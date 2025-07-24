import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { FaPaperPlane, FaChevronDown, FaChevronUp } from "react-icons/fa";
import {
  ConsolidatedToken,
  formatBalance,
  formatValue,
  formatPrice,
  formatPriceChange,
  getEnhancedTokenData,
} from "../../../lib/utils/portfolioUtils";
import { blockchainDictionary, TokenDetail } from "../../../types/portfolio";
import TokenLogo from "./TokenLogo";
import TokenChainBreakdown from "./TokenChainBreakdown";

interface MobileTokenCardProps {
  consolidatedToken: ConsolidatedToken;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onSendToken: (token: TokenDetail, logoUrl?: string) => void;
}

export default function MobileTokenCard({
  consolidatedToken,
  isExpanded,
  onToggleExpansion,
  onSendToken,
}: MobileTokenCardProps) {
  const primaryToken = consolidatedToken.primaryChain;
  const networkInfo = blockchainDictionary[primaryToken.network];
  const { priceChange } = getEnhancedTokenData(primaryToken);

  return (
    <Box
      bg="background"
      borderRadius="xl"
      border="1px solid"
      overflow="hidden"
      transition="all 0.2s ease"
    >
      <Box>
        <HStack justify="space-between" align="center" spacing={4}>
          <HStack spacing={3} flex={1}>
            {/* Token Logo with Chain Badge */}
            <TokenLogo
              token={primaryToken}
              size="44px"
              showNetworkBadge={true}
              networkBadgeSize="16px"
            />

            {/* Token Info */}
            <VStack spacing={1} align="start" flex={1}>
              <HStack spacing={2} align="center">
                <Text
                  fontWeight="600"
                  color="white"
                  fontSize="lg"
                  letterSpacing="-0.02em"
                >
                  {consolidatedToken.symbol}
                </Text>
                {consolidatedToken.chains.length > 1 && (
                  <Badge
                    bg="rgba(59, 130, 246, 0.1)"
                    color="rgb(96, 165, 250)"
                    fontSize="xs"
                    fontWeight="500"
                    px={2}
                    py={0.5}
                    borderRadius="full"
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

          <VStack spacing={1} align="end">
            <Text
              fontSize="lg"
              color="white"
              fontWeight="600"
              letterSpacing="-0.02em"
            >
              {formatValue(consolidatedToken.totalBalanceUSD)}
            </Text>
            <HStack spacing={2} align="center">
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
            </HStack>
          </VStack>
        </HStack>

        {/* Action Buttons Row */}
        <HStack justify="space-between" align="center" mt={3}>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.5)">
            {formatPrice(primaryToken.token.price)}
          </Text>

          <HStack spacing={2}>
            {/* Expand button for multi-chain tokens */}
            {consolidatedToken.chains.length > 1 && (
              <IconButton
                aria-label="Expand token details"
                icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                size="sm"
                variant="ghost"
                color="rgba(255, 255, 255, 0.6)"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
                onClick={onToggleExpansion}
              />
            )}

            {/* Send Button */}
            {consolidatedToken.chains.length > 1 ? (
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  bg="rgba(59, 130, 246, 0.1)"
                  color="rgb(96, 165, 250)"
                  border="1px solid rgba(59, 130, 246, 0.2)"
                  leftIcon={<FaPaperPlane />}
                  fontSize="sm"
                  fontWeight="500"
                  _hover={{
                    bg: "rgba(59, 130, 246, 0.15)",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                  }}
                  _active={{
                    bg: "rgba(59, 130, 246, 0.2)",
                  }}
                >
                  Send
                </MenuButton>
                <MenuList
                  bg="rgba(17, 24, 39, 0.95)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  backdropFilter="blur(20px)"
                >
                  {consolidatedToken.chains.map((chainToken, index) => {
                    const chainInfo = blockchainDictionary[chainToken.network];
                    return (
                      <MenuItem
                        key={`${chainToken.network}-${index}`}
                        onClick={() => onSendToken(chainToken)}
                        bg="transparent"
                        _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                        _focus={{ bg: "rgba(255, 255, 255, 0.05)" }}
                      >
                        <HStack spacing={3} w="100%">
                          <TokenLogo
                            token={chainToken}
                            size="20px"
                            showNetworkBadge={false}
                          />
                          <VStack spacing={0} align="start" flex={1}>
                            <Text fontSize="sm" fontWeight="500" color="white">
                              {chainInfo?.alias || chainToken.network}
                            </Text>
                            <Text
                              fontSize="xs"
                              color="rgba(255, 255, 255, 0.6)"
                            >
                              {formatBalance(chainToken.token.balance)} •{" "}
                              {formatValue(chainToken.token.balanceUSD)}
                            </Text>
                          </VStack>
                        </HStack>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
            ) : (
              <Button
                size="sm"
                bg="rgba(59, 130, 246, 0.1)"
                color="rgb(96, 165, 250)"
                border="1px solid rgba(59, 130, 246, 0.2)"
                leftIcon={<FaPaperPlane />}
                fontSize="sm"
                fontWeight="500"
                _hover={{
                  bg: "rgba(59, 130, 246, 0.15)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
                _active={{
                  bg: "rgba(59, 130, 246, 0.2)",
                }}
                onClick={() => onSendToken(primaryToken)}
              >
                Send
              </Button>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Expandable chain breakdown for mobile */}
      {isExpanded && (
        <>
          <Divider borderColor="rgba(255, 255, 255, 0.1)" />
          <Box p={0} pt={3}>
            <TokenChainBreakdown consolidatedToken={consolidatedToken} />
          </Box>
        </>
      )}
    </Box>
  );
}
