"use client";

import { useAioha } from "@aioha/react-ui";
import useUserbaseHiveIdentity from "@/hooks/useUserbaseHiveIdentity";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";

export default function useEffectiveHiveUser() {
  const { user } = useAioha();
  const { identity, isLoading } = useUserbaseHiveIdentity();
  const { user: userbaseUser } = useUserbaseAuth();

  const handle = user || identity?.handle || null;
  const isWalletConnected = !!user;
  const isUserbaseLinked = !!identity?.handle && !user;
  const canUseAppFeatures = !!user || !!identity?.handle || !!userbaseUser;

  return {
    handle,
    isWalletConnected,
    isUserbaseLinked,
    isLoading: isLoading && !user,
    canUseAppFeatures,
  };
}
