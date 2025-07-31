"use client";
import Magazine from "@/components/shared/Magazine";
import TopBar from "@/components/blog/TopBar";
import { Box } from "@chakra-ui/react";

export default function MagazinePage() {
  // Show posts from the community, 30 at a time
  const communityTag =
    process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "hive-173115";
  const tag = [{ tag: communityTag, limit: 30 }];
  const query = "created"; // or 'trending', 'hot', etc.

  return (
    <Box
      id="scrollableDiv"
      maxW="container.lg"
      mx="auto"
      maxH="100vh"
      overflowY="auto"
      p={0}
      sx={{
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      <TopBar viewMode="magazine" setViewMode={() => {}} setQuery={() => {}} />
      <Magazine tag={tag} query={query} />
    </Box>
  );
}
