"use client";

import { useEffect, useMemo, useState } from "react";

export interface SoftPostOverlayUser {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
}

export interface SoftPostOverlay {
  author: string;
  permlink: string;
  type?: string | null;
  metadata?: Record<string, any> | null;
  user: SoftPostOverlayUser;
}

const overlayCache = new Map<
  string,
  { value: SoftPostOverlay | null; ts: number }
>();
const inflight = new Map<string, Promise<void>>();
const NULL_TTL_MS = 2 * 60 * 1000;

// Subscribers that want to be notified when cache updates
const cacheSubscribers = new Set<() => void>();

function notifyCacheUpdate() {
  cacheSubscribers.forEach((callback) => callback());
}

function getKey(author?: string | null, permlink?: string | null) {
  const normalizedAuthor = author?.trim();
  const normalizedPermlink = permlink?.trim();
  if (!normalizedAuthor || !normalizedPermlink) return null;
  return `${normalizedAuthor}/${normalizedPermlink}`;
}

async function fetchOverlays(
  posts: Array<{ author: string; permlink: string; safe_user?: string | null }>
) {
  const response = await fetch("/api/userbase/soft-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ posts }),
  });
  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(
      `Failed to load soft post overlays (${response.status})${payload ? `: ${payload}` : ""}`
    );
  }
  const data = await response.json();
  return Array.isArray(data?.items) ? data.items : [];
}

export function useSoftPostOverlays(
  posts: Array<{ author: string; permlink: string; safe_user?: string | null }>
) {
  const signature = useMemo(() => {
    const list = posts
      .filter((post) => post.author && post.permlink)
      .map((post) => {
        const safePart = post.safe_user ? `:${post.safe_user}` : "";
        return `${post.author}/${post.permlink}${safePart}`;
      });
    const unique = Array.from(new Set(list));
    unique.sort();
    return unique.join("|");
  }, [posts]);

  const keys = useMemo(() => {
    const list = posts
      .map((post) => ({
        author: post.author?.trim(),
        permlink: post.permlink?.trim(),
      }))
      .filter((post) => post.author && post.permlink)
      .map((post) => `${post.author}/${post.permlink}`);
    const unique = Array.from(new Set(list));
    unique.sort();
    return unique;
  }, [posts]);

  const [overlays, setOverlays] = useState<Record<string, SoftPostOverlay>>({});

  useEffect(() => {
    let isMounted = true;

    if (keys.length === 0) {
      if (isMounted) {
        setOverlays({});
      }
      return () => {
        isMounted = false;
      };
    }

    const cached: Record<string, SoftPostOverlay> = {};
    const missing: Array<{
      author: string;
      permlink: string;
      safe_user?: string | null;
    }> = [];

    keys.forEach((key) => {
      const cachedEntry = overlayCache.get(key);
      if (cachedEntry?.value) {
        cached[key] = cachedEntry.value;
        return;
      }
      const [author, permlink] = key.split("/");
      const original = posts.find(
        (post) =>
          post.author?.trim() === author && post.permlink?.trim() === permlink
      );
      const hasSafeUser = Boolean(original?.safe_user);
      if (
        cachedEntry &&
        cachedEntry.value === null &&
        !hasSafeUser &&
        Date.now() - cachedEntry.ts < NULL_TTL_MS
      ) {
        return;
      }
      missing.push({
        author,
        permlink,
        safe_user: original?.safe_user?.trim() || null,
      });
    });

    if (isMounted) {
      setOverlays(cached);
    }

    if (missing.length === 0) {
      return () => {
        isMounted = false;
      };
    }

    const batchKey = missing
      .map((post) => {
        const safePart = post.safe_user ? `:${post.safe_user}` : "";
        return `${post.author}/${post.permlink}${safePart}`;
      })
      .join("|");
    if (inflight.has(batchKey)) {
      inflight.get(batchKey)!.finally(() => {
        if (!isMounted) return;
        const next: Record<string, SoftPostOverlay> = {};
        keys.forEach((key) => {
          const cachedEntry = overlayCache.get(key);
          if (cachedEntry?.value) {
            next[key] = cachedEntry.value;
          }
        });
        setOverlays(next);
      });
      return () => {
        isMounted = false;
      };
    }

    const request = fetchOverlays(missing)
      .then((items: SoftPostOverlay[]) => {
        const found = new Set<string>();
        const now = Date.now();
        items.forEach((item) => {
          const key = `${item.author}/${item.permlink}`;
          overlayCache.set(key, { value: item, ts: now });
          found.add(key);
        });
        missing.forEach((post) => {
          const key = `${post.author}/${post.permlink}`;
          if (!found.has(key)) {
            overlayCache.set(key, { value: null, ts: now });
          }
        });
        // Notify all subscribers that cache has been updated
        notifyCacheUpdate();
      })
      .catch((error) => {
        console.error("Failed to fetch soft post overlays:", error);
      })
      .finally(() => {
        inflight.delete(batchKey);
        if (!isMounted) return;
        const next: Record<string, SoftPostOverlay> = {};
        keys.forEach((key) => {
          const cachedEntry = overlayCache.get(key);
          if (cachedEntry?.value) {
            next[key] = cachedEntry.value;
          }
        });
        setOverlays(next);
      });

    inflight.set(batchKey, request);

    return () => {
      isMounted = false;
    };
  }, [signature, keys, posts]);

  // Return overlays, also checking cache for any values that might not be in state yet
  return useMemo(() => {
    const result: Record<string, SoftPostOverlay> = { ...overlays };
    // Also include any cached values not yet in state (handles race conditions)
    keys.forEach((key) => {
      if (!result[key]) {
        const cached = overlayCache.get(key);
        if (cached?.value) {
          result[key] = cached.value;
        }
      }
    });
    return result;
  }, [overlays, keys]);
}

export default function useSoftPostOverlay(
  author?: string,
  permlink?: string,
  safeUser?: string | null
) {
  const normalizedAuthor = author?.trim();
  const normalizedPermlink = permlink?.trim();
  const key = getKey(normalizedAuthor, normalizedPermlink);
  
  // Force re-render when cache updates
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const handleCacheUpdate = () => {
      forceUpdate((n) => n + 1);
    };
    cacheSubscribers.add(handleCacheUpdate);
    return () => {
      cacheSubscribers.delete(handleCacheUpdate);
    };
  }, []);
  
  // Memoize the posts array to prevent unnecessary re-renders and race conditions
  const posts = useMemo(() => {
    if (!normalizedAuthor || !normalizedPermlink) return [];
    return [{ author: normalizedAuthor, permlink: normalizedPermlink, safe_user: safeUser }];
  }, [normalizedAuthor, normalizedPermlink, safeUser]);
  
  // This triggers the fetch if needed
  useSoftPostOverlays(posts);
  
  // Return directly from cache (most up-to-date)
  if (key) {
    const cached = overlayCache.get(key);
    if (cached?.value) return cached.value;
  }
  return null;
}
