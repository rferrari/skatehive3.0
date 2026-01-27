import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { isAddress } from "ethers";
import { validateHiveUsernameFormat } from "@/lib/utils/hiveAccountUtils";

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

async function getCount(table: string, filters: Record<string, any>) {
  let query = supabase!.from(table).select("id", {
    count: "exact",
    head: true,
  });
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { count } = await query;
  return count || 0;
}

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const session = await getSessionUserId(request);
  if (session.error) {
    return session.error;
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
  const type = payload?.type;
  const identifierRaw =
    typeof payload?.identifier === "string" ? payload.identifier : null;

  if (!type || !["hive", "evm", "farcaster"].includes(type)) {
    return NextResponse.json(
      { error: "Unsupported identity type" },
      { status: 400 }
    );
  }

  if (!identifierRaw) {
    return NextResponse.json(
      { error: "Missing identity identifier" },
      { status: 400 }
    );
  }

  let identifier = identifierRaw.trim();
  if (type === "hive") {
    identifier = identifier.toLowerCase();
    const validation = validateHiveUsernameFormat(identifier);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid Hive handle" },
        { status: 400 }
      );
    }
  }

  if (type === "evm") {
    if (!isAddress(identifier)) {
      return NextResponse.json(
        { error: "Invalid address" },
        { status: 400 }
      );
    }
    identifier = identifier.toLowerCase();
  }

  if (type === "farcaster") {
    const normalized = identifier.trim();
    if (!/^\d+$/.test(normalized)) {
      return NextResponse.json(
        { error: "Invalid Farcaster fid" },
        { status: 400 }
      );
    }
    identifier = normalized;
  }

  const identifierField =
    type === "hive" ? "handle" : type === "evm" ? "address" : "external_id";

  const { data: identityRows, error: identityError } = await supabase
    .from("userbase_identities")
    .select("id, user_id")
    .eq("type", type)
    .eq(identifierField, identifier)
    .limit(1);

  if (identityError) {
    return NextResponse.json(
      {
        error: "Failed to fetch identity",
        details:
          process.env.NODE_ENV !== "production"
            ? identityError?.message || identityError
            : undefined,
      },
      { status: 500 }
    );
  }

  const identity = identityRows?.[0];
  if (!identity) {
    return NextResponse.json({ exists: false });
  }

  if (identity.user_id === session.userId) {
    return NextResponse.json({ exists: true, same_user: true });
  }

  const sourceUserId = identity.user_id;

  const counts = {
    identities: await getCount("userbase_identities", {
      user_id: sourceUserId,
    }),
    auth_methods: await getCount("userbase_auth_methods", {
      user_id: sourceUserId,
    }),
    sessions: await getCount("userbase_sessions", {
      user_id: sourceUserId,
    }),
    soft_posts: await getCount("userbase_soft_posts", {
      user_id: sourceUserId,
    }),
    soft_votes: await getCount("userbase_soft_votes", {
      user_id: sourceUserId,
    }),
  };

  return NextResponse.json({
    exists: true,
    same_user: false,
    source_user_id: sourceUserId,
    counts,
  });
}
