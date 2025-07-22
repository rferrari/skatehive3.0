import {
  Box,
  Text,
  Avatar,
  Flex,
  Button,
  Link,
  Divider,
  Tag,
  useTheme,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Checkbox,
  CheckboxGroup,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { Discussion } from "@hiveio/dhive";
import { getPostDate } from "@/lib/utils/GetPostDate";
import { useComments } from "@/hooks/useComments";
import { parse, isAfter, isValid } from "date-fns";
import HiveMarkdown from "@/components/shared/HiveMarkdown";
import SnapList from "@/components/homepage/SnapList";
import SnapComposer from "@/components/homepage/SnapComposer";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";
import { useAioha } from "@aioha/react-ui";
import useHivePower from "@/hooks/useHivePower";
import { useHiveUser } from "@/contexts/UserContext";
import { transferWithKeychain, commentWithKeychain } from "@/lib/hive/client-functions";
import { KeychainSDK } from "keychain-sdk";

interface BountyDetailProps {
  post: Discussion;
}

const getDeadlineFromBody = (body: string): Date | null => {
  const deadlineMatch = body.match(/Deadline:\s*([^\n]+)/);
  if (deadlineMatch && deadlineMatch[1]) {
    // Try MM-dd-yyyy
    let date = parse(deadlineMatch[1], "MM-dd-yyyy", new Date());
    if (!isValid(date)) {
      // Try M/d/yyyy
      date = parse(deadlineMatch[1], "M/d/yyyy", new Date());
    }
    return isValid(date) ? date : null;
  }
  return null;
};

const BountyDetail: React.FC<BountyDetailProps> = ({ post }) => {
  const { author, created, body, title: postTitle } = post;
  const postDate = getPostDate(created);
  const theme = useTheme();
  const { comments, isLoading } = useComments(post.author, post.permlink, true);
  const [newComment, setNewComment] = useState<Discussion | null>(null);

  // Voting state
  const { aioha, user } = useAioha();
  const [sliderValue, setSliderValue] = useState(100);
  const [showSlider, setShowSlider] = useState(false);
  const [activeVotes, setActiveVotes] = useState(post.active_votes || []);
  const [voted, setVoted] = useState(
    post.active_votes?.some((item) => item.voter.toLowerCase() === user?.toLowerCase())
  );
  const { hivePower, isLoading: isHivePowerLoading, error: hivePowerError, estimateVoteValue } = useHivePower(user);

  // Claim state
  const { hiveUser } = useHiveUser();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const hasClaimed = useMemo(() => 
    activeVotes.some(v => v.voter === user)
  , [activeVotes, user]);

  // Reward Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [hasRewarded, setHasRewarded] = useState(false); // TODO: Replace with real check

  // Extract bounty fields
  const challengeName = useMemo(() => {
    const match = body.match(/Trick\/Challenge:\s*(.*)/);
    return match && match[1] ? match[1].trim() : postTitle || "Bounty Submission";
  }, [body, postTitle]);
  const rules = useMemo(() => {
    const match = body.match(/Bounty Rules:\s*([\s\S]*?)(?:\n|$)/);
    return match && match[1] ? match[1].trim() : "";
  }, [body]);
  const reward = useMemo(() => {
    const match = body.match(/Reward:\s*([^\n]*)/);
    return match && match[1] ? match[1].trim() : "N/A";
  }, [body]);
  const deadline = getDeadlineFromBody(body);
  const now = new Date();
  const isActive = deadline ? isAfter(deadline, now) : true;

  // Get unique commenters (exclude bounty creator)
  const uniqueCommenters = useMemo(() => {
    if (!comments) return [];
    const commenters = comments
      .map((c) => c.author)
      .filter((author) => author !== post.author);
    return Array.from(new Set(commenters));
  }, [comments, post.author]);

  // Calculate reward per winner
  const totalReward = useMemo(() => {
    const match = body.match(/Reward:\s*([0-9.]+)/);
    return match && match[1] ? parseFloat(match[1]) : 0;
  }, [body]);
  const [isRewarding, setIsRewarding] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [rewardSuccess, setRewardSuccess] = useState(false);

  // Parse reward amount and currency from body
  const rewardInfo = useMemo(() => {
    // Match e.g. "Reward: 10 HIVE" or "Reward: 5.5 HBD"
    const match = body.match(/Reward:\s*([0-9.]+)\s*(HIVE|HBD)?/i);
    if (match) {
      return {
        amount: parseFloat(match[1]),
        currency: match[2] ? match[2].toUpperCase() : "HIVE",
      };
    }
    return { amount: 0, currency: "HIVE" };
  }, [body]);

  const rewardPerWinner = selectedWinners.length > 0 ? (rewardInfo.amount / selectedWinners.length).toFixed(3) : "0";

  // function handleHeartClick() {
  //   setShowSlider(!showSlider);
  // }

  async function handleVote() {
    const vote = await aioha.vote(
      post.author,
      post.permlink,
      sliderValue * 100
    );
    if (vote.success) {
      setVoted(true);
      setActiveVotes([...activeVotes, { voter: user }]);
    }
    setShowSlider(false);
  }

  // Handler for rewarding bounty hunters
  async function handleRewardBountyHunters() {
    setIsRewarding(true);
    setRewardError(null);
    setRewardSuccess(false);
    try {
      // Send tip to each winner
      for (const winner of selectedWinners) {
        await transferWithKeychain(
          String(hiveUser?.name),
          winner,
          rewardPerWinner,
          `Congrats @${winner}! You won ${rewardPerWinner} ${rewardInfo.currency} in the bounty: ${challengeName}`,
          rewardInfo.currency
        );
      }
      // Post a comment announcing the winners
      const winnersList = selectedWinners.map((w) => `@${w}`).join(", ");
      const commentBody = `🏆 Bounty Winners! 🏆\n\nCongratulations to: ${winnersList}\n\nReward: ${rewardPerWinner} ${rewardInfo.currency}\n\nThank you for participating!`;
      const permlink = `bounty-winners-${Date.now()}`;
      // Validation: ensure all required fields are present
      const missingFields = [];
      if (!hiveUser?.name || hiveUser?.name === "undefined") missingFields.push("hiveUser.name");
      if (!post.author || post.author === "undefined") missingFields.push("post.author");
      if (!post.permlink || post.permlink === "undefined") missingFields.push("post.permlink");
      if (!permlink || permlink === "undefined") missingFields.push("permlink");
      if (!commentBody || commentBody === "undefined") missingFields.push("commentBody");

      if (missingFields.length > 0) {
        setRewardError("Missing required data: " + missingFields.join(", "));
        setIsRewarding(false);
        return;
      }
      const postObj = {
        username: String(hiveUser?.name),
        body: commentBody,
        parent_username: post.author,
        parent_perm: post.permlink,
        permlink,
        json_metadata: JSON.stringify({}),
        comment_options: '',
      };
      console.log("Prepared minimal comment postObj:", postObj);
      // Validate all fields are present and not undefined
      for (const [key, value] of Object.entries(postObj)) {
        if (value === undefined || value === null || value === "undefined") {
          setRewardError(`Field ${key} is missing or undefined.`);
          setIsRewarding(false);
          return;
        }
      }
      try {
        const keychain = new KeychainSDK(window);
        const commentResult = await keychain.post(postObj);
        console.log("Keychain result:", commentResult);
        if (!commentResult || commentResult.success === false) {
          throw new Error("Failed to post bounty winner comment.");
        }
      } catch (err) {
        console.error("Keychain post error:", err);
        setRewardError("Failed to post bounty winner comment. " + ((err as any)?.message || String(err)));
        setIsRewarding(false);
        return;
      }
      setRewardSuccess(true);
      setHasRewarded(true);
      // Only close the modal after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setRewardError(err.message || "Failed to reward bounty hunters.");
    } finally {
      setIsRewarding(false);
    }
  }

  // Handler for claiming the bounty
  async function handleClaimBounty() {
    if (!user) {
      setClaimError("You must be logged in to claim a bounty.");
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    try {
      // Use a 100% vote to claim the bounty
      const result = await aioha.vote(post.author, post.permlink, 10000); 
      if (result.success) {
        // Optimistically update the votes list
        setActiveVotes(prev => [...prev, { voter: user, percent: 10000 }]);
      } else {
        setClaimError("Failed to claim bounty. Your vote was not successful.");
      }
    } catch (err: any) {
      setClaimError(err.message || "An error occurred while claiming the bounty.");
    } finally {
      setIsClaiming(false);
    }
  }

  const renderComposerOrBlocker = () => {
    if (!isActive) {
      return null;
    }

    if (!user) {
      return (
        <Box textAlign="center" p={4} bg="gray.800" borderRadius="md">
          <Text>Please log in to submit.</Text>
        </Box>
      );
    }

    if (user === post.author) {
      return (
        <Box textAlign="center" p={4} bg="gray.800" borderRadius="md">
          <Text>You cannot hunt your own bounty.</Text>
        </Box>
      );
    }

    if (!hasClaimed) {
      return (
        <Box
          position="relative"
          p={4}
          borderRadius="md"
          bg="gray.800"
          textAlign="center"
          height="150px"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          overflow="hidden"
        >
          <MatrixOverlay />
          <Box position="relative" zIndex={1}>
            <Text fontWeight="bold" fontSize="lg" color="white">
              Claim Bounty to Submit
            </Text>
            <Text color="gray.300">
              Click &quot;Claim Bounty&quot; on the left to unlock submissions.
            </Text>
          </Box>
        </Box>
      );
    }

    return (
      <SnapComposer
        pa={post.author}
        pp={post.permlink}
        onNewComment={setNewComment as (newComment: Partial<Discussion>) => void}
        onClose={() => null}
      />
    );
  };

  // Claimed users (exclude post author, dedupe, sorted by time desc)
  const claimedUsers = useMemo(() => {
    if (!activeVotes) return [];
    const seen = new Set();
    const filtered = activeVotes
      .filter(v => v.voter && v.voter !== post.author)
      .filter(v => {
        if (seen.has(v.voter)) return false;
        seen.add(v.voter);
        return true;
      });
    // Sort by time descending (most recent first)
    return filtered.sort((a, b) => {
      const ta = a.time ? new Date(a.time).getTime() : 0;
      const tb = b.time ? new Date(b.time).getTime() : 0;
      return tb - ta;
    });
  }, [activeVotes, post.author]);

  return (
    <Box bg="background" color="text" minH="100vh">
      <Flex direction={{ base: "column", md: "row" }} h={{ base: "auto", md: "100vh" }} gap={4}>
        {/* Left: Bounty Details */}
        <Box flex={1} h={{ base: "auto", md: "100vh" }} overflowY="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          <Box
            data-component="BountyDetail"
            borderRadius="base"
            overflow="hidden"
            bg="muted"
            mb={3}
            p={4}
            w="100%"
            mt={{ base: "0px", md: "10px" }}
            boxShadow={theme.shadows.md}
          >
            {/* Header */}
            <Flex
              direction="column"
              boxShadow={theme.shadows.md}
              bg={theme.colors.primary ? `linear-gradient(to bottom, ${theme.colors.primary}, ${theme.colors.secondary})` : undefined}
              p={4}
              mb={4}
            >
              {/* Challenge Name at the top */}
              <Text fontSize="xl" fontWeight="bold" color={theme.colors.background} mb={2}>
                {challengeName}
              </Text>
              <Flex direction={["column", "row"]} alignItems={["flex-start", "center"]} w="100%">
                <Avatar
                  size="sm"
                  name={author}
                  src={`https://images.hive.blog/u/${author}/avatar/sm`}
                />
                <Box ml={[0, 3]} mt={[2, 0]} whiteSpace="nowrap">
                  <Text fontWeight="medium" fontSize="sm" mb={-2} color={theme.colors.background}>
                    <Link href={`/user/${author}`} color={theme.colors.background}>@{author}</Link>
                  </Text>
                  <Text fontSize="sm" color={theme.colors.background}>
                    {postDate}
                  </Text>
                </Box>
                <Divider
                  orientation="vertical"
                  h="34px"
                  borderColor="color"
                  mx={4}
                  display={["none", "block"]}
                />
                <Box flexGrow={1} ml={[0, 4]} mt={[2, 0]} textAlign="start" minWidth={0}>
                  <Tag colorScheme={isActive ? "green" : "red"} size="md" ml={2}>
                    {isActive ? "Active Bounty" : "Closed Bounty"}
                  </Tag>
                </Box>
              </Flex>
            </Flex>
            {/* Bounty Details */}
            <Box mb={4}>
              <Text fontWeight="bold" color="orange.300" fontSize="lg">
                Reward: {reward}
              </Text>
              <Text color="gray.500" fontSize="md">
                Deadline: {deadline ? deadline.toLocaleDateString() : "N/A"}
              </Text>
            </Box>
            <Divider />
            {/* Rules/Description */}
            <Box my={4}>
              <Text fontWeight="bold" mb={1}>Rules:</Text>
              <HiveMarkdown markdown={body.replace(/^Trick\/Challenge:.*$/gim, '').replace(/^Reward:.*$/gim, '').replace(/^Deadline:.*$/gim, '').replace(/^Bounty Rules: ?/gim, '').trim()} />
            </Box>
            {/* Claim Bounty Button */}
            {isActive && user && user !== post.author && (
              <Flex justify="center" my={4}>
                <Button 
                  colorScheme="green" 
                  onClick={handleClaimBounty}
                  isLoading={isClaiming}
                  isDisabled={hasClaimed}
                >
                  {hasClaimed ? "Bounty Claimed" : "Claim Bounty (100% Vote)"}
                </Button>
              </Flex>
            )}
            {claimError && <Text color="red.400" textAlign="center">{claimError}</Text>}
            {/* Media Section */}
            {/* Media Section removed, as full body is now shown above */}
            <Divider />
            {/* Submission Composer Removed */}
            {!isActive && (
              <Text color="red.400" fontWeight="bold" textAlign="center" my={4}>
                Submissions are closed for this bounty.
              </Text>
            )}
            {/* Reward Bounty Hunters Button (UI only, now inside Bounty Details) */}
            {!isActive && user === post.author && !hasRewarded && (
              <Flex justify="center" my={2}>
                <Button colorScheme="orange" onClick={onOpen} fontWeight="bold">
                  Reward Bounty Hunters
                </Button>
              </Flex>
            )}
          </Box>
        </Box>
        {/* Right: Submissions List */}
        <Box flex={1} h={{ base: "auto", md: "100vh" }} overflowY="auto" bg="muted" borderRadius="base" boxShadow={theme.shadows.md} p={4} sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          {/* Claimed Users Section */}
          {claimedUsers.length > 0 && (
            <Box mb={4}>
              <Text fontWeight="bold" fontSize="lg" mb={2} color={theme.colors.text}>
                Claimed By ({claimedUsers.length}):
              </Text>
              <Flex wrap="wrap" gap={4}>
                {claimedUsers.map((vote) => (
                  <Flex key={`${vote.voter}-${vote.time || ''}`} align="center" gap={2} bg={theme.colors.muted} p={2} borderRadius="md" border={`1px solid ${theme.colors.border}`}> 
                    <Avatar size="sm" name={vote.voter} src={`https://images.hive.blog/u/${vote.voter}/avatar/sm`} />
                    <Box>
                      <Text fontWeight="bold">
                        <Link 
                          href={`/user/${vote.voter}`}
                          color={theme.colors.primary}
                          _hover={{ color: theme.colors.accent, textDecoration: 'underline' }}
                          style={{ color: theme.colors.primary }}
                        >
                          @{vote.voter}
                        </Link>
                      </Text>
                      {vote.time && (
                        <Text fontSize="xs" color={theme.colors.accent}>
                          Claimed: {new Date(vote.time).toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
          <Text fontWeight="bold" fontSize="2xl" textAlign="left" mb={2} mt={2}>
            Submissions: {post.children || 0}
          </Text>
          {renderComposerOrBlocker()}
          {isActive && <Divider my={4} />}
          <SnapList
            author={post.author}
            permlink={post.permlink}
            setConversation={() => {}}
            onOpen={() => {}}
            setReply={() => {}}
            newComment={newComment}
            setNewComment={setNewComment}
            post={true}
            data={{ comments, loadNextPage: () => {}, isLoading, hasMore: false }}
            hideComposer={true}
          />
        </Box>
      </Flex>
      {/* Reward Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Bounty Winners</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Select the users who won this bounty:</Text>
            <CheckboxGroup
              value={selectedWinners}
              onChange={(val) => setSelectedWinners(val as string[])}
            >
              <VStack align="start">
                {uniqueCommenters.map((username: string) => (
                  <Checkbox key={username} value={username}>
                    @{username}
                  </Checkbox>
                ))}
              </VStack>
            </CheckboxGroup>
            <Divider my={3} />
            <Text>
              Total Reward: <b>{rewardInfo.amount} {rewardInfo.currency}</b>
            </Text>
            <Text>
              Each winner receives: <b>{rewardPerWinner} {rewardInfo.currency}</b>
            </Text>
            {rewardError && <Text color="red.400" mt={2}>{rewardError}</Text>}
            {rewardSuccess && <Text color="green.400" mt={2}>Bounty rewards sent and winners announced!</Text>}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="orange" mr={3} isDisabled={selectedWinners.length === 0 || isRewarding} onClick={handleRewardBountyHunters} isLoading={isRewarding}>
              Reward Bounty Hunters
            </Button>
            <Button variant="ghost" onClick={onClose} isDisabled={isRewarding}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BountyDetail; 