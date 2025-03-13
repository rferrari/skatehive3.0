import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Box, Spinner, VStack, Text } from '@chakra-ui/react';
import Tweet from './Tweet';
import { ExtendedComment, useComments } from '@/hooks/useComments';
import TweetComposer from './TweetComposer';
import { Comment } from '@hiveio/dhive'; // Add this import for consistency
import LoadingComponent from './loadingComponent';

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
  { author, permlink, setConversation, onOpen, setReply, newComment, setNewComment, post = false, data }
    : TweetListProps) {
  const { comments, loadNextPage, isLoading, hasMore } = data;
  const [displayedComments, setDisplayedComments] = useState<ExtendedComment[]>([]);

  // Mounted state
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // Update displayed comments when data.comments changes or newComment is added
  useEffect(() => {
    if (comments) {
      setDisplayedComments([...comments]);
    }
  }, [comments]);

  useEffect(() => {
    if (newComment) {
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
    if (typeof setNewComment === 'function') {
      setNewComment(newComment as unknown as ExtendedComment);
    } else {
      console.warn('setNewComment is not a function');
      setDisplayedComments(prev => [newComment as unknown as ExtendedComment, ...prev]);
    }
  };

  // Sort comments by creation date (newest first)
  const sortedComments = [...displayedComments].sort((a: ExtendedComment, b: ExtendedComment) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  // Conditionally render after all hooks have run
  if (!hasMounted) return null;

  return (
    <VStack spacing={1} align="stretch" mx="auto">

      {isLoading && sortedComments.length === 0 ? (
        <Box textAlign="center" mt={-1}>
          <LoadingComponent />
        </Box>
      ) : (
        <>
          <TweetComposer pa={author} pp={permlink} onNewComment={handleNewComment} onClose={() => null} />

          <InfiniteScroll
            dataLength={sortedComments.length}
            next={loadNextPage}
            hasMore={hasMore}
            loader={
              (<Box textAlign="center" mt={4}>
                {/* Changed the spinner to LoadingComponent */}
                <Spinner />
              </Box>)
            }
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
        </>

      )}
    </VStack>
  );
}
