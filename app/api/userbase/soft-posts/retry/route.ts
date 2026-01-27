import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PrivateKey } from "@hiveio/dhive";
import HiveClient from "@/lib/hive/hiveclient";
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
    .from("userbase_soft_posts")
    .select("id, author, permlink, title, metadata, status, created_at")
    .in("status", ["queued", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (maxAgeMinutes > 0) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
    query = query.lte("created_at", cutoff);
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error("Failed to fetch queued soft posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch soft posts" },
      { status: 500 }
    );
  }

  let successCount = 0;
  let failCount = 0;

  for (const row of rows || []) {
    try {
      const meta = row.metadata || {};
      const parentAuthor = meta.parent_author || "";
      const parentPermlink = meta.parent_permlink || "";
      const bodyText = meta.body || "";
      const title = meta.title || row.title || "";
      const jsonMetadata = meta.onchain || meta.json_metadata || {};
      const beneficiaries = Array.isArray(meta?.beneficiaries)
        ? meta.beneficiaries
        : [];

      if (!row.author || !row.permlink || !parentPermlink || !bodyText) {
        throw new Error("Missing required post metadata");
      }

      const commentOp: any = [
        "comment",
        {
          parent_author: parentAuthor,
          parent_permlink: parentPermlink,
          author: row.author,
          permlink: row.permlink,
          title,
          body: bodyText,
          json_metadata: JSON.stringify(jsonMetadata),
        },
      ];

      const privateKey = PrivateKey.fromString(defaultKey);
      const ops: any[] = [commentOp];
      if (beneficiaries.length > 0) {
        const totalWeight = beneficiaries.reduce(
          (sum: number, b: any) => sum + Number(b?.weight || 0),
          0
        );
        if (totalWeight > 10000) {
          throw new Error("Beneficiaries exceed 100%");
        }
        const validBeneficiaries = beneficiaries.filter((b: any) => {
          if (!b?.account || typeof b.account !== "string") return false;
          if (!b?.weight || Number(b.weight) <= 0) return false;
          const validation = validateHiveUsernameFormat(b.account);
          return validation.isValid;
        });

        if (validBeneficiaries.length > 0) {
          ops.push([
            "comment_options",
            {
              author: row.author,
              permlink: row.permlink,
              max_accepted_payout: "1000000.000 HBD",
              percent_hbd: 10000,
              allow_votes: true,
              allow_curation_rewards: true,
              extensions: [
                [
                  0,
                  {
                    beneficiaries: validBeneficiaries.map((b: any) => ({
                      account: b.account,
                      weight: b.weight,
                    })),
                  },
                ],
              ],
            },
          ]);
        }
      }

      await HiveClient.broadcast.sendOperations(ops, privateKey);

      // Mark as broadcasted - critical to prevent duplicate broadcasts
      const broadcastedAt = new Date().toISOString();
      const updatePayload = {
        status: "broadcasted" as const,
        error: null,
        broadcasted_at: broadcastedAt,
        updated_at: broadcastedAt,
      };

      // Retry DB update with exponential backoff to prevent duplicate broadcasts
      let dbUpdateSuccess = false;
      let lastDbError: any = null;
      const maxRetries = 3;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { error: updateError, count } = await supabase
          .from("userbase_soft_posts")
          .update(updatePayload)
          .eq("id", row.id);

        if (!updateError) {
          dbUpdateSuccess = true;
          break;
        }

        lastDbError = updateError;
        console.error(
          `DB update attempt ${attempt + 1}/${maxRetries} failed for soft post ${row.id}:`,
          updateError
        );

        // Exponential backoff: 100ms, 200ms, 400ms
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        }
      }

      if (!dbUpdateSuccess) {
        // Critical: Hive broadcast succeeded but DB update failed
        // This could cause duplicate broadcasts on next retry
        console.error(
          `CRITICAL: Hive broadcast succeeded but DB update failed for soft post. ` +
          `id=${row.id}, author=${row.author}, permlink=${row.permlink}, ` +
          `broadcasted_at=${broadcastedAt}, error=${lastDbError?.message || "Unknown DB error"}`
        );
        
        await notifyAlert({
          type: "userbase_soft_post_db_update_failed",
          severity: "critical",
          soft_post_id: row.id,
          author: row.author,
          permlink: row.permlink,
          broadcasted_at: broadcastedAt,
          error: lastDbError?.message || "DB update failed after successful broadcast",
          message: "Post was broadcasted to Hive but DB status update failed. Manual intervention required to prevent duplicate broadcast.",
        });

        // Count as failed since we couldn't confirm the update
        // The post IS on-chain but our DB doesn't reflect it
        failCount += 1;
        continue;
      }

      successCount += 1;
    } catch (retryError: any) {
      failCount += 1;
      await supabase
        .from("userbase_soft_posts")
        .update({
          status: "failed",
          error: retryError?.message || "Retry failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      console.error("Soft post retry failed:", retryError);
      await notifyAlert({
        type: "userbase_soft_post_retry_failed",
        soft_post_id: row.id,
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
      .from("userbase_soft_posts")
      .delete()
      .eq("status", "failed")
      .lt("created_at", cutoff)
      .select("id");

    if (cleanupError) {
      console.error("Failed to cleanup soft posts:", cleanupError);
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
