/**
 * Quick performance probe for the RightSideBar/PostInfiniteScroll fetch cycle.
 * Measures how long Bridge API calls take for three sequential batches using
 * the same parameters as the sidebar (limit 8, with start_author/permlink).
 *
 * Run locally with:
 *   pnpm exec node --import tsx scripts/perf/rightSidebarFetchPerf.ts
 */

import { performance } from "perf_hooks";
import { Discussion } from "@hiveio/dhive";
import { findPosts } from "@/lib/hive/client-functions";

const TAG = process.env.NEXT_PUBLIC_HIVE_SEARCH_TAG || "skatehive";
const LIMIT = 8;
const BATCHES = 8;
// Delay between batches to mimic human scroll pauses
const SCROLL_DELAY_MS = 350;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function measureBatch(
  index: number,
  startAuthor: string,
  startPermlink: string
) {
  const params = [
    {
      tag: TAG,
      limit: LIMIT,
      start_author: startAuthor,
      start_permlink: startPermlink,
    },
  ];

  const started = performance.now();
  const posts = (await findPosts("created", params)) as Discussion[];
  const elapsedMs = performance.now() - started;

  const lastPost = posts[posts.length - 1];

  console.log(
    `Batch ${index + 1}: ${(elapsedMs / 1000).toFixed(2)}s (${posts.length} posts)`
  );

  return {
    posts,
    elapsedMs,
    nextAuthor: lastPost?.author || "",
    nextPermlink: lastPost?.permlink || "",
  };
}

async function run() {
  console.log(`RightSideBar fetch perf (tag="${TAG}", limit=${LIMIT})`);

  let totalMs = 0;
  let startAuthor = "";
  let startPermlink = "";

  for (let i = 0; i < BATCHES; i++) {
    const { elapsedMs, nextAuthor, nextPermlink } = await measureBatch(
      i,
      startAuthor,
      startPermlink
    );
    totalMs += elapsedMs;
    startAuthor = nextAuthor;
    startPermlink = nextPermlink;

    if (i < BATCHES - 1) {
      await sleep(SCROLL_DELAY_MS);
    }

      // Stop only when there are no more posts (i.e., when nextAuthor or nextPermlink is falsy)
      // Note: If fewer than LIMIT posts are returned but nextAuthor/nextPermlink exist, will continue fetching further pages
    if (!nextAuthor || !nextPermlink) {
      console.log("No further posts available; stopping early.");
      break;
    }
  }

  console.log(`Total elapsed: ${(totalMs / 1000).toFixed(2)}s`);
}

run().catch((error) => {
  console.error("Performance probe failed:", error);
  process.exit(1);
});
