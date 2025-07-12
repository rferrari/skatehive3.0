import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Text,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
} from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import { Discussion } from "@hiveio/dhive";
import Snap from "@/components/homepage/Snap";
import Conversation from "@/components/homepage/Conversation";

interface SpotListProps {
  newSpot?: Discussion | null;
  spots?: Discussion[];
}

export default function SpotList({ newSpot, spots }: SpotListProps) {
  const { comments, isLoading, error } = useComments(
    "web-gnar",
    "about-the-skatehive-spotbook",
    false
  );
  const [displayedSpots, setDisplayedSpots] = useState<Discussion[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [conversation, setConversation] = useState<Discussion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update displayed spots when comments or newSpot changes
  useEffect(() => {
    let baseSpots = spots ? [...spots] : [...comments];
    if (newSpot) {
      // Prepend new spot if not already in the list
      const exists = baseSpots.some((c) => c.permlink === newSpot.permlink);
      if (!exists) {
        baseSpots = [newSpot, ...baseSpots];
      }
    }
    // Sort by created date, newest first
    baseSpots.sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
    setDisplayedSpots(baseSpots);
  }, [comments, newSpot, spots]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleOpenConversation = (spot: Discussion) => {
    setConversation(spot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConversation(null);
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
    <>
      <VStack spacing={6} align="stretch" my={8}>
        {displayedSpots.slice(0, visibleCount).map((spot) => (
          <Snap
            key={spot.permlink}
            discussion={spot}
            onOpen={() => handleOpenConversation(spot)}
            setReply={() => {}}
            setConversation={handleOpenConversation}
          />
        ))}
        {visibleCount < displayedSpots.length && (
          <Button
            onClick={handleLoadMore}
            alignSelf="center"
            colorScheme="primary"
            variant="outline"
          >
            Load More
          </Button>
        )}
      </VStack>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
        <ModalOverlay />
        <ModalContent bg="background" color="text">
          {conversation && (
            <Conversation
              discussion={conversation}
              setConversation={() => setIsModalOpen(false)}
              onOpen={() => {}}
              setReply={() => {}}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
} 