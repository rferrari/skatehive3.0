"use client";

import { Box, Spinner } from "@chakra-ui/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Discussion } from "@hiveio/dhive";
import { findPosts } from "@/lib/hive/client-functions";
import PostInfiniteScroll from "@/components/blog/PostInfiniteScroll";
import { CommunityTotalPayout } from "../shared";

export default function RightSideBar() {
  const [query, setQuery] = useState("created");
  const [allPosts, setAllPosts] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);

  const tag = process.env.NEXT_PUBLIC_HIVE_SEARCH_TAG;

  const params = useRef([
    {
      tag: tag,
      limit: 8,
      start_author: "",
      start_permlink: "",
    },
  ]);

  const fetchPosts = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    try {
      const posts = await findPosts(query, params.current);
      setAllPosts((prevPosts) => [...prevPosts, ...posts]);
      params.current = [
        {
          tag: tag,
          limit: 8,
          start_author: posts[posts.length - 1]?.author,
          start_permlink: posts[posts.length - 1]?.permlink,
        },
      ];
    } catch (error) {
      // Error fetching leaderboard data
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [query, tag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleScroll = useCallback(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      const { scrollTop, scrollHeight, clientHeight } = sidebar;
      const threshold = 400;
      if (scrollTop + clientHeight >= scrollHeight - threshold && !isLoading) {
        fetchPosts();
      }
    }
  }, [isLoading, fetchPosts]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener("scroll", handleScroll);
      return () => sidebar.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return (
    <Box
      as="aside"
      w={{ base: "100%", md: "300px", lg: "350px" }} // Match HomePageClient.tsx
      // maxW={{ md: "30%", lg: "35%" }} // Match HomePageClient.tsx
      maxH="calc(100vh - 0px)" // Match HomePageClient.tsx
      overflowY="auto"
      overflowX="hidden"
      p={{ md: 2 }} // 8px padding on md and above
      pt={0} // Remove top padding
      mt={0} // Remove top margin
      boxSizing="border-box"
      ref={sidebarRef}
      id="scrollableDiv"
      sx={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
      }}
    >
      <Box w="100%">
        <CommunityTotalPayout />
      </Box>
      <Box w="100%">
        <PostInfiniteScroll
          allPosts={allPosts}
          fetchPosts={fetchPosts}
          viewMode="grid"
          context="rightsidebar"
        />
      </Box>
      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <Spinner />
        </Box>
      )}
    </Box>
  );
}
