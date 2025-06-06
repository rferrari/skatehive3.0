"use client";

import { useState, useMemo } from "react";
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

type SortOption = "points" | "power" | "posts" | "nfts" | "gnars" | "donations";

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

  const bg = useColorModeValue("gray.900", "black");
  const cardBg = useColorModeValue("gray.800", "gray.700");
  const borderColor = useColorModeValue("green.400", "green.500");

  return (
    <Box minH="100vh" bg={bg} color="green.300" fontFamily="mono">
      {/* Header */}
      <Box
        px={{ base: 4, md: 8 }}
        py={8}
        borderBottom="1px"
        borderColor="green.500"
        bgGradient="linear(to-r, green.900 60%, black)"
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
            color="green.300"
            letterSpacing="wider"
          >
            Skatehive Leaderboard
          </Text>
        </Flex>
        <Flex justify="center" mb={8}>
          <Text color="green.300" fontSize="xl" textAlign="center">
            We are {skatersData.length} skaters supporting ourselves. 🛹
          </Text>
        </Flex>
        {/* Sort Options */}
        <Flex justify="center" gap={4} flexWrap="wrap">
          <Button
            onClick={() => setSortBy("points")}
            leftIcon={<span>🏆</span>}
            colorScheme={sortBy === "points" ? "yellow" : "gray"}
            variant={sortBy === "points" ? "solid" : "ghost"}
            fontWeight={sortBy === "points" ? "bold" : "normal"}
            size="sm"
          >
            Points
          </Button>
          <Button
            onClick={() => setSortBy("power")}
            leftIcon={<span>⚡</span>}
            colorScheme={sortBy === "power" ? "green" : "gray"}
            variant={sortBy === "power" ? "solid" : "ghost"}
            fontWeight={sortBy === "power" ? "bold" : "normal"}
            size="sm"
          >
            Power
          </Button>
          <Button
            onClick={() => setSortBy("posts")}
            leftIcon={<span>💬</span>}
            colorScheme={sortBy === "posts" ? "blue" : "gray"}
            variant={sortBy === "posts" ? "solid" : "ghost"}
            fontWeight={sortBy === "posts" ? "bold" : "normal"}
            size="sm"
          >
            Posts
          </Button>
          <Button
            onClick={() => setSortBy("nfts")}
            leftIcon={<span>🎨</span>}
            colorScheme={sortBy === "nfts" ? "purple" : "gray"}
            variant={sortBy === "nfts" ? "solid" : "ghost"}
            fontWeight={sortBy === "nfts" ? "bold" : "normal"}
            size="sm"
          >
            NFTs
          </Button>
          <Button
            onClick={() => setSortBy("gnars")}
            leftIcon={<span>🪙</span>}
            colorScheme={sortBy === "gnars" ? "orange" : "gray"}
            variant={sortBy === "gnars" ? "solid" : "ghost"}
            fontWeight={sortBy === "gnars" ? "bold" : "normal"}
            size="sm"
          >
            Gnars
          </Button>
          <Button
            onClick={() => setSortBy("donations")}
            leftIcon={<span>❤️</span>}
            colorScheme={sortBy === "donations" ? "red" : "gray"}
            variant={sortBy === "donations" ? "solid" : "ghost"}
            fontWeight={sortBy === "donations" ? "bold" : "normal"}
            size="sm"
          >
            Donations
          </Button>
        </Flex>
      </Box>

      {/* Leaderboard */}
      <Box px={{ base: 2, md: 8 }} py={8}>
        <VStack spacing={6} maxW="7xl" mx="auto" align="stretch">
          {sortedSkaters.map((skater, index) => {
            const rank = index + 1;
            return (
              <Flex
                key={skater.id}
                align="center"
                justify="space-between"
                p={6}
                borderWidth={2}
                borderColor={borderColor}
                borderRadius="xl"
                bg={cardBg}
                boxShadow={rank <= 3 ? "0 0 24px 4px #38A16955" : "md"}
                _hover={{
                  borderColor: "green.300",
                  bg: useColorModeValue("gray.700", "gray.800"),
                  boxShadow: "0 0 32px 8px #38A16988",
                  transform: "scale(1.01)",
                }}
                transition="all 0.2s"
                gap={4}
                flexWrap="wrap"
              >
                {/* Rank */}
                <Box w="60px" textAlign="center">
                  {getRankIcon(rank)}
                </Box>
                {/* Avatar & Name */}
                <HStack spacing={4} minW="220px">
                  <Avatar
                    src={`https://images.hive.blog/u/${skater.hive_author}/avatar/small`}
                    name={skater.hive_author}
                    size="lg"
                    border="2px solid"
                    borderColor="green.400"
                    bgGradient="linear(to-br, green.400, green.600)"
                  />
                  <Box minW={0}>
                    <Text
                      color="green.200"
                      fontWeight="bold"
                      fontSize="lg"
                      isTruncated
                    >
                      {skater.hive_author}
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Last post: {getTimeSince(skater.last_post)}
                    </Text>
                  </Box>
                </HStack>
                {/* Stats */}
                <SimpleGrid
                  columns={{ base: 2, md: 6 }}
                  spacing={4}
                  flex="1"
                  minW="320px"
                >
                  <VStack spacing={0}>
                    <Text
                      color="yellow.400"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      🏆 POINTS
                    </Text>
                    <Text color="yellow.300" fontWeight="bold" fontSize="lg">
                      {skater.points}
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="green.300" fontSize="xs" fontWeight="semibold">
                      ⚡ POWER
                    </Text>
                    <Text color="green.200" fontWeight="bold" fontSize="lg">
                      {formatNumber(
                        skater.hp_balance + skater.max_voting_power_usd
                      )}
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="blue.300" fontSize="xs" fontWeight="semibold">
                      💬 POSTS
                    </Text>
                    <Text color="blue.200" fontWeight="bold" fontSize="lg">
                      {skater.post_count}
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text
                      color="purple.300"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      🎨 NFTs
                    </Text>
                    <Text color="purple.200" fontWeight="bold" fontSize="lg">
                      {skater.skatehive_nft_balance}
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text
                      color="orange.300"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      🪙 GNARS
                    </Text>
                    <Text color="orange.200" fontWeight="bold" fontSize="lg">
                      {skater.gnars_votes}
                    </Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text color="red.300" fontSize="xs" fontWeight="semibold">
                      ❤️ HBD
                    </Text>
                    <Text color="red.200" fontWeight="bold" fontSize="lg">
                      {formatNumber(
                        skater.hbd_balance + skater.hbd_savings_balance
                      )}
                    </Text>
                  </VStack>
                </SimpleGrid>
              </Flex>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}
