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
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { SortOption } from "@/types/airdrop";
import useIsMobile from "@/hooks/useIsMobile";

interface ConfigurationStepProps {
  sortOption: SortOption;
  limit: number;
  selectedToken: string;
  totalAmount: string;
  userCount: {
    total: number;
    eligible: number;
    limited: number;
  };
  airdropUsers: any[];
  onSortOptionChange: (value: SortOption) => void;
  onLimitChange: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ConfigurationStep({
  sortOption,
  limit,
  selectedToken,
  totalAmount,
  userCount,
  airdropUsers,
  onSortOptionChange,
  onLimitChange,
  onBack,
  onNext,
}: ConfigurationStepProps) {
  const isMobile = useIsMobile();

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
