import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  Spinner,
  Button,
  Tabs,
  TabList,
  Tab,
  Flex,
  Divider,
  Select,
} from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import useMarketPrices from "@/hooks/useMarketPrices";
import { Discussion } from "@hiveio/dhive";
import BountySnap from "./BountySnap";
import { parse, isAfter } from "date-fns";
import HiveClient from "@/lib/hive/hiveclient";
import useEffectiveHiveUser from "@/hooks/useEffectiveHiveUser";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";
import { useSoftVoteOverlays } from "@/hooks/useSoftVoteOverlay";
import {
  FaBolt,
  FaCheckCircle,
  FaUserCheck,
  FaList,
  FaFlagCheckered,
  FaUserEdit,
} from "react-icons/fa";

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
    "active" | "claimed" | "my-claimed" | "my-bounties" | "all" | "completed" | "rewarded"
  >("active");
  const [bountyGrinders, setBountyGrinders] = useState<string[]>([]);
  const [isLoadingGrinders, setIsLoadingGrinders] = useState(false);
  const { hivePrice, isPriceLoading } = useMarketPrices();
  const [sortBy, setSortBy] = useState<
    "default" | "rewards" | "hot" | "ending"
  >("default");
  const [bountySubmissionCounts, setBountySubmissionCounts] = useState<
    Record<string, number>
  >({});
  const [rewardedBounties, setRewardedBounties] = useState<Set<string>>(new Set());

  // Claimed bounties logic
  const { handle: effectiveUser } = useEffectiveHiveUser();
  const { user: userbaseUser } = useUserbaseAuth();
  const softVotes = useSoftVoteOverlays(
    displayedBounties.map((bounty) => ({
      author: bounty.author,
      permlink: bounty.permlink,
    }))
  );

  const hasSoftVoteFor = useCallback(
    (author: string, permlink: string) => {
      if (!userbaseUser) return false;
      const key = `${userbaseUser.id}:${author}/${permlink}`;
      const softVote = softVotes[key];
      return !!softVote && softVote.status !== "failed" && softVote.weight > 0;
    },
    [softVotes, userbaseUser]
  );

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
    if (filter === "my-claimed" && effectiveUser) {
      return displayedBounties.filter((bounty) => {
        // Check if the current user has voted on this bounty (claimed it) AND is not the author
        // Use case-insensitive comparison to handle potential case differences
        const isNotAuthor =
          bounty.author.toLowerCase() !== effectiveUser.toLowerCase();
        const hasVoted = bounty.active_votes?.some(
          (vote) => vote.voter.toLowerCase() === effectiveUser.toLowerCase()
        );

        return (
          isNotAuthor &&
          (hasVoted || hasSoftVoteFor(bounty.author, bounty.permlink))
        );
      });
    }
    if (filter === "my-bounties" && effectiveUser) {
      return displayedBounties.filter((bounty) => {
        // Check if the current user is the author of this bounty
        return bounty.author.toLowerCase() === effectiveUser.toLowerCase();
      });
    }
    if (filter === "claimed") {
      return displayedBounties.filter(
        (bounty) => bounty.active_votes && bounty.active_votes.length > 0
      );
    }
    return displayedBounties.filter((bounty) => {
      if (filter === "all") return true;
      const deadline = getDeadlineFromBody(bounty.body);
      if (!deadline) return false;
      const now = new Date();
      if (filter === "active") return isAfter(deadline, now);
          if (filter === "completed") return !isAfter(deadline, now);
    if (filter === "rewarded") {
      // Check if this bounty has been rewarded by checking the rewardedBounties set
      return rewardedBounties.has(`${bounty.author}-${bounty.permlink}`);
    }
    return true;
    });
  }, [filter, displayedBounties, effectiveUser, rewardedBounties, hasSoftVoteFor]);

  // Sorting logic
  const sortedBounties = useMemo(() => {
    let bounties = [...filteredBounties];
    if (sortBy === "rewards") {
      bounties.sort((a: Discussion, b: Discussion) => {
        const getReward = (bounty: Discussion) => {
          const match = bounty.body.match(/Reward:\s*([\d.]+)/);
          return match ? parseFloat(match[1]) : 0;
        };
        return getReward(b) - getReward(a);
      });
    } else if (sortBy === "hot") {
      bounties.sort((a: Discussion, b: Discussion) => {
        const aCount = a.active_votes ? a.active_votes.length : 0;
        const bCount = b.active_votes ? b.active_votes.length : 0;
        return bCount - aCount;
      });
    } else if (sortBy === "ending") {
      bounties = bounties
        .filter((bounty: Discussion) => {
          const deadlineMatch = bounty.body.match(
            /Deadline:\s*(\d{2}-\d{2}-\d{4})/
          );
          if (!deadlineMatch) return false;
          const [mm, dd, yyyy] = deadlineMatch[1].split("-");
          const deadline = new Date(`${yyyy}-${mm}-${dd}`);
          return deadline > new Date();
        })
        .sort((a: Discussion, b: Discussion) => {
          const getDeadline = (bounty: Discussion) => {
            const match = bounty.body.match(/Deadline:\s*(\d{2}-\d{2}-\d{4})/);
            if (!match) return new Date(8640000000000000).getTime(); // far future
            const [mm, dd, yyyy] = match[1].split("-");
            return new Date(`${yyyy}-${mm}-${dd}`).getTime();
          };
          return getDeadline(a) - getDeadline(b);
        });
    } else {
      // Default: newest first
      bounties.sort(
        (a: Discussion, b: Discussion) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
      );
    }
    return bounties;
  }, [filteredBounties, sortBy]);

  // Map filter state to tab index
  const filterToIndex = (f: typeof filter) => {
    if (f === "active") return 0;
    if (f === "claimed") return 1;
    if (f === "my-claimed") return 2;
    if (f === "my-bounties") return 3;
    if (f === "all") return 4;
    if (f === "completed") return 5;
    if (f === "rewarded") return 6;
    return 0;
  };
  const indexToFilter = (idx: number) =>
    ["active", "claimed", "my-claimed", "my-bounties", "all", "completed", "rewarded"][
      idx
    ] as typeof filter;

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
  const rewardsUpForGrabs = activeBounties
    .map((b) => {
      const match = b.body.match(/Reward:\s*(.*)/);
      return match && match[1] ? match[1].trim() : null;
    })
    .filter(Boolean);

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

  // Extract permlinks for dependency - use all displayed bounties, not just active ones
  const allBountyPermlinks = displayedBounties.map((b) => b.permlink).join(",");

  // Fetch replies for all displayed bounties to get bounty grinders, submission counts, and rewarded status
  useEffect(() => {
    let cancelled = false;
    async function fetchBountyData() {
      setIsLoadingGrinders(true);
      const usernames = new Set<string>();
      const submissionCounts: Record<string, number> = {};
      const rewardedSet = new Set<string>();

      await Promise.all(
        displayedBounties.map(async (bounty) => {
          try {
            const replies = await HiveClient.database.call(
              "get_content_replies",
              [bounty.author, bounty.permlink]
            );

            // Get bounty deadline
            const deadline = getDeadlineFromBody(bounty.body);

            // Check if bounty has been rewarded by creator
            if (replies && Array.isArray(replies)) {
              const isRewarded = replies.some((reply: any) => 
                reply.author === bounty.author && 
                reply.body.includes('🏆 Bounty Winners! 🏆')
              );
              if (isRewarded) {
                rewardedSet.add(`${bounty.author}-${bounty.permlink}`);
              }
            }

            // Count submissions (replies) that were made before the deadline
            let submissionCount = 0;
            if (replies && Array.isArray(replies)) {
              replies.forEach((reply: any) => {
                if (reply.author) {
                  usernames.add(reply.author);

                  // Only count submissions made before the deadline
                  if (deadline && reply.created) {
                    const replyDate = new Date(reply.created);
                    if (replyDate < deadline) {
                      submissionCount++;
                    }
                  }
                }
              });
            }

            // Store submission count for this bounty
            submissionCounts[`${bounty.author}-${bounty.permlink}`] =
              submissionCount;
          } catch (error) {
            // Set submission count to 0 on error
            submissionCounts[`${bounty.author}-${bounty.permlink}`] = 0;
          }
        })
      );
      if (!cancelled) {
        setBountyGrinders(Array.from(usernames));
        setBountySubmissionCounts(submissionCounts);
        setRewardedBounties(rewardedSet);
        setIsLoadingGrinders(false);
      }
    }
    fetchBountyData();
    return () => {
      cancelled = true;
    };
  }, [allBountyPermlinks, displayedBounties]);

  // Mapping for short labels (button display)
  const sortByLabels: Record<string, string> = {
    default: "Default",
    rewards: "Rewards",
    hot: "Hot",
    ending: "Ending soon",
  };

  if (isLoading || isLoadingGrinders) {
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

  return (
    <>
      {/* Stats Board */}
      <Box
        mb={{ base: 2, md: 6 }}
        p={{ base: 0, md: 0 }}
        borderRadius={{ base: "none", md: "lg" }}
        bg="muted"
        boxShadow={{ base: "none", md: "md" }}
        maxW="1000px"
        mx="auto"
        overflow="hidden"
      >
        <Flex
          direction={{ base: "row", md: "row" }}
          align="center"
          justify="center"
          height={{ base: "40px", md: "80px" }}
          bg="muted"
          gap={{ base: 0, md: 0 }}
        >
          {/* Active Bounties */}
          <Box
            flex="1"
            textAlign="center"
            py={{ base: 0, md: 3 }}
            px={{ base: 0, md: 0 }}
          >
            <Text
              fontWeight="bold"
              fontSize={{ base: "md", md: "2xl" }}
              color="primary.400"
              lineHeight={1}
            >
              {activeBounties.length}
            </Text>
            <Text
              fontSize={{ base: "xs", md: "md" }}
              color="text"
              lineHeight={1}
            >
              {activeBounties.length === 1
                ? "active bounty"
                : "active bounties"}
            </Text>
          </Box>
          {/* Divider for md+ only */}
          <Divider
            orientation="vertical"
            height="60px"
            display={{ base: "none", md: "block" }}
          />
          {/* Rewards Up for Grabs */}
          <Box
            flex="1"
            textAlign="center"
            py={{ base: 0, md: 3 }}
            px={{ base: 0, md: 0 }}
          >
            <Text
              fontWeight="bold"
              fontSize={{ base: "md", md: "2xl" }}
              color="primary.400"
              lineHeight={1}
            >
              {isPriceLoading || totalActiveRewardsUSD === null
                ? "Calculating..."
                : `~$${totalActiveRewardsUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} USD`}
            </Text>
            <Text
              fontSize={{ base: "xs", md: "md" }}
              color="text"
              lineHeight={1}
            >
              active rewards
            </Text>
          </Box>
          {/* Divider for md+ only */}
          <Divider
            orientation="vertical"
            height="60px"
            display={{ base: "none", md: "block" }}
          />
          {/* Active Bounty Hunters */}
          <Box
            flex="1"
            textAlign="center"
            py={{ base: 0, md: 3 }}
            px={{ base: 0, md: 0 }}
          >
            <Text
              fontWeight="bold"
              fontSize={{ base: "md", md: "2xl" }}
              color="primary.400"
              lineHeight={1}
            >
              {isLoadingGrinders
                ? "..."
                : activeBounties.length === 0
                ? "0"
                : bountyGrinders.length}
            </Text>
            <Text
              fontSize={{ base: "xs", md: "md" }}
              color="text"
              lineHeight={1}
            >
              {bountyGrinders.length === 1 ? "active hunter" : "active hunters"}
            </Text>
          </Box>
        </Flex>
      </Box>
      <Flex
        align="center"
        mb={{ base: 0, md: 4 }}
        gap={{ base: 0, md: 4 }}
        direction={{ base: "column", md: "row" }}
        justifyContent={{ base: "center", md: "flex-start" }}
        alignItems={{ base: "center", md: "stretch" }}
      >
        <Tabs
          variant="enclosed"
          colorScheme="primary"
          index={filterToIndex(filter)}
          onChange={(idx) => setFilter(indexToFilter(idx))}
          size="sm"
          isFitted={true}
          width="100%"
          display="flex"
          justifyContent="center"
        >
          <TabList
            bg="transparent"
            border="1px solid"
            borderColor="gray.600"
            borderRadius="none"
            width="100%"
            sx={{
              overflowX: { base: "auto", md: "visible" },
              whiteSpace: { base: "nowrap", md: "normal" },
              justifyContent: "center",
            }}
          >
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaBolt size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                Active
              </Box>
            </Tab>
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaCheckCircle size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                Claimed
              </Box>
            </Tab>
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaUserCheck size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                My Claimed
              </Box>
            </Tab>
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaUserEdit size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                My Bounties
              </Box>
            </Tab>
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaList size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                All
              </Box>
            </Tab>
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaFlagCheckered size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                Completed
              </Box>
            </Tab>
            <Tab
              _selected={{
                color: "primary",
                bg: "muted",
              }}
              _hover={{
                bg: "muted.100",
                transform: "translateY(-1px)",
              }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={{ base: "auto", md: "80px" }}
              fontSize="sm"
              border="none"
            >
              <FaCheckCircle size={14} />
              <Box display={{ base: "none", md: "inline" }}>
                Rewarded
              </Box>
            </Tab>
          </TabList>
        </Tabs>
      </Flex>
      
      {/* Sorting Dropdown - Moved below tabs */}
      <Flex justify="center" mb={4}>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          variant="outline"
          width={{ base: "120px", md: "150px" }}
          fontFamily="heading"
          fontWeight="bold"
          fontSize="sm"
          color="primary.900"
          bg="muted"
          borderColor="gray.300"
          borderWidth="2px"
          borderRadius="lg"
          py={2}
          px={3}
          pr={8}
          aria-label="Sort bounties"
          sx={{
            "& > option": { color: "initial" },
          }}
        >
          <option value="default">New</option>
          <option value="rewards">Reward</option>
          <option value="hot">Hot</option>
          <option value="ending">Ending</option>
        </Select>
      </Flex>
      {/* Bounty Grid or Empty State */}
      {filteredBounties.length === 0 ? (
        // Show appropriate empty state message based on filter
        <Box textAlign="center" my={8}>
          {filter === "my-claimed" && effectiveUser ? (
            <Text>
              You have not claimed any bounties yet. Go upvote a bounty to claim it!
            </Text>
          ) : filter === "my-bounties" && effectiveUser ? (
            <Text>
              You have not created any bounties yet. Create your first bounty to get
              started!
            </Text>
          ) : filter === "rewarded" ? (
            <>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                🏆 No Rewarded Bounties Yet
              </Text>
              <Text color="gray.400">
                There are no bounties that have been completed and rewarded yet.
              </Text>
            </>
          ) : filter === "claimed" ? (
            <Text>No bounties have been claimed yet.</Text>
          ) : filter === "completed" ? (
            <Text>No completed bounties yet.</Text>
          ) : filter === "active" ? (
            <Text>No active bounties available.</Text>
          ) : displayedBounties.length === 0 ? (
            <Text>No bounties have been submitted yet.</Text>
          ) : (
            <Text>No bounties match the current filter.</Text>
          )}
        </Box>
      ) : (
        <>
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
                submissionCount={
                  bountySubmissionCounts[`${bounty.author}-${bounty.permlink}`] || 0
                }
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
      )}
    </>
  );
}
