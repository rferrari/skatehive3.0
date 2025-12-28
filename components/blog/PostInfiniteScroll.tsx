"use client";
import {
  Box,
  Skeleton,
  SimpleGrid,
  Flex,
  Grid,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";
import InfiniteScroll from "react-infinite-scroll-component";
import PostGrid from "@/components/blog/PostGrid";
import { Discussion } from "@hiveio/dhive";

/**
 * PostsInfiniteScroll Props
 *
 * Note: `hasMore` must be explicitly managed by the parent and passed in.
 * The component does NOT assume a default value to avoid accidental infinite loading.
 */
interface PostsInfiniteScrollProps {
  allPosts: Discussion[];
  fetchPosts: () => Promise<void>;
  /** Whether there are more items to load. Parent MUST manage this. */
  hasMore: boolean;
  viewMode: "grid" | "list" | "magazine";
  context?: "blog" | "profile" | "rightsidebar";
  hideAuthorInfo?: boolean;
  scrollableTargetId?: string;
  scrollThreshold?: number | string;
}

export default function PostsInfiniteScroll({
  allPosts,
  fetchPosts,
  viewMode,
  context = "blog",
  hideAuthorInfo = false,
  hasMore,
  scrollableTargetId = "scrollableDiv",
  scrollThreshold = "200px",
}: PostsInfiniteScrollProps) {
  // Determine columns based on context and viewMode
  const columns =
    viewMode === "grid" || viewMode === "magazine"
      ? (context === "rightsidebar" ? 1 : context === "profile" ? 2 : 3)
      : 1;

  // Safety: ensure hasMore is a boolean; default to false at runtime to avoid accidental infinite loads
  const safeHasMore = typeof hasMore === "boolean" ? hasMore : false;

  return (
    <InfiniteScroll
      dataLength={allPosts.length}
      next={fetchPosts}
      hasMore={safeHasMore}
      scrollThreshold={scrollThreshold}
      loader={
        <SimpleGrid columns={{ base: 1, md: columns }} spacing={4}>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Box
                key={i}
                borderRadius="base"
                overflow="hidden"
                p={4}
                bg="muted"
              >
                {/* Header: avatar + author */}
                <Flex alignItems="center" mb={4}>
                  <SkeletonCircle size="10" mr={3} startColor="muted" endColor="primary" />
                  <Skeleton height="20px" width="100px" startColor="muted" endColor="primary" />
                </Flex>
                {/* Main image/media */}
                <Skeleton height="200px" width="100%" mb={4} startColor="muted" endColor="primary" />
                {/* Title */}
                <Skeleton height="20px" width="80%" mb={2} startColor="muted" endColor="primary" />
                {/* Summary */}
                <Skeleton height="20px" width="60%" startColor="muted" endColor="primary" />
              </Box>
            ))}
        </SimpleGrid>
      }
      scrollableTarget={scrollableTargetId}
    >
      {allPosts && (
        <PostGrid
          posts={allPosts ?? []}
          columns={columns}
          listView={viewMode === "list"}
          hideAuthorInfo={hideAuthorInfo}
        />
      )}
    </InfiniteScroll>
  );
}
