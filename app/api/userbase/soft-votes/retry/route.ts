import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PrivateKey } from "@hiveio/dhive";
import HiveClient from "@/lib/hive/hiveclient";

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

function isAuthorized(request: NextRequest) {
  const expected = process.env.USERBASE_INTERNAL_TOKEN;
  if (!expected) return true;
  const token = request.headers.get("x-userbase-token");
  return token === expected;
}

async function notifyAlert(payload: Record<string, any>) {
  const webhook = process.env.USERBASE_ALERT_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send userbase alert:", error);
  }
}

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 100);
  const maxAgeMinutes = Number(body?.max_age_minutes) || 0;
  const cleanupDays = Number(body?.cleanup_days) || 30;

  const defaultAuthor = process.env.DEFAULT_HIVE_POSTING_ACCOUNT;
  const defaultKey = process.env.DEFAULT_HIVE_POSTING_KEY;
  if (!defaultAuthor || !defaultKey) {
    return NextResponse.json(
      { error: "Default Hive posting account not configured" },
      { status: 500 }
    );
  }

  let query = supabase
    .from("userbase_soft_votes")
    .select("id, author, permlink, weight, status, created_at")
    .in("status", ["queued", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (maxAgeMinutes > 0) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
    query = query.lte("created_at", cutoff);
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error("Failed to fetch queued soft votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch soft votes" },
      { status: 500 }
    );
  }

  let successCount = 0;
  let failCount = 0;

  for (const row of rows || []) {
    try {
      if (!row.author || !row.permlink) {
        throw new Error("Missing vote target");
      }
      const weight = Number(row.weight);
      if (!Number.isFinite(weight) || weight < -10000 || weight > 10000) {
        throw new Error("Invalid vote weight");
      }

      const voteOp: any = [
        "vote",
        {
          voter: defaultAuthor,
          author: row.author,
          permlink: row.permlink,
          weight,
        },
      ];

      const privateKey = PrivateKey.fromString(defaultKey);
      await HiveClient.broadcast.sendOperations([voteOp], privateKey);

      await supabase
        .from("userbase_soft_votes")
        .update({
          status: "broadcasted",
          error: null,
          broadcasted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      successCount += 1;
    } catch (retryError: any) {
      failCount += 1;
      await supabase
        .from("userbase_soft_votes")
        .update({
          status: "failed",
          error: retryError?.message || "Retry failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      console.error("Soft vote retry failed:", retryError);
      await notifyAlert({
        type: "userbase_soft_vote_retry_failed",
        soft_vote_id: row.id,
        author: row.author,
        permlink: row.permlink,
        error: retryError?.message || "Retry failed",
      });
    }
  }

  let cleaned = 0;
  if (cleanupDays > 0) {
    const cutoff = new Date(
      Date.now() - cleanupDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: deleted, error: cleanupError } = await supabase
      .from("userbase_soft_votes")
      .delete()
      .eq("status", "failed")
      .lt("created_at", cutoff)
      .select("id");

    if (cleanupError) {
      console.error("Failed to cleanup soft votes:", cleanupError);
    } else {
      cleaned = deleted?.length || 0;
    }
  }

  return NextResponse.json({
    attempted: rows?.length || 0,
    success: successCount,
    failed: failCount,
    cleaned,
  });
}
