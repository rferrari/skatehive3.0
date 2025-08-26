"use client";
import React, { memo } from "react";
import {
  Box,
  Card,
  CardBody,
  Image,
  Text,
  Badge,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaWallet, FaUsers, FaChartLine } from "react-icons/fa";
import { ZoraBalance } from "@/hooks/useZoraProfileTokens";
import { formatNumber } from "@/lib/zora-utils";

interface ZoraBalanceCardProps {
  balance: ZoraBalance;
}

// Helper functions
const formatBalance = (amount: number, decimals: number = 18) => {
  // Handle very small amounts with proper decimal precision
  if (amount === 0) return "0";

  // For tokens with 18 decimals, amounts are often in wei-like format
  // Check if this looks like a wei amount (very large number that should be divided by 10^18)
  const adjustedAmount =
    amount < 1e15 ? amount : amount / Math.pow(10, decimals);

  if (adjustedAmount >= 1e9) return `${(adjustedAmount / 1e9).toFixed(1)}B`;
  if (adjustedAmount >= 1e6) return `${(adjustedAmount / 1e6).toFixed(1)}M`;
  if (adjustedAmount >= 1e3) return `${(adjustedAmount / 1e3).toFixed(1)}K`;
  if (adjustedAmount >= 100)
    return adjustedAmount.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (adjustedAmount >= 1)
    return adjustedAmount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (adjustedAmount >= 0.001) return adjustedAmount.toFixed(3);
  if (adjustedAmount >= 0.000001) return adjustedAmount.toFixed(6);
  return adjustedAmount.toExponential(2);
};

const formatTokenName = (name: string) => {
  // If the name is all numbers and very long, truncate it
  if (/^\d+$/.test(name) && name.length > 12) {
    return `${name.slice(0, 6)}...${name.slice(-4)}`;
  }
  return name;
};

const ZoraBalanceCard = memo(function ZoraBalanceCard({
  balance,
}: ZoraBalanceCardProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textPrimary = useColorModeValue("gray.900", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  // Get image source with fallback
  const imageSource =
    balance.token.mediaContent?.previewImage?.medium ||
    balance.token.mediaContent?.previewImage?.small ||
    balance.token.mediaContent?.originalUri ||
    "/logos/zora.svg";

  // Get the proper decimal precision (most tokens use 18 decimals)
  const tokenDecimals = 18; // You could get this from token metadata if available

  return (
    <Card
      bg={"background"}
      border="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      _hover={{
        transform: "translateY(-4px)",
        shadow: "xl",
        borderColor: "secondary.400",
      }}
      transition="all 0.3s ease"
      cursor="pointer"
      h="100%"
      minH="320px"
    >
      {/* Full-width image */}
      <Box position="relative" w="100%" h="160px">
        <Image
          src={imageSource}
          alt={balance.token.name}
          w="100%"
          h="100%"
          objectFit="cover"
          fallbackSrc="/logos/zora.svg"
        />
      </Box>

      <CardBody p={4}>
        <VStack align="stretch" spacing={3}>
          {/* Token Info and Balance */}
          <VStack align="center" spacing={2}>
            <Text
              fontWeight="bold"
              fontSize="lg"
              textAlign="center"
              color={textPrimary}
              noOfLines={2}
            >
              {formatTokenName(balance.token.name)}
            </Text>
            <VStack spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="secondary.500">
                {formatBalance(balance.amount.amountDecimal, tokenDecimals)}
              </Text>
              <Badge colorScheme="secondary" size="md" variant="subtle">
                {balance.token.symbol}
              </Badge>
            </VStack>
          </VStack>

          {/* Token Stats */}
          <HStack justify="space-between" fontSize="sm" color={textSecondary}>
            <HStack spacing={1}>
              <FaUsers />
              <Text>
                {formatNumber(balance.token.uniqueHolders.toString())} holders
              </Text>
            </HStack>
            <HStack spacing={1}>
              <FaChartLine />
              <Text>${formatNumber(balance.token.marketCap)}</Text>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
});

export default ZoraBalanceCard;
