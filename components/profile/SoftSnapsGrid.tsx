"use client";

import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import PostCard from "@/components/blog/PostCard";
import { useTranslations } from "@/lib/i18n/hooks";

interface SoftSnapsGridProps {
  snaps: Discussion[];
}

export default function SoftSnapsGrid({ snaps }: SoftSnapsGridProps) {
  const t = useTranslations("common");

  if (!snaps || snaps.length === 0) {
    return (
      <Box p={6} color="dim">
        <Text fontSize="sm">{t("noSnaps")}</Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {snaps.map((snap) => (
        <PostCard
          key={`${snap.author}/${snap.permlink}`}
          post={snap}
          hideAuthorInfo
        />
      ))}
    </SimpleGrid>
  );
}
