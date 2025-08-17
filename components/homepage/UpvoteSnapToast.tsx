"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { FaHeart, FaVoteYea } from "react-icons/fa";
import { useAioha } from "@aioha/react-ui";
import {
  getLastSnapsContainer,
  getPost,
  witnessVoteWithKeychain,
} from "@/lib/hive/client-functions";
import { Discussion } from "@hiveio/dhive";
import HiveClient from "@/lib/hive/hiveclient";
import useHiveAccount from "@/hooks/useHiveAccount";

interface UpvoteSnapToastProps {
  showInterval?: number; // How often to show the toast (in milliseconds)
  displayDuration?: number; // How long to display the toast (in milliseconds)
}

// Custom hook to check if we're on desktop without SSR issues
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };

    if (typeof window !== "undefined") {
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => window.removeEventListener("resize", checkDesktop);
    }
  }, []);

  return { isDesktop: isMounted && isDesktop, isMounted };
}

export default function UpvoteSnapToast({
  showInterval = 120000, // Show every 2 minutes by default
  displayDuration = 16000, // Display for 16 seconds (doubled from 8)
}: UpvoteSnapToastProps) {
  const { user, aioha } = useAioha();
  const [snapContainer, setSnapContainer] = useState<Discussion | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [lastShownTime, setLastShownTime] = useState<number>(0);
  const [hasVotedWitness, setHasVotedWitness] = useState(false);
  const [lastShownWitnessTime, setLastShownWitnessTime] = useState<number>(0);
  const [hasShownLoginWitnessToast, setHasShownLoginWitnessToast] =
    useState(false);
  const toast = useToast();

  // Use the useHiveAccount hook to get account data
  const { hiveAccount, isLoading: isAccountLoading } = useHiveAccount(
    user || ""
  );

  // Use our custom hook for desktop detection
  const { isDesktop, isMounted } = useIsDesktop();

  // Use refs to track if certain toasts have been shown to prevent duplicates
  const hasShownTestToast = useRef(false);
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const witnessInitialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const witnessIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSnapContainerData = useCallback(async () => {
    if (!user) return;

    try {
      const containerInfo = await getLastSnapsContainer();
      if (containerInfo) {
        const postDetails = await getPost(
          containerInfo.author,
          containerInfo.permlink
        );
        setSnapContainer(postDetails);
        if (user && postDetails) {
          const userVote = postDetails.active_votes.some(
            (v) => v.voter === user
          );
          setHasVoted(userVote);
        } else {
          setHasVoted(false);
        }
      }
    } catch (error) {
      console.error("Failed to get snap container", error);
    }
  }, [user || null]);

  const fetchUserData = useCallback(async () => {
    if (!user || !hiveAccount) return;

    try {
      console.log("🔍 Checking witness votes for:", user);

      // Use HiveClient to get account witness votes
      const witnessVotes = await HiveClient.database.call("get_account_votes", [
        user,
      ]);

      console.log("�️ Witness votes:", witnessVotes);

      // Check if user has voted for skatehive witness
      const hasVotedForSkateHive = witnessVotes.some(
        (vote: any) => vote.witness === "skatehive" && vote.approve === 1
      );

      console.log("👤 User witness vote status:", {
        user,
        hasVotedForSkateHive,
        totalWitnessVotes: witnessVotes.length,
      });

      setHasVotedWitness(hasVotedForSkateHive);
    } catch (error) {
      console.error("Failed to get witness votes", error);
    }
  }, [user || null]);

  const handleUpvote = async () => {
    if (!user || !snapContainer) return;

    try {
      const response = await aioha.vote(
        snapContainer.author,
        snapContainer.permlink,
        10000 // 100% upvote
      );

      if (response.success) {
        toast({
          title: "Success! 🎉",
          description: "Successfully upvoted the snap container!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setHasVoted(true);
      } else {
        throw new Error(response.message || "Unknown error");
      }
    } catch (error: any) {
      console.error("Failed to upvote:", error);
      toast({
        title: "Upvote Failed",
        description:
          error.message || "An error occurred while trying to upvote.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleWitnessVote = async () => {
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
      // Refresh witness vote data to confirm vote
      setTimeout(() => {
        fetchUserData();
      }, 2000);
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
  };

  const showUpvoteToast = useCallback(() => {
    if (!isMounted || !isDesktop || !user || !snapContainer || hasVoted) {
      return;
    }

    const now = Date.now();
    if (now - lastShownTime < showInterval) {
      return;
    }

    setLastShownTime(now);

    const toastId = toast({
      title: "💜 Support the Community",
      description: "Help SkateHive by upvoting the main snap container post",
      status: "info",
      duration: displayDuration,
      isClosable: true,
      position: "bottom-right",
      render: ({ onClose }) => (
        <div
          style={{
            background: "var(--chakra-colors-background)",
            border: "1px solid var(--chakra-colors-primary)",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: "300px",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--chakra-colors-primary)",
              }}
            >
              <FaHeart size={16} />
              Support the Community
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--chakra-colors-text)",
                lineHeight: "1.4",
              }}
            >
              Help SkateHive by upvoting the main snap container post where all
              snaps are stored.
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--chakra-colors-muted)",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              Container: {snapContainer.author}/{snapContainer.permlink}
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <Button
                size="sm"
                colorScheme="blue"
                onClick={async () => {
                  await handleUpvote();
                  onClose();
                }}
                leftIcon={<FaHeart size={12} />}
              >
                Upvote Now
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
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
    snapContainer,
    hasVoted,
    lastShownTime,
    showInterval,
    displayDuration,
    toast,
    handleUpvote,
  ]);

  const showWitnessVoteToast = useCallback(() => {
    if (!isMounted || !isDesktop || !user || hasVotedWitness) {
      return;
    }

    const now = Date.now();
    if (now - lastShownWitnessTime < showInterval) {
      return;
    }

    setLastShownWitnessTime(now);

    const toastId = toast({
      title: "🗳️ Witness Vote",
      description: "Vote for SkateHive witness to support the blockchain",
      status: "info",
      duration: displayDuration,
      isClosable: true,
      position: "bottom-right",
      render: ({ onClose }) => (
        <div
          style={{
            background: "var(--chakra-colors-background)",
            border: "1px solid var(--chakra-colors-green-500)",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: "300px",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--chakra-colors-green-500)",
              }}
            >
              <FaVoteYea size={16} />
              Vote for SkateHive Witness
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--chakra-colors-text)",
                lineHeight: "1.4",
              }}
            >
              Support SkateHive's blockchain infrastructure by voting for our
              witness. Your vote helps secure the network and supports our
              community.
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--chakra-colors-muted)",
                fontFamily: "monospace",
              }}
            >
              Witness: @skatehive
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <Button
                size="sm"
                colorScheme="green"
                onClick={async () => {
                  await handleWitnessVote();
                  onClose();
                }}
                leftIcon={<FaVoteYea size={12} />}
              >
                Vote Now
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
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
    lastShownWitnessTime,
    showInterval,
    displayDuration,
    toast,
    handleWitnessVote,
  ]);

  // Load snap container data when user changes
  useEffect(() => {
    if (user && isMounted) {
      fetchSnapContainerData();
    }
  }, [user || null, isMounted, fetchSnapContainerData]);

  // Load user data when user changes
  useEffect(() => {
    if (user && isMounted) {
      fetchUserData();
    }
  }, [user || null, isMounted, fetchUserData]);

  // Show witness vote toast immediately after user login if they haven't voted
  useEffect(() => {
    if (
      user &&
      isMounted &&
      isDesktop &&
      hiveAccount &&
      !hasVotedWitness &&
      !hasShownLoginWitnessToast
    ) {
      setHasShownLoginWitnessToast(true);
      // Show witness toast after a short delay (2 seconds after login)
      setTimeout(() => {
        showWitnessVoteToast();
      }, 2000);
    }
  }, [
    user || null,
    isMounted,
    isDesktop,
    hiveAccount || null,
    hasVotedWitness,
    hasShownLoginWitnessToast,
    showWitnessVoteToast,
  ]);

  // Reset login toast flag when user changes
  useEffect(() => {
    if (!user) {
      setHasShownLoginWitnessToast(false);
    }
  }, [user || null]);

  // Set up interval to show toast periodically
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isMounted || !isDesktop || !user) return;

    intervalRef.current = setInterval(() => {
      showUpvoteToast();
    }, showInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMounted, isDesktop, user || null, showUpvoteToast, showInterval]);

  // Set up interval to show witness vote toast periodically
  useEffect(() => {
    // Clear any existing interval
    if (witnessIntervalRef.current) {
      clearInterval(witnessIntervalRef.current);
    }

    if (!isMounted || !isDesktop || !user) return;

    witnessIntervalRef.current = setInterval(() => {
      showWitnessVoteToast();
    }, showInterval);

    return () => {
      if (witnessIntervalRef.current) {
        clearInterval(witnessIntervalRef.current);
      }
    };
  }, [isMounted, isDesktop, user || null, showWitnessVoteToast, showInterval]);

  // Show toast initially after a short delay
  useEffect(() => {
    // Clear any existing timer
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
    }

    if (!isMounted || !isDesktop || !user || !snapContainer) return;

    initialTimerRef.current = setTimeout(() => {
      showUpvoteToast();
    }, 5000); // Show first toast after 5 seconds

    return () => {
      if (initialTimerRef.current) {
        clearTimeout(initialTimerRef.current);
      }
    };
  }, [
    isMounted,
    isDesktop,
    user || null,
    snapContainer || null,
    showUpvoteToast,
  ]);

  // Show witness vote toast initially after a delay
  useEffect(() => {
    // Clear any existing timer
    if (witnessInitialTimerRef.current) {
      clearTimeout(witnessInitialTimerRef.current);
    }

    if (!isMounted || !isDesktop || !user || !hiveAccount || hasVotedWitness) {
      return;
    }

    witnessInitialTimerRef.current = setTimeout(() => {
      showWitnessVoteToast();
    }, 15000); // Show witness toast after 15 seconds (more offset from upvote toast)

    return () => {
      if (witnessInitialTimerRef.current) {
        clearTimeout(witnessInitialTimerRef.current);
      }
    };
  }, [
    isMounted,
    isDesktop,
    user || null,
    hiveAccount || null,
    hasVotedWitness,
    showWitnessVoteToast,
  ]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && isMounted) {
        fetchSnapContainerData();
        fetchUserData();
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
  }, [user || null, isMounted, fetchSnapContainerData, fetchUserData]);

  // This component doesn't render anything - it only shows toasts
  return null;
}
