import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { isAddress, getAddress, verifyMessage } from "ethers";

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

function buildMessage({
  userId,
  address,
  nonce,
  issuedAt,
}: {
  userId: string;
  address: string;
  nonce: string;
  issuedAt: string;
}) {
  return [
    "Skatehive wants to link your wallet to your app account.",
    "",
    `User ID: ${userId}`,
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `Issued at: ${issuedAt}`,
    "",
    "If you did not request this, you can ignore this message.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const session = await getSessionUserId(request);
  if (session.error) {
    return session.error;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const addressRaw = body?.address;
  const signature = body?.signature;

  if (!addressRaw || typeof addressRaw !== "string") {
    return NextResponse.json(
      { error: "Missing address" },
      { status: 400 }
    );
  }

  if (!signature || typeof signature !== "string") {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  if (!isAddress(addressRaw)) {
    return NextResponse.json(
      { error: "Invalid address" },
      { status: 400 }
    );
  }

  const address = addressRaw.toLowerCase();

  const { data: challengeRows, error: challengeError } = await supabase!
    .from("userbase_identity_challenges")
    .select("id, nonce, created_at, expires_at, consumed_at, message")
    .eq("user_id", session.userId)
    .eq("type", "evm")
    .eq("identifier", address)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (challengeError) {
    console.error("Failed to fetch EVM challenge:", challengeError);
    return NextResponse.json(
      {
        error: "Failed to verify challenge",
        details:
          process.env.NODE_ENV !== "production"
            ? challengeError?.message || challengeError
            : undefined,
      },
      { status: 500 }
    );
  }

  const challenge = challengeRows?.[0];
  if (!challenge) {
    return NextResponse.json(
      { error: "No active challenge found" },
      { status: 400 }
    );
  }

  if (new Date(challenge.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Challenge expired" },
      { status: 401 }
    );
  }

  if (!challenge.message) {
    return NextResponse.json(
      { error: "Challenge must be refreshed" },
      { status: 400 }
    );
  }

  const message = challenge.message;

  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }
  if (getAddress(recovered) !== getAddress(address)) {
    return NextResponse.json(
      { error: "Signature does not match address" },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase!
    .from("userbase_identities")
    .select("id, user_id, type, handle, address, external_id, is_primary")
    .eq("type", "evm")
    .eq("address", address)
    .limit(1);

  if (existingError) {
    console.error("Failed to check existing identity:", existingError);
    return NextResponse.json(
      { error: "Failed to verify identity" },
      { status: 500 }
    );
  }

  if (existing?.[0]) {
    if (existing[0].user_id !== session.userId) {
      return NextResponse.json(
        {
          error: "Address already linked to another user",
          merge_required: true,
        },
        { status: 409 }
      );
    }
    const { error: consumeError } = await supabase!
      .from("userbase_identity_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challenge.id);
    if (consumeError) {
      console.error("Failed to consume challenge:", consumeError);
    }
    return NextResponse.json({ identity: existing[0] });
  }

  const { data: existingType } = await supabase!
    .from("userbase_identities")
    .select("id")
    .eq("user_id", session.userId)
    .eq("type", "evm")
    .limit(1);

  const isPrimary = !existingType || existingType.length === 0;

  const { data: inserted, error: insertError } = await supabase!
    .from("userbase_identities")
    .insert({
      user_id: session.userId,
      type: "evm",
      address,
      is_primary: isPrimary,
      verified_at: new Date().toISOString(),
      metadata: {},
    })
    .select(
      "id, user_id, type, handle, address, external_id, is_primary, verified_at, metadata"
    )
    .single();

  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      return NextResponse.json(
        { error: "Address already exists" },
        { status: 409 }
      );
    }
    console.error("Failed to create EVM identity:", insertError);
    return NextResponse.json(
      {
        error: "Failed to create identity",
        details:
          process.env.NODE_ENV !== "production"
            ? insertError?.message || insertError
            : undefined,
      },
      { status: 500 }
    );
  }

  const { error: consumeError } = await supabase!
    .from("userbase_identity_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challenge.id);
  if (consumeError) {
    console.error("Failed to consume challenge:", consumeError);
  }

  return NextResponse.json({ identity: inserted });
}
