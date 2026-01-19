"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { FaHeart } from "react-icons/fa";
import { useAioha } from "@aioha/react-ui";
import { getLastSnapsContainer, getPost } from "@/lib/hive/client-functions";
import { Discussion } from "@hiveio/dhive";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePeriodicTimer } from "@/hooks/usePeriodicTimer";
import { TOAST_CONFIG } from "@/config/toast.config";
import ToastCard from "@/components/shared/ToastCard";

interface UpvoteSnapToastProps {
  showInterval?: number;
  displayDuration?: number;
}

export default function UpvoteSnapToast({
  showInterval = TOAST_CONFIG.SHOW_INTERVAL,
  displayDuration = TOAST_CONFIG.DISPLAY_DURATION,
}: UpvoteSnapToastProps) {
  const { user, aioha } = useAioha();
  const [snapContainer, setSnapContainer] = useState<Discussion | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSnapVoteLoading, setIsSnapVoteLoading] = useState(true);
  const [lastShownTime, setLastShownTime] = useState<number>(0);
  const toast = useToast();
  const { isDesktop, isMounted } = useIsDesktop();

  const fetchSnapContainerData = useCallback(async () => {
    if (!user) {
      setIsSnapVoteLoading(false);
      return;
    }

    setIsSnapVoteLoading(true);

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
      setHasVoted(false);
    } finally {
      setIsSnapVoteLoading(false);
    }
  }, [user]);

  const handleUpvote = useCallback(async () => {
    if (!user || !snapContainer) return;

    try {
      const response = await aioha.vote(
        snapContainer.author,
        snapContainer.permlink,
        TOAST_CONFIG.VOTE_WEIGHT
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
  }, [aioha, snapContainer, toast, user]);

  const showUpvoteToast = useCallback(() => {
    if (!isMounted || !isDesktop || !user || !snapContainer || hasVoted || isSnapVoteLoading) {
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
        <ToastCard
          title="Support the Community"
          description="Help SkateHive by upvoting the main snap container post where all snaps are stored."
          detail={`Container: ${snapContainer.author}/${snapContainer.permlink}`}
          icon={<FaHeart size={16} />}
          primaryButton={{
            label: "Upvote Now",
            icon: <FaHeart size={12} />,
            onClick: async () => {
              await handleUpvote();
              onClose();
            },
            colorScheme: "blue",
          }}
          onClose={onClose}
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
    snapContainer,
    hasVoted,
    lastShownTime,
    showInterval,
    displayDuration,
    toast,
    handleUpvote,
    isSnapVoteLoading,
  ]);

  // Load snap container data when user changes
  useEffect(() => {
    if (user && isMounted) {
      fetchSnapContainerData();
    }
  }, [user, isMounted, fetchSnapContainerData]);

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

  // Set up periodic timer for showing toasts
  usePeriodicTimer(showUpvoteToast, {
    initialDelay: TOAST_CONFIG.INITIAL_DELAY,
    interval: showInterval,
    enabled: isMounted && isDesktop && !!user,
  });

  return null;
}
