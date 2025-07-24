import { Box, Text, HStack, VStack, Badge, IconButton } from "@chakra-ui/react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import {
  ConsolidatedToken,
  formatBalance,
  formatValue,
  formatPriceChange,
  getEnhancedTokenData,
} from "../../../lib/utils/portfolioUtils";
import { blockchainDictionary } from "../../../types/portfolio";
import TokenLogo from "./TokenLogo";
import TokenChainBreakdown from "./TokenChainBreakdown";

interface MobileTokenRowProps {
  consolidatedToken: ConsolidatedToken;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onClick: () => void;
}

export default function MobileTokenRow({
  consolidatedToken,
  isExpanded,
  onToggleExpansion,
  onClick,
}: MobileTokenRowProps) {
  const primaryToken = consolidatedToken.primaryChain;
  const networkInfo = blockchainDictionary[primaryToken.network];
  const { priceChange } = getEnhancedTokenData(primaryToken);

  return (
    <>
      <Box
        onClick={onClick}
        cursor="pointer"
        py={3}
        px={4}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        _hover={{
          bg: "rgba(255, 255, 255, 0.02)",
        }}
        transition="all 0.2s ease"
      >
        <HStack justify="space-between" align="center" spacing={3}>
          <HStack spacing={3} flex={1}>
            {/* Token Logo with Chain Badge */}
            <TokenLogo
              token={primaryToken}
              size="40px"
              showNetworkBadge={true}
              networkBadgeSize="14px"
            />

            {/* Token Info */}
            <VStack spacing={0} align="start" flex={1}>
              <HStack spacing={2} align="center">
                <Text
                  fontWeight="600"
                  color="white"
                  fontSize="md"
                  letterSpacing="-0.01em"
                >
                  {consolidatedToken.symbol}
                </Text>
                {consolidatedToken.chains.length > 1 && (
                  <Badge
                    bg="rgba(59, 130, 246, 0.1)"
                    color="rgb(96, 165, 250)"
                    fontSize="xs"
                    fontWeight="500"
                    px={1.5}
                    py={0.5}
                    borderRadius="md"
                  >
                    {consolidatedToken.chains.length}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                {formatBalance(
                  consolidatedToken.chains.reduce(
                    (sum, chain) => sum + chain.token.balance,
                    0
                  )
                )}{" "}
                {consolidatedToken.symbol}
              </Text>
            </VStack>
          </HStack>

          <VStack spacing={0} align="end">
            <Text
              fontSize="md"
              color="white"
              fontWeight="600"
              letterSpacing="-0.01em"
            >
              {formatValue(consolidatedToken.totalBalanceUSD)}
            </Text>
            {priceChange !== null && priceChange !== undefined && (
              <Text
                fontSize="sm"
                color={priceChange >= 0 ? "#10B981" : "#EF4444"}
                fontWeight="500"
              >
                {priceChange >= 0 ? "+" : ""}
                {formatPriceChange(priceChange)}%
              </Text>
            )}
          </VStack>

          {/* Expand button for multi-chain tokens */}
          {consolidatedToken.chains.length > 1 && (
            <IconButton
              aria-label="Expand token details"
              icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              size="xs"
              variant="ghost"
              color="rgba(255, 255, 255, 0.4)"
              _hover={{
                bg: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.8)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpansion();
              }}
            />
          )}
        </HStack>
      </Box>

      {/* Expandable chain breakdown */}
      {isExpanded && (
        <Box
          bg="rgba(255, 255, 255, 0.02)"
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          px={4}
          py={3}
        >
          <TokenChainBreakdown consolidatedToken={consolidatedToken} />
        </Box>
      )}
    </>
  );
}
