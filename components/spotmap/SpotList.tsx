import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Text,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  SimpleGrid,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import Snap from "@/components/homepage/Snap";
import Conversation from "@/components/homepage/Conversation";
import LoadingComponent from "@/components/homepage/loadingComponent";

interface SpotListProps {
  newSpot?: Discussion | null;
  spots?: Discussion[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  error?: string | null;
}

export default function SpotList({
  newSpot,
  spots = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  error,
}: SpotListProps) {
  const [displayedSpots, setDisplayedSpots] = useState<Discussion[]>(spots);
  const [conversation, setConversation] = useState<Discussion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug: Track props and state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("SpotList props:", { isLoading, spotsLength: spots.length, newSpot, displayedSpotsLength: displayedSpots.length, error });
    }
  }, [isLoading, spots, newSpot, displayedSpots, error]);

  // Update displayed spots when spots or newSpot changes
  useEffect(() => {
    let baseSpots = [...spots];
    if (newSpot) {
      // Prepend new spot if not already in the list
      const exists = baseSpots.some((c) => c.permlink === newSpot.permlink);
      if (!exists) {
        baseSpots = [newSpot, ...baseSpots];
      }
    }
    // Sort by created date, newest first, handling invalid dates
    baseSpots.sort((a, b) => {
      const dateA = a.created === "just now" ? new Date() : new Date(a.created);
      const dateB = b.created === "just now" ? new Date() : new Date(b.created);
      return dateB.getTime() - dateA.getTime();
    });
    setDisplayedSpots(baseSpots);
  }, [spots, newSpot]);

  const handleLoadMore = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log(`handleLoadMore called: hasMore=${hasMore}, onLoadMore=${!!onLoadMore}, isLoading=${isLoading}`);
    }

    if (onLoadMore && hasMore && !isLoading) {
      // If we have a loadMore function and there's more data to fetch, use it
      if (typeof window !== 'undefined') {
        console.log('Calling onLoadMore to fetch more data from API');
      }
      onLoadMore();
    } else {
      if (typeof window !== 'undefined') {
        console.log('Cannot load more: conditions not met');
      }
    }
  }, [onLoadMore, hasMore, isLoading]);

  // Infinite scroll functionality
  useEffect(() => {
    if (!hasMore || isLoading || !onLoadMore) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
          const documentHeight = document.documentElement.offsetHeight;

          if (scrollPosition >= documentHeight - 500) { // Increased threshold for better UX
            if (hasMore && !isLoading) {
              handleLoadMore();
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isLoading, onLoadMore, handleLoadMore]);

  const handleOpenConversation = (spot: Discussion) => {
    setConversation(spot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConversation(null);
  };

  // Initial load: show LoadingComponent
  if (isLoading && spots.length === 0 && displayedSpots.length === 0) {
    return <LoadingComponent />;
  }

  // No spots available
  if (!isLoading && spots.length === 0 && !newSpot) {
    return (
      <Box textAlign="center" my={8}>
        <Text>No spots have been submitted yet.</Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box textAlign="center" my={8}>
        <Text color="red.600" fontWeight="bold">
          Error loading spots:
        </Text>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <>
      <Box my={8}>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacing={6}
          alignItems="stretch"
        >
          {displayedSpots.map((spot) => (
            <Box key={spot.permlink} height="100%">
              <Snap
                key={spot.permlink}
                discussion={spot}
                onOpen={() => handleOpenConversation(spot)}
                setReply={() => {}}
                setConversation={handleOpenConversation}
              />
            </Box>
          ))}
        </SimpleGrid>

        {/* Load more spinner */}
        {isLoading && displayedSpots.length > 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <Spinner color="primary" />
          </Box>
        )}

        {/* Load More button */}
        {hasMore && onLoadMore && !isLoading && displayedSpots.length > 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <Button
              onClick={handleLoadMore}
              colorScheme="primary"
              variant="outline"
            >
              Load More Spots
            </Button>
          </Box>
        )}
      </Box>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
        <ModalOverlay />
        <ModalContent bg="background" color="text">
          {conversation && (
            <Conversation
              discussion={conversation}
              setConversation={() => setIsModalOpen(false)}
              onOpen={() => { }}
              setReply={() => { }}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
}