import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { isAddress, getAddress, verifyMessage } from "ethers";
import { PublicKey, Signature, cryptoUtils } from "@hiveio/dhive";
import fetchAccount from "@/lib/hive/fetchAccount";
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

function parseSignature(signature: string) {
  let normalized = signature.trim().toLowerCase();
  if (normalized.startsWith("0x")) {
    normalized = normalized.slice(2);
  }
  if (!/^[0-9a-f]+$/.test(normalized)) {
    return null;
  }

  const buffer = Buffer.from(normalized, "hex");
  if (buffer.length === 65) {
    return Signature.fromBuffer(buffer);
  }
  if (buffer.length === 64) {
    return new Signature(buffer, 0);
  }
  return null;
}

async function verifyHiveChallenge({
  userId,
  handle,
  signatureRaw,
  publicKey,
}: {
  userId: string;
  handle: string;
  signatureRaw: string;
  publicKey: string;
}) {
  const { data: challengeRows, error: challengeError } = await supabase!
    .from("userbase_identity_challenges")
    .select("id, nonce, created_at, expires_at, consumed_at, message")
    .eq("user_id", userId)
    .eq("type", "hive")
    .eq("identifier", handle)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (challengeError) {
    return {
      error: NextResponse.json(
        {
          error: "Failed to verify challenge",
          details:
            process.env.NODE_ENV !== "production"
              ? challengeError?.message || challengeError
              : undefined,
        },
        { status: 500 }
      ),
    };
  }

  const challenge = challengeRows?.[0];
  if (!challenge) {
    return {
      error: NextResponse.json(
        { error: "No active challenge found" },
        { status: 400 }
      ),
    };
  }

  if (new Date(challenge.expires_at) < new Date()) {
    return {
      error: NextResponse.json(
        { error: "Challenge expired" },
        { status: 401 }
      ),
    };
  }

  if (!challenge.message) {
    return {
      error: NextResponse.json(
        { error: "Challenge must be refreshed" },
        { status: 400 }
      ),
    };
  }

  const signature = parseSignature(signatureRaw);
  if (!signature) {
    return {
      error: NextResponse.json(
        { error: "Invalid signature format" },
        { status: 400 }
      ),
    };
  }

  let isValid = false;
  try {
    const digest = cryptoUtils.sha256(Buffer.from(challenge.message));
    const publicKeyObj = PublicKey.fromString(publicKey);
    isValid = publicKeyObj.verify(digest, signature);
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: "Signature verification failed" },
        { status: 400 }
      ),
    };
  }

  if (!isValid) {
    return {
      error: NextResponse.json(
        { error: "Signature does not match" },
        { status: 400 }
      ),
    };
  }

  let accountData;
  try {
    accountData = await fetchAccount(handle);
  } catch (error: any) {
    return {
      error: NextResponse.json(
        { error: error?.message || "Hive account not found" },
        { status: 404 }
      ),
    };
  }

  const postingKeys = accountData.account.posting?.key_auths?.map(
    (entry) => entry[0]
  );
  if (!postingKeys?.includes(publicKey)) {
    return {
      error: NextResponse.json(
        { error: "Public key not authorized for posting" },
        { status: 403 }
      ),
    };
  }

  return { challengeId: challenge.id };
}

async function verifyEvmChallenge({
  userId,
  address,
  signature,
}: {
  userId: string;
  address: string;
  signature: string;
}) {
  const { data: challengeRows, error: challengeError } = await supabase!
    .from("userbase_identity_challenges")
    .select("id, nonce, created_at, expires_at, consumed_at, message")
    .eq("user_id", userId)
    .eq("type", "evm")
    .eq("identifier", address)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (challengeError) {
    return {
      error: NextResponse.json(
        {
          error: "Failed to verify challenge",
          details:
            process.env.NODE_ENV !== "production"
              ? challengeError?.message || challengeError
              : undefined,
        },
        { status: 500 }
      ),
    };
  }

  const challenge = challengeRows?.[0];
  if (!challenge) {
    return {
      error: NextResponse.json(
        { error: "No active challenge found" },
        { status: 400 }
      ),
    };
  }

  if (new Date(challenge.expires_at) < new Date()) {
    return {
      error: NextResponse.json(
        { error: "Challenge expired" },
        { status: 401 }
      ),
    };
  }

  if (!challenge.message) {
    return {
      error: NextResponse.json(
        { error: "Challenge must be refreshed" },
        { status: 400 }
      ),
    };
  }

  let recovered: string;
  try {
    recovered = verifyMessage(challenge.message, signature);
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      ),
    };
  }

  if (getAddress(recovered) !== getAddress(address)) {
    return {
      error: NextResponse.json(
        { error: "Signature does not match address" },
        { status: 400 }
      ),
    };
  }

  return { challengeId: challenge.id };
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
  const sourceUserId =
    typeof payload?.source_user_id === "string"
      ? payload.source_user_id
      : null;
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

  if (sourceUserId && sourceUserId === session.userId) {
    return NextResponse.json(
      { error: "Source and target users must be different" },
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
    .select("id, user_id, type, handle, address, external_id")
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
  const resolvedSourceUserId = sourceUserId || identity?.user_id || null;

  if (!identity || !resolvedSourceUserId) {
    return NextResponse.json(
      { error: "Identity not found" },
      { status: 404 }
    );
  }

  if (resolvedSourceUserId === session.userId) {
    return NextResponse.json(
      { error: "Source and target users must be different" },
      { status: 400 }
    );
  }

  if (sourceUserId && identity.user_id !== sourceUserId) {
    return NextResponse.json(
      { error: "Identity does not belong to source user" },
      { status: 400 }
    );
  }

  let challengeId: string | null = null;

  if (type === "hive") {
    const signature = payload?.signature;
    const publicKey = payload?.public_key;
    if (!signature || typeof signature !== "string") {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }
    if (!publicKey || typeof publicKey !== "string") {
      return NextResponse.json(
        { error: "Missing public key" },
        { status: 400 }
      );
    }
    const verified = await verifyHiveChallenge({
      userId: session.userId,
      handle: identifier,
      signatureRaw: signature,
      publicKey: publicKey.trim(),
    });
    if (verified.error) {
      return verified.error;
    }
    challengeId = verified.challengeId;
  }

  if (type === "evm") {
    const signature = payload?.signature;
    if (!signature || typeof signature !== "string") {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }
    const verified = await verifyEvmChallenge({
      userId: session.userId,
      address: identifier,
      signature,
    });
    if (verified.error) {
      return verified.error;
    }
    challengeId = verified.challengeId;
  }

  const mergeMetadata = {
    identity_type: type,
    identifier,
  };

  const { error: mergeError } = await supabase.rpc("userbase_merge_users", {
    source_user_id: resolvedSourceUserId,
    target_user_id: session.userId,
    actor_user_id: session.userId,
    reason: "identity_conflict",
    metadata: mergeMetadata,
  });

  if (mergeError) {
    console.error("Failed to merge users:", mergeError);
    return NextResponse.json(
      {
        error: "Failed to merge users",
        details:
          process.env.NODE_ENV !== "production"
            ? mergeError?.message || mergeError
            : undefined,
      },
      { status: 500 }
    );
  }

  if (challengeId) {
    await supabase
      .from("userbase_identity_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challengeId);
  }

  return NextResponse.json({ success: true });
}
