"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Progress,
  Skeleton,
  Avatar,
  Link,
  useToast,
  Tooltip,
  Divider,
} from "@chakra-ui/react";
import { ExternalLinkIcon, CheckIcon, ViewIcon } from "@chakra-ui/icons";
import { useAccount } from "wagmi";
import {
  useSnapshotProposal,
  getProposalStatus,
  isSnapshotUrl,
  checkUserVote,
  getUserVotingPower,
} from "@/lib/utils/snapshotUtils";
import { useSnapshotVoting } from "@/hooks/useSnapshotVoting";
import { SnapshotProposalModal } from "./SnapshotProposalModal";
import { SNAPSHOT_CONFIG, isBasicVotingProposal } from "@/lib/config/snapshot";

interface SnapshotPreviewProps {
  url: string;
}

interface VoteButtonProps {
  choice: string;
  index: number;
  isSelected: boolean;
  score: number;
  totalScore: number;
  canVote: boolean;
  onVote: (choiceIndex: number) => void;
  isVoting: boolean;
}

const VoteButton: React.FC<VoteButtonProps> = ({
  choice,
  index,
  isSelected,
  score,
  totalScore,
  canVote,
  onVote,
  isVoting,
}) => {
  const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;

  return (
    <Button
      width="100%"
      size="sm"
      onClick={() => onVote(index)}
      position="relative"
      overflow="hidden"
      justifyContent="flex-start"
      px={3}
      py={2}
      height="auto"
      minH="40px"
      bg={isSelected ? "primary" : "background"}
      color={isSelected ? "background" : "primary"}
      border="1px solid"
      borderColor="primary"
      role="group"
      _hover={{
        bg: "primary",
        color: "background",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      }}
      _active={{
        transform: "translateY(0px)",
      }}
      transition="all 0.2s ease"
      isDisabled={!canVote || isVoting}
    >
      {/* Background progress bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        height="100%"
        width={`${percentage}%`}
        bg={isSelected ? "background" : "primary"}
        opacity={0.2}
        transition="width 0.3s ease"
      />

      <HStack justify="space-between" width="100%" position="relative">
        <HStack spacing={2}>
          {isSelected && <CheckIcon boxSize={3} />}
          <Text
            fontSize="sm"
            fontWeight="medium"
            _groupHover={{ color: "background" }}
          >
            {choice}
          </Text>
        </HStack>
        <VStack spacing={0} align="flex-end">
          <Text
            fontSize="xs"
            color="inherit"
            _groupHover={{ color: "background" }}
          >
            {percentage.toFixed(1)}%
          </Text>
          <Text
            fontSize="xs"
            color="inherit"
            opacity={0.8}
            _groupHover={{ color: "background", opacity: 0.8 }}
          >
            {score.toLocaleString()} votes
          </Text>
        </VStack>
      </HStack>
    </Button>
  );
};

const SnapshotPreview: React.FC<SnapshotPreviewProps> = ({ url }) => {
  console.log("🗳️ [SnapshotPreview] Rendering component for URL:", url);

  const { proposal, loading, error, refresh } = useSnapshotProposal(url);
  const { address: userAddress, isConnected } = useAccount();
  const { vote, isVoting } = useSnapshotVoting();
  const [userVote, setUserVote] = useState<any>(null);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [votingPower, setVotingPower] = useState(0);
  const [hasCheckedVote, setHasCheckedVote] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  console.log("🗳️ [SnapshotPreview] Hook results:", {
    proposal: proposal?.id,
    loading,
    error,
    isConnected,
    userAddress,
  });

  // Reset state when proposal or user changes
  React.useEffect(() => {
    setHasCheckedVote(false);
    setUserVote(null);
    setVotingPower(0);
  }, [proposal?.id, userAddress]);

  // Check if user has already voted
  const checkExistingVote = useCallback(async () => {
    console.log("🗳️ [SnapshotPreview] Checking existing vote:", {
      proposal: proposal?.id,
      userAddress,
      hasCheckedVote,
    });

    if (!proposal || !userAddress || hasCheckedVote) {
      console.log(
        "🗳️ [SnapshotPreview] Skipping vote check - missing requirements"
      );
      return;
    }

    try {
      console.log("🗳️ [SnapshotPreview] Fetching user vote from API");
      const vote = await checkUserVote(proposal.id, userAddress);
      console.log("🗳️ [SnapshotPreview] User vote result:", vote);

      if (vote) {
        setUserVote(vote.choice);
      }

      const vp = await getUserVotingPower(
        userAddress,
        proposal.space.id,
        proposal.id
      );
      console.log("🗳️ [SnapshotPreview] User voting power:", vp);

      setVotingPower(vp);
      setHasCheckedVote(true);
    } catch (error) {
      console.error(
        "🗳️ [SnapshotPreview] Error checking existing vote:",
        error
      );
    }
  }, [proposal?.id, userAddress, hasCheckedVote]);

  React.useEffect(() => {
    if (proposal && userAddress && !hasCheckedVote) {
      checkExistingVote();
    }
  }, [proposal?.id, userAddress, hasCheckedVote, checkExistingVote]);

  const handleVote = async (choiceIndex: number) => {
    console.log("🗳️ [SnapshotPreview] Attempting to vote:", {
      proposalId: proposal?.id,
      choiceIndex: choiceIndex,
      choiceText: proposal?.choices[choiceIndex],
      userAddress: userAddress,
      isConnected,
    });

    if (!proposal || !isConnected || !userAddress) {
      console.log(
        "🗳️ [SnapshotPreview] Cannot vote - missing proposal, connection, or user address"
      );
      return;
    }

    console.log("🗳️ [SnapshotPreview] Starting production vote process");

    try {
      // Use the production voting hook
      const result = await vote(
        proposal.space.id,
        proposal.id,
        choiceIndex + 1, // Snapshot choices are 1-indexed
        `Vote cast from Skatehive feed`
      );

      console.log("🗳️ [SnapshotPreview] Vote result:", result);

      if (result.success) {
        // Update local state to reflect the vote
        setUserVote(choiceIndex + 1);
        console.log(
          "🗳️ [SnapshotPreview] Vote successful, updating local state"
        );

        // Refresh the proposal data to get updated vote counts
        setTimeout(() => {
          refresh();
          console.log(
            "🗳️ [SnapshotPreview] Refreshing proposal data after vote"
          );
        }, SNAPSHOT_CONFIG.VOTE_REFRESH_DELAY); // Wait for Snapshot to process the vote
      } else {
        console.error("🗳️ [SnapshotPreview] Vote failed:", result.error);
      }
    } catch (error) {
      console.error("🗳️ [SnapshotPreview] Error in vote process:", error);
    }
  };

  // Early return after hooks
  if (!isSnapshotUrl(url)) {
    console.log("🗳️ [SnapshotPreview] Not a Snapshot URL, returning null");
    return null;
  }

  if (loading) {
    console.log("🗳️ [SnapshotPreview] Rendering loading state");
    return (
      <Box display="flex" justifyContent="center" mt={2} mb={2}>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          width="400px"
          minW="300px"
          maxW="400px"
          bg="background"
          p={4}
        >
          <VStack spacing={3} align="stretch">
            <HStack>
              <Skeleton width="40px" height="40px" borderRadius="full" />
              <VStack align="start" spacing={1} flex={1}>
                <Skeleton height="16px" width="60%" />
                <Skeleton height="12px" width="40%" />
              </VStack>
            </HStack>
            <Skeleton height="20px" width="100%" />
            <Skeleton height="60px" width="100%" />
            <VStack spacing={2} align="stretch">
              <Skeleton height="32px" width="100%" />
              <Skeleton height="32px" width="100%" />
              <Skeleton height="32px" width="100%" />
            </VStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (error || !proposal) {
    console.log("🗳️ [SnapshotPreview] Error or no proposal found:", {
      error,
      proposal,
    });
    return null;
  }

  const { status, timeText } = getProposalStatus(proposal);
  // Allow voting if proposal is active, user is connected, and has voting power
  const canVote = Boolean(
    status === "active" && isConnected && userAddress && votingPower > 0
  );
  // Use the improved basic voting detection
  const isBasicVoting = isBasicVotingProposal(proposal.choices);

  console.log("🗳️ [SnapshotPreview] Rendering proposal:", {
    proposalId: proposal.id,
    title: proposal.title,
    status,
    timeText,
    canVote,
    isBasicVoting,
    choices: proposal.choices,
    userVote,
    votingPower,
    userAddress,
    isConnected,
  });

  // Only show voting interface for basic proposals (For, Against, Abstain, etc.)
  if (!isBasicVoting) {
    console.log(
      "🗳️ [SnapshotPreview] Not basic voting, showing simplified preview"
    );
    // For complex voting types, show a simplified preview
    return (
      <Box display="flex" justifyContent="center" mt={2} mb={2}>
        <Link href={url} isExternal _hover={{ textDecoration: "none" }}>
          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            overflow="hidden"
            width="400px"
            minW="400px"
            maxW="400px"
            cursor="pointer"
            bg="background"
            transition="all 0.2s"
            _hover={{
              borderColor: "blue.300",
              transform: "translateY(-2px)",
              boxShadow: "md",
            }}
            p={4}
          >
            <VStack spacing={3} align="stretch">
              <HStack>
                <Avatar
                  size="sm"
                  src={proposal.space.avatar}
                  name={proposal.space.name}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" color="primary">
                    {proposal.space.name} Proposal
                  </Text>
                  <Badge
                    colorScheme={
                      status === "active"
                        ? "green"
                        : status === "pending"
                        ? "orange"
                        : "gray"
                    }
                    size="sm"
                  >
                    {status.toUpperCase()}
                  </Badge>
                </VStack>
                <HStack spacing={2}>
                  <Tooltip label="Preview proposal details" hasArrow>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsModalOpen(true);
                      }}
                      p={1}
                      minW="auto"
                    >
                      <ViewIcon color="gray.500" />
                    </Button>
                  </Tooltip>
                  <ExternalLinkIcon color="gray.500" />
                </HStack>
              </HStack>

              <Text
                fontSize="sm"
                fontWeight="medium"
                noOfLines={2}
                color="primary"
              >
                {proposal.title}
              </Text>

              <Text fontSize="xs" color="gray.600">
                {timeText} • {proposal.scores_total.toLocaleString()} votes
              </Text>
            </VStack>
          </Box>
        </Link>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" mt={2} mb={2}>
      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        overflow="hidden"
        width="400px"
        minW="400px"
        maxW="400px"
        bg="background"
        p={4}
      >
        <VStack spacing={3} align="stretch">
          {/* Header */}
          <HStack>
            <Avatar
              size="sm"
              src={proposal.space.avatar}
              name={proposal.space.name}
            />
            <VStack align="start" spacing={0} flex={1}>
              <Link href={url} isExternal>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="blue.500"
                  _hover={{ textDecoration: "underline" }}
                >
                  {proposal.space.name}
                </Text>
              </Link>
              <HStack spacing={2}>
                <Badge
                  colorScheme={
                    status === "active"
                      ? "green"
                      : status === "pending"
                      ? "orange"
                      : "gray"
                  }
                  size="sm"
                >
                  {status.toUpperCase()}
                </Badge>
                {userVote && (
                  <Badge colorScheme="blue" size="sm">
                    VOTED
                  </Badge>
                )}
              </HStack>
            </VStack>
            <HStack spacing={2}>
              <Tooltip label="Preview proposal details" hasArrow>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsModalOpen(true)}
                  p={1}
                  minW="auto"
                >
                  <ViewIcon color="gray.500" />
                </Button>
              </Tooltip>
              <Link href={url} isExternal>
                <ExternalLinkIcon color="gray.500" />
              </Link>
            </HStack>
          </HStack>

          {/* Title */}
          <Text
            fontSize="sm"
            fontWeight="medium"
            noOfLines={3}
            color="primary"
            lineHeight="1.3"
          >
            {proposal.title}
          </Text>

          {/* Voting Progress */}
          {proposal.scores_total > 0 && (
            <VStack spacing={1} align="stretch">
              <Text fontSize="xs" color="gray.600">
                {proposal.scores_total.toLocaleString()} votes • {timeText}
              </Text>
              <Progress
                value={status === "closed" ? 100 : 70}
                size="sm"
                colorScheme="blue"
                bg="gray.100"
              />
            </VStack>
          )}

          {/* Voting Options */}
          {(() => {
            const showVoting = canVote || userVote;
            console.log("🗳️ [SnapshotPreview] Voting section visibility:", {
              canVote,
              userVote,
              showVoting,
              status,
              isConnected,
              userAddress: !!userAddress,
              votingPower,
            });
            return showVoting;
          })() ? (
            <VStack spacing={2} align="stretch">
              <Divider />
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="primary"
                textAlign="center"
              >
                {canVote
                  ? `Vote with ${votingPower.toFixed(2)} voting power`
                  : "Voting Results"}
              </Text>
              {proposal.choices.map((choice, index) => (
                <VoteButton
                  key={index}
                  choice={choice}
                  index={index}
                  isSelected={userVote === index + 1}
                  score={proposal.scores[index] || 0}
                  totalScore={proposal.scores_total}
                  canVote={canVote}
                  onVote={handleVote}
                  isVoting={isVoting}
                />
              ))}
              {!isConnected && status === "active" && (
                <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
                  Connect wallet to vote
                </Text>
              )}
            </VStack>
          ) : (
            <VStack spacing={2} align="stretch">
              <Divider />
              <Text fontSize="xs" color="gray.600" textAlign="center">
                {status === "pending"
                  ? "Voting not started"
                  : status === "closed"
                  ? "Voting ended"
                  : !isConnected
                  ? "Connect wallet to vote"
                  : "No voting power"}
              </Text>
              {proposal.choices.map((choice, index) => (
                <HStack
                  key={index}
                  justify="space-between"
                  px={3}
                  py={2}
                  bg="muted"
                  borderRadius="md"
                >
                  <Text fontSize="sm">{choice}</Text>
                  <Text fontSize="xs" color="gray.600">
                    {(
                      ((proposal.scores[index] || 0) /
                        Math.max(proposal.scores_total, 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Proposal Details Modal */}
      {proposal && (
        <SnapshotProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          proposal={proposal}
        />
      )}
    </Box>
  );
};

export default SnapshotPreview;
