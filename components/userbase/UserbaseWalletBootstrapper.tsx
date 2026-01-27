"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAioha } from "@aioha/react-ui";
import { useAccount, useEnsAvatar, useEnsName } from "wagmi";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";

export default function UserbaseWalletBootstrapper() {
  const { user: hiveUser } = useAioha();
  const { address, isConnected: isEvmConnected } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
    query: { enabled: !!ensName },
  });
  const {
    isAuthenticated: isFarcasterConnected,
    profile: farcasterProfile,
    isRestoring,
  } = useFarcasterSession();
  const { user: userbaseUser, refresh } = useUserbaseAuth();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const attemptedRef = useRef<Map<string, number>>(new Map());
  const lastUserIdRef = useRef<string | null>(null);

  const hiveHandle =
    typeof hiveUser === "string"
      ? hiveUser
      : hiveUser?.name || hiveUser?.username || null;
  const evmAddress = address ? address.toLowerCase() : null;
  const farcasterProfileSafe = farcasterProfile || null;
  const farcasterHandle = farcasterProfileSafe?.username || null;
  const farcasterFid =
    farcasterProfileSafe?.fid !== undefined && farcasterProfileSafe?.fid !== null
      ? String(farcasterProfileSafe.fid)
      : null;
  const farcasterDisplayName =
    farcasterProfileSafe?.displayName || farcasterHandle || "Skater";
  const farcasterAvatar = farcasterProfileSafe?.pfpUrl || null;
  const farcasterCustody = farcasterProfileSafe?.custody || null;
  const farcasterVerifications = useMemo(
    () => farcasterProfileSafe?.verifications || [],
    [farcasterProfileSafe?.verifications]
  );

  const bootstrapCandidate = useMemo(() => {
    if (hiveHandle) {
      return {
        key: `hive:${hiveHandle}`,
        payload: {
          type: "hive" as const,
          identifier: hiveHandle,
          handle: hiveHandle,
          display_name: hiveHandle,
          avatar_url: `https://images.hive.blog/u/${hiveHandle}/avatar`,
        },
      };
    }

    if (isFarcasterConnected && farcasterFid) {
      return {
        key: `farcaster:${farcasterFid}`,
        payload: {
          type: "farcaster" as const,
          identifier: farcasterFid,
          handle: farcasterHandle,
          display_name: farcasterDisplayName,
          avatar_url: farcasterAvatar,
          metadata: {
            custody: farcasterCustody,
            verifications: farcasterVerifications,
          },
        },
      };
    }

    if (isEvmConnected && evmAddress) {
      return {
        key: `evm:${evmAddress}`,
        payload: {
          type: "evm" as const,
          identifier: evmAddress,
          handle: ensName || null,
          display_name: ensName || `Wallet ${evmAddress.slice(0, 6)}`,
          avatar_url: ensAvatar || null,
          metadata: {
            ens_name: ensName || null,
          },
        },
      };
    }

    return null;
  }, [
    hiveHandle,
    isFarcasterConnected,
    farcasterFid,
    farcasterHandle,
    farcasterDisplayName,
    farcasterAvatar,
    farcasterCustody,
    farcasterVerifications,
    isEvmConnected,
    evmAddress,
    ensName,
    ensAvatar,
  ]);

  useEffect(() => {
    if (userbaseUser?.id) {
      lastUserIdRef.current = userbaseUser.id;
      return;
    }
    if (!userbaseUser && lastUserIdRef.current) {
      attemptedRef.current.clear();
      lastUserIdRef.current = null;
    }
  }, [userbaseUser]);

  useEffect(() => {
    if (userbaseUser || isBootstrapping) return;
    if (isRestoring) return;
    if (!bootstrapCandidate) return;

    const { key: attemptKey, payload } = bootstrapCandidate;
    const lastAttempt = attemptedRef.current.get(attemptKey);
    if (lastAttempt && Date.now() - lastAttempt < 60_000) return;
    attemptedRef.current.set(attemptKey, Date.now());

    const bootstrap = async () => {
      try {
        setIsBootstrapping(true);
        const response = await fetch("/api/userbase/auth/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to bootstrap userbase");
        }
        await refresh();
      } catch (error) {
        console.error("Userbase bootstrap failed:", error);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, [
    userbaseUser,
    bootstrapCandidate,
    isBootstrapping,
    isRestoring,
    refresh,
  ]);

  return null;
}
