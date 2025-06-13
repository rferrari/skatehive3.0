"use client";

import { useState, useMemo, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  useToast,
  Image,
  Link,
} from "@chakra-ui/react";
import RulesModal from "./RulesModal";
import React from "react";
import { Name, IdentityResolver } from "@paperclip-labs/whisk-sdk/identity";
import { Address } from "viem";

const resolverOrder = [
  IdentityResolver.Farcaster,
  IdentityResolver.Nns,
  IdentityResolver.Ens,
  IdentityResolver.Base,
  IdentityResolver.Lens,
  IdentityResolver.Uni,
  IdentityResolver.World,
];

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
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const toast = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address copied!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const formatEthAddress = (address: string) => {
    if (!address || address === "0x0000000000000000000000000000000000000000") return "-";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      <Badge colorScheme="primary" fontSize="lg" fontWeight="bold" px={2}>
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

  // Add more stat columns here
  const statColumns = [
    {
      key: "points",
      label: "🏆 Points",
      color: "accent",
      value: (skater: SkaterData) => Math.round(skater.points),
    },
    {
      key: "power",
      label: (
        <Image
          src="/images/hp_logo.png"
          alt="HP"
          style={{ display: "inline", height: "18px", verticalAlign: "middle" }}
        />
      ),
      color: "primary",
      value: (skater: SkaterData) =>
        formatNumber(skater.hp_balance + skater.max_voting_power_usd),
    },
    {
      key: "posts",
      label: "Posts",
      color: "primary",
      value: (skater: SkaterData) => skater.post_count,
    },
    {
      key: "nfts",
      label: "SKTHV NFTs",
      color: "primary",
      value: (skater: SkaterData) => skater.skatehive_nft_balance,
    },
    {
      key: "gnars_balance",
      label: "Gnars NFTs",
      color: "primary",
      value: (skater: SkaterData) => skater.gnars_balance,
    },
    {
      key: "gnars",
      label: "Gnars Votes",
      color: "primary",
      value: (skater: SkaterData) => skater.gnars_votes,
    },
    {
      key: "hbd",
      label: (
        <Image
          src="/images/hbd_savings.png"
          alt="HBD"
          style={{ display: "inline", height: "18px", verticalAlign: "middle" }}
        />
      ),
      color: "primary",
      value: (skater: SkaterData) =>
        formatNumber(skater.hbd_balance + skater.hbd_savings_balance),
    },
    {
      key: "hive",
      label: "Hive",
      color: "primary",
      value: (skater: SkaterData) => formatNumber(skater.hive_balance),
    },
    {
      key: "donations",
      label: "Giveth Donation",
      color: "primary",
      value: (skater: SkaterData) => formatNumber(skater.giveth_donations_usd),
    },
    {
      key: "witness",
      label: "Witness Vote",
      color: "primary",
      value: (skater: SkaterData) =>
        skater.has_voted_in_witness ? "✅" : "❌",
    },
    // {
    //   key: "last_updated",
    //   label: "Last Update",
    //   color: "primary",
    //   value: (skater: SkaterData) => getTimeSince(skater.last_updated),
    // },
  ];
  console.log("Sorted Skaters:", sortedSkaters);
  return (
    <>
      {isRulesOpen && (
        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />
      )}
      {/* Main Container */}
      <Box
        maxH="100vh"
        overflowY="auto"
        bg={"background"}
        color="primary"
        fontFamily="mono"
        transition="filter 0.3s, opacity 0.3s"
        style={
          isRulesOpen
            ? { filter: "blur(8px)", opacity: 0.3, pointerEvents: "none" }
            : {}
        }
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {/* Header */}
        <Box
          px={{ base: 1, md: 2 }}
          pt={2}
          pb={2}
          bg={"background"}
          maxW="100wh"
          mx="0"
          borderRadius="xl"
        >
          <Flex direction="column" align="center" justify="center" mb={2}>
            <Text
              fontSize={{ base: "4xl", md: "7xl" }}
              fontWeight="extrabold"
              color="primary"
              letterSpacing="wider"
              textAlign="center"
              mb={1}
              style={{ textTransform: "uppercase" }}
            >
              Skatehive Leaderboard
            </Text>
            <Text
              color="primary"
              fontSize={{ base: "xs", md: "sm" }}
              fontStyle="italic"
              textAlign="center"
              mb={0}
            >
              We are {skatersData.length} skaters supporting each other. 🛹
            </Text>
          </Flex>
          {/* Sort Options */}
          <Flex justify="space-between" align="center" mb={4}>
            <Flex align="center" gap={2}>
              <Text color="primary" fontSize="sm" fontWeight="bold" mb={0}>
                Sort by:
              </Text>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: "var(--chakra-colors-background)",
                  color: "var(--chakra-colors-primary)",
                  border: "1px solid var(--chakra-colors-border)",
                  fontFamily: "inherit",
                  fontWeight: "bold",
                  appearance: "none",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: "1em",
                  minWidth: 0,
                }}
              >
                <option value="points">🏆 Points</option>
                <option value="power">⚡ Power</option>
                <option value="posts">💬 Posts</option>
                <option value="nfts">🎨 NFTs</option>
                <option value="gnars_balance">🟢 Gnars NFTs</option>
                <option value="gnars">🪙 Gnars Votes</option>
                <option value="donations">🎁 Donations</option>
                <option value="hive">💰 Hive</option>
                <option value="eth">🦄 ETH</option>
                <option value="giveth_donations_usd">🎁 Donations ($)</option>
                <option value="witness">🗳️ Witness</option>
                <option value="last_updated">⏰ Last Updated</option>
              </select>
            </Flex>
            <button
              onClick={() => setIsRulesOpen(true)}
              style={{
                padding: "4px 16px",
                borderRadius: "8px",
                background: "var(--chakra-colors-background)",
                color: "var(--chakra-colors-primary)",
                border: "1px solid var(--chakra-colors-border)",
                fontFamily: "inherit",
                fontWeight: "bold",
                fontSize: "0.95em",
                cursor: "pointer",
                marginLeft: "8px",
                transition: "background 0.2s, color 0.2s",
                minWidth: 0,
                height: "32px",
                lineHeight: 1,
              }}
            >
              Rules
            </button>
          </Flex>
        </Box>
        {/* Leaderboard */}
        <Box overflowX="auto" borderRadius="xl" bg={"background"} py={2}>
          <Box minW="1100px">
            {/* Table Header */}
            <Flex>
              <Box
                minW="240px"
                maxW="240px"
                position="sticky"
                left={0}
                zIndex={2}
                bg={"background"}
                py={1}
                px={2}
                display="flex"
                alignItems="center"
                fontWeight="bold"
                fontSize="sm"
                borderRight="2px solid var(--chakra-colors-border)"
                color="primary"
              >
                Skater
              </Box>
              {statColumns.map((col, i) => (
                <Box
                  key={col.key}
                  minW="65px"
                  maxW="65px"
                  px={1}
                  py={2}
                  fontWeight="bold"
                  fontSize="xs"
                  color={col.color}
                  textAlign="center"
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
                <React.Fragment key={skater.id}>
                  {index === 0 && (
                    <Box
                      as="hr"
                      borderTop="2px solid var(--chakra-colors-border)"
                      my={1}
                    />
                  )}
                  <Flex align="center" transition="background 0.2s">
                    {/* Sticky Skater Info */}
                    <Box
                      minW="240px"
                      maxW="240px"
                      position="sticky"
                      left={0}
                      zIndex={1}
                      bg={"background"}
                      py={2}
                      px={2}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      borderRight="2px solid var(--chakra-colors-border)"
                    >
                      <Box w="28px" textAlign="center">
                        {getRankIcon(rank)}
                      </Box>
                      <Avatar
                        src={`https://images.hive.blog/u/${skater.hive_author}/avatar/small`}
                        name={skater.hive_author}
                        size="sm"
                        mr={1}
                      />
                      <Box minW={0}>
                        <Text
                          as={Link}
                          href={`https://peakd.com/@${skater.hive_author}`}
                          color="primary"
                          fontWeight="bold"
                          fontSize="sm"
                          isTruncated
                          maxW="100px"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {skater.hive_author}
                        </Text>
                        {/* Ethereum identity below username */}
                        {skater.eth_address && skater.eth_address !== "0x0000000000000000000000000000000000000000" && (
                          <span
                            style={{ fontSize: "10px", color: "#aaa", cursor: "pointer", userSelect: "all", marginTop: 0, textAlign: "left", display: "flex", alignItems: "center", gap: "2px" }}
                            onClick={() => copyToClipboard(skater.eth_address)}
                            title="Click to copy address"
                          >
                            <Image src="/images/ethvector.svg" alt="ETH" height="12px" width="12px" style={{ marginRight: "2px", display: "inline" }} />
                            <Name address={skater.eth_address as Address} resolverOrder={resolverOrder}>{formatEthAddress(skater.eth_address)}</Name>
                          </span>
                        )}
                        <Text color="text" fontSize="xs" lineHeight={1}>
                          Last: {getTimeSince(skater.last_post)}
                        </Text>
                      </Box>
                    </Box>
                    {/* Stats */}
                    {statColumns.map((col, i) => (
                      <Box
                        key={col.key}
                        minW="65px"
                        maxW="65px"
                        px={1}
                        py={3}
                        color={col.color}
                        textAlign="center"
                        fontWeight="semibold"
                        fontSize="sm"
                        bg={"background"}
                      >
                        {col.value(skater)}
                      </Box>
                    ))}
                  </Flex>
                </React.Fragment>
              );
            })}
          </Box>
        </Box>
      </Box>
    </>
  );
}
