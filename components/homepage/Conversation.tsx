import React, { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Button,
  Divider,
  VStack,
  Spinner,
  useToken,
  useTheme,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { useComments } from "@/hooks/useComments";
import { ArrowBackIcon, CloseIcon } from "@chakra-ui/icons";
import Snap from "./Snap";
import SnapComposer from "./SnapComposer";

interface ConversationProps {
  discussion: Discussion;
  setConversation: (conversation: Discussion | undefined) => void;
  onOpen: () => void;
  setReply: (reply: Discussion) => void;
}

const Conversation = ({
  discussion,
  setConversation,
  onOpen,
  setReply,
}: ConversationProps) => {
  const { comments, isLoading, error } = useComments(
    discussion.author,
    discussion.permlink,
    true
  );
  const replies = comments;

  // New state for inline reply and optimistic update
  const [optimisticReplies, setOptimisticReplies] = useState<Discussion[]>([]);

  const theme = useTheme();
  const [primaryColor] = useToken("colors", ["primary"]);

  function onBackClick() {
    setConversation(undefined);
  }

  // New onNewComment handler for SnapComposer with optimistic update
  function handleNewReply(newComment: Partial<Discussion>) {
    const newReply = newComment as Discussion;
    setOptimisticReplies((prev) => [...prev, newReply]);
    setReply(newReply);
  }

  // Callback to update comment count when a new comment is added
  function handleCommentAdded() {
    // This will be called when a comment is added to update the count
    // The count is already updated optimistically in the Snap component
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
    <Box bg="muted" p={4} mt={1} mb={1} borderRadius="base" boxShadow="lg">
      <HStack mb={4} spacing={2}>
        <Text fontSize="2xl" fontWeight="extrabold">
          Conversation
        </Text>
        <Button
          onClick={onBackClick}
          variant="ghost"
          ml="auto"
          aria-label="Close"
          _hover={{ bg: primaryColor + "20" }}
        >
          <CloseIcon color={primaryColor} />
        </Button>
      </HStack>
      <Snap
        discussion={{ ...discussion, depth: 0 } as any} // Use the built‑in depth for root
        onOpen={onOpen}
        setReply={setReply}
        setConversation={setConversation}
        onCommentAdded={handleCommentAdded}
      />
      <Divider my={4} />
      <Box mt={2}>
        {/* Inline snap composer replacing the generic Textarea */}
        <SnapComposer
          pa={discussion.author}
          pp={discussion.permlink}
          onNewComment={
            handleNewReply as (newComment: Partial<Discussion>) => void
          } // changed cast type
          onClose={() => {}}
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
              discussion={reply}
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
