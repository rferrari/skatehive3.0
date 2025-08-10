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
            objectFit="cover"
            borderRadius="lg"
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onLoadStart={() => {
              console.log("🎬 Video loading started...");
              setIsLoading(true);
            }}
            onLoadedMetadata={() => {
              console.log("🎬 Video metadata loaded");
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
            objectFit="cover"
            borderRadius="lg"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onLoadStart={() => {
              console.log("🖼️ Image loading started...");
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

    // Get quote when amount changes
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
          console.error("Quote failed:", error);
          setQuoteResult(null);
          setFormattedQuoteOutput("0");
        } finally {
          setLoadingQuote(false);
        }
      };

      const timeoutId = setTimeout(getQuote, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }, [
      tradeAmount,
      isBuying,
      coinData?.address,
      isConnected,
      getTradeQuote,
      userBalance,
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

    // Fetch user's coin balance when connected
    useEffect(() => {
      const fetchUserBalance = async () => {
        if (!isConnected || !coinData?.address) return;

        try {
          const balance = await getFormattedBalance(
            "erc20",
            coinData.address as `0x${string}`
          );
          setUserBalance(balance);
        } catch (err) {
          // Balance fetching failed silently
        }
      };

      fetchUserBalance();
    }, [isConnected, coinData?.address, getFormattedBalance]);

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
        <Grid templateColumns={{ base: "1fr", lg: "1fr 400px" }} h="100vh">
          {/* Left Side - Media Content */}
          <GridItem
            bg="background"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
          >
            <Box maxW="800px" maxH="600px" w="100%" h="100%">
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
            borderLeft="1px solid"
            borderColor="gray.700"
          >
            <VStack h="100%" spacing={0}>
              {/* Header */}
              <Box
                w="100%"
                p={6}
                borderBottom="1px solid"
                borderColor="gray.700"
              >
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="100%">
                    <HStack>
                      <Avatar
                        size="sm"
                        name={coinData.name || coinData.symbol}
                      />
                      <VStack align="start" spacing={1}>
                        <Heading size="md" fontWeight="bold">
                          {coinData.name || "Unknown Coin"}
                        </Heading>
                        <Text fontSize="xs" color="gray.400">
                          {coinData.symbol || "COIN"}
                        </Text>
                      </VStack>
                    </HStack>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      fontSize="xs"
                      as="a"
                      href={`https://zora.co/coin/base:${coinData.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      See on Zora
                    </Button>
                  </HStack>
                  <Text fontSize="sm" color="gray.400" noOfLines={2}>
                    {coinData.description || `${coinData.name} creator coin`}
                  </Text>
                </VStack>
              </Box>

              {/* Stats */}
              <Box
                w="100%"
                p={4}
                borderBottom="1px solid"
                borderColor="gray.700"
              >
                <Grid
                  templateColumns="repeat(3, 1fr)"
                  gap={2}
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
                  <Box>
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
              <Box w="100%" p={6} flex="1">
                <VStack spacing={4} align="stretch">
                  {/* Buy/Sell Toggle */}
                  <HStack spacing={0}>
                    <Button
                      variant="ghost"
                      bg={isBuying ? "green.500" : "transparent"}
                      color={isBuying ? "black" : "gray.400"}
                      borderRadius="lg"
                      flex="1"
                      fontWeight="bold"
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
                      onClick={() => setIsBuying(false)}
                      _hover={{ bg: !isBuying ? "red.400" : "gray.700" }}
                    >
                      Sell
                    </Button>
                  </HStack>

                  {/* Balance */}
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      Balance
                    </Text>
                    <Text fontSize="sm" color="gray.400">
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
                      fontSize="lg"
                      h="50px"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      _placeholder={{ color: "gray.500" }}
                    />
                    <HStack mt={2} spacing={2}>
                      {isBuying ? (
                        // Buy mode - show ETH amounts
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="gray"
                            onClick={() => setTradeAmount("0.001")}
                          >
                            0.001 ETH
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="gray"
                            onClick={() => setTradeAmount("0.01")}
                          >
                            0.01 ETH
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="gray"
                            onClick={() => setTradeAmount("0.1")}
                          >
                            0.1 ETH
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="gray"
                            onClick={() =>
                              setTradeAmount(ethBalance?.formatted || "0")
                            }
                          >
                            Max
                          </Button>
                        </>
                      ) : (
                        // Sell mode - show percentages of token balance
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => {
                              if (userBalance?.raw) {
                                const amount25 =
                                  (userBalance.raw * BigInt(25)) / BigInt(100);
                                setTradeAmount(
                                  formatUnits(amount25, userBalance.decimals)
                                );
                              }
                            }}
                            isDisabled={
                              !userBalance?.raw || userBalance.raw === BigInt(0)
                            }
                          >
                            25%
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => {
                              if (userBalance?.raw) {
                                const amount50 =
                                  (userBalance.raw * BigInt(50)) / BigInt(100);
                                setTradeAmount(
                                  formatUnits(amount50, userBalance.decimals)
                                );
                              }
                            }}
                            isDisabled={
                              !userBalance?.raw || userBalance.raw === BigInt(0)
                            }
                          >
                            50%
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => {
                              if (userBalance?.raw) {
                                const amount75 =
                                  (userBalance.raw * BigInt(75)) / BigInt(100);
                                setTradeAmount(
                                  formatUnits(amount75, userBalance.decimals)
                                );
                              }
                            }}
                            isDisabled={
                              !userBalance?.raw || userBalance.raw === BigInt(0)
                            }
                          >
                            75%
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
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
                              !userBalance?.raw || userBalance.raw === BigInt(0)
                            }
                          >
                            100%
                          </Button>
                        </>
                      )}
                    </HStack>
                  </Box>

                  {/* Currency Selector */}
                  <HStack>
                    <Box
                      bg="gray.800"
                      borderRadius="lg"
                      p={3}
                      display="flex"
                      alignItems="center"
                      cursor="pointer"
                    >
                      <Avatar size="xs" name="ETH" mr={2} />
                      <Text fontSize="sm" mr={2}>
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
                    size="lg"
                    fontWeight="bold"
                    borderRadius="lg"
                    h="50px"
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
              <Box w="100%" borderTop="1px solid" borderColor="gray.700">
                <Tabs variant="enclosed" colorScheme="gray">
                  <TabList bg="transparent" borderBottom="none">
                    <Tab
                      color="gray.400"
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
                      _selected={{ color: "white", borderColor: "gray.600" }}
                    >
                      Details
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel p={4}>
                      <VStack spacing={3} align="stretch">
                        <Box>
                          <Input
                            placeholder="Add a comment..."
                            bg="gray.800"
                            border="none"
                            color="white"
                            size="sm"
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

                    <TabPanel p={4}>
                      <VStack spacing={3} align="stretch">
                        {/* Holders List */}
                        <HStack justify="space-between">
                          <HStack>
                            <Text fontSize="lg">1</Text>
                            <Avatar size="sm" name="Market" />
                            <Text fontSize="sm">Market</Text>
                          </HStack>
                          <Badge colorScheme="blue">98.864%</Badge>
                        </HStack>

                        <HStack justify="space-between">
                          <HStack>
                            <Text fontSize="lg">2</Text>
                            <Avatar size="sm" name="skatehacker" />
                            <Text fontSize="sm">skatehacker (creator)</Text>
                          </HStack>
                          <Badge colorScheme="blue">1%</Badge>
                        </HStack>

                        <HStack justify="space-between">
                          <HStack>
                            <Text fontSize="lg">3</Text>
                            <Avatar size="sm" name="r4to" />
                            <Text fontSize="sm">r4to ⚡</Text>
                          </HStack>
                          <Badge colorScheme="blue">0.136%</Badge>
                        </HStack>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={4}>
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
