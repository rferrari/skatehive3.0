"use client";

import { Flex, Box } from "@chakra-ui/react";
import SnapList from "@/components/homepage/SnapList";
import RightSidebar from "@/components/layout/RightSideBar";
import { useState, useEffect } from "react";
import { Discussion } from "@hiveio/dhive";
import Conversation from "@/components/homepage/Conversation";
import SnapReplyModal from "@/components/homepage/SnapReplyModal";
import { useSnaps } from "@/hooks/useSnaps";
import useIsMobile from "@/hooks/useIsMobile";

export default function HomePageClient() {
  const thread_author = "peak.snaps";
  const thread_permlink = "snaps";
  const isMobile = useIsMobile();

  const [conversation, setConversation] = useState<Discussion | undefined>();
  const [reply, setReply] = useState<Discussion>();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState<Discussion | null>(null);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleNewComment = (
    newComment: Partial<Discussion> | CharacterData
  ) => {
    setNewComment(newComment as Discussion);
  };

  const snaps = useSnaps();

  return (
    <Flex direction={{ base: "column", md: "row" }} justifyContent="center">
      <Box
        maxH="100vh"
        overflowY="auto"
        width={{ base: "100%", md: "600px", lg: "600px" }}
        maxWidth="600px"
        borderLeft="1px"
        borderRight="1px"
        borderColor="muted"
        p={0}
        pt={2}
        justifyContent="center"
        sx={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
        }}
        id="scrollableDiv"
      >
        {/* On mobile, always show SnapList and show Conversation as overlay drawer */}
        {/* On desktop, conditionally show either SnapList or Conversation */}
        {!conversation ? (
          <SnapList
            author={thread_author}
            permlink={thread_permlink}
            setConversation={setConversation}
            onOpen={onOpen}
            setReply={setReply}
            newComment={newComment}
            setNewComment={setNewComment}
            data={snaps}
          />
        ) : (
          <>
            {/* Mobile: Show SnapList always */}
            <Box display={{ base: "block", md: "none" }}>
              <SnapList
                author={thread_author}
                permlink={thread_permlink}
                setConversation={setConversation}
                onOpen={onOpen}
                setReply={setReply}
                newComment={newComment}
                setNewComment={setNewComment}
                data={snaps}
              />
            </Box>
            {/* Desktop: Show Conversation */}
            <Box display={{ base: "none", md: "block" }}>
              <Conversation
                discussion={conversation}
                setConversation={setConversation}
                onOpen={onOpen}
                setReply={setReply}
                isOpen={!!conversation}
              />
            </Box>
          </>
        )}

        {/* Mobile conversation drawer - always show on mobile when conversation exists */}
        <Box display={{ base: "block", md: "none" }}>
          {conversation && (
            <Conversation
              discussion={conversation}
              setConversation={setConversation}
              onOpen={onOpen}
              setReply={setReply}
              isOpen={!!conversation}
            />
          )}
        </Box>
      </Box>

      <Box display={{ base: "none", md: "block", lg: "block" }}>
        <RightSidebar />
      </Box>
      {isOpen && (
        <SnapReplyModal
          isOpen={isOpen}
          onClose={onClose}
          discussion={reply}
          onNewReply={handleNewComment}
        />
      )}
    </Flex>
  );
}
