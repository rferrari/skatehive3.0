"use client";

import { Flex, Box } from "@chakra-ui/react";
import SnapList from "@/components/homepage/SnapList";
import RightSidebar from "@/components/layout/RightSideBar";
import { useState } from "react";
import { Discussion } from "@hiveio/dhive";
import Conversation from "@/components/homepage/Conversation";
import SnapReplyModal from "@/components/homepage/SnapReplyModal";
import { useSnaps } from "@/hooks/useSnaps";

export default function Home() {
  //console.log('author', process.env.NEXT_PUBLIC_THREAD_AUTHOR);
  const thread_author = "peak.snaps";
  const thread_permlink = "snaps";

  const [conversation, setConversation] = useState<Discussion | undefined>();
  const [reply, setReply] = useState<Discussion>();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState<Discussion | null>(null); // Define the state

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const handleNewComment = (
    newComment: Partial<Discussion> | CharacterData
  ) => {
    setNewComment(newComment as Discussion);
  };

  const snaps = useSnaps();

  return (
    <Flex direction={{ base: "column", md: "row" }}>
      <Box
        maxH="100vh"
        overflowY="auto"
        flex="1"
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
          <Conversation
            Discussion={conversation}
            setConversation={setConversation}
            onOpen={onOpen}
            setReply={setReply}
          />
        )}
      </Box>

      {/* Changed: Wrap RightSidebar in a Box displayed only on mobile */}
      <Box display={{ base: "none", md: "block", lg: "block" }}>
        <RightSidebar />
      </Box>
      {isOpen && (
        <SnapReplyModal
          isOpen={isOpen}
          onClose={onClose}
          Discussion={reply}
          onNewReply={handleNewComment}
        />
      )}
    </Flex>
  );
}
