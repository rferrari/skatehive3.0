"use client";

import { useCallback } from "react";
import { useAioha } from "@aioha/react-ui";
import useUserbaseHiveIdentity from "@/hooks/useUserbaseHiveIdentity";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";

export default function useHiveVote() {
  const { user, aioha } = useAioha();
  const { identity } = useUserbaseHiveIdentity();
  const { user: userbaseUser } = useUserbaseAuth();

  const effectiveUser = user || identity?.handle || null;
  const canVote = !!user || !!identity?.handle || !!userbaseUser;

  const vote = useCallback(
    async (author: string, permlink: string, weight: number) => {
      if (user) {
        const result = await aioha.vote(author, permlink, weight);
        return { success: true, result };
      }

      const response = await fetch("/api/userbase/hive/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, permlink, weight }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to vote");
      }

      return { success: true, result: data };
    },
    [aioha, user]
  );

  return { vote, effectiveUser, isWalletConnected: !!user, canVote };
}
