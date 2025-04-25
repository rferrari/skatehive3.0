import React, { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Button,
  Divider,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { useComments } from "@/hooks/useComments";
import { ArrowBackIcon } from "@chakra-ui/icons";
import Snap from "./Snap";
import SnapComposer from "./SnapComposer";

interface ConversationProps {
  Discussion: Discussion;
  setConversation: (conversation: Discussion | undefined) => void;
  onOpen: () => void;
  setReply: (reply: Discussion) => void;
}

const Conversation = ({
  Discussion,
  setConversation,
  onOpen,
  setReply,
}: ConversationProps) => {
  const { comments, isLoading, error } = useComments(
    Discussion.author,
    Discussion.permlink,
    true
  );
  const replies = comments;

  // New state for inline reply and optimistic update
  const [optimisticReplies, setOptimisticReplies] = useState<Discussion[]>([]);

  function onBackClick() {
    setConversation(undefined);
  }

  // New onNewComment handler for SnapComposer with optimistic update
  function handleNewReply(newComment: Partial<Discussion>) {
    const newReply = newComment as Discussion;
    setOptimisticReplies((prev) => [...prev, newReply]);
    setReply(newReply);
  }

  if (isLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <Spinner size="xl" />
        <Text>Loading Snaps...</Text>
      </Box>
    );
  }

  return (
    <Box
      bg="muted"
      p={4}
      mt={1}
      mb={1}
      borderRadius="base"
      border="tb1"
      boxShadow="lg"
    >
      <HStack mb={4} spacing={2}>
        <Button
          onClick={onBackClick}
          variant="ghost"
          leftIcon={<ArrowBackIcon />}
        />
        <Text fontSize="lg" fontWeight="bold">
          Conversation
        </Text>
      </HStack>
      <Snap
        Discussion={{ ...Discussion, depth: 0 } as any} // Use the built‑in depth for root
        onOpen={onOpen}
        setReply={setReply}
        setConversation={setConversation}
      />
      <Divider my={4} />
      <Box mt={2}>
        {/* Inline snap composer replacing the generic Textarea */}
        <SnapComposer
          pa={Discussion.author}
          pp={Discussion.permlink}
          onNewComment={
            handleNewReply as (newComment: Partial<Discussion>) => void
          } // changed cast type
          onClose={() => console.log("Composer closed")}
          post
        />
      </Box>
      <Divider my={4} />
      <VStack spacing={2} align="stretch">
        {
          // Display optimistic replies first then replies from hook
          [...optimisticReplies, ...replies].map((reply: any) => (
            <Snap
              key={reply.permlink}
              Discussion={reply}
              onOpen={onOpen}
              setReply={setReply}
            />
          ))
        }
      </VStack>
    </Box>
  );
};

export default Conversation;
