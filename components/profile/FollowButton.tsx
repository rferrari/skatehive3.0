"use client";
import React, { useCallback } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { checkFollow, changeFollow } from "@/lib/hive/client-functions";

interface FollowButtonProps {
  user: string | null;
  username: string;
  isFollowing: boolean | null;
  isFollowLoading: boolean;
  onFollowingChange: (following: boolean | null) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function FollowButton({ 
  user, 
  username, 
  isFollowing, 
  isFollowLoading, 
  onFollowingChange, 
  onLoadingChange 
}: FollowButtonProps) {
  const toast = useToast();

  const handleFollowToggle = useCallback(async () => {
    if (!user || !username || user === username) return;
    
    const prev = isFollowing;
    const next = !isFollowing;
    onFollowingChange(next);
    onLoadingChange(true);
    
    try {
      await changeFollow(user, username);
      // Poll for backend confirmation
      let tries = 0;
      const maxTries = 10;
      const poll = async () => {
        tries++;
        const backendState = await checkFollow(user, username);
        if (backendState === next) {
          onFollowingChange(next);
          onLoadingChange(false);
        } else if (tries < maxTries) {
          setTimeout(poll, 1000);
        } else {
          onFollowingChange(prev);
          onLoadingChange(false);
          toast({
            title: "Follow state not confirmed",
            description: "The blockchain did not confirm your follow/unfollow action. Please try again.",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
      };
      poll();
    } catch (err) {
      onFollowingChange(prev);
      onLoadingChange(false);
      toast({
        title: "Follow action failed",
        description: "There was a problem updating your follow status. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }, [user, username, isFollowing, onFollowingChange, onLoadingChange, toast]);

  if (!user || user === username) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowToggle}
      colorScheme={isFollowing ? 'secondary' : 'primary'}
      isLoading={isFollowLoading}
      isDisabled={isFollowLoading}
      borderRadius="md"
      fontWeight="bold"
      px={2}
      py={0}
      size="xs"
      variant="solid"
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
