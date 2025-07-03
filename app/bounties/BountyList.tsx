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
  Divider,
  Select,
} from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import { Discussion } from "@hiveio/dhive";
import BountySnap from "./BountySnap";
import { parse, isAfter } from "date-fns";
import HiveClient from "@/lib/hive/hiveclient";
import { useHiveUser } from "@/contexts/UserContext";

// Manually define the type for get_account_votes response
interface AccountVote {
  author: string;
  permlink: string;
  weight: number;
  rshares: number;
  time: string;
}

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
  const [filter, setFilter] = useState<
    "active" | "claimed" | "my-claimed" | "all" | "completed"
  >("active");
  const [bountyGrinders, setBountyGrinders] = useState<string[]>([]);
  const [isLoadingGrinders, setIsLoadingGrinders] = useState(false);
  const [hivePrice, setHivePrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'rewards' | 'hot' | 'ending'>('default');

  // Claimed bounties logic
  const { hiveUser } = useHiveUser();

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
  const filteredBounties = useMemo(() => {
    if (filter === 'my-claimed' && hiveUser?.name) {
      return displayedBounties.filter(bounty =>
        bounty.active_votes?.some(vote => vote.voter === hiveUser.name)
      );
    }
    if (filter === 'claimed') {
      return displayedBounties.filter(bounty =>
        bounty.active_votes && bounty.active_votes.length > 0
      );
    }
    return displayedBounties.filter((bounty) => {
      if (filter === "all") return true;
      const deadline = getDeadlineFromBody(bounty.body);
      if (!deadline) return false;
      const now = new Date();
      if (filter === "active") return isAfter(deadline, now);
      if (filter === "completed") return !isAfter(deadline, now);
      return true;
    });
  }, [filter, displayedBounties, hiveUser?.name]);

  // Sorting logic
  const sortedBounties = useMemo(() => {
    let bounties = [...filteredBounties];
    if (sortBy === 'rewards') {
      bounties.sort((a: Discussion, b: Discussion) => {
        const getReward = (bounty: Discussion) => {
          const match = bounty.body.match(/Reward:\s*([\d.]+)/);
          return match ? parseFloat(match[1]) : 0;
        };
        return getReward(b) - getReward(a);
      });
    } else if (sortBy === 'hot') {
      bounties.sort((a: Discussion, b: Discussion) => {
        const aCount = a.active_votes ? a.active_votes.length : 0;
        const bCount = b.active_votes ? b.active_votes.length : 0;
        return bCount - aCount;
      });
    } else if (sortBy === 'ending') {
      bounties = bounties
        .filter((bounty: Discussion) => {
          const deadlineMatch = bounty.body.match(/Deadline:\s*(\d{2}-\d{2}-\d{4})/);
          if (!deadlineMatch) return false;
          const [mm, dd, yyyy] = deadlineMatch[1].split('-');
          const deadline = new Date(`${yyyy}-${mm}-${dd}`);
          return deadline > new Date();
        })
        .sort((a: Discussion, b: Discussion) => {
          const getDeadline = (bounty: Discussion) => {
            const match = bounty.body.match(/Deadline:\s*(\d{2}-\d{2}-\d{4})/);
            if (!match) return new Date(8640000000000000).getTime(); // far future
            const [mm, dd, yyyy] = match[1].split('-');
            return new Date(`${yyyy}-${mm}-${dd}`).getTime();
          };
          return getDeadline(a) - getDeadline(b);
        });
    } else {
      // Default: newest first
      bounties.sort((a: Discussion, b: Discussion) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }
    return bounties;
  }, [filteredBounties, sortBy]);

  // Map filter state to tab index
  const filterToIndex = (f: typeof filter) => {
    if (f === "active") return 0;
    if (f === "claimed") return 1;
    if (f === "my-claimed") return 2;
    if (f === "all") return 3;
    if (f === "completed") return 4;
    return 0;
  };
  const indexToFilter = (idx: number) =>
    ["active", "claimed", "my-claimed", "all", "completed"][idx] as typeof filter;

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
  const activeBounties = useMemo(() => {
    const now = new Date();
    return displayedBounties.filter((b) => {
      const deadline = getDeadlineFromBody(b.body);
      return deadline && isAfter(deadline, now);
    });
  }, [displayedBounties]);
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
  }, [activeBountyPermlinks, activeBounties]);

  // Mapping for short labels (button display)
  const sortByLabels: Record<string, string> = {
    default: 'Default',
    rewards: 'Rewards',
    hot: 'Hot',
    ending: 'Ending soon',
  };

  if (isLoading || (filter === 'claimed' && isLoadingGrinders)) {
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

  if (displayedBounties.length === 0 && filter !== 'claimed') {
    return (
      <Box textAlign="center" my={8}>
        <Text>No bounties have been submitted yet.</Text>
      </Box>
    );
  }

  if (filter === 'my-claimed' && hiveUser?.name && filteredBounties.length === 0) {
    return (
      <Box textAlign="center" my={8}>
        <Text>You have not claimed any bounties yet. Go upvote a bounty to claim it!</Text>
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
              {activeBounties.length === 1 ? 'active bounty' : 'active bounties'}
            </Text>
          </Box>
          <Divider orientation="vertical" height="60px" />
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
          <Divider orientation="vertical" height="60px" />
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
              {bountyGrinders.length === 1 ? 'active hunter' : 'active hunters'}
            </Text>
          </Box>
        </Flex>
      </Box>
      <Flex align="center" mb={4} gap={4}>
        <Tabs
          variant="soft-rounded"
          colorScheme="primary"
          index={filterToIndex(filter)}
          onChange={(idx) => setFilter(indexToFilter(idx))}
          flex="1"
        >
          <TabList>
            <Tab
              borderWidth="2px"
              borderColor="transparent"
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
              borderWidth="2px"
              borderColor="transparent"
              _selected={{
                color: "primary",
                bg: "primary.900",
                borderColor: "primary",
                borderWidth: "2px",
              }}
            >
              Claimed
            </Tab>
            <Tab
              borderWidth="2px"
              borderColor="transparent"
              _selected={{
                color: "primary",
                bg: "primary.900",
                borderColor: "primary",
                borderWidth: "2px",
              }}
            >
              My Claimed
            </Tab>
            <Tab
              borderWidth="2px"
              borderColor="transparent"
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
              borderWidth="2px"
              borderColor="transparent"
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
        <Box textAlign="right">
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            variant="outline"
            display="inline-block"
            width="120px"
            sx={{
              '& > option': { color: 'initial' },
            }}
          >
            <option value="default">Default (new)</option>
            <option value="rewards">Rewards (higher bounty payouts first)</option>
            <option value="hot">Hot (most unique claims)</option>
            <option value="ending">Ending soon</option>
          </Select>
          <style jsx global>{`
            select[value="default"] { color: inherit; }
          `}</style>
        </Box>
      </Flex>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} my={8}>
        {sortedBounties.slice(0, visibleCount).map((bounty) => (
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
      {visibleCount < sortedBounties.length && (
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
