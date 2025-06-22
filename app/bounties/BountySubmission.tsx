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
import { CloseIcon } from "@chakra-ui/icons";
import BountySnap from "./BountySnap";
import BountyReplyComposer from "./BountyReplyComposer";
import { parse, isAfter } from "date-fns";

interface BountySubmissionProps {
  discussion: Discussion;
  setSubmission: (submission: Discussion | undefined) => void;
  onOpen: () => void;
  setReply: (reply: Discussion) => void;
}

const BountySubmission = ({
  discussion,
  setSubmission,
  onOpen,
  setReply,
}: BountySubmissionProps) => {
  const { comments, isLoading, error } = useComments(
    discussion.author,
    discussion.permlink,
    true
  );
  const replies = comments;
  const [optimisticReplies, setOptimisticReplies] = useState<Discussion[]>([]);
  const theme = useTheme();
  const [primaryColor] = useToken("colors", ["primary"]);

  function onBackClick() {
    setSubmission(undefined);
  }

  function handleNewReply(newComment: Partial<Discussion>) {
    const newReply = newComment as Discussion;
    setOptimisticReplies((prev) => [...prev, newReply]);
    setReply(newReply);
  }

  // Helper to get deadline from bounty body
  function getDeadlineFromBody(body: string): Date | null {
    const deadlineMatch = body.match(/Deadline:\s*(\d{2}-\d{2}-\d{4})/);
    if (deadlineMatch && deadlineMatch[1]) {
      return parse(deadlineMatch[1], "MM-dd-yyyy", new Date());
    }
    return null;
  }
  const deadline = getDeadlineFromBody(discussion.body);
  const now = new Date();
  const isActive = deadline ? isAfter(deadline, now) : true;

  if (isLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <Spinner size="xl" />
        <Text>Loading Bounty Submission...</Text>
      </Box>
    );
  }

  return (
    <Box bg="muted" p={4} mt={1} mb={1} borderRadius="base" boxShadow="lg">
      {/* Large Title (Trick/Challenge) */}
      <HStack mb={4} spacing={2} align="flex-start">
        <Box flex={1}>
          <Text
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
            mb={1}
          >
            {(() => {
              const match = discussion.body.match(/Trick\/Challenge:\s*(.*)/);
              return match && match[1] ? match[1].trim() : "Bounty Submission";
            })()}
          </Text>
        </Box>
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
      <BountySnap
        discussion={{ ...discussion, depth: 0 } as any}
        onOpen={onOpen}
        setReply={setReply}
        setConversation={setSubmission}
        hideSubmitButton={true}
        showMedia={true}
        showTitle={false}
        showAuthor={true}
      />
      <Divider my={4} />
      {isActive ? (
        <BountyReplyComposer
          parentDiscussion={discussion}
          onNewReply={handleNewReply}
          onClose={() => console.log("Composer closed")}
        />
      ) : (
        <Text color="red.400" fontWeight="bold" textAlign="center" my={4}>
          Submissions are closed for this bounty.
        </Text>
      )}
      <Divider my={4} />
      <VStack spacing={2} align="stretch">
        {[...optimisticReplies, ...replies].map((reply: any) => (
          <BountySnap
            key={reply.permlink}
            discussion={reply}
            onOpen={onOpen}
            setReply={setReply}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default BountySubmission;
