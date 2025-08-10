"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Skeleton,
  SkeletonText,
  Center,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Avatar,
  Heading,
  Input,
} from "@chakra-ui/react";
import { useAccount } from "wagmi";
import {
  formatUnits,
  parseEther,
  parseUnits,
  formatEther,
  Address,
} from "viem";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useZoraTrade, TradeConfig } from "@/hooks/useZoraTrade";
import { getIpfsGatewayUrls } from "@/lib/utils/ipfsMetadata";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";

// Component that tries multiple IPFS gateways for reliable media loading
const MediaRenderer = React.memo(
  ({
    videoUrl,
    imageUrl,
    hasVideo,
    altText,
  }: {
    videoUrl?: string;
    imageUrl?: string;
    hasVideo?: boolean;
    altText: string;
  }) => {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [videoFailed, setVideoFailed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [loadingTimeoutId, setLoadingTimeoutId] =
      useState<NodeJS.Timeout | null>(null);

    // Handle both IPFS and regular URLs
    const videoGateways = videoUrl
      ? videoUrl.startsWith("ipfs://")
        ? getIpfsGatewayUrls(videoUrl)
        : [videoUrl]
      : [];

    const imageGateways = imageUrl
      ? imageUrl.startsWith("ipfs://")
        ? getIpfsGatewayUrls(imageUrl)
        : [imageUrl]
      : [];

    // Set initial loading state based on available content
    useEffect(() => {
      if (!hasVideo && !imageUrl) {
        setIsLoading(false);
      } else {
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          setIsLoading(false);
          if (hasVideo && videoUrl) {
            setVideoFailed(true);
          }
          if (!hasVideo && imageUrl) {
            setHasError(true);
          }
          setLoadingTimeoutId(null);
        }, 10000); // 10 second timeout

        setLoadingTimeoutId(timeout);

        return () => {
          clearTimeout(timeout);
          setLoadingTimeoutId(null);
        };
      }
    }, [hasVideo, imageUrl, videoUrl]);

    // Clear timeout when media loads successfully
    const clearLoadingTimeout = () => {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
        setLoadingTimeoutId(null);
      }
    };

    const handleVideoError = () => {
      if (currentVideoIndex < videoGateways.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      } else {
        setVideoFailed(true);
        if (!imageUrl) {
          setIsLoading(false);
        }
      }
    };

    const handleImageError = () => {
      if (currentImageIndex < imageGateways.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleVideoLoad = () => {
      setIsLoading(false);
      clearLoadingTimeout();
    };

    const handleImageLoad = () => {
      setIsLoading(false);
      clearLoadingTimeout();
    };

    // Try to render video first if available and not failed
    if (hasVideo && videoUrl && !videoFailed && videoGateways.length > 0) {
      return (
        <Box position="relative" w="100%" h="100%">
          {/* Preview image as loading background */}
          {isLoading && imageUrl && (
            <Box position="absolute" w="100%" h="100%" zIndex={1}>
              <Image
                src={imageUrl}
                alt={altText}
                w="100%"
                h="100%"
                objectFit="cover"
                borderRadius="lg"
                filter="blur(2px)"
                opacity={0.8}
              />
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="blackAlpha.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="lg"
              >
                <Spinner size="xl" color="white" />
              </Box>
            </Box>
          )}
          <Box
            as="video"
            src={videoGateways[currentVideoIndex]}
            autoPlay
            loop
            muted
            playsInline
            w="100%"
            h="100%"
            objectFit={{ base: "contain", lg: "cover" }}
            borderRadius="lg"
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onLoadStart={() => {
              setIsLoading(true);
            }}
            onLoadedMetadata={() => {
              setIsLoading(false);
            }}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          />
        </Box>
      );
    }

    // Fallback to image if video failed or not available
    if (imageUrl && imageGateways.length > 0 && !hasError) {
      return (
        <Box position="relative" w="100%" h="100%">
          {/* For images, show a subtle loading state */}
          {isLoading && (
            <Box position="absolute" w="100%" h="100%" zIndex={1}>
              <Skeleton w="100%" h="100%" borderRadius="lg" />
              <Center
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
              >
                <Spinner size="lg" color="blue.500" />
              </Center>
            </Box>
          )}
          <Image
            src={imageGateways[currentImageIndex]}
            alt={altText}
            w="100%"
            h="100%"
            objectFit={{ base: "contain", lg: "cover" }}
            borderRadius="lg"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onLoadStart={() => {
              setIsLoading(true);
            }}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          />
        </Box>
      );
    }

    // Final fallback to avatar
    return (
      <Center h="100%">
        <VStack spacing={4}>
          <Avatar size="2xl" name={altText} bg="gray.600" />
          {hasError && (
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Media content unavailable
            </Text>
          )}
        </VStack>
      </Center>
    );
  }
);

MediaRenderer.displayName = "MediaRenderer";

interface CoinData {
  address: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  videoUrl?: string;
  hasVideo?: boolean;
  marketCap?: string;
  totalSupply?: string;
  uniqueHolders?: number;
  createdAt?: string;
  creatorAddress?: string;
}

interface ZoraCoinPageClientProps {
  address: string;
  initialCoinData: CoinData | null;
  error: string | null;
}

const ZoraCoinPageClient = React.memo(
  ({
    address,
    initialCoinData,
    error: initialError,
  }: ZoraCoinPageClientProps) => {
    const [coinData, setCoinData] = useState<CoinData | null>(initialCoinData);
    const [loading, setLoading] = useState(!initialCoinData && !initialError);
    const [error, setError] = useState<string | null>(initialError);
    const [userBalance, setUserBalance] = useState<{
      raw: bigint;
      formatted: string;
      symbol: string;
      decimals: number;
    } | null>(null);

    // Trading state
    const [isBuying, setIsBuying] = useState(true);
    const [tradeAmount, setTradeAmount] = useState("");
    const [tradeComment, setTradeComment] = useState("");
    const [quoteResult, setQuoteResult] = useState<any>(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [formattedQuoteOutput, setFormattedQuoteOutput] =
      useState<string>("0");

    const { isConnected } = useAccount();
    const {
      executeTrade,
      getTradeQuote,
      getFormattedBalance,
      getTokenDecimals,
      isTrading,
      ethBalance,
    } = useZoraTrade();

    // Get quote when amount changes (optimized to prevent unnecessary requests)
    useEffect(() => {
      const getQuote = async () => {
        if (!tradeAmount || !coinData?.address || !isConnected) {
          setQuoteResult(null);
          setFormattedQuoteOutput("0");
          return;
        }

        // For sell mode, ensure we have token balance information
        if (
          !isBuying &&
          (!userBalance ||
            userBalance.decimals === undefined ||
            userBalance.decimals === null)
        ) {
          setQuoteResult(null);
          setFormattedQuoteOutput("0");
          return;
        }

        // Validate amount is a valid number
        const numericAmount = parseFloat(tradeAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          setQuoteResult(null);
          setFormattedQuoteOutput("0");
          return;
        }

        try {
          setLoadingQuote(true);

          let amountInWei: bigint;

          if (isBuying) {
            // When buying, input is in ETH
            amountInWei = parseEther(tradeAmount);
          } else {
            // When selling, input is in token units - use parseUnits with balance decimals
            const tokenDecimals = userBalance?.decimals || 18;
            amountInWei = parseUnits(tradeAmount, tokenDecimals);
          }

          const config: TradeConfig = {
            fromToken: isBuying
              ? { type: "eth", amount: amountInWei }
              : {
                  type: "erc20",
                  address: coinData.address as Address,
                  amount: amountInWei,
                },
            toToken: isBuying
              ? { type: "erc20", address: coinData.address as Address }
              : { type: "eth" },
            slippage: 3,
          };

          const quote = await getTradeQuote(config);

          if (quote?.quote?.amountOut) {
            // Format the output amount with correct decimals like the modal does
            const amountOut = BigInt(quote.quote.amountOut);
            let formatted: string;

            if (isBuying) {
              // Getting tokens - get token decimals
              const tokenDecimals = userBalance?.decimals || 18;
              formatted = formatUnits(amountOut, tokenDecimals);
            } else {
              // Getting ETH - use 18 decimals
              formatted = formatEther(amountOut);
            }

            setFormattedQuoteOutput(Number(formatted).toFixed(6));
          } else {
            setFormattedQuoteOutput("0");
          }

          setQuoteResult(quote);
        } catch (error) {
          setQuoteResult(null);
          setFormattedQuoteOutput("0");
        } finally {
          setLoadingQuote(false);
        }
      };

      // Only get quote if we have a valid amount
      if (tradeAmount && parseFloat(tradeAmount) > 0) {
        const timeoutId = setTimeout(getQuote, 800); // Increased debounce
        return () => clearTimeout(timeoutId);
      } else {
        // Clear quote immediately if no valid amount
        setQuoteResult(null);
        setFormattedQuoteOutput("0");
      }
    }, [
      tradeAmount,
      isBuying,
      coinData?.address,
      userBalance?.decimals, // Only depend on decimals, not the entire userBalance object
    ]);

    // Trade function that executes directly
    const handleTrade = async () => {
      if (!tradeAmount || !coinData?.address || !isConnected) return;

      // For sell mode, ensure we have token balance information
      if (!isBuying && (!userBalance || !userBalance.decimals)) {
        return;
      }

      // Validate amount is a valid number
      const numericAmount = parseFloat(tradeAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return;
      }

      try {
        let amountInWei: bigint;

        if (isBuying) {
          // When buying, input is in ETH
          amountInWei = parseEther(tradeAmount);
        } else {
          // When selling, input is in token units - use parseUnits with balance decimals
          const tokenDecimals = userBalance?.decimals || 18;
          amountInWei = parseUnits(tradeAmount, tokenDecimals);
        }

        const config: TradeConfig = {
          fromToken: isBuying
            ? { type: "eth", amount: amountInWei }
            : {
                type: "erc20",
                address: coinData.address as Address,
                amount: amountInWei,
              },
          toToken: isBuying
            ? { type: "erc20", address: coinData.address as Address }
            : { type: "eth" },
          slippage: 3, // 3% slippage tolerance
        };

        await executeTrade(config);

        // Clear form after successful trade
        setTradeAmount("");
        setTradeComment("");

        // Refresh user balance after trade
        setTimeout(async () => {
          if (isConnected && coinData?.address) {
            const balance = await getFormattedBalance(
              "erc20",
              coinData.address as `0x${string}`
            );
            setUserBalance(balance);
          }
        }, 2000);
      } catch (error) {
        // Error toast is already handled in useZoraTrade
      }
    };

    // Fetch user's coin balance when connected (optimized)
    useEffect(() => {
      const fetchUserBalance = async () => {
        if (!isConnected || !coinData?.address) {
          setUserBalance(null);
          return;
        }

        try {
          const balance = await getFormattedBalance(
            "erc20",
            coinData.address as `0x${string}`
          );
          setUserBalance(balance);
        } catch (err) {
          // Balance fetching failed silently
          setUserBalance(null);
        }
      };

      fetchUserBalance();
    }, [isConnected, coinData?.address]); // Removed getFormattedBalance from dependencies

    // Format large numbers
    const formatNumber = (value: string | number | undefined): string => {
      if (!value) return "Unknown";
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
      return num.toLocaleString();
    };

    // Format currency
    const formatCurrency = (value: string | undefined): string => {
      if (!value) return "Unknown";
      const num = parseFloat(value);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    };

    // Format date
    const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return "Unknown";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    if (error) {
      return (
        <Container maxW="container.lg" py={8}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      );
    }

    if (loading || !coinData) {
      return (
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6}>
            <Skeleton height="300px" width="100%" />
            <SkeletonText noOfLines={4} spacing="4" />
          </VStack>
        </Container>
      );
    }

    return (
      <Box minH="100vh" bg="background" color="white">
        <Grid
          templateColumns={{
            base: "1fr",
            lg: "1fr 400px",
          }}
          templateRows={{
            base: "auto 1fr",
            lg: "100vh",
          }}
          h={{ base: "auto", lg: "100vh" }}
        >
          {/* Left Side - Media Content */}
          <GridItem
            bg="background"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={{ base: 1, md: 4 }}
            order={{ base: 1, lg: 0 }}
            minH={{ base: "60vh", lg: "100vh" }}
          >
            <Box
              maxW={{ base: "100%", lg: "800px" }}
              maxH={{ base: "60vh", lg: "600px" }}
              w="100%"
              h={{ base: "auto", lg: "100%" }}
              aspectRatio={{ base: "auto", lg: "unset" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MediaRenderer
                videoUrl={coinData.videoUrl}
                imageUrl={coinData.image}
                hasVideo={coinData.hasVideo}
                altText={coinData.name || "Coin"}
              />
            </Box>
          </GridItem>

          {/* Right Side - Trading Interface */}
          <GridItem
            bg="background"
            borderLeft={{ base: "none", lg: "1px solid" }}
            borderTop={{ base: "1px solid", lg: "none" }}
            borderColor="gray.700"
            order={{ base: 2, lg: 1 }}
            maxH={{ base: "none", lg: "100vh" }}
            overflowY={{ base: "visible", lg: "auto" }}
          >
            <VStack h={{ base: "auto", lg: "100%" }} spacing={0}>
              {/* Header */}
              <Box
                w="100%"
                p={{ base: 4, md: 6 }}
                borderBottom="1px solid"
                borderColor="gray.700"
              >
                <VStack align="start" spacing={3}>
                  <HStack
                    justify="space-between"
                    w="100%"
                    flexWrap={{ base: "wrap", md: "nowrap" }}
                  >
                    <HStack
                      minW={{ base: "100%", sm: "auto" }}
                      mb={{ base: 2, sm: 0 }}
                    >
                      <Avatar
                        size={{ base: "md", md: "sm" }}
                        name={coinData.name || coinData.symbol}
                      />
                      <VStack align="start" spacing={1}>
                        <Heading
                          size={{ base: "sm", md: "md" }}
                          fontWeight="bold"
                        >
                          {coinData.name || "Unknown Coin"}
                        </Heading>
                        <Text fontSize="xs" color="gray.400">
                          {coinData.symbol || "COIN"}
                        </Text>
                      </VStack>
                    </HStack>
                    <Button
                      size={{ base: "xs", md: "sm" }}
                      variant="outline"
                      colorScheme="blue"
                      fontSize="xs"
                      w={{ base: "100%", sm: "auto" }}
                      mt={{ base: 2, sm: 0 }}
                      as="a"
                      href={`https://zora.co/coin/base:${coinData.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      See on Zora
                    </Button>
                  </HStack>
                  <Box 
                    maxW="100%" 
                    overflow="hidden"
                    wordBreak="break-all"
                    overflowWrap="break-word"
                    sx={{
                      "& *": {
                        wordBreak: "break-all",
                        overflowWrap: "break-word",
                        maxWidth: "100%"
                      },
                      "& a": {
                        wordBreak: "break-all",
                        overflowWrap: "break-word"
                      }
                    }}
                  >
                    <EnhancedMarkdownRenderer
                      content={coinData.description || `${coinData.name} creator coin`}
                      className="text-sm text-gray-400"
                    />
                  </Box>
                </VStack>
              </Box>

              {/* Stats */}
              <Box
                w="100%"
                p={{ base: 3, md: 4 }}
                borderBottom="1px solid"
                borderColor="gray.700"
              >
                <Grid
                  templateColumns={{
                    base: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                  }}
                  gap={{ base: 3, md: 2 }}
                  textAlign="center"
                >
                  <Box>
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      Market Cap
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="green.400">
                      {formatCurrency(coinData.marketCap)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      Total Volume
                    </Text>
                    <Text fontSize="xs" fontWeight="bold">
                      {formatCurrency(coinData.marketCap)}
                    </Text>
                  </Box>
                  <Box gridColumn={{ base: "span 2", sm: "span 1" }}>
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      Creator Earnings
                    </Text>
                    <Text fontSize="xs" fontWeight="bold">
                      $0.05
                    </Text>
                  </Box>
                </Grid>
              </Box>

              {/* Trading Section */}
              <Box w="100%" p={{ base: 3, md: 6 }} flex="1">
                <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                  {/* Buy/Sell Toggle */}
                  <HStack spacing={0}>
                    <Button
                      variant="ghost"
                      bg={isBuying ? "green.500" : "transparent"}
                      color={isBuying ? "black" : "gray.400"}
                      borderRadius="lg"
                      flex="1"
                      fontWeight="bold"
                      h={{ base: "48px", md: "40px" }}
                      fontSize={{ base: "md", md: "sm" }}
                      onClick={() => setIsBuying(true)}
                      _hover={{ bg: isBuying ? "green.400" : "gray.700" }}
                    >
                      Buy
                    </Button>
                    <Button
                      variant="ghost"
                      bg={!isBuying ? "red.500" : "transparent"}
                      color={!isBuying ? "black" : "gray.400"}
                      borderRadius="lg"
                      flex="1"
                      fontWeight="bold"
                      h={{ base: "48px", md: "40px" }}
                      fontSize={{ base: "md", md: "sm" }}
                      onClick={() => setIsBuying(false)}
                      _hover={{ bg: !isBuying ? "red.400" : "gray.700" }}
                    >
                      Sell
                    </Button>
                  </HStack>

                  {/* Balance */}
                  <HStack justify="space-between" flexWrap="wrap">
                    <Text fontSize={{ base: "sm", md: "sm" }} color="gray.400">
                      Balance
                    </Text>
                    <Text
                      fontSize={{ base: "sm", md: "sm" }}
                      color="gray.400"
                      textAlign="right"
                      wordBreak="break-all"
                    >
                      {isBuying
                        ? ethBalance?.formatted
                          ? `${parseFloat(ethBalance.formatted).toFixed(6)} ETH`
                          : "0.000000 ETH"
                        : userBalance?.formatted
                        ? `${parseFloat(userBalance.formatted).toFixed(6)} ${
                            coinData?.symbol || "TOKENS"
                          }`
                        : `0.000000 ${coinData?.symbol || "TOKENS"}`}
                    </Text>
                  </HStack>

                  {/* Amount Input */}
                  <Box>
                    <Input
                      placeholder={isBuying ? "0.000111" : "0.000111"}
                      bg="gray.800"
                      border="none"
                      color="white"
                      fontSize={{ base: "lg", md: "lg" }}
                      h={{ base: "56px", md: "50px" }}
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      _placeholder={{ color: "gray.500" }}
                    />
                    <VStack spacing={3} mt={3}>
                      <HStack 
                        spacing={{ base: 1, md: 2 }} 
                        flexWrap="wrap" 
                        justify="center"
                        w="100%"
                      >
                        {isBuying ? (
                          // Buy mode - show ETH amounts
                          <>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="gray"
                              onClick={() => setTradeAmount("0.001")}
                              minW={{ base: "70px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                            >
                              0.001 ETH
                            </Button>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="gray"
                              onClick={() => setTradeAmount("0.01")}
                              minW={{ base: "70px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                            >
                              0.01 ETH
                            </Button>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="gray"
                              onClick={() => setTradeAmount("0.1")}
                              minW={{ base: "70px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                            >
                              0.1 ETH
                            </Button>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="gray"
                              onClick={() =>
                                setTradeAmount(ethBalance?.formatted || "0")
                              }
                              minW={{ base: "50px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                            >
                              Max
                            </Button>
                          </>
                        ) : (
                          // Sell mode - show percentages of token balance
                          <>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="red"
                              minW={{ base: "50px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                              onClick={() => {
                                if (userBalance?.raw) {
                                  const amount25 =
                                    (userBalance.raw * BigInt(25)) /
                                    BigInt(100);
                                  setTradeAmount(
                                    formatUnits(amount25, userBalance.decimals)
                                  );
                                }
                              }}
                              isDisabled={
                                !userBalance?.raw ||
                                userBalance.raw === BigInt(0)
                              }
                            >
                              25%
                            </Button>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="red"
                              minW={{ base: "50px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                              onClick={() => {
                                if (userBalance?.raw) {
                                  const amount50 =
                                    (userBalance.raw * BigInt(50)) /
                                    BigInt(100);
                                  setTradeAmount(
                                    formatUnits(amount50, userBalance.decimals)
                                  );
                                }
                              }}
                              isDisabled={
                                !userBalance?.raw ||
                                userBalance.raw === BigInt(0)
                              }
                            >
                              50%
                            </Button>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="red"
                              minW={{ base: "50px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                              onClick={() => {
                                if (userBalance?.raw) {
                                  const amount75 =
                                    (userBalance.raw * BigInt(75)) /
                                    BigInt(100);
                                  setTradeAmount(
                                    formatUnits(amount75, userBalance.decimals)
                                  );
                                }
                              }}
                              isDisabled={
                                !userBalance?.raw ||
                                userBalance.raw === BigInt(0)
                              }
                            >
                              75%
                            </Button>
                            <Button
                              size={{ base: "sm", md: "xs" }}
                              variant="outline"
                              colorScheme="red"
                              minW={{ base: "50px", md: "auto" }}
                              fontSize={{ base: "xs", md: "xs" }}
                              onClick={() => {
                                if (userBalance?.raw) {
                                  setTradeAmount(
                                    formatUnits(
                                      userBalance.raw,
                                      userBalance.decimals
                                    )
                                  );
                                }
                              }}
                              isDisabled={
                                !userBalance?.raw ||
                                userBalance.raw === BigInt(0)
                              }
                            >
                              100%
                            </Button>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Currency Selector */}
                  <HStack justify="space-between" w="100%">
                    <Box
                      bg="gray.800"
                      borderRadius="lg"
                      p={{ base: 2, md: 3 }}
                      display="flex"
                      alignItems="center"
                      cursor="pointer"
                      flex="1"
                      maxW="120px"
                    >
                      <Avatar size="xs" name="ETH" mr={2} />
                      <Text fontSize={{ base: "sm", md: "sm" }} mr={2}>
                        ETH
                      </Text>
                      <ChevronDownIcon />
                    </Box>
                  </HStack>

                  {/* Comment Box */}
                  <Box>
                    <Input
                      placeholder="Add a comment..."
                      bg="gray.800"
                      border="none"
                      color="white"
                      h={{ base: "48px", md: "40px" }}
                      fontSize={{ base: "sm", md: "sm" }}
                      value={tradeComment}
                      onChange={(e) => setTradeComment(e.target.value)}
                      _placeholder={{ color: "gray.500" }}
                    />
                  </Box>

                  {/* Quote Preview */}
                  {tradeAmount && (
                    <Box bg="gray.800" p={3} borderRadius="lg">
                      {loadingQuote ? (
                        <HStack>
                          <Spinner size="sm" />
                          <Text fontSize="sm" color="gray.400">
                            Getting quote...
                          </Text>
                        </HStack>
                      ) : quoteResult ? (
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.400">
                              {isBuying ? "You will receive" : "You will get"}
                            </Text>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color={isBuying ? "green.400" : "blue.400"}
                            >
                              {formattedQuoteOutput}{" "}
                              {isBuying ? coinData?.symbol || "COIN" : "ETH"}
                            </Text>
                          </HStack>
                          {quoteResult?.quote?.minimumAmountOut && (
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="gray.500">
                                Minimum received
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatUnits(
                                  BigInt(quoteResult.quote.minimumAmountOut),
                                  18
                                )}{" "}
                                {isBuying ? coinData?.symbol || "COIN" : "ETH"}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="red.400">
                          Unable to get quote
                        </Text>
                      )}
                    </Box>
                  )}

                  {/* Buy/Sell Button */}
                  <Button
                    bg={isBuying ? "green.500" : "red.500"}
                    color="black"
                    size={{ base: "lg", md: "lg" }}
                    fontWeight="bold"
                    borderRadius="lg"
                    h={{ base: "56px", md: "50px" }}
                    fontSize={{ base: "lg", md: "md" }}
                    onClick={handleTrade}
                    isLoading={isTrading}
                    loadingText={isBuying ? "Buying..." : "Selling..."}
                    isDisabled={!tradeAmount || !isConnected}
                    _hover={{ bg: isBuying ? "green.400" : "red.400" }}
                  >
                    {isBuying ? "Buy" : "Sell"}
                  </Button>
                </VStack>
              </Box>

              {/* Tabs Section */}
              <Box
                w="100%"
                borderTop="1px solid"
                borderColor="gray.700"
                flex={{ base: "none", lg: "1" }}
                maxH={{ base: "400px", lg: "none" }}
                overflowY={{ base: "auto", lg: "visible" }}
              >
                <Tabs
                  variant="enclosed"
                  colorScheme="gray"
                  size={{ base: "md", lg: "sm" }}
                >
                  <TabList bg="transparent" borderBottom="none">
                    <Tab
                      color="gray.400"
                      fontSize={{ base: "sm", lg: "xs" }}
                      _selected={{ color: "white", borderColor: "gray.600" }}
                    >
                      Comments
                      <Badge
                        ml={2}
                        fontSize="xs"
                        bg="gray.700"
                        color="gray.300"
                      >
                        1
                      </Badge>
                    </Tab>
                    <Tab
                      color="gray.400"
                      fontSize={{ base: "sm", lg: "xs" }}
                      _selected={{ color: "white", borderColor: "gray.600" }}
                    >
                      Holders
                      <Badge
                        ml={2}
                        fontSize="xs"
                        bg="gray.700"
                        color="gray.300"
                      >
                        3
                      </Badge>
                    </Tab>
                    <Tab
                      color="gray.400"
                      fontSize={{ base: "sm", lg: "xs" }}
                      _selected={{ color: "white", borderColor: "gray.600" }}
                    >
                      Details
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel p={{ base: 3, md: 4 }}>
                      <VStack spacing={3} align="stretch">
                        <Box>
                          <Input
                            placeholder="Add a comment..."
                            bg="gray.800"
                            border="none"
                            color="white"
                            size={{ base: "md", lg: "sm" }}
                            h={{ base: "44px", lg: "36px" }}
                            _placeholder={{ color: "gray.500" }}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Become a holder to unlock 🔒
                          </Text>
                        </Box>

                        {/* Sample Comment */}
                        <HStack align="start" spacing={3}>
                          <Avatar size="sm" name="User" />
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Text fontSize="sm" fontWeight="bold">
                                eyeseeyou47
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                8d
                              </Text>
                            </HStack>
                            <Text fontSize="sm">This is such a great shot</Text>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              cursor="pointer"
                            >
                              Reply
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={{ base: 3, md: 4 }}>
                      <VStack spacing={3} align="stretch">
                        {/* Holders List */}
                        <HStack
                          justify="space-between"
                          flexWrap={{ base: "wrap", md: "nowrap" }}
                        >
                          <HStack minW={{ base: "60%", md: "auto" }}>
                            <Text fontSize={{ base: "md", md: "lg" }}>1</Text>
                            <Avatar
                              size={{ base: "sm", md: "sm" }}
                              name="Market"
                            />
                            <Text fontSize={{ base: "sm", md: "sm" }}>
                              Market
                            </Text>
                          </HStack>
                          <Badge
                            colorScheme="blue"
                            fontSize={{ base: "xs", md: "sm" }}
                          >
                            98.864%
                          </Badge>
                        </HStack>

                        <HStack
                          justify="space-between"
                          flexWrap={{ base: "wrap", md: "nowrap" }}
                        >
                          <HStack minW={{ base: "60%", md: "auto" }}>
                            <Text fontSize={{ base: "md", md: "lg" }}>2</Text>
                            <Avatar
                              size={{ base: "sm", md: "sm" }}
                              name="skatehacker"
                            />
                            <Text fontSize={{ base: "sm", md: "sm" }}>
                              skatehacker (creator)
                            </Text>
                          </HStack>
                          <Badge
                            colorScheme="blue"
                            fontSize={{ base: "xs", md: "sm" }}
                          >
                            1%
                          </Badge>
                        </HStack>

                        <HStack
                          justify="space-between"
                          flexWrap={{ base: "wrap", md: "nowrap" }}
                        >
                          <HStack minW={{ base: "60%", md: "auto" }}>
                            <Text fontSize={{ base: "md", md: "lg" }}>3</Text>
                            <Avatar
                              size={{ base: "sm", md: "sm" }}
                              name="r4to"
                            />
                            <Text fontSize={{ base: "sm", md: "sm" }}>
                              r4to ⚡
                            </Text>
                          </HStack>
                          <Badge
                            colorScheme="blue"
                            fontSize={{ base: "xs", md: "sm" }}
                          >
                            0.136%
                          </Badge>
                        </HStack>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={{ base: 3, md: 4 }}>
                      <VStack align="start" spacing={3}>
                        <Box>
                          <Text fontSize="sm" color="gray.400" mb={1}>
                            Contract Address
                          </Text>
                          <Text
                            fontSize="xs"
                            fontFamily="mono"
                            color="blue.400"
                          >
                            {coinData.address}
                          </Text>
                        </Box>

                        {coinData.creatorAddress && (
                          <Box>
                            <Text fontSize="sm" color="gray.400" mb={1}>
                              Creator
                            </Text>
                            <Text
                              fontSize="xs"
                              fontFamily="mono"
                              color="blue.400"
                            >
                              {coinData.creatorAddress}
                            </Text>
                          </Box>
                        )}

                        <Box>
                          <Text fontSize="sm" color="gray.400" mb={1}>
                            Chain
                          </Text>
                          <Badge colorScheme="blue" size="sm">
                            Base
                          </Badge>
                        </Box>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Box>
    );
  }
);

ZoraCoinPageClient.displayName = "ZoraCoinPageClient";

export default ZoraCoinPageClient;
