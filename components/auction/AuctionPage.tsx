"use client";

import { AuctionBid, BidsModal } from "@/components/auction";
import { AuctionHeader } from "@/components/auction/AuctionHeader";
import { AdminAuctionPage } from "@/components/auction/AdminAuctionPage";
import AuctionMobileNavbar from "@/components/auction/AuctionMobileNavbar";
import { fetchAuctionByTokenId, fetchAuction } from "@/services/auction";
import { useQuery } from "@tanstack/react-query";
import { DAO_ADDRESSES } from "@/lib/utils/constants";
import { formatEther } from "viem";
import { useMemo, useState } from "react";
import Countdown from "react-countdown";
import { useAccount } from "wagmi";
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
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";
import { Name, Avatar, Identity } from "@coinbase/onchainkit/identity";

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
        const result = await fetchAuctionByTokenId(tokenId);
        return result;
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
    const isMultipleOf10 = tokenId ? tokenId % 10 === 0 : false;

    // Show special admin auction page for multiples of 10
    if (tokenId && isMultipleOf10) {
      return (
        <AdminAuctionPage
          tokenId={tokenId}
          showNavigation={showNavigation}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      );
    }

    return (
      <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={8} justify="center" minH="60vh">
            <Text color="muted" fontSize="lg">
              {tokenId
                ? `Auction #${tokenId} not found. This auction may not exist or may not be from SkateHive DAO.`
                : "No active auction found"}
            </Text>
            {tokenId && (
              <Text color="muted" fontSize="sm" textAlign="center" maxW="md">
                Only auctions from SkateHive DAO are displayed. If you&apos;re
                looking for a specific auction, make sure the token ID
                corresponds to a SkateHive auction.
              </Text>
            )}
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <>
      {/* Mobile Navbar */}
      <AuctionMobileNavbar />

      <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={{ base: 2, md: 3 }}>
            {/* Header Section */}
            <Box textAlign="center" maxW="4xl" mx="auto">
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
            </Box>

            {/* Auction Header - Name, Date, Navigation */}
            <Box maxW="4xl" mx="auto" w="full">
              <AuctionHeader
                tokenName={activeAuction.token.name}
                tokenId={activeAuction.token.tokenId.toString()}
                startTime={activeAuction.startTime}
                showNavigation={showNavigation}
                currentTokenId={currentTokenId}
                isLatestAuction={isLatestAuction ?? false}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </Box>

            {/* Main Auction Layout */}
            <Box maxW="4xl" mx="auto" w="full" mb={16} mt={6}>
              <Grid
                templateColumns={{ base: "1fr", lg: "0.25fr 0.75fr" }}
                gap={{ base: 6, md: 6 }}
                w="full"
                alignItems="center"
              >
                {/* Auction Details */}
                <GridItem order={{ base: 2, lg: 2 }} ml={{ base: 0, lg: 4 }}>
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
                      <Box w="full" alignSelf="center">
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
                          bids={activeAuction.bids || []}
                          onBidSectionHover={setIsHoveringBid}
                          isLatestAuction={isLatestAuction ?? false}
                        />
                      </Box>
                    </VStack>
                  </Box>
                </GridItem>

                {/* Large NFT Image */}
                <GridItem order={{ base: 1, lg: 1 }}>
                  <Box position="relative" h="full">
                    <VStack spacing={0}>
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
                                <HStack color={"primary"} spacing={2}>
                                  <Avatar
                                    address={activeAuction.highestBid.bidder}
                                  />
                                  <Name
                                    className="text-lg font-bold text-white"
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

                      {/* NFT Image Only - Title, Date, and Navigation moved to AuctionHeader */}
                      <Box />
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
                        If you&apos;re the highest bidder when the auction ends,
                        you win!
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
    </>
  );
}
