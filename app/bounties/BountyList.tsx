import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  Tabs,
  TabList,
  Tab,
  HStack,
  Tag,
  Wrap,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import { Discussion } from "@hiveio/dhive";
import BountySnap from "./BountySnap";
import { parse, isAfter } from "date-fns";
import HiveClient from "@/lib/hive/hiveclient";

interface BountyListProps {
  newBounty?: Discussion | null;
  refreshTrigger?: number;
}

export default function BountyList({
  newBounty,
  refreshTrigger,
}: BountyListProps) {
  const { comments, isLoading, error, updateComments } = useComments(
    "skatehive",
    "skatehive-bounties",
    false
  );
  const [displayedBounties, setDisplayedBounties] = useState<Discussion[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [bountyGrinders, setBountyGrinders] = useState<string[]>([]);
  const [isLoadingGrinders, setIsLoadingGrinders] = useState(false);
  const [hivePrice, setHivePrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  useEffect(() => {
    let bounties = [...comments];
    if (newBounty) {
      const exists = bounties.some((c) => c.permlink === newBounty.permlink);
      if (!exists) {
        bounties = [newBounty, ...bounties];
      }
    }
    bounties.sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
    setDisplayedBounties(bounties);
  }, [comments, newBounty]);

  // Refresh comments when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      updateComments();
    }
  }, [refreshTrigger, updateComments]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  // Helper to get deadline from bounty body
  function getDeadlineFromBody(body: string): Date | null {
    const deadlineMatch = body.match(/Deadline:\s*(\d{2}-\d{2}-\d{4})/);
    if (deadlineMatch && deadlineMatch[1]) {
      return parse(deadlineMatch[1], "MM-dd-yyyy", new Date());
    }
    return null;
  }

  // Filter bounties based on status
  const filteredBounties = displayedBounties.filter((bounty) => {
    if (filter === "all") return true;
    const deadline = getDeadlineFromBody(bounty.body);
    if (!deadline) return false;
    const now = new Date();
    if (filter === "active") return isAfter(deadline, now);
    if (filter === "completed") return !isAfter(deadline, now);
    return true;
  });

  // Map filter state to tab index
  const filterToIndex = (f: typeof filter) => {
    if (f === "all") return 0;
    if (f === "active") return 1;
    if (f === "completed") return 2;
    return 0;
  };
  const indexToFilter = (idx: number) =>
    ["all", "active", "completed"][idx] as typeof filter;

  useEffect(() => {
    async function fetchPrices() {
      setIsPriceLoading(true);
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd"
        );
        const data = await res.json();
        setHivePrice(data.hive ? data.hive.usd : null);
      } catch (e) {
        setHivePrice(null);
      } finally {
        setIsPriceLoading(false);
      }
    }
    fetchPrices();
  }, []);

  // --- Stats Computation ---
  // Get all active bounties
  const now = new Date();
  const activeBounties = useMemo(() =>
    displayedBounties.filter((b) => {
      const deadline = getDeadlineFromBody(b.body);
      return deadline && isAfter(deadline, now);
    }),
    [displayedBounties, now]
  );
  // Rewards up for grabs
  const rewardsUpForGrabs = activeBounties.map(b => {
    const match = b.body.match(/Reward:\s*(.*)/);
    return match && match[1] ? match[1].trim() : null;
  }).filter(Boolean);

  // Calculate total USD value of active rewards
  const totalActiveRewardsUSD = useMemo(() => {
    if (isPriceLoading || hivePrice === null) return null;
    let total = 0;
    for (const reward of rewardsUpForGrabs) {
      if (!reward) continue;
      // Match e.g. "10 HBD" or "5 Hive"
      const match = reward.match(/([\d.]+)\s*(HBD|HIVE)/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const currency = match[2].toUpperCase();
        if (currency === "HBD") {
          total += amount * 1;
        } else if (currency === "HIVE") {
          total += amount * hivePrice;
        }
      }
    }
    return total;
  }, [rewardsUpForGrabs, hivePrice, isPriceLoading]);

  // Extract permlinks for dependency
  const activeBountyPermlinks = activeBounties.map(b => b.permlink).join(",");

  // Fetch replies for all active bounties to get bounty grinders
  useEffect(() => {
    let cancelled = false;
    async function fetchGrinders() {
      setIsLoadingGrinders(true);
      const usernames = new Set<string>();
      await Promise.all(
        activeBounties.map(async (bounty) => {
          try {
            const replies = await HiveClient.database.call(
              "get_content_replies",
              [bounty.author, bounty.permlink]
            );
            replies.forEach((reply: any) => {
              if (reply.author) usernames.add(reply.author);
            });
          } catch {}
        })
      );
      if (!cancelled) {
        setBountyGrinders(Array.from(usernames));
        setIsLoadingGrinders(false);
      }
    }
    fetchGrinders();
    return () => { cancelled = true; };
  }, [activeBountyPermlinks]);

  if (isLoading) {
    return (
      <Box textAlign="center" my={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading bounties...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" my={8} color="red.500">
        <Text>Error loading bounties: {error}</Text>
      </Box>
    );
  }

  if (displayedBounties.length === 0) {
    return (
      <Box textAlign="center" my={8}>
        <Text>No bounties have been submitted yet.</Text>
      </Box>
    );
  }

  return (
    <>
      {/* Stats Board */}
      <Box
        mb={6}
        p={0}
        borderRadius="lg"
        bg="muted"
        boxShadow="md"
        maxW="1000px"
        mx="auto"
        overflow="hidden"
      >
        <Flex
          direction="row"
          align="center"
          justify="center"
          height="80px"
          bg="muted"
        >
          {/* Active Bounties */}
          <Box flex="1" textAlign="center">
            <Text fontWeight="bold" fontSize="2xl" color="primary.400">
              {activeBounties.length}
            </Text>
            <Text fontSize="md" color="text">
              active bounties
            </Text>
          </Box>
          <Box height="60%" borderLeft="2px solid" borderColor="gray.700" />
          {/* Rewards Up for Grabs */}
          <Box flex="1" textAlign="center">
            <Text fontWeight="bold" fontSize="2xl" color="primary.400">
              {isPriceLoading || totalActiveRewardsUSD === null
                ? "Calculating..."
                : `~$${totalActiveRewardsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`}
            </Text>
            <Text fontSize="md" color="text">
              active rewards
            </Text>
          </Box>
          <Box height="60%" borderLeft="2px solid" borderColor="gray.700" />
          {/* Active Bounty Hunters */}
          <Box flex="1" textAlign="center">
            <Text fontWeight="bold" fontSize="2xl" color="primary.400">
              {isLoadingGrinders
                ? "..."
                : activeBounties.length === 0
                ? "0"
                : bountyGrinders.length}
            </Text>
            <Text fontSize="md" color="text">
              active hunters
            </Text>
          </Box>
        </Flex>
      </Box>
      <Tabs
        variant="soft-rounded"
        colorScheme="primary"
        mb={4}
        index={filterToIndex(filter)}
        onChange={(idx) => setFilter(indexToFilter(idx))}
      >
        <TabList>
          <Tab
            _selected={{
              color: "primary",
              bg: "primary.900",
              borderColor: "primary",
              borderWidth: "2px",
            }}
          >
            All
          </Tab>
          <Tab
            _selected={{
              color: "primary",
              bg: "primary.900",
              borderColor: "primary",
              borderWidth: "2px",
            }}
          >
            Active
          </Tab>
          <Tab
            _selected={{
              color: "primary",
              bg: "primary.900",
              borderColor: "primary",
              borderWidth: "2px",
            }}
          >
            Completed
          </Tab>
        </TabList>
      </Tabs>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} my={8}>
        {filteredBounties.slice(0, visibleCount).map((bounty) => (
          <BountySnap
            key={bounty.permlink}
            discussion={bounty}
            onOpen={() => {
              const url = `/post/${bounty.author}/${bounty.permlink}`;
              window.location.href = url;
            }}
            setReply={() => {}}
            setConversation={() => {}}
            showAuthor={true}
            disableFooter={true}
          />
        ))}
      </SimpleGrid>
      {visibleCount < filteredBounties.length && (
        <Box display="flex" justifyContent="center" my={4}>
          <Button
            onClick={handleLoadMore}
            colorScheme="primary"
            variant="outline"
          >
            Load More
          </Button>
        </Box>
      )}
    </>
  );
}
