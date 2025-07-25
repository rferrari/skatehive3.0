"use client";

import { AuctionBid, BidsModal } from "@/components/auction";
import { fetchAuctionByTokenId, fetchAuction } from "@/services/auction";
import { useQuery } from "@tanstack/react-query";
import { DAO_ADDRESSES } from "@/lib/utils/constants";
import { formatEther } from "viem";
import { useMemo, useState } from "react";
import Countdown from "react-countdown";
import { useAccount, useDisconnect } from "wagmi";
import ConnectModal from "@/components/wallet/ConnectModal";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Grid,
  GridItem,
  Badge,
  Flex,
  useBreakpointValue,
  Button,
  Image,
  Spinner,
  List,
  ListItem,
  ListIcon,
  Center,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";
import { Name, Avatar, Identity } from "@coinbase/onchainkit/identity";
import ConnectButton from "@/components/wallet/ConnectButton";

const formatBidAmount = (amount: bigint) => {
  return Number(formatEther(amount)).toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
};

const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const formatBidDate = (timestamp: string) => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isAuctionActive = (endTime: string) => {
  return parseInt(endTime) * 1000 > Date.now();
};

interface AuctionPageProps {
  tokenId?: number;
  showNavigation?: boolean;
}

export default function AuctionPage({
  tokenId,
  showNavigation = false,
}: AuctionPageProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const router = useRouter();

  // Use different queries based on whether we have a specific tokenId
  const {
    data: activeAuction,
    refetch,
    isLoading,
    error,
  } = useQuery({
    queryKey: tokenId ? ["auction", tokenId] : ["auction", "latest"],
    queryFn: async () => {
      if (tokenId !== undefined) {
        return await fetchAuctionByTokenId(tokenId);
      } else {
        // Fetch latest auction for main page
        const auctions = await fetchAuction(DAO_ADDRESSES.token);
        return auctions[0] || null;
      }
    },
    staleTime: 0,
  });

  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isHoveringBid, setIsHoveringBid] = useState(false);

  // Navigation logic
  const currentTokenId =
    tokenId ||
    (activeAuction ? Number(activeAuction.token.tokenId) : undefined);

  // Check if we're viewing the latest auction by comparing with fetched latest auction
  const { data: latestAuction } = useQuery({
    queryKey: ["auction", "latest-check"],
    queryFn: async () => {
      const auctions = await fetchAuction(DAO_ADDRESSES.token);
      return auctions[0] || null;
    },
    staleTime: 0,
  });

  const isLatestAuction =
    latestAuction &&
    activeAuction &&
    Number(latestAuction.token.tokenId) === Number(activeAuction.token.tokenId);

  const handlePrev = () => {
    if (currentTokenId && currentTokenId > 1) {
      router.push(`/auction/${currentTokenId - 1}`);
    }
  };

  const handleNext = () => {
    if (currentTokenId) {
      router.push(`/auction/${currentTokenId + 1}`);
    }
  };

  const auctionData = useMemo(() => {
    if (!activeAuction) return null;
    const endTime = parseInt(activeAuction.endTime) * 1000;
    const isRunning = isAuctionActive(activeAuction.endTime);
    const bidAmount = activeAuction.highestBid
      ? formatBidAmount(BigInt(activeAuction.highestBid.amount))
      : "0";
    return { endTime, isRunning, bidAmount };
  }, [activeAuction]);

  if (isLoading) {
    return (
      <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={8} justify="center" minH="60vh">
            <Spinner size="xl" color="primary" />
            <Text color="text">Loading auction...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error) {
    console.error("Auction fetch error:", error);
    return (
      <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={8} justify="center" minH="60vh">
            <Text color="error" fontSize="lg">
              Error loading auction: {error.message}
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!activeAuction || !auctionData) {
    return (
      <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={8} justify="center" minH="60vh">
            <Text color="muted" fontSize="lg">
              {tokenId
                ? `No auction found for token #${tokenId}`
                : "No active auction found"}
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
      <Container maxW="7xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 6, md: 8 }}>
          {/* Header Section */}
          <VStack
            spacing={{ base: 3, md: 4 }}
            textAlign="center"
            maxW="4xl"
            mx="auto"
          >
            <Heading
              size={{ base: "3xl", md: "4xl" }}
              color="primary"
              fontFamily="heading"
              textTransform="uppercase"
              letterSpacing="wide"
              lineHeight="tight"
              style={{
                fontFamily: "Dash",
              }}
            >
              Skatehive Auction
            </Heading>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="text"
              maxW="2xl"
              lineHeight="tall"
              px={{ base: 2, md: 0 }}
            >
              Participate in an auction to acquire Skatehive Art and Votes
            </Text>
          </VStack>

          {/* Main Auction Layout */}
          <Box maxW="6xl" mx="auto" w="full">
            <Grid
              templateColumns={{ base: "1fr", lg: "1fr 2fr" }}
              gap={{ base: 6, md: 6 }}
              w="full"
              alignItems="stretch"
            >
              {/* Auction Details */}
              <GridItem order={{ base: 2, lg: 2 }}>
                {/* Wallet Connection */}
                {!isConnected ? (
                  <ConnectButton />
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="stretch"
                    justifyContent="center"
                    bg="muted"
                    border="2px solid"
                    borderColor="primary"
                    borderRadius="xl"
                    p={2}
                    minH="60px"
                    transition="all 0.3s ease"
                    w="100%"
                  >
                    <Box w="full">
                      <Identity address={address as `0x${string}`}>
                        <Avatar />
                        <Name className="font-bold text-base ml-1" />
                      </Identity>
                    </Box>
                    <Button
                      w="full"
                      mt={2}
                      px={2}
                      py={1}
                      fontSize="md"
                      fontWeight="bold"
                      textTransform="uppercase"
                      color="#D1FF4C"
                      bg="transparent"
                      border="2px solid #D1FF4C"
                      borderRadius="lg"
                      _hover={{ bg: "#1a1a1a", color: "#D1FF4C" }}
                      onClick={() => disconnect()}
                    >
                      Disconnect
                    </Button>
                  </Box>
                )}
                <Box
                  p={{ base: 6, lg: 6 }}
                  position="relative"
                  overflow="hidden"
                  border={"1px solid"}
                  borderColor="border"
                >
                  {isHoveringBid && <MatrixOverlay />}
                  <VStack spacing={6} align="center">
                    {/* Time Remaining */}
                    <VStack spacing={2} position="relative" zIndex={1}>
                      <Text fontSize="sm" color="primary" fontWeight="medium">
                        Auction ends in
                      </Text>
                      {auctionData.isRunning ? (
                        <Countdown
                          date={auctionData.endTime}
                          renderer={({
                            days,
                            hours,
                            minutes,
                            seconds,
                            completed,
                          }) => {
                            if (completed) {
                              return (
                                <Text
                                  fontSize="3xl"
                                  fontWeight="bold"
                                  color="error"
                                  fontFamily="mono"
                                >
                                  ENDED
                                </Text>
                              );
                            }
                            return (
                              <HStack spacing={2} align="center">
                                <Image
                                  src="/images/clock.gif"
                                  alt="clock"
                                  boxSize="32px"
                                  objectFit="contain"
                                />
                                <Text
                                  fontSize="4xl"
                                  fontWeight="bold"
                                  color="primary"
                                  fontFamily="mono"
                                >
                                  {days > 0 && `${days}d `}
                                  {String(hours).padStart(2, "0")}h{" "}
                                  {String(minutes).padStart(2, "0")}m{" "}
                                  {String(seconds).padStart(2, "0")}s
                                </Text>
                              </HStack>
                            );
                          }}
                          onComplete={() => refetch()}
                        />
                      ) : (
                        <Text
                          fontSize="3xl"
                          fontWeight="bold"
                          color="error"
                          fontFamily="mono"
                        >
                          ENDED
                        </Text>
                      )}
                    </VStack>

                    {/* Bidding Interface */}
                    <Box
                      w="full"
                      alignSelf="center"
                      onMouseEnter={() => setIsHoveringBid(true)}
                      onMouseLeave={() => setIsHoveringBid(false)}
                    >
                      <AuctionBid
                        tokenId={activeAuction.token.tokenId}
                        winningBid={
                          activeAuction.highestBid?.amount
                            ? BigInt(activeAuction.highestBid.amount)
                            : 0n
                        }
                        isAuctionRunning={auctionData.isRunning}
                        reservePrice={
                          activeAuction.dao.auctionConfig.reservePrice
                        }
                        minimumBidIncrement={
                          activeAuction.dao.auctionConfig.minimumBidIncrement
                        }
                        onBid={refetch}
                        onSettle={refetch}
                        alignContent="left"
                      />
                    </Box>

                    {/* Bids Viewport */}
                    {activeAuction.bids && activeAuction.bids.length > 0 && (
                      <Box
                        w="full"
                        bg="muted"
                        borderRadius="md"
                        p={3}
                        maxH="376px"
                        overflowY="auto"
                        position="relative"
                        zIndex={1}
                        sx={{
                          "&::-webkit-scrollbar": { width: "6px" },
                          "&::-webkit-scrollbar-track": {
                            background: "transparent",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: "var(--chakra-colors-border)",
                            borderRadius: "3px",
                          },
                          "&::-webkit-scrollbar-thumb:hover": {
                            background: "var(--chakra-colors-primary)",
                          },
                          scrollbarWidth: "thin",
                          scrollbarColor:
                            "var(--chakra-colors-border) transparent",
                        }}
                      >
                        <VStack spacing={3} align="stretch">
                          {/* Bid History */}
                          <VStack spacing={2} align="stretch" flex={1}>
                            <Center>
                              <Text
                                fontSize="sm"
                                fontWeight="bold"
                                color="primary"
                              >
                                Bid History
                              </Text>
                            </Center>
                            {activeAuction.bids.length === 1 ? (
                              <HStack
                                justify="space-between"
                                w="full"
                                py={0}
                                px={0}
                                bg="muted"
                                borderRadius="md"
                              >
                                <HStack>
                                  <Avatar
                                    address={activeAuction.bids[0].bidder}
                                  />
                                  <Name
                                    address={activeAuction.bids[0].bidder}
                                    className="font-bold text-sm"
                                  />
                                </HStack>
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="text"
                                >
                                  {formatBidAmount(
                                    BigInt(activeAuction.bids[0].amount)
                                  )}{" "}
                                  ETH
                                </Text>
                              </HStack>
                            ) : activeAuction.bids.length > 1 ? (
                              [...activeAuction.bids]
                                .sort((a, b) => {
                                  const amountA = BigInt(a.amount);
                                  const amountB = BigInt(b.amount);
                                  return amountB > amountA
                                    ? 1
                                    : amountB < amountA
                                    ? -1
                                    : 0;
                                })
                                .slice(1)
                                .map((bid, index) => (
                                  <HStack
                                    key={index}
                                    justify="space-between"
                                    w="full"
                                    py={2}
                                    px={3}
                                    bg="secondary"
                                    borderRadius="md"
                                  >
                                    <HStack>
                                      <Avatar address={bid.bidder} />
                                      <Name
                                        address={bid.bidder}
                                        className="font-bold text-sm"
                                      />
                                    </HStack>
                                    <Text
                                      fontSize="sm"
                                      fontWeight="medium"
                                      color="text"
                                    >
                                      {formatBidAmount(BigInt(bid.amount))} ETH
                                    </Text>
                                  </HStack>
                                ))
                            ) : (
                              <Box
                                flex={1}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg="muted"
                                borderRadius="md"
                                minH="100px"
                              >
                                <Text
                                  fontSize="sm"
                                  color="primary"
                                  textAlign="center"
                                >
                                  No bid history yet
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </GridItem>

              {/* Large NFT Image */}
              <GridItem order={{ base: 1, lg: 1 }}>
                <Box p={{ base: 6, lg: 8 }} position="relative" h="full">
                  <VStack spacing={8}>
                    {/* NFT Image */}
                    <Box
                      position="relative"
                      w={{ base: "full", md: "400px", lg: "600px" }}
                      h={{ base: "auto", md: "400px", lg: "600px" }}
                      mx="auto"
                    >
                      <Image
                        src={activeAuction.token.image}
                        alt={activeAuction.token.name}
                        w={{ base: "full", md: "400px", lg: "600px" }}
                        h={{ base: "auto", md: "400px", lg: "600px" }}
                        aspectRatio="1"
                        objectFit="cover"
                        fallbackSrc="/images/placeholder.png"
                      />
                      {/* Stamped Latest Champ Box - Centered and Rotated */}
                      {!auctionData.isRunning && activeAuction.highestBid && (
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%) rotate(30deg)"
                          bg="background"
                          color="primary"
                          p={3}
                          borderRadius="md"
                          boxShadow="lg"
                          border="2px dashed"
                          borderColor="primary"
                          zIndex={2}
                          minW={{ base: "180px", md: "220px" }}
                        >
                          <VStack spacing={2} align="stretch" w="full">
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color="primary"
                              textAlign="center"
                              letterSpacing="wide"
                              textTransform="uppercase"
                            >
                              Latest Champ
                            </Text>
                            <Center>
                              <HStack>
                                <Avatar
                                  address={activeAuction.highestBid.bidder}
                                />
                                <Name
                                  className="text-lg font-bold"
                                  address={activeAuction.highestBid.bidder}
                                />
                              </HStack>
                            </Center>
                            <Text
                              fontSize="lg"
                              fontWeight="bold"
                              color="success"
                              textAlign="center"
                              w="full"
                            >
                              {auctionData.bidAmount} ETH
                            </Text>
                          </VStack>
                        </Box>
                      )}
                    </Box>

                    {/* Title and Date Group with Optional Navigation */}
                    <VStack spacing={1}>
                      {/* NFT Title */}
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color="text"
                        textAlign="center"
                        pt={2}
                        mb={0}
                      >
                        {activeAuction.token.name.includes(
                          `#${activeAuction.token.tokenId.toString()}`
                        )
                          ? activeAuction.token.name
                          : `${
                              activeAuction.token.name
                            } #${activeAuction.token.tokenId.toString()}`}
                      </Text>
                      {/* Date */}
                      <Text
                        fontSize="xs"
                        color="primary"
                        textAlign="center"
                        mt={0}
                        mb={showNavigation ? 4 : 0}
                      >
                        {new Date(
                          parseInt(activeAuction.startTime) * 1000
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>

                      {/* Navigation Arrows (only show if enabled) */}
                      {showNavigation && currentTokenId && (
                        <HStack spacing={4} justify="center" w="full">
                          <Tooltip
                            label={
                              currentTokenId && currentTokenId > 1
                                ? `View Auction #${currentTokenId - 1}`
                                : "No previous auction"
                            }
                            hasArrow
                            placement="bottom"
                          >
                            <IconButton
                              aria-label="Previous Auction"
                              icon={<ArrowBackIcon />}
                              onClick={handlePrev}
                              isDisabled={
                                !currentTokenId || currentTokenId <= 1
                              }
                              size="lg"
                              variant="ghost"
                              colorScheme="red"
                              color="primary"
                              bg="background"
                              border="2px solid"
                              borderColor="primary"
                              borderRadius="full"
                              _hover={{
                                bg: "primary",
                                color: "background",
                                transform: "scale(1.1)",
                              }}
                              _active={{ transform: "scale(0.95)" }}
                              transition="all 0.2s ease"
                            />
                          </Tooltip>

                          <Text fontSize="sm" color="muted" fontFamily="mono">
                            Token #{activeAuction.token.tokenId.toString()}
                          </Text>

                          <Tooltip
                            label={
                              !tokenId || isLatestAuction
                                ? "Latest auction - no future auctions available"
                                : currentTokenId
                                ? `View Auction #${currentTokenId + 1}`
                                : "Next auction"
                            }
                            hasArrow
                            placement="bottom"
                          >
                            <IconButton
                              aria-label="Next Auction"
                              icon={<ArrowForwardIcon />}
                              onClick={handleNext}
                              isDisabled={
                                !!(
                                  !currentTokenId ||
                                  !tokenId ||
                                  isLatestAuction
                                )
                              }
                              size="lg"
                              variant="ghost"
                              colorScheme="red"
                              color="primary"
                              bg="background"
                              border="2px solid"
                              borderColor="primary"
                              borderRadius="full"
                              _hover={{
                                bg: "primary",
                                color: "background",
                                transform: "scale(1.1)",
                              }}
                              _active={{ transform: "scale(0.95)" }}
                              transition="all 0.2s ease"
                            />
                          </Tooltip>
                        </HStack>
                      )}
                    </VStack>
                  </VStack>
                </Box>
              </GridItem>
            </Grid>
          </Box>

          {/* Widgets Row - 3 Columns */}
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
            gap={{ base: 4, md: 6 }}
            w="full"
            maxW="6xl"
            mx="auto"
          >
            {/* How it works */}
            <GridItem>
              <Box
                bg="muted"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={6}
                shadow="sm"
                h="full"
              >
                <Heading size="md" color="text" mb={4} fontSize="lg">
                  How it works
                </Heading>
                <List spacing={3}>
                  <ListItem display="flex" alignItems="start">
                    <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                    <Text fontSize="sm" color="text">
                      Connect your wallet to participate in the auction
                    </Text>
                  </ListItem>
                  <ListItem display="flex" alignItems="start">
                    <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                    <Text fontSize="sm" color="text">
                      Place a bid higher than the current highest bid
                    </Text>
                  </ListItem>
                  <ListItem display="flex" alignItems="start">
                    <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                    <Text fontSize="sm" color="text">
                      If you're the highest bidder when the auction ends, you
                      win!
                    </Text>
                  </ListItem>
                  <ListItem display="flex" alignItems="start">
                    <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                    <Text fontSize="sm" color="text">
                      Settle the auction to claim your NFT and start the next
                      one
                    </Text>
                  </ListItem>
                </List>
              </Box>
            </GridItem>

            {/* Auction Rules */}
            <GridItem>
              <Box
                bg="muted"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={6}
                shadow="sm"
                h="full"
              >
                <Heading size="md" color="text" mb={4} fontSize="lg">
                  Auction Rules
                </Heading>
                <VStack spacing={3}>
                  <Flex justify="space-between" w="full" align="center">
                    <Text fontSize="sm" color="text">
                      Auction Duration:
                    </Text>
                    <Badge
                      bg="success"
                      color="background"
                      variant="solid"
                      fontSize="xs"
                    >
                      24 hours
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" w="full" align="center">
                    <Text fontSize="sm" color="text">
                      Minimum Increment:
                    </Text>
                    <Badge
                      bg="success"
                      color="background"
                      variant="solid"
                      fontSize="xs"
                    >
                      2%
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" w="full" align="center">
                    <Text fontSize="sm" color="text">
                      Reserve Price:
                    </Text>
                    <Badge
                      bg="success"
                      color="background"
                      variant="solid"
                      fontSize="xs"
                    >
                      {formatBidAmount(
                        BigInt(activeAuction.dao.auctionConfig.reservePrice)
                      )}{" "}
                      ETH
                    </Badge>
                  </Flex>
                </VStack>
              </Box>
            </GridItem>

            {/* Pro Tips */}
            <GridItem>
              <Box
                bg="muted"
                borderRadius="xl"
                border="1px solid"
                borderColor="primary"
                p={6}
                shadow="sm"
                h="full"
              >
                <HStack spacing={2} mb={3}>
                  <InfoIcon color="primary" />
                  <Heading size="md" color="primary" fontSize="lg">
                    Pro Tips
                  </Heading>
                </HStack>
                <List spacing={2}>
                  <ListItem>
                    <Text fontSize="sm" color="text">
                      • Bids in the last 10 minutes extend the auction
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fontSize="sm" color="text">
                      • Higher gas fees = faster transaction confirmation
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fontSize="sm" color="text">
                      • Check the transaction on Basescan for updates
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text fontSize="sm" color="text">
                      • Join our Discord for auction notifications
                    </Text>
                  </ListItem>
                </List>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      </Container>

      {/* Bids Modal */}
      {activeAuction && activeAuction.bids && (
        <BidsModal
          isOpen={isBidsModalOpen}
          onClose={() => setIsBidsModalOpen(false)}
          bids={activeAuction.bids}
          tokenName={activeAuction.token.name}
          tokenId={activeAuction.token.tokenId.toString()}
        />
      )}

      {/* Connect Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </Box>
  );
}
