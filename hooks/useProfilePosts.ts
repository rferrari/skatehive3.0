"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { findPosts } from "@/lib/hive/client-functions";

export default function useProfilePosts(username: string) {
  const [posts, setPosts] = useState<any[]>([]);
  const isFetching = useRef(false);
  const params = useRef([
    username,
    "",
    new Date().toISOString().split(".")[0],
    12,
  ]);

  const fetchPosts = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const newPosts = await findPosts("author_before_date", params.current);
      if (newPosts && newPosts.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        params.current = [
          username,
          newPosts[newPosts.length - 1].permlink,
          newPosts[newPosts.length - 1].created,
          12,
        ];
      }
      isFetching.current = false;
    } catch (err) {
      console.error("Failed to fetch posts", err);
      isFetching.current = false;
    }
  }, [username]);

  // Reset posts when username changes
  useEffect(() => {
    setPosts([]);
    params.current = [username, "", new Date().toISOString().split(".")[0], 12];
    fetchPosts();
  }, [username, fetchPosts]);

  return { posts, fetchPosts };
}
