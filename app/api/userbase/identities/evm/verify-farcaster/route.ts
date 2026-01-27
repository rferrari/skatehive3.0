import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { isAddress, getAddress } from "ethers";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getSessionUserId(request: NextRequest) {
  if (!supabase) {
    return {
      error: NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      ),
    };
  }

  const refreshToken = request.cookies.get("userbase_refresh")?.value;
  if (!refreshToken) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const refreshTokenHash = hashToken(refreshToken);
  const { data: sessionRows, error: sessionError } = await supabase
    .from("userbase_sessions")
    .select("id, user_id, expires_at, revoked_at")
    .eq("refresh_token_hash", refreshTokenHash)
    .is("revoked_at", null)
    .limit(1);

  if (sessionError) {
    console.error("Userbase session lookup failed:", sessionError);
    return {
      error: NextResponse.json(
        {
          error: "Failed to validate session",
          details:
            process.env.NODE_ENV !== "production"
              ? sessionError?.message || sessionError
              : undefined,
        },
        { status: 500 }
      ),
    };
  }

  const session = sessionRows?.[0];
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (new Date(session.expires_at) < new Date()) {
    return {
      error: NextResponse.json({ error: "Session expired" }, { status: 401 }),
    };
  }

  return { userId: session.user_id };
}

/**
 * POST /api/userbase/identities/evm/verify-farcaster
 * 
 * Link an Ethereum address that has been verified by Farcaster.
 * No wallet signature required since Farcaster has already verified ownership.
 */
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { address, farcaster_fid } = body;

    // Validate inputs
    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Missing or invalid address" }, { status: 400 });
    }
    if (!farcaster_fid) {
      return NextResponse.json({ error: "Missing farcaster_fid" }, { status: 400 });
    }

    // Validate Ethereum address format
    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 });
    }

    const checksummedAddress = getAddress(address);

    // Get session user ID
    const sessionResult = await getSessionUserId(request);
    if (sessionResult.error) {
      return sessionResult.error;
    }
    const userId = sessionResult.userId;

    // Verify the user has a linked Farcaster account with this FID
    const { data: farcasterIdentities, error: farcasterCheckError } = await supabase
      .from("userbase_identities")
      .select("id, user_id, external_id")
      .eq("user_id", userId)
      .eq("type", "farcaster")
      .eq("external_id", farcaster_fid.toString())
      .limit(1);

    if (farcasterCheckError) {
      console.error("Farcaster identity check failed:", farcasterCheckError);
      return NextResponse.json(
        { error: "Failed to verify Farcaster identity" },
        { status: 500 }
      );
    }

    if (!farcasterIdentities || farcasterIdentities.length === 0) {
      return NextResponse.json(
        { error: "You must link your Farcaster account first" },
        { status: 403 }
      );
    }

    // Check if this address is already linked to any user
    const { data: existingIdentities, error: existingError } = await supabase
      .from("userbase_identities")
      .select("id, user_id")
      .eq("type", "evm")
      .eq("address", checksummedAddress.toLowerCase())
      .limit(1);

    if (existingError) {
      console.error("Existing identity check failed:", existingError);
      return NextResponse.json(
        { error: "Failed to check existing identities" },
        { status: 500 }
      );
    }

    const existingIdentity = existingIdentities?.[0];
    if (existingIdentity) {
      if (existingIdentity.user_id === userId) {
        // Already linked to this user
        return NextResponse.json({ 
          message: "Address already linked to your account",
          identity_id: existingIdentity.id,
        });
      } else {
        // Linked to a different user - require merge
        return NextResponse.json(
          {
            error: "Address already linked to another account",
            merge_required: true,
            existing_user_id: existingIdentity.user_id,
          },
          { status: 409 }
        );
      }
    }

    // Create the new identity
    const { data: newIdentity, error: insertError } = await supabase
      .from("userbase_identities")
      .insert({
        user_id: userId,
        type: "evm",
        address: checksummedAddress.toLowerCase(),
        verified_at: new Date().toISOString(),
        metadata: {
          verified_via: "farcaster",
          farcaster_fid: farcaster_fid,
        },
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Identity insert failed:", insertError);
      return NextResponse.json(
        {
          error: "Failed to link address",
          details:
            process.env.NODE_ENV !== "production"
              ? insertError?.message
              : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Address linked successfully via Farcaster verification",
      identity_id: newIdentity.id,
    });
  } catch (error: any) {
    console.error("Farcaster EVM verification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV !== "production" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
