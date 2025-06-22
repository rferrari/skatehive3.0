import React, { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import { Discussion } from "@hiveio/dhive";
import BountySnap from "./BountySnap";
import BountySubmission from "./BountySubmission";
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
  const [submission, setSubmission] = useState<Discussion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [bountyGrinders, setBountyGrinders] = useState<string[]>([]);
  const [isLoadingGrinders, setIsLoadingGrinders] = useState(false);

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

  const handleOpenSubmission = (bounty: Discussion) => {
    setSubmission(bounty);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmission(null);
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

  // --- Stats Computation ---
  // Get all active bounties
  const now = new Date();
  const activeBounties = displayedBounties.filter((b) => {
    const deadline = getDeadlineFromBody(b.body);
    return deadline && isAfter(deadline, now);
  });
  // Rewards up for grabs
  const rewardsUpForGrabs = activeBounties
    .map((b) => {
      const match = b.body.match(/Reward:\s*(.*)/);
      return match && match[1] ? match[1].trim() : null;
    })
    .filter(Boolean);

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
    return () => {
      cancelled = true;
    };
  }, [activeBounties.map((b) => b.permlink).join(",")]);

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
        p={4}
        borderRadius="lg"
        bg="muted"
        boxShadow="md"
        maxW="700px"
        mx="auto"
      >
        <SimpleGrid columns={2} spacing={4} alignItems="center">
          <Box>
            <VStack align="start" spacing={6}>
              <Text fontWeight="bold" fontSize="lg">
                Active Bounties
              </Text>
              <Text fontWeight="bold" fontSize="lg">
                Rewards Up for Grabs
              </Text>
              <Text fontWeight="bold" fontSize="lg">
                Active Bounty Grinders
              </Text>
            </VStack>
          </Box>
          <Box>
            <VStack align="start" spacing={6}>
              <Text fontSize="2xl" color="primary.400">
                {activeBounties.length}
              </Text>
              <Wrap>
                {rewardsUpForGrabs.length > 0 ? (
                  rewardsUpForGrabs.map((reward, i) => (
                    <Tag key={i} colorScheme="primary" mx={1}>
                      {reward}
                    </Tag>
                  ))
                ) : (
                  <Text fontSize="2xl" color="primary.400">
                    0
                  </Text>
                )}
              </Wrap>
              {isLoadingGrinders ? (
                <Text color="muted">Loading...</Text>
              ) : (
                <Wrap>
                  {bountyGrinders.length > 0 ? (
                    bountyGrinders.map((user, i) => (
                      <Tag key={i} colorScheme="accent" mx={1}>
                        @{user}
                      </Tag>
                    ))
                  ) : (
                    <Text fontSize="2xl" color="primary.400">
                      0
                    </Text>
                  )}
                </Wrap>
              )}
            </VStack>
          </Box>
        </SimpleGrid>
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
            onOpen={() => handleOpenSubmission(bounty)}
            setReply={() => {}}
            setConversation={handleOpenSubmission}
            showAuthor={false}
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
        <ModalOverlay />
        <ModalContent bg="background" color="text">
          {submission && (
            <BountySubmission
              discussion={submission}
              setSubmission={() => setIsModalOpen(false)}
              onOpen={() => {}}
              setReply={() => {}}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
