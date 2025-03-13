import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Box, Spinner, VStack, Text } from '@chakra-ui/react';
import Tweet from './Tweet';
import { ExtendedComment, useComments } from '@/hooks/useComments';
import TweetComposer from './TweetComposer';
import { Comment } from '@hiveio/dhive'; // Add this import for consistency

interface TweetListProps {
  author: string
  permlink: string
  setConversation: (conversation: ExtendedComment) => void;
  onOpen: () => void;
  setReply: (reply: ExtendedComment) => void;
  newComment: ExtendedComment | null;
  setNewComment: (comment: ExtendedComment | null) => void;
  post?: boolean;
  data: InfiniteScrollData
}

interface InfiniteScrollData {
  comments: ExtendedComment[];
  loadNextPage: () => void; // Default can be an empty function in usage
  isLoading: boolean;
  hasMore: boolean; // Default can be `false` in usage
}

export default function TweetList(
  {
    author,
    permlink,
    setConversation,
    onOpen,
    setReply,
    newComment,
    setNewComment,
    post = false,
    data,
  }: TweetListProps) {
  const { comments, loadNextPage, isLoading, hasMore } = data;
  // Track displayed comments locally for optimistic updates
  const [displayedComments, setDisplayedComments] = useState<ExtendedComment[]>([]);

  // Update displayed comments when data.comments changes or newComment is added
  useEffect(() => {
    if (comments) {
      setDisplayedComments([...comments]);
    }
  }, [comments]);

  // Add new comment optimistically
  useEffect(() => {
    if (newComment) {
      // Add the new comment to the displayed comments if it's not already there
      setDisplayedComments(prevComments => {
        const exists = prevComments.some(c => c.permlink === (newComment as any).permlink);
        if (!exists) {
          return [newComment as unknown as ExtendedComment, ...prevComments];
        }
        return prevComments;
      });
    }
  }, [newComment]);

  const handleNewComment = (newComment: Partial<Comment>) => {
    // Check if setNewComment is a function before calling it
    if (typeof setNewComment === 'function') {
      setNewComment(newComment as unknown as ExtendedComment);
    } else {
      console.warn('setNewComment is not a function');
      // Still update local state even if parent state setter isn't available
      setDisplayedComments(prev => [newComment as unknown as ExtendedComment, ...prev]);
    }
  };

  // Sort comments by creation date (newest first)
  const sortedComments = [...displayedComments].sort((a: ExtendedComment, b: ExtendedComment) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  return (
    <VStack spacing={1} align="stretch" mx="auto">
      <TweetComposer pa={author} pp={permlink} onNewComment={handleNewComment} onClose={() => null} />

      {isLoading && sortedComments.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Spinner size="xl" />
          <Text>Loading posts...</Text>
        </Box>
      ) : (
        <InfiniteScroll
          dataLength={sortedComments.length}
          next={loadNextPage}
          hasMore={hasMore}
          loader={
            (<Box display="flex" justifyContent="center" alignItems="center" py={5}>
              <Spinner size="xl" color="primary" />
            </Box>
            )}
          scrollableTarget="scrollableDiv"
        >
          <VStack spacing={1} align="stretch">
            {sortedComments.map((comment: ExtendedComment) => (
              <Tweet
                key={comment.permlink}
                comment={comment}
                onOpen={onOpen}
                setReply={setReply}
                {...(!post ? { setConversation } : {})}
              />
            ))}
          </VStack>
        </InfiniteScroll>
      )}
    </VStack>
  );
}
