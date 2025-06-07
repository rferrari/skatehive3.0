"use client";

import { useState, useMemo, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  VStack,
  HStack,
  Stack,
  Badge,
  useColorModeValue,
  Tooltip,
  SimpleGrid,
  IconButton,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";

interface SkaterData {
  id: number;
  hive_author: string;
  hive_balance: number;
  hp_balance: number;
  hbd_balance: number;
  hbd_savings_balance: number;
  has_voted_in_witness: boolean;
  eth_address: string;
  gnars_balance: number;
  gnars_votes: number;
  skatehive_nft_balance: number;
  max_voting_power_usd: number;
  last_updated: string;
  last_post: string;
  post_count: number;
  points: number;
  giveth_donations_usd: number;
  giveth_donations_amount: number;
}

interface Props {
  skatersData: SkaterData[];
}

type SortOption =
  | "points"
  | "power"
  | "posts"
  | "nfts"
  | "gnars"
  | "donations"
  | "hive"
  | "eth"
  | "gnars_balance"
  | "giveth_donations_usd"
  | "witness"
  | "last_updated";

export default function LeaderboardClient({ skatersData }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("points");

  const sortedSkaters = useMemo(() => {
    const sorted = [...skatersData].sort((a, b) => {
      switch (sortBy) {
        case "points":
          return b.points - a.points;
        case "power":
          return (
            b.hp_balance +
            b.max_voting_power_usd -
            (a.hp_balance + a.max_voting_power_usd)
          );
        case "posts":
          return b.post_count - a.post_count;
        case "nfts":
          return b.skatehive_nft_balance - a.skatehive_nft_balance;
        case "gnars":
          return b.gnars_votes - a.gnars_votes;
        case "donations":
          return b.giveth_donations_usd - a.giveth_donations_usd;
        case "hive":
          return b.hive_balance - a.hive_balance;
        case "eth":
          // Sort by eth address alphabetically (or you can implement a custom logic)
          return (b.eth_address || "").localeCompare(a.eth_address || "");
        case "gnars_balance":
          return b.gnars_balance - a.gnars_balance;
        case "giveth_donations_usd":
          return b.giveth_donations_usd - a.giveth_donations_usd;
        case "witness":
          return (
            (b.has_voted_in_witness ? 1 : 0) - (a.has_voted_in_witness ? 1 : 0)
          );
        case "last_updated":
          return (
            new Date(b.last_updated).getTime() -
            new Date(a.last_updated).getTime()
          );
        default:
          return 0;
      }
    });
    return sorted.slice(0, 50); // Top 50
  }, [skatersData, sortBy]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Text fontSize="2xl">🏆</Text>;
    if (rank === 2) return <Text fontSize="2xl">🥈</Text>;
    if (rank === 3) return <Text fontSize="2xl">🥉</Text>;
    return (
      <Badge colorScheme="green" fontSize="lg" fontWeight="bold" px={2}>
        #{rank}
      </Badge>
    );
  };

  const formatNumber = (num: number) => {
    if (num == null || isNaN(num)) return "-";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toFixed(2);
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays < 1) return "Today";
    if (diffInDays === 1) return "1d";
    if (diffInDays < 30) return `${diffInDays}d`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo`;
    return `${Math.floor(diffInDays / 365)}y`;
  };

  // Add more stat columns here
  const statColumns = [
    {
      label: "🏆 Points",
      color: "yellow.300",
      value: (skater: SkaterData) => skater.points,
    },
    {
      label: "⚡ Power",
      color: "green.200",
      value: (skater: SkaterData) =>
        formatNumber(skater.hp_balance + skater.max_voting_power_usd),
    },
    {
      label: "💬 Posts",
      color: "blue.200",
      value: (skater: SkaterData) => skater.post_count,
    },
    {
      label: "🎨 NFTs",
      color: "purple.200",
      value: (skater: SkaterData) => skater.skatehive_nft_balance,
    },
    {
      label: "🪙 Gnars",
      color: "orange.200",
      value: (skater: SkaterData) => skater.gnars_votes,
    },
    {
      label: "❤️ HBD",
      color: "red.200",
      value: (skater: SkaterData) =>
        formatNumber(skater.hbd_balance + skater.hbd_savings_balance),
    },
    {
      label: "💰 Hive",
      color: "cyan.200",
      value: (skater: SkaterData) => formatNumber(skater.hive_balance),
    },
    {
      label: "🦄 ETH",
      color: "pink.200",
      value: (skater: SkaterData) =>
        skater.eth_address
          ? skater.eth_address.slice(0, 6) +
            "..." +
            skater.eth_address.slice(-4)
          : "-",
    },
    {
      label: "🟢 Gnars Bal",
      color: "teal.200",
      value: (skater: SkaterData) => skater.gnars_balance,
    },
    {
      label: "🎁 Donations ($)",
      color: "red.300",
      value: (skater: SkaterData) => formatNumber(skater.giveth_donations_usd),
    },
    {
      label: "🗳️ Witness",
      color: "green.400",
      value: (skater: SkaterData) =>
        skater.has_voted_in_witness ? "✅" : "❌",
    },
    {
      label: "⏰ Last Updated",
      color: "gray.300",
      value: (skater: SkaterData) => getTimeSince(skater.last_updated),
    },
  ];

  return (
    <Box minH="100vh" bg={"background"} color="green.300" fontFamily="mono">
      {/* Header */}
      <Box
        px={{ base: 2, md: 8 }}
        py={8}
        bg={"background"}
        maxW="100wh"
        mx="0"
        borderRadius="xl"
      >
        <Flex align="center" gap={6} mb={6}>
          <IconButton
            aria-label="Back"
            icon={<ArrowBackIcon />}
            variant="ghost"
            colorScheme="green"
            fontSize="2xl"
            _hover={{ color: "green.200", bg: "green.900" }}
          />
          <Text
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color="green.200"
            letterSpacing="wider"
          >
            Skatehive Leaderboard
          </Text>
        </Flex>
        <Flex justify="center" mb={8}>
          <Text color="green.200" fontSize="xl" textAlign="center">
            We are {skatersData.length} skaters supporting ourselves. 🛹
          </Text>
        </Flex>
        {/* Sort Options */}
        <Flex
          justify="center"
          gap={4}
          flexWrap="wrap"
          py={2}
          borderRadius="md"
          //   bg={useColorModeValue("gray.900", "gray.800")}
          // Remove border and boxShadow for a cleaner look
        >
          <Button
            onClick={() => setSortBy("points")}
            colorScheme={sortBy === "points" ? "yellow" : "gray"}
            variant={sortBy === "points" ? "solid" : "ghost"}
            fontWeight={sortBy === "points" ? "bold" : "normal"}
            size="sm"
          >
            Points
          </Button>
          <Button
            onClick={() => setSortBy("power")}
            colorScheme={sortBy === "power" ? "green" : "gray"}
            variant={sortBy === "power" ? "solid" : "ghost"}
            fontWeight={sortBy === "power" ? "bold" : "normal"}
            size="sm"
          >
            Power
          </Button>
          <Button
            onClick={() => setSortBy("posts")}
            colorScheme={sortBy === "posts" ? "blue" : "gray"}
            variant={sortBy === "posts" ? "solid" : "ghost"}
            fontWeight={sortBy === "posts" ? "bold" : "normal"}
            size="sm"
          >
            Posts
          </Button>
          <Button
            onClick={() => setSortBy("nfts")}
            colorScheme={sortBy === "nfts" ? "purple" : "gray"}
            variant={sortBy === "nfts" ? "solid" : "ghost"}
            fontWeight={sortBy === "nfts" ? "bold" : "normal"}
            size="sm"
          >
            NFTs
          </Button>
          <Button
            onClick={() => setSortBy("gnars")}
            colorScheme={sortBy === "gnars" ? "orange" : "gray"}
            variant={sortBy === "gnars" ? "solid" : "ghost"}
            fontWeight={sortBy === "gnars" ? "bold" : "normal"}
            size="sm"
          >
            Gnars
          </Button>
          <Button
            onClick={() => setSortBy("donations")}
            colorScheme={sortBy === "donations" ? "red" : "gray"}
            variant={sortBy === "donations" ? "solid" : "ghost"}
            fontWeight={sortBy === "donations" ? "bold" : "normal"}
            size="sm"
          >
            Donations
          </Button>
          {/* Additional filters for all stat columns */}
          <Button
            onClick={() => setSortBy("hive")}
            colorScheme={sortBy === "hive" ? "cyan" : "gray"}
            variant={sortBy === "hive" ? "solid" : "ghost"}
            fontWeight={sortBy === "hive" ? "bold" : "normal"}
            size="sm"
          >
            Hive
          </Button>
          <Button
            onClick={() => setSortBy("eth")}
            colorScheme={sortBy === "eth" ? "pink" : "gray"}
            variant={sortBy === "eth" ? "solid" : "ghost"}
            fontWeight={sortBy === "eth" ? "bold" : "normal"}
            size="sm"
          >
            ETH
          </Button>
          <Button
            onClick={() => setSortBy("gnars_balance")}
            colorScheme={sortBy === "gnars_balance" ? "teal" : "gray"}
            variant={sortBy === "gnars_balance" ? "solid" : "ghost"}
            fontWeight={sortBy === "gnars_balance" ? "bold" : "normal"}
            size="sm"
          >
            Gnars Bal
          </Button>
          <Button
            onClick={() => setSortBy("giveth_donations_usd")}
            colorScheme={sortBy === "giveth_donations_usd" ? "red" : "gray"}
            variant={sortBy === "giveth_donations_usd" ? "solid" : "ghost"}
            fontWeight={sortBy === "giveth_donations_usd" ? "bold" : "normal"}
            size="sm"
          >
            Donations ($)
          </Button>
          <Button
            onClick={() => setSortBy("witness")}
            colorScheme={sortBy === "witness" ? "green" : "gray"}
            variant={sortBy === "witness" ? "solid" : "ghost"}
            fontWeight={sortBy === "witness" ? "bold" : "normal"}
            size="sm"
          >
            Witness
          </Button>
          <Button
            onClick={() => setSortBy("last_updated")}
            colorScheme={sortBy === "last_updated" ? "gray" : "gray"}
            variant={sortBy === "last_updated" ? "solid" : "ghost"}
            fontWeight={sortBy === "last_updated" ? "bold" : "normal"}
            size="sm"
          >
            Last Updated
          </Button>
        </Flex>
      </Box>
      {/* Leaderboard */}
      <Box
        overflowX="auto"
        borderRadius="xl"
        borderWidth={1}
        borderColor="green.800"
        bg={"background"}
        py={2}
        // Remove maxW and mx to allow full width stretch
      >
        <Box minW="1100px">
          {/* Table Header */}
          <Flex>
            <Box
              minW="260px"
              maxW="260px"
              position="sticky"
              left={0}
              zIndex={2}
              bg={"background"}
              borderRight="1px solid"
              borderColor="green.900"
              py={2}
              px={4}
              display="flex"
              alignItems="center"
              fontWeight="bold"
              fontSize="md"
              color="green.200"
            >
              Skater
            </Box>
            {statColumns.map((col) => (
              <Box
                key={col.label}
                minW="120px"
                px={2}
                py={2}
                fontWeight="bold"
                fontSize="sm"
                color={col.color}
                textAlign="center"
                borderRight="1px solid"
                borderColor="green.900"
                bg={"background"}
              >
                {col.label}
              </Box>
            ))}
          </Flex>
          {/* Table Body */}
          {sortedSkaters.map((skater, index) => {
            const rank = index + 1;
            return (
              <Flex
                key={skater.id}
                align="center"
                borderTop="1px solid"
                borderColor="green.900"
                transition="background 0.2s"
              >
                {/* Sticky Skater Info */}
                <Box
                  minW="260px"
                  maxW="260px"
                  position="sticky"
                  left={0}
                  zIndex={1}
                  bg={"background"}
                  borderRight="1px solid"
                  borderColor="green.900"
                  py={3}
                  px={4}
                  display="flex"
                  alignItems="center"
                  gap={4}
                >
                  <Box w="36px" textAlign="center">
                    {getRankIcon(rank)}
                  </Box>
                  <Avatar
                    src={`https://images.hive.blog/u/${skater.hive_author}/avatar/small`}
                    name={skater.hive_author}
                    size="md"
                    border="2px solid"
                    borderColor="green.400"
                    mr={2}
                  />
                  <Box minW={0}>
                    <Text
                      color="green.200"
                      fontWeight="bold"
                      fontSize="md"
                      isTruncated
                      maxW="100px"
                    >
                      {skater.hive_author}
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      Last post: {getTimeSince(skater.last_post)}
                    </Text>
                  </Box>
                </Box>
                {/* Stats */}
                {statColumns.map((col) => (
                  <Box
                    key={col.label}
                    minW="120px"
                    px={2}
                    py={3}
                    color={col.color}
                    textAlign="center"
                    fontWeight="semibold"
                    fontSize="md"
                    borderRight="1px solid"
                    borderColor="green.900"
                    bg={"background"}
                  >
                    {col.value(skater)}
                  </Box>
                ))}
              </Flex>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
