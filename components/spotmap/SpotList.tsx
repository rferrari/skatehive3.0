import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  VStack,
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
}

export default function SpotList({ 
  newSpot, 
  spots = [], 
  isLoading = false, 
  hasMore = false, 
  onLoadMore 
}: SpotListProps) {
  const [displayedSpots, setDisplayedSpots] = useState<Discussion[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [conversation, setConversation] = useState<Discussion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug: Track displayedSpots changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('SpotList: displayedSpots changed', { 
        count: displayedSpots.length,
        spots: displayedSpots.map(s => ({ author: s.author, permlink: s.permlink }))
      });
    }
  }, [displayedSpots]);

  // Update displayed spots when spots or newSpot changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('SpotList: spots or newSpot changed', { 
        spotsCount: spots.length, 
        newSpot: newSpot ? { author: newSpot.author, permlink: newSpot.permlink } : null 
      });
    }
    
    let baseSpots = [...spots];
    if (newSpot) {
      // Prepend new spot if not already in the list
      const exists = baseSpots.some((c) => c.permlink === newSpot.permlink);
      if (!exists) {
        baseSpots = [newSpot, ...baseSpots];
        if (typeof window !== 'undefined') {
          console.log('SpotList: Added new spot to baseSpots');
        }
      }
    }
    // Sort by created date, newest first, handling invalid dates
    baseSpots.sort((a, b) => {
      const dateA = a.created === "just now" ? new Date() : new Date(a.created);
      const dateB = b.created === "just now" ? new Date() : new Date(b.created);
      return dateB.getTime() - dateA.getTime();
    });
    if (typeof window !== 'undefined') {
      console.log('SpotList: Setting displayedSpots', { count: baseSpots.length });
    }
    setDisplayedSpots(baseSpots);
    
    // Reset visibleCount when spots change (new data loaded)
    if (spots.length > 0) {
      setVisibleCount(10);
    }
  }, [spots, newSpot]);

  const handleLoadMore = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('SpotList: handleLoadMore called', { 
        hasOnLoadMore: !!onLoadMore, 
        hasMore, 
        isLoading,
        visibleCount,
        displayedSpotsLength: displayedSpots.length
      });
    }
    
    if (onLoadMore && hasMore && !isLoading) {
      // If we have a loadMore function, use it to fetch more data
      if (typeof window !== 'undefined') {
        console.log('SpotList: Calling onLoadMore to fetch more data');
      }
      onLoadMore();
    } else if (!onLoadMore) {
      // Fallback to just showing more items from current data
      if (typeof window !== 'undefined') {
        console.log('SpotList: Using fallback - increasing visibleCount');
      }
      setVisibleCount((prev) => prev + 10);
    } else {
      if (typeof window !== 'undefined') {
        console.log('SpotList: handleLoadMore conditions not met', {
          hasOnLoadMore: !!onLoadMore,
          hasMore,
          isLoading
        });
      }
    }
  }, [onLoadMore, hasMore, isLoading, visibleCount, displayedSpots.length]);

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

  if (isLoading && displayedSpots.length === 0) {
    return <LoadingComponent />;
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
      <Box my={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {displayedSpots.slice(0, visibleCount).map((spot) => (
            <Snap
              key={spot.permlink}
              discussion={spot}
              onOpen={() => handleOpenConversation(spot)}
              setReply={() => {}}
              setConversation={handleOpenConversation}
            />
          ))}
        </SimpleGrid>
        
        {/* Show loading spinner when fetching more data */}
        {isLoading && displayedSpots.length > 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <Spinner color="primary" />
          </Box>
        )}
        
        {/* Show manual load more button as fallback */}
        {(hasMore || visibleCount < displayedSpots.length) && !isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <Button
              onClick={handleLoadMore}
              colorScheme="primary"
              variant="outline"
            >
              {hasMore ? "Load More Spots" : "Show More"}
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
              onOpen={() => {}}
              setReply={() => {}}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
} 