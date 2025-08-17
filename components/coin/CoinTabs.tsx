"use client";

import React from "react";
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  VStack,
  HStack,
  Input,
  Text,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { CoinData, CoinHolder } from "@/types/coin";
import { useCoinHolders } from "@/hooks/useCoinHolders";
import { useCoinComments } from "@/hooks/useCoinComments";

interface CoinTabsProps {
  coinData: CoinData;
}

export const CoinTabs: React.FC<CoinTabsProps> = ({ coinData }) => {
  const {
    holders,
    loading: holdersLoading,
    error: holdersError,
  } = useCoinHolders({
    address: coinData.address,
    count: 10,
  });

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
  } = useCoinComments({
    address: coinData.address,
    count: 20,
  });

  // Calculate percentage for each holder (like Zora's format)
  const calculatePercentage = (
    balance: string,
    totalSupply: string
  ): string => {
    try {
      if (!totalSupply || totalSupply === "0") {
        return "0%";
      }

      // Convert balance from wei to human readable (divide by 1e18)
      const balanceBigInt = BigInt(balance);
      const weiDivisor = BigInt("1000000000000000000"); // 1e18
      const balanceInTokens = balanceBigInt / weiDivisor; // Convert from wei to tokens

      const totalSupplyBigInt = BigInt(totalSupply);

      // Calculate percentage: (balanceInTokens / totalSupply) * 100
      const percentage = (balanceInTokens * BigInt(10000)) / totalSupplyBigInt; // Multiply by 10000 for 2 decimal precision
      const percentageNum = Number(percentage) / 100; // Divide by 100 to get actual percentage

      // Format like Zora - clean percentages
      let percentageStr;
      if (percentageNum >= 10) {
        percentageStr = `${percentageNum.toFixed(1)}%`; // e.g., "98.5%"
      } else if (percentageNum >= 1) {
        percentageStr = `${percentageNum.toFixed(2)}%`; // e.g., "1.49%"
      } else if (percentageNum >= 0.01) {
        percentageStr = `${percentageNum.toFixed(3)}%`; // e.g., "0.124%"
      } else {
        percentageStr = `${percentageNum.toFixed(4)}%`; // e.g., "0.0195%"
      }

      return percentageStr;
    } catch (error) {
      console.error("❌ Error calculating percentage:", error, {
        balance,
        totalSupply,
      });
      return "0%";
    }
  };

  // Format balance for display
  const formatBalance = (balance: string): number => {
    try {
      const balanceBigInt = BigInt(balance);
      // Convert to a more readable number (assuming 18 decimals)
      const divisor = BigInt("1000000000000000000"); // 1e18
      const formattedBalance = Number(balanceBigInt / divisor);
      return formattedBalance;
    } catch (error) {
      console.error("❌ Error formatting balance:", error);
      return 0;
    }
  };

  // Format large numbers like Zora (e.g., 965,916,381 or 14,932,210)
  const formatTokenAmount = (balance: string): string => {
    const formatted = formatBalance(balance);
    return formatted.toLocaleString();
  };

  // Format address for display
  const formatAddress = (address: string): string => {
    // Don't need special handling for market address since real API doesn't use zero address
    const formatted = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return formatted;
  };

  // Get display name for holder
  const getDisplayName = (holder: CoinHolder, index: number): string => {
    // First holder is typically the market/pool
    if (index === 0) {
      return "Market";
    }

    if (holder.ownerProfile?.handle) {
      return holder.ownerProfile.handle;
    }
    return formatAddress(holder.ownerAddress);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now() / 1000; // Convert to seconds
    const diff = now - timestamp;

    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    if (diff < 2628000) return `${Math.floor(diff / 604800)}w`;
    return `${Math.floor(diff / 2628000)}mo`;
  };

  // Format address for comments
  const formatCommentAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
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
            <Badge ml={2} fontSize="xs" bg="gray.700" color="gray.300">
              {comments?.totalCount || 0}
            </Badge>
          </Tab>
          <Tab
            color="gray.400"
            fontSize={{ base: "sm", lg: "xs" }}
            _selected={{ color: "white", borderColor: "gray.600" }}
          >
            Holders
            <Badge ml={2} fontSize="xs" bg="gray.700" color="gray.300">
              {holders?.totalCount || coinData.uniqueHolders || 0}
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

              {commentsLoading ? (
                <VStack spacing={3} align="center">
                  <Spinner size="md" color="blue.400" />
                  <Text fontSize="sm" color="gray.400">
                    Loading comments...
                  </Text>
                </VStack>
              ) : commentsError ? (
                <Alert status="error" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">Failed to load comments</Text>
                </Alert>
              ) : comments?.comments && comments.comments.length > 0 ? (
                comments.comments.map((comment, index) => {
                  const displayName =
                    comment.userProfile?.handle ||
                    formatCommentAddress(comment.userAddress);

                  return (
                    <HStack key={comment.commentId} align="start" spacing={3}>
                      <Avatar
                        size="sm"
                        name={displayName}
                        src={comment.userProfile?.avatar?.previewImage?.small}
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Text fontSize="sm" fontWeight="bold">
                            {displayName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatTimestamp(comment.timestamp)}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="white">
                          {comment.comment}
                        </Text>
                        <HStack spacing={4}>
                          <Text fontSize="xs" color="gray.500" cursor="pointer">
                            Reply
                          </Text>
                          {comment.replies && comment.replies.count > 0 && (
                            <Text
                              fontSize="xs"
                              color="blue.400"
                              cursor="pointer"
                            >
                              {comment.replies.count}{" "}
                              {comment.replies.count === 1
                                ? "reply"
                                : "replies"}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                  );
                })
              ) : (
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  No comments yet. Be the first to comment!
                </Text>
              )}

              {comments?.hasNextPage && (
                <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
                  Showing {comments.comments.length} of {comments.totalCount}{" "}
                  comments
                </Text>
              )}
            </VStack>
          </TabPanel>

          <TabPanel p={{ base: 3, md: 4 }}>
            {holdersLoading ? (
              <VStack spacing={3} align="center">
                <Spinner size="md" color="blue.400" />
                <Text fontSize="sm" color="gray.400">
                  Loading holders...
                </Text>
              </VStack>
            ) : holdersError ? (
              <Alert status="error" size="sm">
                <AlertIcon />
                <Text fontSize="sm">Failed to load holders</Text>
              </Alert>
            ) : (
              <VStack spacing={3} align="stretch">
                {holders?.holders && holders.holders.length > 0 ? (
                  holders.holders.map((holder, index) => {
                    const displayName = getDisplayName(holder, index);
                    const isCreator =
                      coinData.creatorAddress &&
                      holder.ownerAddress.toLowerCase() ===
                        coinData.creatorAddress.toLowerCase();

                    return (
                      <HStack
                        key={holder.ownerAddress}
                        justify="space-between"
                        align="center"
                        py={2}
                        px={0}
                      >
                        <HStack spacing={3} flex={1} minW={0}>
                          <Text
                            fontSize="lg"
                            color="gray.400"
                            fontWeight="medium"
                            minW="20px"
                          >
                            {index + 1}
                          </Text>
                          <Avatar
                            size="sm"
                            name={displayName}
                            src={
                              holder.ownerProfile?.avatar?.previewImage?.small
                            }
                          />
                          <VStack align="start" spacing={0} flex={1} minW={0}>
                            <HStack spacing={1}>
                              <Text
                                fontSize="md"
                                fontWeight="medium"
                                color="white"
                                isTruncated
                              >
                                {displayName}
                              </Text>
                              {isCreator && (
                                <Text fontSize="sm" color="gray.400">
                                  (creator)
                                </Text>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.500" isTruncated>
                              {formatTokenAmount(holder.balance)} tokens
                            </Text>
                          </VStack>
                        </HStack>
                        <Badge
                          colorScheme="blue"
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="md"
                          fontWeight="medium"
                        >
                          {calculatePercentage(
                            holder.balance,
                            coinData.totalSupply || "0"
                          )}
                        </Badge>
                      </HStack>
                    );
                  })
                ) : (
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    No holders data available
                  </Text>
                )}

                {holders?.hasNextPage && (
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textAlign="center"
                    mt={2}
                  >
                    Showing top {holders.holders.length} of{" "}
                    {holders.totalCount || coinData.uniqueHolders} holders
                  </Text>
                )}
              </VStack>
            )}
          </TabPanel>

          <TabPanel p={{ base: 3, md: 4 }}>
            <VStack align="start" spacing={3}>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Contract Address
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="blue.400">
                  {coinData.address}
                </Text>
              </Box>

              {coinData.creatorAddress && (
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>
                    Creator
                  </Text>
                  <Text fontSize="xs" fontFamily="mono" color="blue.400">
                    {coinData.creatorProfile?.handle
                      ? `@${coinData.creatorProfile.handle}`
                      : coinData.creatorAddress}
                  </Text>
                  {coinData.creatorProfile?.handle && (
                    <Text
                      fontSize="xs"
                      fontFamily="mono"
                      color="gray.500"
                      mt={1}
                    >
                      {coinData.creatorAddress}
                    </Text>
                  )}
                </Box>
              )}

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Unique Holders
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {coinData.uniqueHolders?.toLocaleString() || "0"}
                </Text>
              </Box>

              {coinData.totalSupply && (
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>
                    Total Supply
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="white">
                    {Number(coinData.totalSupply).toLocaleString()}
                  </Text>
                </Box>
              )}

              {coinData.createdAt && (
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>
                    Created
                  </Text>
                  <Text fontSize="sm" color="white">
                    {new Date(coinData.createdAt).toLocaleDateString()}
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
  );
};
