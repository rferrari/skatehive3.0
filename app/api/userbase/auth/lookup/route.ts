import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function normalizeHandle(handle: string | null) {
  if (!handle) return null;
  return handle.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const payload = body as Record<string, any>;
    const rawIdentifier = payload?.identifier;
    const rawHandle = payload?.handle ?? null;

    if (!rawIdentifier || typeof rawIdentifier !== "string") {
      return NextResponse.json(
        { error: "Missing required field: identifier" },
        { status: 400 }
      );
    }

    const identifier = normalizeIdentifier(rawIdentifier);
    const handle = normalizeHandle(
      typeof rawHandle === "string" ? rawHandle : null
    );

    const { data: authRows, error: authError } = await supabase
      .from("userbase_auth_methods")
      .select("id, user_id")
      .eq("type", "email_magic")
      .eq("identifier", identifier)
      .limit(1);

    if (authError) {
      console.error("Userbase lookup failed:", authError);
      return NextResponse.json(
        { error: "Failed to lookup account" },
        { status: 500 }
      );
    }

    let handleAvailable: boolean | null = null;
    let handleLookupFailed = false;
    if (handle) {
      const { data: handleRows, error: handleError } = await supabase
        .from("userbase_users")
        .select("id")
        .eq("handle", handle)
        .limit(1);

      if (handleError) {
        console.error("Handle lookup failed:", handleError);
        handleLookupFailed = true;
      } else {
        handleAvailable = !handleRows || handleRows.length === 0;
      }
    }

    return NextResponse.json({
      exists: Boolean(authRows?.[0]?.user_id),
      handle_available: handleAvailable,
      handle_lookup_failed: handleLookupFailed || undefined,
    });
  } catch (error) {
    console.error("Userbase lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
