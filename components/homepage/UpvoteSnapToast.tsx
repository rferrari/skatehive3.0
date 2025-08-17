"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { FaHeart } from "react-icons/fa";
import { useAioha } from "@aioha/react-ui";
import { getLastSnapsContainer, getPost } from "@/lib/hive/client-functions";
import { Discussion } from "@hiveio/dhive";

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
  const toast = useToast();

  // Use our custom hook for desktop detection
  const { isDesktop, isMounted } = useIsDesktop();

  // Use refs to track if certain toasts have been shown to prevent duplicates
  const hasShownTestToast = useRef(false);
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug effect - but only log, don't show toasts on every state change
  useEffect(() => {
    console.log("🚀 UpvoteSnapToast state changed:", {
      isMounted,
      isDesktop,
      user: !!user,
      snapContainer: !!snapContainer,
      hasVoted,
    });
  }, [isMounted, isDesktop, user, snapContainer, hasVoted]);

  // One-time test toast to verify the system works - only run once
  useEffect(() => {
    if (isMounted && isDesktop && !hasShownTestToast.current) {
      hasShownTestToast.current = true;
      setTimeout(() => {
        console.log("🧪 Showing one-time test toast");
        toast({
          title: "� UpvoteSnapToast Ready",
          description: "Toast system is working on desktop",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom-right",
        });
      }, 1000);
    }
  }, [isMounted, isDesktop, toast]);

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
  }, [user]);

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

  // Load snap container data when user changes
  useEffect(() => {
    if (user && isMounted) {
      fetchSnapContainerData();
    }
  }, [user, isMounted, fetchSnapContainerData]);

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
  }, [isMounted, isDesktop, user, showUpvoteToast, showInterval]);

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
  }, [isMounted, isDesktop, user, snapContainer, showUpvoteToast]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && isMounted) {
        fetchSnapContainerData();
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
  }, [user, isMounted, fetchSnapContainerData]);

  // This component doesn't render anything - it only shows toasts
  return null;
}
