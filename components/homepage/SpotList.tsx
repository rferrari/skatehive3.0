import React, { useEffect, useState } from "react";
import { Box, VStack, Text, Spinner, Image, Divider, Button } from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import { Discussion } from "@hiveio/dhive";

interface SpotListProps {
  newSpot?: Discussion | null;
}

export default function SpotList({ newSpot }: SpotListProps) {
  const { comments, isLoading, error } = useComments(
    "web-gnar",
    "about-the-skatehive-spotbook",
    false
  );
  const [displayedSpots, setDisplayedSpots] = useState<Discussion[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);

  // Update displayed spots when comments or newSpot changes
  useEffect(() => {
    let spots = [...comments];
    if (newSpot) {
      // Prepend new spot if not already in the list
      const exists = spots.some((c) => c.permlink === newSpot.permlink);
      if (!exists) {
        spots = [newSpot, ...spots];
      }
    }
    // Sort by created date, newest first
    spots.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    setDisplayedSpots(spots);
  }, [comments, newSpot]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" my={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading spots...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" my={8} color="red.500">
        <Text>Error loading spots: {error}</Text>
      </Box>
    );
  }

  if (displayedSpots.length === 0) {
    return (
      <Box textAlign="center" my={8}>
        <Text>No spots have been submitted yet.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch" my={8}>
      {displayedSpots.slice(0, visibleCount).map((spot) => (
        <Box key={spot.permlink} p={4} borderRadius="md" boxShadow="md" bg="gray.900">
          <Text fontWeight="bold" fontSize="lg" mb={2}>{spot.body.split("\n")[0]}</Text>
          <Text color="gray.300" mb={2}>{spot.body.split("\n")[1]}</Text>
          <Text color="gray.100" mb={2}>{spot.body.split("\n").slice(2).join("\n")}</Text>
          {/* Render images if present in body */}
          {spot.body.match(/!\[image\]\((.*?)\)/g)?.map((img, idx) => {
            const url = img.match(/!\[image\]\((.*?)\)/)?.[1];
            return url ? (
              <Image key={idx} src={url} alt="spot" maxH="200px" my={2} borderRadius="md" />
            ) : null;
          })}
        </Box>
      ))}
      {visibleCount < displayedSpots.length && (
        <Button onClick={handleLoadMore} alignSelf="center" colorScheme="primary" variant="outline">
          Load More
        </Button>
      )}
    </VStack>
  );
} 