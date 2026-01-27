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

type PostKey = { author: string; permlink: string; safe_user?: string | null };

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const posts = Array.isArray(body?.posts) ? body.posts : [];
  const cleaned: PostKey[] = posts
    .filter(
      (post: any) =>
        post &&
        typeof post.author === "string" &&
        typeof post.permlink === "string" &&
        post.author.trim() &&
        post.permlink.trim()
    )
    .map((post: any) => ({
      author: post.author.trim(),
      permlink: post.permlink.trim(),
      safe_user:
        typeof post.safe_user === "string" ? post.safe_user.trim() : null,
    }))
    .slice(0, 200);

  if (cleaned.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const authorSet = Array.from(new Set(cleaned.map((p) => p.author)));
  const permlinkSet = Array.from(new Set(cleaned.map((p) => p.permlink)));
  const safeUserSet = Array.from(
    new Set(cleaned.map((p) => p.safe_user).filter(Boolean) as string[])
  );
  const keySet = new Set(cleaned.map((p) => `${p.author}/${p.permlink}`));

  const { data: primaryData, error: primaryError } = await supabase
    .from("userbase_soft_posts")
    .select(
      "author, permlink, type, metadata, user_id, safe_user, userbase_users(display_name, handle, avatar_url)"
    )
    .in("author", authorSet)
    .in("permlink", permlinkSet);

  if (primaryError) {
    console.error("Failed to fetch soft posts:", primaryError);
    return NextResponse.json(
      { error: "Failed to fetch soft posts" },
      { status: 500 }
    );
  }

  let secondaryData: any[] = [];
  if (safeUserSet.length > 0) {
    const { data: safeData, error: safeError } = await supabase
      .from("userbase_soft_posts")
      .select(
        "author, permlink, type, metadata, user_id, safe_user, userbase_users(display_name, handle, avatar_url)"
      )
      .in("safe_user", safeUserSet)
      .in("permlink", permlinkSet);
    if (safeError) {
      console.error("Failed to fetch soft posts by safe_user:", safeError);
    } else if (Array.isArray(safeData)) {
      secondaryData = safeData;
    }
  }

  const merged = [...(primaryData || []), ...secondaryData];
  const seen = new Set<string>();
  const items = merged
    .filter((row) => keySet.has(`${row.author}/${row.permlink}`))
    .filter((row) => {
      const key = `${row.author}/${row.permlink}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row: any) => ({
      author: row.author,
      permlink: row.permlink,
      type: row.type,
      metadata: row.metadata,
      user: {
        id: row.user_id,
        display_name: row.userbase_users?.display_name || null,
        handle: row.userbase_users?.handle || null,
        avatar_url: row.userbase_users?.avatar_url || null,
      },
    }));

  return NextResponse.json({ items });
}
