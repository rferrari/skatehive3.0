import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  SimpleGrid,
} from "@chakra-ui/react";
import { useTranslations } from "@/contexts/LocaleContext";
import { Discussion } from "@hiveio/dhive";
import Snap from "@/components/homepage/Snap";
import SnapComposer from "@/components/homepage/SnapComposer";
import LoadingComponent from "@/components/homepage/loadingComponent";
import { useComments } from "@/hooks/useComments";
import { useAioha } from "@aioha/react-ui";

interface SpotCommentsModalProps {
  discussion: Discussion;
  onClose: () => void;
}

const SpotCommentsModal = ({ discussion, onClose }: SpotCommentsModalProps) => {
  const t = useTranslations('map');
  const tCommon = useTranslations('common');
  const { user } = useAioha();
  const [optimisticComments, setOptimisticComments] = useState<Discussion[]>([]);

  // Fetch comments for this spot
  const {
    comments,
    isLoading: commentsLoading,
    error: commentsError,
  } = useComments(discussion.author, discussion.permlink, false);

  const handleNewComment = (newComment: Partial<Discussion>) => {
    setOptimisticComments((prev) => [newComment as Discussion, ...prev]);
  };

  const handleCommentAdded = () => {
    // This will be called when a comment is added to update the count
  };

  return (
    <VStack spacing={4} align="stretch" p={4} maxH="80vh" overflow="hidden">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="bold">
          {t('comments')}
        </Text>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {tCommon('close')}
        </Button>
      </HStack>

      {/* Comment Composer - only show if user is logged in */}
      {user && (
        <Box>
          <SnapComposer
            pa={discussion.author}
            pp={discussion.permlink}
            onNewComment={handleNewComment}
            post={false}
            onClose={() => {}}
            submitLabel={t('comment')}
            buttonSize="sm"
          />
        </Box>
      )}

      {/* Comments List */}
      <Box flex="1" overflowY="auto" maxH="60vh">
        <VStack spacing={3} align="stretch">
          {commentsLoading ? (
            <Text color="muted" textAlign="center" py={8}>
              {t('loadingComments')}
            </Text>
          ) : commentsError ? (
            <Text color="red.400" textAlign="center" py={8}>
              {t('errorLoadingComments')} {commentsError}
            </Text>
          ) : optimisticComments.length === 0 && comments.length === 0 ? (
            <Text color="muted" textAlign="center" py={8}>
              {t('noCommentsYet')}
            </Text>
          ) : (
            <>
              {/* Show optimistic comments first (newest) */}
              {optimisticComments.map((comment, index) => (
                <Box
                  key={`optimistic-${index}`}
                  p={2}
                  borderRadius="none"
                  bg="muted"
                  opacity={0.8}
                  borderLeft="3px solid"
                  borderColor="primary"
                >
                  <Snap
                    discussion={comment}
                    onOpen={() => {}}
                    setReply={() => {}}
                    onCommentAdded={handleCommentAdded}
                  />
                </Box>
              ))}
              {/* Show real comments using Snap component */}
              {comments.map((comment, index) => (
                <Box key={comment.permlink || index} p={2} borderRadius="md" bg="muted">
                  <Snap
                    discussion={comment}
                    onOpen={() => {}}
                    setReply={() => {}}
                    onCommentAdded={handleCommentAdded}
                  />
                </Box>
              ))}
            </>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

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
  const t = useTranslations('map');
  const [displayedSpots, setDisplayedSpots] = useState<Discussion[]>([]);
  const [conversation, setConversation] = useState<Discussion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (onLoadMore && hasMore && !isLoading) {
      onLoadMore();
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

  if (isLoading && displayedSpots.length === 0) {
    return <LoadingComponent />;
  }

  if (displayedSpots.length === 0) {
    return (
      <Box textAlign="center" my={8}>
        <Text>{t('noSpotsYet')}</Text>
      </Box>
    );
  }

  return (
    <>
      <Box my={8} className="spot-list">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {displayedSpots.map((spot) => (
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
        
        {/* Show Load More button only when there's more data to fetch */}
        {hasMore && onLoadMore && !isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <Button
              onClick={handleLoadMore}
              colorScheme="primary"
              variant="outline"
            >
              {t('loadMoreSpots')}
            </Button>
          </Box>
        )}
      </Box>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
        <ModalOverlay />
        <ModalContent bg="background" color="text">
          {conversation && <SpotCommentsModal discussion={conversation} onClose={handleCloseModal} />}
        </ModalContent>
      </Modal>
    </>
  );
} 