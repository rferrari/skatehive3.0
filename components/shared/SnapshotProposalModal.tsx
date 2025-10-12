import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Box,
  Divider,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";
import type { SnapshotProposal } from "@/lib/utils/snapshotUtils";

interface SnapshotProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: SnapshotProposal;
}

export const SnapshotProposalModal: React.FC<SnapshotProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  const isActive = proposal.state === "active";
  const hasEnded = proposal.state === "closed";

  // Format dates
  const startDate = new Date(proposal.start * 1000);
  const endDate = new Date(proposal.end * 1000);

  // Calculate vote percentages
  const totalVotes = proposal.scores.reduce((sum, score) => sum + score, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent
        bg={"background"}
        border="1px"
        borderColor={"primary"}
        maxH="90vh"
      >
        <ModalHeader pb={2}>
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="lg" fontWeight="bold" noOfLines={2}>
                {proposal.title}
              </Text>
              <Badge
                colorScheme={isActive ? "green" : hasEnded ? "red" : "gray"}
                variant="solid"
                textTransform="capitalize"
              >
                {proposal.state}
              </Badge>
            </HStack>

            <HStack spacing={4} fontSize="sm" color="gray.500">
              <Text>Space: {proposal.space.name}</Text>
              <Text>•</Text>
              <Text>Author: {proposal.author}</Text>
            </HStack>
          </VStack>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          <VStack align="start" spacing={4}>
            {/* Voting Period */}
            <Box w="full">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Voting Period
              </Text>
              <HStack spacing={4} fontSize="sm" color="gray.600">
                <Text>Start: {startDate.toLocaleDateString()}</Text>
                <Text>End: {endDate.toLocaleDateString()}</Text>
              </HStack>
            </Box>

            <Divider />

            {/* Voting Results */}
            {proposal.choices && proposal.choices.length > 0 && (
              <Box w="full">
                <Text fontSize="sm" fontWeight="semibold" mb={3}>
                  Voting Results
                </Text>
                <VStack align="start" spacing={2}>
                  {proposal.choices.map((choice, index) => {
                    const votes = proposal.scores[index] || 0;
                    const percentage =
                      totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

                    return (
                      <Box key={index} w="full">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {choice}
                          </Text>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.500">
                              {percentage.toFixed(1)}%
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              ({votes.toLocaleString()} votes)
                            </Text>
                          </HStack>
                        </HStack>
                        <Box w="full" bg="gray.200" borderRadius="full" h={2}>
                          <Box
                            bg={index === 0 ? "green.500" : "red.500"}
                            h={2}
                            borderRadius="full"
                            w={`${percentage}%`}
                            transition="width 0.3s ease"
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            )}

            <Divider />

            {/* Proposal Content */}
            <Box w="full">
              <Text fontSize="sm" fontWeight="semibold" mb={3}>
                Proposal Details
              </Text>
              <Box
                p={4}
                border="1px"
                borderColor={"primary"}
                borderRadius="md"
                bg={useColorModeValue("gray.50", "gray.700")}
                maxH="400px"
                overflowY="auto"
              >
                <EnhancedMarkdownRenderer content={proposal.body} />
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Link
              href={`https://snapshot.org/#/${proposal.space.id}/proposal/${proposal.id}`}
              isExternal
            >
              <Button variant="outline" rightIcon={<ExternalLinkIcon />}>
                View on Snapshot
              </Button>
            </Link>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
