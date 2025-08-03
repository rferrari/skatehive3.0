"use client";

import {
  VStack,
  HStack,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Box,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Checkbox,
  Textarea,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { SortOption } from "@/types/airdrop";
import useIsMobile from "@/hooks/useIsMobile";
import { tokenDictionary } from "@/lib/utils/tokenDictionary";

interface ConfigurationStepProps {
  sortOption: SortOption;
  limit: number;
  selectedToken: string;
  totalAmount: string;
  customMessage: string;
  includeSkateHive: boolean;
  isWeightedAirdrop: boolean;
  isAnonymous: boolean;
  userCount: {
    total: number;
    eligible: number;
    limited: number;
  };
  airdropUsers: any[];
  onSortOptionChange: (value: SortOption) => void;
  onLimitChange: (value: number) => void;
  onCustomMessageChange: (value: string) => void;
  onIncludeSkateHiveChange: (value: boolean) => void;
  onWeightedAirdropChange: (value: boolean) => void;
  onAnonymousChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ConfigurationStep({
  sortOption,
  limit,
  selectedToken,
  totalAmount,
  customMessage,
  includeSkateHive,
  isWeightedAirdrop,
  isAnonymous,
  userCount,
  airdropUsers,
  onSortOptionChange,
  onLimitChange,
  onCustomMessageChange,
  onIncludeSkateHiveChange,
  onWeightedAirdropChange,
  onAnonymousChange,
  onBack,
  onNext,
}: ConfigurationStepProps) {
  const isMobile = useIsMobile();

  // Get token info for better logic
  const selectedTokenInfo = tokenDictionary[selectedToken];
  const isHiveToken = selectedTokenInfo?.network === "hive";

  // Generate helper text based on token network
  const getSkateHiveHelperText = () => {
    if (isHiveToken) {
      return "Will include @skatehive account";
    } else if (
      selectedTokenInfo?.network === "base" ||
      selectedTokenInfo?.network === "ethereum"
    ) {
      return "Will include the dao address";
    } else {
      return "Will include SkateHive account";
    }
  };

  return (
    <>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
            Filter Options
          </Text>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="text" fontSize={isMobile ? "sm" : "md"}>
                Sort Recipients By
              </FormLabel>
              <Select
                value={sortOption}
                onChange={(e) =>
                  onSortOptionChange(e.target.value as SortOption)
                }
                bg="cardBg"
                borderColor="border"
                size={isMobile ? "sm" : "md"}
                fontSize={isMobile ? "16px" : "md"}
              >
                <option value="points">Points (Recommended)</option>
                <option value="hp_balance">Hive Power</option>
                <option value="hive_balance">Hive Balance</option>
                <option value="hbd_savings_balance">HBD Savings</option>
                <option value="post_count">Post Count</option>
                <option value="has_voted_in_witness">Witness Voters</option>
                <option value="gnars_balance">Gnars Balance</option>
                <option value="skatehive_nft_balance">SkateHive NFTs</option>
                <option value="gnars_votes">Gnars Votes</option>
                <option value="giveth_donations_usd">Giveth Donations</option>
                <option value="airdrop_the_poor">Airdrop the Poor</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="text" fontSize={isMobile ? "sm" : "md"}>
                Number of Recipients
              </FormLabel>
              <NumberInput
                value={limit}
                onChange={(_, num) => onLimitChange(num)}
                min={1}
                max={1000}
                size={isMobile ? "sm" : "md"}
              >
                <NumberInputField
                  bg="cardBg"
                  borderColor="border"
                  fontSize={isMobile ? "16px" : "md"}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={includeSkateHive}
                onChange={(e) => onIncludeSkateHiveChange(e.target.checked)}
                colorScheme="blue"
                size={isMobile ? "sm" : "md"}
              >
                <Text color="text" fontSize={isMobile ? "sm" : "md"}>
                  Include SkateHive in airdrop
                </Text>
              </Checkbox>
              <Text fontSize="xs" color="textSecondary" mt={1} ml={6}>
                {getSkateHiveHelperText()}
              </Text>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={isWeightedAirdrop}
                onChange={(e) => onWeightedAirdropChange(e.target.checked)}
                colorScheme="purple"
                size={isMobile ? "sm" : "md"}
              >
                <Text color="text" fontSize={isMobile ? "sm" : "md"}>
                  Weighted Airdrop
                </Text>
              </Checkbox>
              <Text fontSize="xs" color="textSecondary" mt={1} ml={6}>
                Distribute tokens proportionally based on{" "}
                {sortOption === "points"
                  ? "points"
                  : sortOption === "hp_balance"
                  ? "Hive Power"
                  : sortOption === "hive_balance"
                  ? "Hive Balance"
                  : sortOption === "hbd_savings_balance"
                  ? "HBD Savings"
                  : sortOption === "post_count"
                  ? "post count"
                  : sortOption === "gnars_balance"
                  ? "Gnars balance"
                  : sortOption === "skatehive_nft_balance"
                  ? "NFT holdings"
                  : sortOption === "gnars_votes"
                  ? "Gnars votes"
                  : sortOption === "giveth_donations_usd"
                  ? "donations"
                  : "selected criteria"}
                {!isWeightedAirdrop && " (equal distribution)"}
              </Text>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={isAnonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                colorScheme="gray"
                size={isMobile ? "sm" : "md"}
              >
                <Text color="text" fontSize={isMobile ? "sm" : "md"}>
                  Anonymous Airdrop
                </Text>
              </Checkbox>
              <Text fontSize="xs" color="textSecondary" mt={1} ml={6}>
                Don't mention your username in the announcement post
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel color="text" fontSize={isMobile ? "sm" : "md"}>
                Custom Message for Announcement (Optional)
              </FormLabel>
              <Textarea
                value={customMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onCustomMessageChange(e.target.value)}
                placeholder="Add a personal message for the airdrop announcement post..."
                bg="cardBg"
                borderColor="border"
                size={isMobile ? "sm" : "md"}
                fontSize={isMobile ? "16px" : "md"}
                resize="vertical"
                rows={3}
              />
              <Text fontSize="xs" color="textSecondary" mt={1}>
                This message will be included in the automated announcement post
              </Text>
            </FormControl>
          </VStack>
        </Box>

        {/* Live Preview Stats */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
            Preview Statistics
          </Text>
          {isMobile ? (
            <VStack spacing={3} align="stretch">
              <Stat textAlign="center" bg="cardBg" p={3} borderRadius="md">
                <StatLabel color="textSecondary" fontSize="sm">
                  Total Users
                </StatLabel>
                <StatNumber color="text" fontSize="xl">
                  {userCount.total}
                </StatNumber>
              </Stat>
              <Stat textAlign="center" bg="cardBg" p={3} borderRadius="md">
                <StatLabel color="textSecondary" fontSize="sm">
                  Eligible
                </StatLabel>
                <StatNumber color="text" fontSize="xl">
                  {userCount.eligible}
                </StatNumber>
              </Stat>
              <Stat textAlign="center" bg="cardBg" p={3} borderRadius="md">
                <StatLabel color="textSecondary" fontSize="sm">
                  Selected
                </StatLabel>
                <StatNumber color="primary" fontSize="xl">
                  {userCount.limited}
                </StatNumber>
              </Stat>
              <Stat textAlign="center" bg="cardBg" p={3} borderRadius="md">
                <StatLabel color="textSecondary" fontSize="sm">
                  Per User
                </StatLabel>
                <StatNumber color="primary" fontSize="xl">
                  {airdropUsers.length > 0
                    ? (parseFloat(totalAmount) / airdropUsers.length).toFixed(2)
                    : "0.00"}
                </StatNumber>
              </Stat>
            </VStack>
          ) : (
            <StatGroup>
              <Stat>
                <StatLabel color="textSecondary">Total Users</StatLabel>
                <StatNumber color="text">{userCount.total}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="textSecondary">Eligible</StatLabel>
                <StatNumber color="text">{userCount.eligible}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="textSecondary">Selected</StatLabel>
                <StatNumber color="primary">{userCount.limited}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="textSecondary">Per User</StatLabel>
                <StatNumber color="primary">
                  {airdropUsers.length > 0
                    ? (parseFloat(totalAmount) / airdropUsers.length).toFixed(2)
                    : "0.00"}{" "}
                  {selectedToken}
                </StatNumber>
              </Stat>
            </StatGroup>
          )}
        </Box>
      </VStack>
    </>
  );
}
