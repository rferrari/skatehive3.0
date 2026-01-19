"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { FaVoteYea } from "react-icons/fa";
import { useAioha } from "@aioha/react-ui";
import { witnessVoteWithKeychain } from "@/lib/hive/client-functions";
import useHiveAccount from "@/hooks/useHiveAccount";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePeriodicTimer } from "@/hooks/usePeriodicTimer";
import { TOAST_CONFIG } from "@/config/toast.config";
import ToastCard from "@/components/shared/ToastCard";

interface WitnessVoteToastProps {
  showInterval?: number;
  displayDuration?: number;
}

export default function WitnessVoteToast({
  showInterval = TOAST_CONFIG.SHOW_INTERVAL,
  displayDuration = TOAST_CONFIG.DISPLAY_DURATION,
}: WitnessVoteToastProps) {
  const { user } = useAioha();
  const [hasVotedWitness, setHasVotedWitness] = useState(false);
  const [lastShownTime, setLastShownTime] = useState<number>(0);
  const [hasShownLoginToast, setHasShownLoginToast] = useState(false);
  const [witnessDataLoaded, setWitnessDataLoaded] = useState(false);
  const toast = useToast();
  const { isDesktop, isMounted } = useIsDesktop();

  // Use the useHiveAccount hook to get account data
  const { hiveAccount } = useHiveAccount(user || "");

  const fetchWitnessVoteData = useCallback(() => {
    if (!user || !hiveAccount) return;

    try {
      // Check if user has voted for skatehive witness using the witness_votes array
      const hasVotedForSkateHive =
        hiveAccount.witness_votes?.includes("skatehive") || false;

      setHasVotedWitness(hasVotedForSkateHive);
      setWitnessDataLoaded(true);
    } catch (error) {
      console.error("Failed to get witness votes", error);
    }
  }, [user, hiveAccount]);

  const handleWitnessVote = useCallback(async () => {
    if (!user) return;

    try {
      await witnessVoteWithKeychain(user, "skatehive");
      toast({
        title: "Success! 🎉",
        description: "Successfully voted for SkateHive witness!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setHasVotedWitness(true);
      // The account data will refresh automatically through useHiveAccount
    } catch (error: any) {
      console.error("Failed to vote for witness:", error);
      toast({
        title: "Witness Vote Failed",
        description:
          error.message ||
          "An error occurred while trying to vote for witness.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast, user]);

  const showWitnessVoteToast = useCallback(() => {
    if (!isMounted || !isDesktop || !user || hasVotedWitness) {
      return;
    }

    const now = Date.now();
    if (now - lastShownTime < showInterval) {
      return;
    }

    setLastShownTime(now);

    const toastId = toast({
      title: "🗳️ Witness Vote",
      description: "Vote for SkateHive witness to support the blockchain",
      status: "info",
      duration: displayDuration,
      isClosable: true,
      position: "bottom-right",
      render: ({ onClose }) => (
        <ToastCard
          title="Vote for SkateHive Witness"
          description="Support SkateHive blockchain infrastructure by voting for our witness. Your vote helps secure the network and supports our community."
          detail="Witness: @skatehive"
          icon={<FaVoteYea size={16} />}
          primaryButton={{
            label: "Vote Now",
            icon: <FaVoteYea size={12} />,
            onClick: async () => {
              await handleWitnessVote();
              onClose();
            },
            colorScheme: "green",
          }}
          onClose={onClose}
          borderColor="var(--chakra-colors-green-500)"
          titleColor="var(--chakra-colors-green-500)"
        />
      ),
    });

    // Auto-close after duration if user hasn't interacted
    setTimeout(() => {
      if (toast.isActive(toastId)) {
        toast.close(toastId);
      }
    }, displayDuration);
  }, [
    isMounted,
    isDesktop,
    user,
    hasVotedWitness,
    lastShownTime,
    showInterval,
    displayDuration,
    toast,
    handleWitnessVote,
  ]);

  // Load user data when user changes
  useEffect(() => {
    if (user && isMounted && hiveAccount) {
      fetchWitnessVoteData();
    }
  }, [user, isMounted, hiveAccount, fetchWitnessVoteData]);

  // Show witness vote toast immediately after user login if they haven't voted
  useEffect(() => {
    if (
      user &&
      isMounted &&
      isDesktop &&
      hiveAccount &&
      witnessDataLoaded &&
      !hasVotedWitness &&
      !hasShownLoginToast
    ) {
      setHasShownLoginToast(true);
      // Show witness toast after a short delay after login
      setTimeout(() => {
        showWitnessVoteToast();
      }, TOAST_CONFIG.LOGIN_WITNESS_DELAY);
    }
  }, [
    user,
    isMounted,
    isDesktop,
    hiveAccount,
    witnessDataLoaded,
    hasVotedWitness,
    hasShownLoginToast,
    showWitnessVoteToast,
  ]);

  // Reset login toast flag when user changes
  useEffect(() => {
    if (!user) {
      setHasShownLoginToast(false);
      setWitnessDataLoaded(false);
    }
  }, [user]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && isMounted) {
        fetchWitnessVoteData();
      }
    };

    if (isMounted) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [user, isMounted, fetchWitnessVoteData]);

  // Set up periodic timer for showing toasts
  usePeriodicTimer(showWitnessVoteToast, {
    initialDelay: TOAST_CONFIG.WITNESS_DELAY,
    interval: showInterval,
    enabled: isMounted && isDesktop && !!user,
  });

  return null;
}
