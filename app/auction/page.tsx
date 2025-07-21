"use client";

import { AuctionBid, BidsModal } from "@/components/auction";
import { useLastAuction } from "@/hooks/auction";
import { DAO_ADDRESSES } from "@/lib/utils/constants";
import { Address, formatEther } from "viem";
import { useMemo, useState } from "react";
import Countdown from "react-countdown";
import { useAccount, useDisconnect } from "wagmi";
import { FaEthereum } from "react-icons/fa";
import ConnectModal from "@/components/wallet/ConnectModal";
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
} from "@chakra-ui/react";
import { CheckCircleIcon, InfoIcon } from "@chakra-ui/icons";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";

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

export default function AuctionPage() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const {
    data: activeAuction,
    refetch,
    isLoading,
  } = useLastAuction(DAO_ADDRESSES.token);
  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isHoveringBid, setIsHoveringBid] = useState(false);

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

  if (!activeAuction || !auctionData) {
    return (
      <Box bg="background" minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={8} justify="center" minH="60vh">
            <Text color="muted" fontSize="lg">
              No active auction found
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
              Participate in an auction to acquire a unique Skatehive NFT.
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
                <Box
                  borderTopLeftRadius="0"
                  borderTopRightRadius="0"
                  borderBottomLeftRadius="12px"
                  borderBottomRightRadius="12px"
                  p={{ base: 6, lg: 8 }}
                  h="full"
                  position="relative"
                  overflow="hidden"
                >
                  {isHoveringBid && <MatrixOverlay />}
                  <VStack spacing={6} align="center">
                    {/* Time Remaining */}
                    <VStack
                      align="center"
                      spacing={2}
                      position="relative"
                      zIndex={1}
                    >
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

                    {/* Wallet Connection */}
                    <VStack align="center" spacing={2}>
                      {isConnected ? (
                        <Button
                          onClick={() => disconnect()}
                          w="full"
                          variant="outline"
                          height="auto"
                          py={3}
                          border="1px solid"
                          borderColor="border"
                          bg="muted"
                        >
                          <HStack spacing={3} w="full" justify="space-between">
                            <HStack spacing={2}>
                              <FaEthereum size={16} />
                              <Text fontSize="sm" color="text">
                                {formatAddress(address as Address)}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="primary">
                              Disconnect
                            </Text>
                          </HStack>
                        </Button>
                      ) : (
                        <Button
                          leftIcon={<FaEthereum size={16} />}
                          onClick={() => setIsConnectModalOpen(true)}
                          w="full"
                          colorScheme="blue"
                          variant="outline"
                        >
                          Connect Wallet to Bid
                        </Button>
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
                        onBidButtonHover={(isHovering) =>
                          setIsHoveringBid(isHovering)
                        }
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
                          "&::-webkit-scrollbar": {
                            width: "6px",
                          },
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
                          {/* Highest Bidder */}
                          {activeAuction.highestBid && (
                            <Box
                              bg="accent"
                              color="background"
                              p={3}
                              borderRadius="md"
                            >
                              <VStack spacing={2} align="stretch" w="full">
                                <Text
                                  fontSize="sm"
                                  fontWeight="bold"
                                  color="background"
                                  textAlign="center"
                                >
                                  Highest Bidder
                                </Text>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color="background"
                                  textAlign="center"
                                  w="full"
                                >
                                  {formatAddress(
                                    activeAuction.highestBid.bidder
                                  )}
                                </Text>
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

                          {/* Bid History */}
                          <VStack spacing={2} align="stretch" flex={1}>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color="primary"
                            >
                              Bid History
                            </Text>
                            {activeAuction.bids.length > 1 ? (
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
                                .slice(1) // Skip the highest bid since it's shown above
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
                                    <Text fontSize="sm" color="accent">
                                      {formatAddress(bid.bidder)}
                                    </Text>
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
                                bg="secondary"
                                borderRadius="md"
                                minH="100px"
                              >
                                <Text
                                  fontSize="sm"
                                  color="muted"
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
                <Box
                  borderTopLeftRadius="0"
                  borderTopRightRadius="0"
                  borderBottomLeftRadius="12px"
                  borderBottomRightRadius="12px"
                  p={{ base: 6, lg: 8 }}
                  position="relative"
                  h="full"
                >
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
                      {!auctionData.isRunning && (
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="rgba(0,0,0,0.7)"
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Badge bg="error" color="background" size="lg">
                            ENDED
                          </Badge>
                        </Box>
                      )}
                    </Box>

                    {/* Title and Date Group */}
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
                      >
                        {new Date(
                          parseInt(activeAuction.startTime) * 1000
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
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
                bg="secondary"
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
                bg="secondary"
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
