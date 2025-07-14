import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Box, Spinner, VStack } from "@chakra-ui/react";
import Snap from "./Snap";
import SnapComposer from "./SnapComposer";
import { Discussion } from "@hiveio/dhive"; // Add this import for consistency
import LoadingComponent from "./loadingComponent";
import UpvoteSnapContainer from "./UpvoteSnapContainer";

interface SnapListProps {
  author: string;
  permlink: string;
  setConversation: (conversation: Discussion) => void;
  onOpen: () => void;
  setReply: (reply: Discussion) => void;
  newComment: Discussion | null;
  setNewComment: (Discussion: Discussion | null) => void;
  post?: boolean;
  data: InfiniteScrollData;
  hideComposer?: boolean;
}

interface InfiniteScrollData {
  comments: Discussion[];
  loadNextPage: () => void; // Default can be an empty function in usage
  isLoading: boolean;
  hasMore: boolean; // Default can be `false` in usage
}

export default function SnapList({
  author,
  permlink,
  setConversation,
  onOpen,
  setReply,
  newComment,
  setNewComment,
  post = false,
  data,
  hideComposer = false,
}: SnapListProps) {
  const { comments, loadNextPage, isLoading, hasMore } = data;
  const [displayedComments, setDisplayedComments] = useState<Discussion[]>([]);

  // Mounted state
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Update displayed comments when data.comments changes or newComment is added
  useEffect(() => {
    if (comments) {
      setDisplayedComments([...comments]);
    }
  }, [comments]);

  useEffect(() => {
    if (newComment) {
      setDisplayedComments((prevComments) => {
        const exists = prevComments.some(
          (c) => c.permlink === (newComment as any).permlink
        );
        if (!exists) {
          return [newComment as unknown as Discussion, ...prevComments];
        }
        return prevComments;
      });
    }
  }, [newComment]);

  const handleNewComment = (newComment: Partial<Discussion>) => {
    if (typeof setNewComment === "function") {
      setNewComment(newComment as unknown as Discussion);
    } else {
      console.warn("setNewComment is not a function");
      setDisplayedComments((prev) => [
        newComment as unknown as Discussion,
        ...prev,
      ]);
    }
  };

  // Sort comments by creation date (newest first)
  const sortedComments = [...displayedComments].sort(
    (a: Discussion, b: Discussion) => {
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    }
  );

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
          {!hideComposer && (
            <SnapComposer
              pa={author}
              pp={permlink}
              onNewComment={
                handleNewComment as (newComment: Partial<Discussion>) => void
              } // Cast handler to expected type
              onClose={() => null}
            />
          )}

          <UpvoteSnapContainer hideIfVoted />

          <InfiniteScroll
            dataLength={sortedComments.length}
            next={loadNextPage}
            hasMore={hasMore}
            loader={
              <Box textAlign="center" mt={4}>
                {/* Changed the spinner to LoadingComponent */}
                <Spinner />
              </Box>
            }
            scrollableTarget="scrollableDiv"
          >
            <VStack spacing={1} align="stretch">
              {sortedComments.map((discussion: Discussion) => (
                <Snap
                  key={discussion.permlink}
                  discussion={discussion}
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
