import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Box,
  Text,
  Select,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { SortOption } from "@/types/airdrop";

interface AirdropFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortOption: SortOption;
  setSortOption: (value: SortOption) => void;
  limit: number;
  setLimit: (value: number) => void;
  userCount: { total: number; limited: number };
  onConfirm: () => void;
}

const AirdropFilterModal: React.FC<AirdropFilterModalProps> = ({
  isOpen,
  onClose,
  sortOption,
  setSortOption,
  limit,
  setLimit,
  userCount,
  onConfirm,
}) => {
  const sortOptions = [
    {
      value: "points",
      label: "Points",
      description: "Users with highest platform engagement",
    },
    {
      value: "hp_balance",
      label: "Hive Power",
      description: "Users with most Hive Power (HP)",
    },
    {
      value: "hive_balance",
      label: "Liquid Hive",
      description: "Users with most liquid Hive",
    },
    {
      value: "hbd_savings_balance",
      label: "HBD Savings",
      description: "Users with most HBD in savings",
    },
    {
      value: "posts_score",
      label: "Posts Score",
      description: "Most active content creators",
    },
    {
      value: "has_voted_in_witness",
      label: "Witness Voters",
      description: "Governance participants",
    },
    {
      value: "gnars_balance",
      label: "Gnars NFTs",
      description: "Gnars NFT holders",
    },
    {
      value: "skatehive_nft_balance",
      label: "SkateHive NFTs",
      description: "SkateHive NFT holders",
    },
    {
      value: "gnars_votes",
      label: "Gnars Votes",
      description: "Gnars governance participants",
    },
    {
      value: "giveth_donations_usd",
      label: "Giveth Donations",
      description: "Top Giveth contributors",
    },
    {
      value: "airdrop_the_poor",
      label: "🍃 Airdrop the Poor",
      description: "Low balance users (< 100 Hive total)",
    },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        bg="background"
        color="text"
        borderRadius="20px"
        border="1px solid"
        borderColor="border"
        shadow="2xl"
        mx={4}
      >
        <ModalHeader
          textAlign="center"
          fontSize="xl"
          fontWeight="bold"
          color="primary"
          pb={2}
        >
          🎯 Configure Airdrop Filters
        </ModalHeader>
        <ModalCloseButton
          color="text"
          _hover={{ color: "background", bg: "primary" }}
          borderRadius="full"
        />
        <ModalBody px={8} pb={8}>
          <VStack spacing={6}>
            <Box w="full">
              <Text fontWeight="semibold" mb={3} color="text">
                Sort Recipients By:
              </Text>
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                bg="muted"
                border="1px solid"
                borderColor="border"
                color="text"
                _focus={{ borderColor: "primary" }}
              >
                {sortOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    style={{
                      background: "var(--chakra-colors-muted)",
                      color: "var(--chakra-colors-text)",
                    }}
                  >
                    {option.label}
                  </option>
                ))}
              </Select>
              {sortOptions.find((opt) => opt.value === sortOption) && (
                <Text fontSize="sm" color="textSecondary" mt={2}>
                  {
                    sortOptions.find((opt) => opt.value === sortOption)
                      ?.description
                  }
                </Text>
              )}
            </Box>

            <Box w="full">
              <Text fontWeight="semibold" mb={3} color="text">
                Number of Recipients:
              </Text>
              <Select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                bg="muted"
                border="1px solid"
                borderColor="border"
                color="text"
                _focus={{ borderColor: "primary" }}
              >
                <option
                  value={10}
                  style={{
                    background: "var(--chakra-colors-muted)",
                    color: "var(--chakra-colors-text)",
                  }}
                >
                  Top 10
                </option>
                <option
                  value={25}
                  style={{
                    background: "var(--chakra-colors-muted)",
                    color: "var(--chakra-colors-text)",
                  }}
                >
                  Top 25
                </option>
                <option
                  value={50}
                  style={{
                    background: "var(--chakra-colors-muted)",
                    color: "var(--chakra-colors-text)",
                  }}
                >
                  Top 50
                </option>
                <option
                  value={100}
                  style={{
                    background: "var(--chakra-colors-muted)",
                    color: "var(--chakra-colors-text)",
                  }}
                >
                  Top 100
                </option>
              </Select>
            </Box>

            <Box w="full">
              <Text fontWeight="semibold" mb={3} color="text">
                Preview:
              </Text>
              <HStack justify="space-between">
                <Badge colorScheme="blue" variant="solid" px={3} py={1}>
                  {userCount.total} eligible
                </Badge>
                <Text color="text">→</Text>
                <Badge colorScheme="green" variant="solid" px={3} py={1}>
                  {userCount.limited} will receive
                </Badge>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            color="text"
            _hover={{ color: "background", bg: "primary" }}
          >
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={onConfirm}
            ml={3}
            bg="primary"
            color="background"
            _hover={{ bg: "accent" }}
          >
            Confirm ({userCount.limited} users)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AirdropFilterModal;
