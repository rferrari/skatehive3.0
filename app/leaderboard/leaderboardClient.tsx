"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  useToast,
  Image,
  Link,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Button,
  VStack,
  HStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import RulesModal from "./RulesModal";
import React from "react";
import useIsMobile from "@/hooks/useIsMobile";

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
  const [sortBy, setSortBy] = useState<SortOption>("posts");
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const toast = useToast();
  const isMobile = useIsMobile();

  // Responsive values
  const headerFontSize = useBreakpointValue({
    base: "2xl",
    md: "4xl",
    lg: "6xl",
  });
  const tableHeight = useBreakpointValue({
    base: "calc(100vh - 200px)",
    md: "calc(100vh - 180px)",
  });
  const containerPadding = useBreakpointValue({ base: 2, md: 4 });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

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
          // Sort by post count first, then by ETH address presence
          // This shows active users who haven't connected ETH
          const aHasEth = a.eth_address && a.eth_address !== "0x0000000000000000000000000000000000000000";
          const bHasEth = b.eth_address && b.eth_address !== "0x0000000000000000000000000000000000000000";
          
          if (aHasEth === bHasEth) {
            return b.post_count - a.post_count; // Same ETH status, sort by activity
          }
          return aHasEth ? 1 : -1; // Users without ETH rank higher
        case "gnars_balance":
          return b.gnars_balance - a.gnars_balance;
        case "giveth_donations_usd":
          return b.giveth_donations_usd - a.giveth_donations_usd;
        case "witness":
          // Sort by post count first, then by witness vote presence
          // This shows active users who haven't voted for witness
          if (a.has_voted_in_witness === b.has_voted_in_witness) {
            return b.post_count - a.post_count; // Same witness status, sort by activity
          }
          return a.has_voted_in_witness ? 1 : -1; // Users without witness vote rank higher
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

  const getRankIcon = (rank: number, sortBy: SortOption, skater: SkaterData) => {
    // For binary filters, show checkmark/X instead of rankings
    if (sortBy === "witness") {
      return skater.has_voted_in_witness ? (
        <Text fontSize="lg" color="green.400">✅</Text>
      ) : (
        <Text fontSize="lg" color="red.400">❌</Text>
      );
    }
    
    if (sortBy === "eth") {
      const hasEthAddress = skater.eth_address && 
        skater.eth_address !== "0x0000000000000000000000000000000000000000";
      return hasEthAddress ? (
        <Text fontSize="lg" color="green.400">✅</Text>
      ) : (
        <Text fontSize="lg" color="red.400">❌</Text>
      );
    }
    
    // For all other categories, show normal trophy rankings
    if (rank === 1) return <Text fontSize="xl">🏆</Text>;
    if (rank === 2) return <Text fontSize="xl">🥈</Text>;
    if (rank === 3) return <Text fontSize="xl">🥉</Text>;
    return (
      <Badge colorScheme="primary" fontSize="sm" fontWeight="bold" px={2}>
        {rank}
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

  // Simplified columns for mobile
  const mobileColumns = [
    {
      key: "points",
      label: "Points",
      value: (skater: SkaterData) => Math.round(skater.points),
    },
    {
      key: "power",
      label: "Power",
      value: (skater: SkaterData) =>
        formatNumber(skater.hp_balance + skater.max_voting_power_usd),
    },
    {
      key: "posts",
      label: "Posts",
      value: (skater: SkaterData) => skater.post_count,
    },
  ];

  // Full columns for desktop
  const desktopColumns = [
    {
      key: "points",
      label: "🏆 Points",
      value: (skater: SkaterData) => Math.round(skater.points),
    },
    {
      key: "power",
      label: (
        <Image src="/images/hp_logo.png" alt="HP" h="18px" display="inline" />
      ),
      value: (skater: SkaterData) =>
        formatNumber(skater.hp_balance + skater.max_voting_power_usd),
    },
    {
      key: "voting_mana",
      label: "Voting Mana",
      value: (skater: SkaterData) =>
        skater.max_voting_power_usd != null
          ? `$${skater.max_voting_power_usd.toFixed(2)}`
          : "-",
    },
    {
      key: "posts",
      label: "Posts",
      value: (skater: SkaterData) => skater.post_count,
    },
    {
      key: "nfts",
      label: "SKTHV NFTs",
      value: (skater: SkaterData) => skater.skatehive_nft_balance,
    },
    {
      key: "gnars_balance",
      label: "Gnars NFTs",
      value: (skater: SkaterData) => skater.gnars_balance,
    },
    {
      key: "gnars",
      label: "Gnars Votes",
      value: (skater: SkaterData) => skater.gnars_votes,
    },
    {
      key: "hbd",
      label: (
        <Image
          src="/images/hbd_savings.png"
          alt="HBD"
          h="18px"
          display="inline"
        />
      ),
      value: (skater: SkaterData) =>
        formatNumber(skater.hbd_balance + skater.hbd_savings_balance),
    },
    {
      key: "hive",
      label: "Hive",
      value: (skater: SkaterData) => formatNumber(skater.hive_balance),
    },
    {
      key: "donations",
      label: "Giveth",
      value: (skater: SkaterData) => formatNumber(skater.giveth_donations_usd),
    },
    {
      key: "witness",
      label: "Witness",
      value: (skater: SkaterData) =>
        skater.has_voted_in_witness ? "✅" : "❌",
    },
  ];

  const columns = isMobile ? mobileColumns : desktopColumns;
  return (
    <VStack
      spacing={0}
      h="100vh"
      bg="background"
      color="text"
      overflow="hidden"
    >
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Header */}
      <Box
        w="full"
        px={containerPadding}
        py={4}
        bg="background"
        borderBottom="1px solid"
        borderColor="border"
      >
        <VStack spacing={3}>
          <Text
            fontSize={headerFontSize}
            fontWeight="extrabold"
            color="primary"
            textAlign="center"
            fontFamily="heading"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Skatehive Leaderboard
          </Text>

          <Text
            color="text"
            fontSize={{ base: "xs", md: "sm" }}
            textAlign="center"
          >
            We are {skatersData.length} skaters supporting each other. 🛹
          </Text>

          {/* Controls */}
          <HStack spacing={4} w="full" justify="center" flexWrap="wrap">
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="bold" color="text">
                Sort by:
              </Text>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                size="sm"
                w="auto"
                minW="120px"
                bg="background"
                borderColor="border"
                color="text"
                _hover={{ borderColor: "primary" }}
                _focus={{ borderColor: "primary", boxShadow: "outline" }}
              >
                <option value="points">🏆 Points</option>
                <option value="power">⚡ Power</option>
                <option value="posts">💻 Posts</option>
                <option value="nfts">🎨 Skatehive NFTs</option>
                <option value="gnars_balance">🖼️ Gnars NFTs</option>
                <option value="gnars">🪙 Gnars Voters</option>
                <option value="donations">🎁 Donations</option>
                <option value="hive">💰 Hive</option>
                <option value="eth">🦄 Missing ETH</option>
                <option value="giveth_donations_usd">🎁 Donations ($)</option>
                <option value="witness">🗳️ Missing Witness</option>
                <option value="last_updated">⏰ Last Updated</option>
              </Select>
            </HStack>

            <Button
              onClick={() => setIsRulesOpen(true)}
              size="sm"
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ borderColor: "primary", color: "primary" }}
            >
              Rules
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Table Container */}
      <Box flex="1" w="full" overflow="hidden">
        <TableContainer
          h="full"
          overflowY="auto"
          overflowX="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              bg: "muted",
            },
            "&::-webkit-scrollbar-thumb": {
              bg: "border",
              borderRadius: "full",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              bg: "primary",
            },
          }}
        >
          <Table variant="simple" size={isMobile ? "sm" : "md"}>
            <Thead position="sticky" top={0} bg="background" zIndex={2}>
              <Tr>
                <Th
                  color="primary"
                  fontWeight="bold"
                  borderColor="border"
                  position="sticky"
                  left={0}
                  bg="background"
                  zIndex={3}
                  minW={isMobile ? "120px" : "200px"}
                >
                  Skater
                </Th>
                {columns.map((col) => (
                  <Th
                    key={col.key}
                    color="primary"
                    fontWeight="bold"
                    borderColor="border"
                    textAlign="center"
                    minW={isMobile ? "60px" : "80px"}
                  >
                    {col.label}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {sortedSkaters.map((skater, index) => {
                const rank = index + 1;
                return (
                  <Tr
                    key={skater.id}
                    _hover={{ bg: "muted" }}
                    transition="background 0.2s"
                  >
                    <Td
                      borderColor="border"
                      position="sticky"
                      left={0}
                      bg="background"
                      zIndex={1}
                      minW={isMobile ? "120px" : "200px"}
                      _groupHover={{ bg: "muted" }}
                    >
                      <HStack spacing={2}>
                        <Box minW="30px">{getRankIcon(rank, sortBy, skater)}</Box>
                        <Avatar
                          src={`https://images.hive.blog/u/${skater.hive_author}/avatar/small`}
                          name={skater.hive_author}
                          size={isMobile ? "xs" : "sm"}
                        />
                        <VStack spacing={0} align="start" minW={0}>
                          <Text
                            as={Link}
                            href={`https://peakd.com/@${skater.hive_author}`}
                            color="primary"
                            fontWeight="bold"
                            fontSize={isMobile ? "xs" : "sm"}
                            isTruncated
                            maxW="100px"
                            target="_blank"
                            rel="noopener noreferrer"
                            _hover={{ color: "accent" }}
                          >
                            {skater.hive_author}
                          </Text>
                          {!isMobile &&
                            skater.eth_address &&
                            skater.eth_address !==
                              "0x0000000000000000000000000000000000000000" && (
                              <HStack spacing={1}>
                                <Image
                                  src="/images/ethvector.svg"
                                  alt="ETH"
                                  h="10px"
                                  w="10px"
                                />
                              </HStack>
                            )}
                          {!isMobile && (
                            <Text color="muted" fontSize="2xs">
                              Last: {getTimeSince(skater.last_post)}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    </Td>
                    {columns.map((col) => (
                      <Td
                        key={col.key}
                        borderColor="border"
                        textAlign="center"
                        fontSize={isMobile ? "xs" : "sm"}
                        color="text"
                        fontWeight="medium"
                      >
                        {col.value(skater)}
                      </Td>
                    ))}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </VStack>
  );
}
