import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  VStack,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { useComments } from "@/hooks/useComments";
import { countDownvotes } from "@/lib/utils/postUtils";
import { useAioha } from "@aioha/react-ui";
import Snap from "../homepage/Snap";
import SnapComposer from "../homepage/SnapComposer";
import LogoMatrix from "../graphics/LogoMatrix";

interface PostCommentsProps {
  author: string;
  permlink: string;
  hideComposer?: boolean;
  onNewComment?: (comment: Discussion) => void;
}

/**
 * Calculate the total upvote value for a comment based on rshares and weight
 * This prioritizes rshares (reward shares) as the primary indicator of vote value
 */
function calculateUpvoteValue(activeVotes: any[]): number {
  if (!activeVotes || !Array.isArray(activeVotes)) return 0;
  
  return activeVotes.reduce((total, vote) => {
    // Skip downvotes (negative values)
    const rshares = vote.rshares || 0;
    const weight = vote.weight || 0;
    
    if (rshares < 0 || weight < 0) return total;
    
    // Prioritize rshares as it represents actual reward value
    // Use weight as fallback for older vote data
    const voteValue = rshares !== 0 ? rshares : weight;
    return total + Math.max(0, voteValue);
  }, 0);
}

/**
 * PostComments - A specialized component for displaying comments on root posts
 * 
 * Sorting Logic:
 * 1. Filter out heavily downvoted comments (2+ downvotes)
 * 2. Sort by highest upvote value first (based on rshares/weight)
 * 3. Then by date (newest first) for comments with equal vote values
 * 
 * This creates a "best comments first" experience while still showing
 * recent activity for comments with similar engagement.
 */
export default function PostComments({
  author,
  permlink,
  hideComposer = false,
  onNewComment,
}: PostCommentsProps) {
  const { comments, isLoading, error } = useComments(author, permlink, true);
  const { user } = useAioha();
  const [displayedComments, setDisplayedComments] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState<Discussion | null>(null);

  // Update displayed comments when data changes
  useEffect(() => {
    if (comments) {
      setDisplayedComments([...comments]);
    }
  }, [comments]);

  // Handle new comments from composer
  useEffect(() => {
    if (newComment) {
      setDisplayedComments((prevComments) => {
        const exists = prevComments.some(
          (c) => c.permlink === newComment.permlink
        );
        if (!exists) {
          const updated = [newComment, ...prevComments];
          onNewComment?.(newComment);
          return updated;
        }
        return prevComments;
      });
    }
  }, [newComment, onNewComment]);

  // Filter and sort comments with upvote-first logic
  const filteredAndSortedComments = useMemo(() => {
    return [...displayedComments]
      .filter((discussion: Discussion) => {
        const downvoteCount = countDownvotes(discussion.active_votes);
        // Filter out posts with 2 or more downvotes (community disapproval)
        return downvoteCount < 2;
      })
      .sort((a: Discussion, b: Discussion) => {
        // Primary sort: Highest upvote value first
        const aUpvoteValue = calculateUpvoteValue(a.active_votes);
        const bUpvoteValue = calculateUpvoteValue(b.active_votes);
        
        if (aUpvoteValue !== bUpvoteValue) {
          return bUpvoteValue - aUpvoteValue; // Higher values first
        }
        
        // Secondary sort: Newest first (for comments with equal vote values)
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      });
  }, [displayedComments]);

  const handleNewComment = (newComment: Partial<Discussion>) => {
    setNewComment(newComment as Discussion);
  };

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Text color="error">Failed to load comments</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={1} align="stretch" mx="auto">
      {isLoading && filteredAndSortedComments.length === 0 ? (
        <Box textAlign="center" mt={-1}>
          <LogoMatrix />
        </Box>
      ) : (
        <>
          {/* Comment Composer */}
          {!hideComposer && user && (
            <SnapComposer
              pa={author}
              pp={permlink}
              onNewComment={handleNewComment}
              onClose={() => null}
            />
          )}

          {/* Comments List */}
          <VStack spacing={1} align="stretch">
            {filteredAndSortedComments.length === 0 && !isLoading ? (
              <Box p={8} textAlign="center">
                <Text color="muted" fontSize="sm">
                  No comments yet. Be the first to comment!
                </Text>
              </Box>
            ) : (
              filteredAndSortedComments.map((discussion: Discussion) => (
                <Snap
                  key={discussion.permlink}
                  discussion={discussion}
                  onOpen={() => {}} // PostComments doesn't need conversation opening
                  setReply={() => {}} // PostComments doesn't handle reply state
                />
              ))
            )}
          </VStack>

          {/* Loading indicator for pagination */}
          {isLoading && filteredAndSortedComments.length > 0 && (
            <Box textAlign="center" mt={4}>
              <Spinner size="sm" color="primary" />
            </Box>
          )}
        </>
      )}
    </VStack>
  );
}

// Export the upvote calculation function for potential reuse
export { calculateUpvoteValue };
