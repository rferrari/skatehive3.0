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

interface PostsInfiniteScrollProps {
  allPosts: Discussion[];
  fetchPosts: () => Promise<void>;
  viewMode: "grid" | "list" | "magazine";
  context?: "blog" | "profile" | "rightsidebar";
  hideAuthorInfo?: boolean;
}

export default function PostsInfiniteScroll({
  allPosts,
  fetchPosts,
  viewMode,
  context = "blog",
  hideAuthorInfo = false,
}: PostsInfiniteScrollProps) {
  const hasMore = allPosts.length % 12 === 0; // Adjust this logic based on your pagination
  // Determine columns based on context and viewMode
  const columns =
    viewMode === "grid" || viewMode === "magazine"
      ? (context === "rightsidebar" ? 1 : context === "profile" ? 2 : 3)
      : 1;

  return (
    <Box maxWidth="100%" overflowX="hidden"> {/* Constrain width and clip overflow */}
      <InfiniteScroll
        dataLength={allPosts.length}
        next={fetchPosts}
        hasMore={hasMore}
        loader={
          <SimpleGrid columns={{ base: 1, md: columns }} spacing={4} maxWidth="100%">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Box
                  key={i}
                  borderRadius="base"
                  overflow="hidden"
                  p={4}
                  bg="muted"
                  maxWidth="100%" // Ensure skeleton fits within grid
                >
                  {/* Header: avatar + author */}
                  <Flex alignItems="center" mb={4} maxWidth="100%">
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
        scrollableTarget="scrollableDiv"
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
    </Box>
  );
}
