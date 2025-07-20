"use client";

import { AuctionBid } from "@/components/AuctionBid";
import { useLastAuction } from '@/hooks/auction';
import { DAO_ADDRESSES } from "@/lib/utils/constants";
import { formatEther } from 'viem';
import { useMemo } from 'react';
import Countdown from 'react-countdown';
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
  IconButton,
  Image,
  Spinner,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpIcon, CheckCircleIcon, InfoIcon } from "@chakra-ui/icons";

const formatBidAmount = (amount: bigint) => {
  return Number(formatEther(amount)).toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
};

const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const isAuctionActive = (endTime: string) => {
  return parseInt(endTime) * 1000 > Date.now();
};

export default function AuctionPage() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { data: activeAuction, refetch, isLoading } = useLastAuction(DAO_ADDRESSES.token);

  const auctionData = useMemo(() => {
    if (!activeAuction) return null;
    
    const endTime = parseInt(activeAuction.endTime) * 1000;
    const isRunning = isAuctionActive(activeAuction.endTime);
    const bidAmount = activeAuction.highestBid
      ? formatBidAmount(BigInt(activeAuction.highestBid.amount))
      : '0';

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
            <Text color="muted" fontSize="lg">No active auction found</Text>
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
          <VStack spacing={{ base: 3, md: 4 }} textAlign="center" maxW="4xl" mx="auto">
            <Heading
              size={{ base: "xl", md: "2xl" }}
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
              Participate in our daily auctions to collect unique Skatehive
              NFTs. Each auction runs for 24 hours and uses the Base L2
              Ethereum blockchain.
            </Text>
          </VStack>

          {/* Main Auction Layout */}
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 6, md: 8 }}
            w="full"
            alignItems="start"
          >
            {/* Large NFT Image */}
            <GridItem>
              <Box
                bg="secondary"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={6}
                shadow="lg"
                position="relative"
              >
                <VStack spacing={4}>
                  {/* NFT Image */}
                  <Box position="relative" w="full">
                    <Image
                      src={activeAuction.token.image}
                      alt={activeAuction.token.name}
                      w="full"
                      aspectRatio="1"
                      borderRadius="lg"
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
                        <Badge colorScheme="red" size="lg">ENDED</Badge>
                      </Box>
                    )}
                  </Box>

                  {/* NFT Title */}
                  <Text fontSize="2xl" fontWeight="bold" color="text" textAlign="center">
                    {activeAuction.token.name.includes(`#${activeAuction.token.tokenId.toString()}`) 
                      ? activeAuction.token.name 
                      : `${activeAuction.token.name} #${activeAuction.token.tokenId.toString()}`
                    }
                  </Text>
                </VStack>
              </Box>
            </GridItem>

            {/* Auction Details */}
            <GridItem>
              <Box
                bg="secondary"
                borderRadius="xl"
                border="1px solid"
                borderColor="border"
                p={6}
                shadow="lg"
              >
                <VStack spacing={6} align="stretch">
                  {/* Current Bid with Date */}
                  <VStack align="start" spacing={2}>
                    <HStack justify="space-between" w="full" align="start">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="muted" fontWeight="medium">
                          Current bid
                        </Text>
                        <Text fontSize="3xl" fontWeight="bold" color="success">
                          {auctionData.bidAmount} ETH
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="xs" color="muted">
                          {new Date().toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>

                  {/* Time Remaining */}
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="muted" fontWeight="medium">
                      Auction ends in
                    </Text>
                    {auctionData.isRunning ? (
                      <Countdown
                        date={auctionData.endTime}
                        renderer={({ days, hours, minutes, seconds, completed }) => {
                          if (completed) {
                            return <Text fontSize="3xl" fontWeight="bold" color="error" fontFamily="mono">ENDED</Text>;
                          }
                          
                          return (
                            <Text fontSize="3xl" fontWeight="bold" color="primary" fontFamily="mono">
                              {days > 0 && `${days}d `}
                              {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
                            </Text>
                          );
                        }}
                        onComplete={() => refetch()}
                      />
                    ) : (
                      <Text fontSize="3xl" fontWeight="bold" color="error" fontFamily="mono">
                        ENDED
                      </Text>
                    )}
                  </VStack>

                  {/* Bidding Interface */}
                  <Box>
                    <AuctionBid
                      tokenId={activeAuction.token.tokenId}
                      winningBid={activeAuction.highestBid?.amount ? BigInt(activeAuction.highestBid.amount) : 0n}
                      isAuctionRunning={auctionData.isRunning}
                      reservePrice={activeAuction.dao.auctionConfig.reservePrice}
                      minimumBidIncrement={activeAuction.dao.auctionConfig.minimumBidIncrement}
                      onBid={refetch}
                      onSettle={refetch}
                    />
                  </Box>

                  {/* Current Bidder */}
                  {activeAuction.highestBid && (
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="muted" fontWeight="medium">
                        Current bidder
                      </Text>
                      <HStack spacing={3}>
                        <Box
                          w={6}
                          h={6}
                          borderRadius="full"
                          bgGradient="linear(to-r, pink.400, purple.500)"
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium" color="text">
                            {formatAddress(activeAuction.highestBid.bidder)}
                          </Text>
                          <Text fontSize="xs" color="muted">
                            {auctionData.bidAmount} ETH
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  )}

                  {/* View All Bids Button */}
                  {activeAuction.bids && activeAuction.bids.length > 0 && (
                    <Button
                      variant="outline"
                      size="lg"
                      borderColor="border"
                      color="text"
                      _hover={{ borderColor: "primary", color: "primary" }}
                    >
                      View All Bids ({activeAuction.bidCount})
                    </Button>
                  )}
                </VStack>
              </Box>
            </GridItem>
          </Grid>

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
                    <Badge colorScheme="green" variant="outline" fontSize="xs">
                      24 hours
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" w="full" align="center">
                    <Text fontSize="sm" color="text">
                      Minimum Increment:
                    </Text>
                    <Badge colorScheme="green" variant="outline" fontSize="xs">
                      2%
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" w="full" align="center">
                    <Text fontSize="sm" color="text">
                      Reserve Price:
                    </Text>
                    <Badge colorScheme="green" variant="outline" fontSize="xs">
                      {formatBidAmount(BigInt(activeAuction.dao.auctionConfig.reservePrice))} ETH
                    </Badge>
                  </Flex>
                </VStack>
              </Box>
            </GridItem>

            {/* Pro Tips */}
            <GridItem>
              <Box
                bg="rgba(168, 255, 96, 0.1)"
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
    </Box>
  );
}
