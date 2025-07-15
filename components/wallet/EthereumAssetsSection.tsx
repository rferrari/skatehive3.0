import {
  Box,
  Text,
  HStack,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Image,
  Flex,
  Switch,
  FormControl,
  FormLabel,
  Badge,
  Button,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useBreakpointValue,
  IconButton,
  Collapse,
  Divider,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useProfile } from '@farcaster/auth-kit';
import { FaEye, FaEyeSlash, FaPaperPlane, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Name,
  Avatar,
  IdentityResolver,
} from "@paperclip-labs/whisk-sdk/identity";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { TokenDetail, blockchainDictionary } from "../../types/portfolio";
import {
  formatBalance,
  formatValue,
  formatPrice,
  formatMarketCap,
  formatPriceChange,
  getTokenLogoSync,
  getEnhancedTokenData,
  preloadTokenLogos,
  subscribeToLogoUpdates,
  forceRefreshTokenData,
  consolidateTokensBySymbol,
  filterConsolidatedTokensByBalance,
  sortConsolidatedTokensByBalance,
  ConsolidatedToken,
} from "../../lib/utils/portfolioUtils";
import SendTokenModal from "./SendTokenModal";

export default function EthereumAssetsSection() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile } = useProfile();
  const { disconnect } = useDisconnect();
  const { aggregatedPortfolio, portfolio, farcasterPortfolio, farcasterVerifiedPortfolios, isLoading, error, refetch } = usePortfolioContext();
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const minBalanceThreshold = 5;
  const [logoUpdateTrigger, setLogoUpdateTrigger] = useState(0);
  const [showTokenBalances, setShowTokenBalances] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenDetail | null>(null);
  const [selectedTokenLogo, setSelectedTokenLogo] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const {
    isOpen: isSendModalOpen,
    onOpen: onSendModalOpen,
    onClose: onSendModalClose,
  } = useDisclosure();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toggle expanded token details
  const toggleTokenExpansion = useCallback((symbol: string) => {
    setExpandedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  }, []);

  // Responsive breakpoint for mobile/desktop layout
  const isMobile = useBreakpointValue({ base: true, md: false });

  const resolverOrder = [
    IdentityResolver.Farcaster,
    IdentityResolver.Nns,
    IdentityResolver.Ens,
    IdentityResolver.Base,
    IdentityResolver.Lens,
    IdentityResolver.Uni,
    IdentityResolver.World,
  ];

  // Helper function to determine wallet source for a token
  const getWalletSource = (tokenDetail: TokenDetail): { type: 'ethereum' | 'farcaster' | 'verified', label: string, walletLabel: string, networkLabel: string } => {
    const networkInfo = blockchainDictionary[tokenDetail.network];
    const networkLabel = networkInfo?.alias || tokenDetail.network;

    // Use the source tag if available (from enhanced aggregation)
    if (tokenDetail.source) {
      switch (tokenDetail.source) {
        case 'ethereum':
          return {
            type: 'ethereum',
            label: `Ethereum Wallet on ${networkLabel}`,
            walletLabel: 'Ethereum Wallet',
            networkLabel: networkLabel
          };
        case 'farcaster':
          return {
            type: 'farcaster',
            label: `Farcaster Wallet on ${networkLabel}`,
            walletLabel: 'Farcaster Wallet',
            networkLabel: networkLabel
          };
        case 'verified':
          return {
            type: 'verified',
            label: `Farcaster Wallet (${tokenDetail.sourceAddress?.slice(0, 6)}...${tokenDetail.sourceAddress?.slice(-4)}) on ${networkLabel}`,
            walletLabel: `Farcaster Wallet (${tokenDetail.sourceAddress?.slice(0, 6)}...${tokenDetail.sourceAddress?.slice(-4)})`,
            networkLabel: networkLabel
          };
        default:
          return {
            type: 'ethereum',
            label: `Unknown Source on ${networkLabel}`,
            walletLabel: 'Unknown Source',
            networkLabel: networkLabel
          };
      }
    }

    // Fallback to legacy detection logic if source tag is not available
    const ethAddress = address?.toLowerCase();
    const farcasterAddress = farcasterProfile?.custody?.toLowerCase();

    // Check if token exists in farcaster portfolio and we have a farcaster address different from ethereum
    if (farcasterPortfolio?.tokens?.some(t =>
      t.token.address === tokenDetail.token.address &&
      t.network === tokenDetail.network
    ) && farcasterAddress && farcasterAddress !== ethAddress) {
      return {
        type: 'farcaster',
        label: `Farcaster Wallet on ${networkLabel}`,
        walletLabel: 'Farcaster Wallet',
        networkLabel: networkLabel
      };
    }

    // Check if token exists in ethereum portfolio
    if (portfolio?.tokens?.some(t =>
      t.token.address === tokenDetail.token.address &&
      t.network === tokenDetail.network
    )) {
      return {
        type: 'ethereum',
        label: `Ethereum Wallet on ${networkLabel}`,
        walletLabel: 'Ethereum Wallet',
        networkLabel: networkLabel
      };
    }

    // Check if token exists in any verified address portfolio
    for (const [addr, portfolioData] of Object.entries(farcasterVerifiedPortfolios)) {
      if (portfolioData.tokens?.some(t =>
        t.token.address === tokenDetail.token.address &&
        t.network === tokenDetail.network
      )) {
        return {
          type: 'verified',
          label: `Farcaster Wallet (${addr.slice(0, 6)}...${addr.slice(-4)}) on ${networkLabel}`,
          walletLabel: `Farcaster Wallet (${addr.slice(0, 6)}...${addr.slice(-4)})`,
          networkLabel: networkLabel
        };
      }
    }

    // Fallback
    return {
      type: 'ethereum',
      label: `Unknown Source on ${networkLabel}`,
      walletLabel: 'Unknown Source',
      networkLabel: networkLabel
    };
  };

  // Memoize consolidated tokens to prevent unnecessary re-computation
  const memoizedConsolidatedTokens = useMemo(() => {
    const consolidated = consolidateTokensBySymbol(aggregatedPortfolio?.tokens);
    const filtered = filterConsolidatedTokensByBalance(
      consolidated,
      hideSmallBalances,
      minBalanceThreshold
    );
    return sortConsolidatedTokensByBalance(filtered);
  }, [aggregatedPortfolio?.tokens, hideSmallBalances, minBalanceThreshold]);

  // Effect to preload token logos and subscribe to updates - only run once per portfolio change
  useEffect(() => {
    if (aggregatedPortfolio?.tokens && aggregatedPortfolio.tokens.length > 0) {
      // Only preload if not already done for this portfolio
      const portfolioHash = aggregatedPortfolio.tokens
        .map((t) => `${t.network}-${t.token.address}`)
        .join(",");
      const lastHash = sessionStorage.getItem("lastPortfolioHash");

      if (portfolioHash !== lastHash) {
        preloadTokenLogos(aggregatedPortfolio.tokens);
        sessionStorage.setItem("lastPortfolioHash", portfolioHash);
      }

      // Subscribe to logo updates
      const unsubscribe = subscribeToLogoUpdates(() => {
        setLogoUpdateTrigger((prev) => prev + 1);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [aggregatedPortfolio?.tokens]);

  const handleForceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (aggregatedPortfolio?.tokens) {
        await forceRefreshTokenData(aggregatedPortfolio.tokens);
        // Clear the portfolio hash to allow fresh preloading
        sessionStorage.removeItem("lastPortfolioHash");
      }
      // Refetch portfolio data from API
      refetch();
    } catch (error) {
      console.error("Failed to refresh token data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [aggregatedPortfolio?.tokens, refetch]);

  const handleSendToken = (tokenDetail: TokenDetail, logoUrl?: string) => {
    setSelectedToken(tokenDetail);
    setSelectedTokenLogo(logoUrl || "");
    onSendModalOpen();
  };

  // Token Chain Breakdown Component
  const TokenChainBreakdown = ({ consolidatedToken }: { consolidatedToken: ConsolidatedToken }) => {
    return (
      <Box
        p={4}
        bg="gray.900"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.600"
        mt={2}
      >
        <Text fontSize="sm" fontWeight="medium" color="gray.300" mb={3}>
          Distribution across {consolidatedToken.chains.length} blockchain{consolidatedToken.chains.length > 1 ? 's' : ''}:
        </Text>

        <VStack spacing={3} align="stretch">
          {consolidatedToken.chains.map((chainToken, index) => {
            const networkInfo = blockchainDictionary[chainToken.network];
            const walletSource = getWalletSource(chainToken);
            const isHigherToken = chainToken.token.symbol.toLowerCase() === 'higher';
            const percentage = (chainToken.token.balanceUSD / consolidatedToken.totalBalanceUSD) * 100;

            return (
              <Box key={`${chainToken.network}-${index}`}>
                <HStack justify="space-between" align="center" mb={2}>
                  <HStack spacing={2}>
                    {networkInfo?.logo && (
                      <Image
                        src={networkInfo.logo}
                        alt={networkInfo?.alias || chainToken.network}
                        w="20px"
                        h="20px"
                        borderRadius="full"
                        objectFit="cover"
                        flexShrink={0}
                      />
                    )}
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" fontWeight="medium" color="white">
                        {walletSource.networkLabel}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {walletSource.walletLabel}
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={walletSource.type === 'ethereum' ? 'blue' : walletSource.type === 'farcaster' ? 'purple' : 'gray'}
                      fontSize="xs"
                    >
                      {percentage.toFixed(1)}%
                    </Badge>
                  </HStack>

                  <VStack spacing={0} align="end">
                    <Text fontSize="sm" color="white">
                      {formatBalance(chainToken.token.balance)} {chainToken.token.symbol}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {formatValue(chainToken.token.balanceUSD)}
                    </Text>
                  </VStack>
                </HStack>

                {/* Progress bar showing percentage */}
                <Box w="100%" bg="gray.700" h="4px" borderRadius="full">
                  <Box
                    w={`${percentage}%`}
                    bg={walletSource.type === 'ethereum' ? 'blue.400' : walletSource.type === 'farcaster' ? 'purple.400' : 'gray.400'}
                    h="100%"
                    borderRadius="full"
                  />
                </Box>

                {/* Contract address for transparency */}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {chainToken.token.address.slice(0, 6)}...{chainToken.token.address.slice(-4)}
                </Text>
              </Box>
            );
          })}
        </VStack>
      </Box>
    );
  };

  // Mobile Token Card Component
  const MobileTokenCard = ({ consolidatedToken }: { consolidatedToken: ConsolidatedToken }) => {
    const primaryToken = consolidatedToken.primaryChain;
    const networkInfo = blockchainDictionary[primaryToken.network];
    const isHigherToken = consolidatedToken.symbol.toLowerCase() === 'higher';
    const { marketCap, priceChange } = getEnhancedTokenData(primaryToken);

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
            <Box position="relative" display="inline-block">
              {isHigherToken ? (
                <Image
                  src="/logos/higher.png"
                  alt={primaryToken.token.symbol}
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  fallback={
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="gray.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="sm" fontWeight="bold" color="white">
                        {primaryToken.token.symbol.charAt(0)}
                      </Text>
                    </Box>
                  }
                />
              ) : getTokenLogoSync(
                primaryToken.token,
                networkInfo,
                primaryToken.network
              ) ? (
                <Image
                  src={
                    getTokenLogoSync(
                      primaryToken.token,
                      networkInfo,
                      primaryToken.network
                    )!
                  }
                  alt={primaryToken.token.symbol}
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  fallback={
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="gray.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="sm" fontWeight="bold" color="white">
                        {primaryToken.token.symbol.charAt(0)}
                      </Text>
                    </Box>
                  }
                />
              ) : (
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg="gray.600"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="sm" fontWeight="bold" color="white">
                    {primaryToken.token.symbol.charAt(0)}
                  </Text>
                </Box>
              )}

              {/* Chain Badge */}
              {networkInfo?.logo && (
                <Image
                  src={networkInfo.logo}
                  alt={networkInfo?.alias || primaryToken.network}
                  w="14px"
                  h="14px"
                  borderRadius="full"
                  position="absolute"
                  bottom="-2px"
                  right="-2px"
                  border="2px solid"
                  borderColor="background"
                  bg="background"
                  objectFit="cover"
                  flexShrink={0}
                />
              )}
            </Box>

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
                    icon={expandedTokens.has(consolidatedToken.symbol) ? <FaChevronUp /> : <FaChevronDown />}
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => toggleTokenExpansion(consolidatedToken.symbol)}
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
                    const chainIsHigher = chainToken.token.symbol.toLowerCase() === 'higher';
                    return (
                      <MenuItem
                        key={`${chainToken.network}-${index}`}
                        onClick={() =>
                          handleSendToken(
                            chainToken,
                            chainIsHigher ? "/logos/higher.png" : getTokenLogoSync(
                              chainToken.token,
                              chainInfo,
                              chainToken.network
                            ) || undefined
                          )
                        }
                        bg="background"
                        _hover={{ bg: "gray.700" }}
                      >
                        <HStack spacing={2} w="100%">
                          {chainInfo?.logo && (
                            <Image
                              src={chainInfo.logo}
                              alt={chainInfo?.alias || chainToken.network}
                              w="16px"
                              h="16px"
                              borderRadius="full"
                              objectFit="cover"
                              flexShrink={0}
                            />
                          )}
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
                onClick={() =>
                  handleSendToken(
                    primaryToken,
                    isHigherToken ? "/logos/higher.png" : getTokenLogoSync(
                      primaryToken.token,
                      networkInfo,
                      primaryToken.network
                    ) || undefined
                  )
                }
              >
                Send
              </Button>
            )}
          </VStack>
        </HStack>

        {/* Expandable chain breakdown for mobile */}
        {expandedTokens.has(consolidatedToken.symbol) && (
          <Box mt={3}>
            <TokenChainBreakdown consolidatedToken={consolidatedToken} />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      mt={8}
      p={2}
      borderRadius="base"
      bg="muted"
      w={"100wh"}
      textAlign="left"
    >
      <HStack
        p={4}
        bg="background"
        borderRadius="md"
        mb={4}
        border="2px solid"
        borderColor="blue.200"
        textAlign="center"
        justify="center"
        position="relative"
      >
        {/* Absolutely centered text */}
        <Box position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)" zIndex={1}>
          <Text fontSize="sm" color="blue.200" mb={1}>
            Digital Assets
          </Text>
        </Box>
        {/* IconButton on the right */}
        <Box position="absolute" right={4} top="50%" transform="translateY(-50%)" zIndex={2}>
          <IconButton
            aria-label={showTokenBalances ? "Hide Token Balances" : "Show Token Balances"}
            icon={showTokenBalances ? <FaEyeSlash /> : <FaEye />}
            onClick={() => setShowTokenBalances(!showTokenBalances)}
            variant="ghost"
            colorScheme="blue"
            size="sm"
          />
        </Box>
      </HStack>

      {isMounted && ((isConnected && address) || (isFarcasterConnected && farcasterProfile?.custody)) && (
        <Box>

          {/* Token Balances Section - only display if showTokenBalances is true */}
          {showTokenBalances && (
            <>


              <HStack spacing={2} m={2} flexWrap="wrap" justifyContent={"space-between"}>
                <Button
                  onClick={handleForceRefresh}
                  isLoading={isRefreshing}
                  loadingText="Refreshing..."
                  size="xs"
                  colorScheme="green"
                  variant="ghost"
                >
                  🔄 Refresh Data
                </Button>
                <FormControl display="flex" alignItems="center" w="auto">
                  <FormLabel htmlFor="hide-small" mb="0" fontSize="sm" whiteSpace="nowrap">
                    Hide Dust
                  </FormLabel>
                  <Switch
                    id="hide-small"
                    isChecked={hideSmallBalances}
                    onChange={(e) => setHideSmallBalances(e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>
              </HStack>

              {isLoading && (
                <Flex justify="center" align="center" py={4}>
                  <Spinner color="primary" />
                </Flex>
              )}

              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {aggregatedPortfolio && (
                <>
                  {isMobile ? (
                    // Mobile Card Layout
                    <VStack spacing={0} align="stretch">
                      {memoizedConsolidatedTokens.length > 0 ? (
                        memoizedConsolidatedTokens.map((consolidatedToken) => (
                          <MobileTokenCard
                            key={consolidatedToken.symbol}
                            consolidatedToken={consolidatedToken}
                          />
                        ))
                      ) : (
                        <Box py={8} textAlign="center">
                          <Text color="muted">No tokens found in portfolio</Text>
                        </Box>
                      )}
                    </VStack>
                  ) : (
                    // Desktop Table Layout
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase">
                              Asset
                            </Th>
                            <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase">
                              Price
                            </Th>
                            <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase" isNumeric>
                              Balance
                            </Th>
                            <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase" isNumeric>
                              Value
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {memoizedConsolidatedTokens.length > 0 ? (
                            memoizedConsolidatedTokens.map((consolidatedToken) => {
                              const primaryToken = consolidatedToken.primaryChain;
                              const networkInfo = blockchainDictionary[primaryToken.network];
                              const isHigherToken = consolidatedToken.symbol.toLowerCase() === 'higher';

                              // Get enhanced data from GeckoTerminal cache for primary chain
                              const { marketCap, priceChange } = getEnhancedTokenData(primaryToken);

                              return (
                                <>
                                  <Tr
                                    key={consolidatedToken.symbol}
                                    _hover={{ bg: "gray.800" }}
                                    borderBottom="1px solid"
                                    borderColor="gray.700"
                                  >
                                    {/* Asset Column */}
                                    <Td py={3}>
                                      <HStack spacing={3}>
                                        {/* Token Logo with Chain Badge */}
                                        <Box position="relative" display="inline-block">
                                          {isHigherToken ? (
                                            <Image
                                              src="/logos/higher.png"
                                              alt={primaryToken.token.symbol}
                                              w="32px"
                                              h="32px"
                                              borderRadius="full"
                                              fallback={
                                                <Text
                                                  fontSize="sm"
                                                  fontWeight="bold"
                                                  color="primary"
                                                >
                                                  {primaryToken.token.symbol.charAt(0)}
                                                </Text>
                                              }
                                            />
                                          ) : getTokenLogoSync(
                                            primaryToken.token,
                                            networkInfo,
                                            primaryToken.network
                                          ) ? (
                                            <Image
                                              src={
                                                getTokenLogoSync(
                                                  primaryToken.token,
                                                  networkInfo,
                                                  primaryToken.network
                                                )!
                                              }
                                              alt={primaryToken.token.symbol}
                                              w="32px"
                                              h="32px"
                                              borderRadius="full"
                                              fallback={
                                                <Text
                                                  fontSize="sm"
                                                  fontWeight="bold"
                                                  color="primary"
                                                >
                                                  {primaryToken.token.symbol.charAt(0)}
                                                </Text>
                                              }
                                            />
                                          ) : (
                                            <Box
                                              w="32px"
                                              h="32px"
                                              borderRadius="full"
                                              bg="gray.600"
                                              display="flex"
                                              alignItems="center"
                                              justifyContent="center"
                                            >
                                              <Text
                                                fontSize="sm"
                                                fontWeight="bold"
                                                color="white"
                                              >
                                                {primaryToken.token.symbol.charAt(0)}
                                              </Text>
                                            </Box>
                                          )}

                                          {/* Chain Badge */}
                                          {networkInfo?.logo && (
                                            <Image
                                              src={networkInfo.logo}
                                              alt={networkInfo?.alias || primaryToken.network}
                                              w="12px"
                                              h="12px"
                                              borderRadius="full"
                                              position="absolute"
                                              bottom="-2px"
                                              right="-2px"
                                              border="1px solid"
                                              borderColor="background"
                                              bg="background"
                                              objectFit="cover"
                                              flexShrink={0}
                                            />
                                          )}
                                        </Box>

                                        {/* Token Info */}
                                        <VStack spacing={0} align="start">
                                          <HStack spacing={2} align="center">
                                            <Text
                                              fontWeight="medium"
                                              color="white"
                                              fontSize="sm"
                                            >
                                              {consolidatedToken.symbol}
                                            </Text>
                                            {/* Multi-chain indicator */}
                                            {consolidatedToken.chains.length > 1 && (
                                              <Badge colorScheme="blue" fontSize="xs" variant="solid">
                                                {consolidatedToken.chains.length} Blockchains
                                              </Badge>
                                            )}
                                            {/* Expand button for multi-chain tokens */}
                                            {consolidatedToken.chains.length > 1 && (
                                              <IconButton
                                                aria-label="Expand token details"
                                                icon={expandedTokens.has(consolidatedToken.symbol) ? <FaChevronUp /> : <FaChevronDown />}
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="blue"
                                                onClick={() => toggleTokenExpansion(consolidatedToken.symbol)}
                                              />
                                            )}
                                          </HStack>
                                          <Text fontSize="xs" color="gray.400">
                                            {networkInfo?.alias || primaryToken.network}
                                          </Text>
                                        </VStack>
                                      </HStack>
                                    </Td>

                                    {/* Price Column */}
                                    <Td py={3}>
                                      <VStack spacing={0} align="start">
                                        <Text fontSize="sm" color="white">
                                          {formatPrice(primaryToken.token.price)}
                                        </Text>
                                        {/* Price Change Badge */}
                                        {priceChange !== null && (
                                          <Text
                                            fontSize="xs"
                                            color={priceChange >= 0 ? "green.400" : "red.400"}
                                          >
                                            {priceChange >= 0 ? "+" : ""}
                                            {formatPriceChange(priceChange)}%
                                          </Text>
                                        )}
                                      </VStack>
                                    </Td>

                                    {/* Balance Column */}
                                    <Td py={3} isNumeric>
                                      <VStack spacing={0} align="end">
                                        <Text fontSize="sm" color="white">
                                          {formatBalance(
                                            consolidatedToken.chains.reduce(
                                              (sum, chain) => sum + chain.token.balance,
                                              0
                                            )
                                          )}
                                        </Text>
                                        <Text fontSize="xs" color="gray.400">
                                          {consolidatedToken.symbol}
                                        </Text>
                                      </VStack>
                                    </Td>

                                    {/* Value Column */}
                                    <Td py={3} isNumeric>
                                      <VStack spacing={0} align="end">
                                        <Text fontSize="sm" color="white" fontWeight="medium">
                                          {formatValue(consolidatedToken.totalBalanceUSD)}
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
                                                const chainIsHigher = chainToken.token.symbol.toLowerCase() === 'higher';
                                                return (
                                                  <MenuItem
                                                    key={`${chainToken.network}-${index}`}
                                                    onClick={() =>
                                                      handleSendToken(
                                                        chainToken,
                                                        chainIsHigher ? "/logos/higher.png" : getTokenLogoSync(
                                                          chainToken.token,
                                                          chainInfo,
                                                          chainToken.network
                                                        ) || undefined
                                                      )
                                                    }
                                                    bg="background"
                                                    _hover={{ bg: "gray.700" }}
                                                  >
                                                    <HStack spacing={2} w="100%">
                                                      {chainInfo?.logo && (
                                                        <Image
                                                          src={chainInfo.logo}
                                                          alt={chainInfo?.alias || chainToken.network}
                                                          w="16px"
                                                          h="16px"
                                                          borderRadius="full"
                                                          objectFit="cover"
                                                          flexShrink={0}
                                                        />
                                                      )}
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
                                            onClick={() =>
                                              handleSendToken(
                                                primaryToken,
                                                isHigherToken ? "/logos/higher.png" : getTokenLogoSync(
                                                  primaryToken.token,
                                                  networkInfo,
                                                  primaryToken.network
                                                ) || undefined
                                              )
                                            }
                                          >
                                            Send
                                          </Button>
                                        )}
                                      </VStack>
                                    </Td>
                                  </Tr>

                                  {/* Expandable Row for Chain Details */}
                                  {expandedTokens.has(consolidatedToken.symbol) && (
                                    <Tr key={`${consolidatedToken.symbol}-expanded`}>
                                      <Td colSpan={4} py={0} borderBottom="none">
                                        <Box py={2}>
                                          <TokenChainBreakdown consolidatedToken={consolidatedToken} />
                                        </Box>
                                      </Td>
                                    </Tr>
                                  )}
                                </>
                              );
                            })
                          ) : (
                            <Tr>
                              <Td colSpan={4} textAlign="center" py={8}>
                                <Text color="muted">No tokens found in portfolio</Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* Send Token Modal */}
      {selectedToken && (
        <SendTokenModal
          isOpen={isSendModalOpen}
          onClose={onSendModalClose}
          token={selectedToken}
          tokenLogo={selectedTokenLogo}
        />
      )}
    </Box>
  );
}