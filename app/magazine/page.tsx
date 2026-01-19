"use client";
import Magazine from "@/components/shared/Magazine";
import TopBar from "@/components/blog/TopBar";
import { Box } from "@chakra-ui/react";
import { HIVE_CONFIG } from "@/config/app.config";

export default function MagazinePage() {
  // Show posts from the community, 30 at a time
  const communityTag = HIVE_CONFIG.COMMUNITY_TAG;
  const tag = [{ tag: communityTag, limit: 20 }]; // Bridge API max limit is 20
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
