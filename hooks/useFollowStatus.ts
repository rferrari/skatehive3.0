"use client";
import { useState, useEffect, useCallback } from "react";
import { checkFollow } from "@/lib/hive/client-functions";

export default function useFollowStatus(user: string | null, username: string) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (user && username && user !== username) {
      setIsFollowLoading(true);
      checkFollow(user, username)
        .then((res) => setIsFollowing(res))
        .catch(() => setIsFollowing(false))
        .finally(() => setIsFollowLoading(false));
    } else {
      setIsFollowing(null);
    }
  }, [user, username]);

  const updateFollowing = useCallback((following: boolean | null) => {
    setIsFollowing(following);
  }, []);

  const updateLoading = useCallback((loading: boolean) => {
    setIsFollowLoading(loading);
  }, []);

  return {
    isFollowing,
    isFollowLoading,
    updateFollowing,
    updateLoading,
  };
}
