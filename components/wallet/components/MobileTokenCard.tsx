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
} from "@chakra-ui/react";
import { useState } from "react";
import { FaPaperPlane, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { ConsolidatedToken, formatBalance, formatValue, formatPrice, formatPriceChange, getEnhancedTokenData } from "../../../lib/utils/portfolioUtils";
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
    onSendToken
}: MobileTokenCardProps) {
    const primaryToken = consolidatedToken.primaryChain;
    const networkInfo = blockchainDictionary[primaryToken.network];
    const { priceChange } = getEnhancedTokenData(primaryToken);

    return (
        <Box
            p={4}
            bg="background"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.700"
            mb={3}
            _hover={{ bg: "gray.800" }}
        >
            <HStack justify="space-between" align="center">
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
                            <Text fontWeight="medium" color="white" fontSize="md">
                                {consolidatedToken.symbol}
                            </Text>
                            {consolidatedToken.chains.length > 1 && (
                                <Badge colorScheme="blue" fontSize="xs" variant="solid">
                                    {consolidatedToken.chains.length} chains
                                </Badge>
                            )}
                            {/* Expand button for multi-chain tokens */}
                            {consolidatedToken.chains.length > 1 && (
                                <IconButton
                                    aria-label="Expand token details"
                                    icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={onToggleExpansion}
                                />
                            )}
                        </HStack>
                        <HStack spacing={2} align="center">
                            <Text fontSize="sm" color="gray.300">
                                {formatBalance(
                                    consolidatedToken.chains.reduce(
                                        (sum, chain) => sum + chain.token.balance,
                                        0
                                    )
                                )} {consolidatedToken.symbol}
                            </Text>
                            {priceChange !== null && priceChange !== undefined && (
                                <Text
                                    fontSize="xs"
                                    color={priceChange >= 0 ? "green.400" : "red.400"}
                                >
                                    {priceChange >= 0 ? "+" : ""}
                                    {formatPriceChange(priceChange)}%
                                </Text>
                            )}
                        </HStack>
                    </VStack>
                </HStack>

                <VStack spacing={1} align="end">
                    <Text fontSize="md" color="white" fontWeight="medium">
                        {formatValue(consolidatedToken.totalBalanceUSD)}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                        {formatPrice(primaryToken.token.price)}
                    </Text>
                    {/* Send Button */}
                    {consolidatedToken.chains.length > 1 ? (
                        <Menu>
                            <MenuButton
                                as={Button}
                                size="xs"
                                colorScheme="blue"
                                variant="ghost"
                                leftIcon={<FaPaperPlane />}
                                fontSize="xs"
                            >
                                Send
                            </MenuButton>
                            <MenuList bg="background" border="1px solid" borderColor="gray.200">
                                {consolidatedToken.chains.map((chainToken, index) => {
                                    const chainInfo = blockchainDictionary[chainToken.network];
                                    return (
                                        <MenuItem
                                            key={`${chainToken.network}-${index}`}
                                            onClick={() => onSendToken(chainToken)}
                                            bg="background"
                                            _hover={{ bg: "gray.700" }}
                                        >
                                            <HStack spacing={2} w="100%">
                                                <TokenLogo
                                                    token={chainToken}
                                                    size="16px"
                                                    showNetworkBadge={false}
                                                />
                                                <VStack spacing={0} align="start" flex={1}>
                                                    <Text fontSize="sm" fontWeight="medium">
                                                        {chainInfo?.alias || chainToken.network}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.400">
                                                        {formatBalance(chainToken.token.balance)} • {formatValue(chainToken.token.balanceUSD)}
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
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            leftIcon={<FaPaperPlane />}
                            fontSize="xs"
                            onClick={() => onSendToken(primaryToken)}
                        >
                            Send
                        </Button>
                    )}
                </VStack>
            </HStack>

            {/* Expandable chain breakdown for mobile */}
            {isExpanded && (
                <Box mt={3}>
                    <TokenChainBreakdown consolidatedToken={consolidatedToken} />
                </Box>
            )}
        </Box>
    );
}
