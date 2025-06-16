import React from "react";
import { Box, VStack, Text } from "@chakra-ui/react";
import SnapComposer from "@/components/homepage/SnapComposer";
import { Discussion } from "@hiveio/dhive";

interface BountyReplyComposerProps {
  parentDiscussion: Discussion;
  onNewReply: (newComment: Partial<Discussion>) => void;
  onClose: () => void;
}

const BountyReplyComposer: React.FC<BountyReplyComposerProps> = ({ parentDiscussion, onNewReply, onClose }) => {
  return (
    <Box
      bg="background"
      borderRadius="lg"
      boxShadow="md"
      p={4}
      mb={4}
      mt={2}
    >
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="bold" fontSize="lg" mb={2}>
          Claim the Bounty
        </Text>
        <SnapComposer
          pa={parentDiscussion.author}
          pp={parentDiscussion.permlink}
          onNewComment={onNewReply}
          onClose={onClose}
          post
          submitLabel="Submit"
        />
      </VStack>
    </Box>
  );
};

export default BountyReplyComposer; 