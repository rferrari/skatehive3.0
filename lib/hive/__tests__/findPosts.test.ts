/**
 * Unit tests for findPosts pagination parameters
 * Run with: pnpm exec tsx lib/hive/__tests__/findPosts.test.ts
 */

import { findPosts } from "../client-functions";
import HiveClient from "../hiveclient";

type CallRecord = {
  api: string;
  method: string;
  payload: any;
};

const tests: Array<() => void | Promise<void>> = [];
let hasFailures = false;

function describe(name: string, fn: () => void) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name: string, fn: () => void | Promise<void>) {
  tests.push(async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
    } catch (error) {
      console.error(`  ❌ ${name}`);
      console.error(`     ${error}`);
      hasFailures = true;
    }
  });
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Expected condition to be true");
  }
}

async function withMockedCall(
  mock: (api: string, method: string, payload: any) => Promise<any>,
  run: () => Promise<void>
) {
  const originalCall = (HiveClient as any).call;
  (HiveClient as any).call = mock;
  try {
    await run();
  } finally {
    (HiveClient as any).call = originalCall;
  }
}

describe("findPosts", () => {
  it("forwards start params when provided", async () => {
    const calls: CallRecord[] = [];
    const mockPosts = [{ author: "alice", permlink: "post-1" }];

    await withMockedCall(async (api, method, payload) => {
      calls.push({ api, method, payload });
      return mockPosts;
    }, async () => {
      const params = [
        {
          tag: "skatehive",
          limit: 30,
          start_author: "bob",
          start_permlink: "hello-world",
        },
      ];

      const result = await findPosts("created", params);

      assertEqual(result, mockPosts, "Should return posts from HiveClient");
      assertEqual(calls.length, 1, "Should call HiveClient.call once");
      const { api, method, payload } = calls[0];
      assertEqual(api, "bridge");
      assertEqual(method, "get_ranked_posts");
      assertEqual(payload.tag, "skatehive");
      assertEqual(payload.start_author, "bob");
      assertEqual(payload.start_permlink, "hello-world");
      assertEqual(payload.limit, 20, "Should cap limit at bridge max of 20");
    });
  });

  it("omits start params when not supplied", async () => {
    const calls: CallRecord[] = [];

    await withMockedCall(async (api, method, payload) => {
      calls.push({ api, method, payload });
      return [];
    }, async () => {
      const params = [
        {
          tag: "skatehive",
          limit: 10,
          start_author: "",
          start_permlink: "",
        },
      ];

      await findPosts("created", params);

      assertEqual(calls.length, 1);
      const { payload } = calls[0];
      assertEqual(payload.start_author, undefined);
      assertEqual(payload.start_permlink, undefined);
      assertEqual(payload.limit, 10);
    });
  });

  it("supports a load-more flow by carrying forward cursors", async () => {
    const calls: CallRecord[] = [];
    const firstBatch = [
      { author: "alice", permlink: "post-1" },
      { author: "bob", permlink: "post-2" },
    ];
    const secondBatch = [{ author: "carol", permlink: "post-3" }];

    await withMockedCall(async (api, method, payload) => {
      calls.push({ api, method, payload });
      return calls.length === 1 ? firstBatch : secondBatch;
    }, async () => {
      const params = [
        {
          tag: "skatehive",
          limit: 25,
          start_author: "",
          start_permlink: "",
        },
      ];

      const first = await findPosts("created", params);
      const last = first[first.length - 1];
      params[0].start_author = last.author;
      params[0].start_permlink = last.permlink;

      const second = await findPosts("created", params);

      assertEqual(first, firstBatch, "First batch should be returned");
      assertEqual(second, secondBatch, "Second batch should be returned");
      assertEqual(calls.length, 2, "Should make two bridge calls");

      const [firstCall, secondCall] = calls;
      assertEqual(firstCall.payload.start_author, undefined);
      assertEqual(firstCall.payload.start_permlink, undefined);
      assertEqual(secondCall.payload.start_author, "bob");
      assertEqual(secondCall.payload.start_permlink, "post-2");
      assertEqual(secondCall.payload.limit, 20, "Second call still caps at 20");
    });
  });
});

// Run all tests
(async () => {
  for (const test of tests) {
    await test();
  }

  if (hasFailures) {
    console.log("\n❌ Some tests failed!\n");
    process.exit(1);
  } else {
    console.log("\n✨ All findPosts tests completed!\n");
  }
})();
