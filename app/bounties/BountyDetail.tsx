import {
  Box,
  Text,
  Avatar,
  Flex,
  Icon,
  Button,
  Link,
  Divider,
  Tag,
  useTheme,
  Spinner,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
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
import { processMediaContent } from "@/lib/utils/MarkdownRenderer";
import SnapList from "@/components/homepage/SnapList";
import SnapComposer from "@/components/homepage/SnapComposer";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";
import { FaHeart, FaRegHeart, FaComment } from "react-icons/fa";
import VoteListPopover from "@/components/blog/VoteListModal";
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
  const { hiveUser } = useHiveUser();
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

  function handleHeartClick() {
    setShowSlider(!showSlider);
  }

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
      const commentBody = `🏆 Bounty Winners! 🏆\n\nCongratulations to: ${winnersList}\n\nEach receives: ${rewardPerWinner} ${rewardInfo.currency}\n\nThank you for participating!`;
      const permlink = `bounty-winners-${Date.now()}`;
      // Validation: ensure all required fields are present
      if (
        !hiveUser?.name ||
        hiveUser?.name === "undefined" ||
        !post.author ||
        post.author === "undefined" ||
        !post.permlink ||
        post.permlink === "undefined" ||
        !permlink ||
        permlink === "undefined" ||
        !commentBody ||
        commentBody === "undefined" ||
        !post.author
      ) {
        setRewardError("Missing required data for posting the comment. Please refresh and try again.");
        setIsRewarding(false);
        return;
      }
      const jsonMeta = { app: "skatehive-bounties/1.0" };
      const postObj = {
        username: String(hiveUser?.name),
        title: "Bounty Winners!",
        body: commentBody,
        parent_author: post.author,
        parent_perm: post.permlink,
        permlink,
        json_metadata: JSON.stringify(jsonMeta) || '{}',
        comment_options: JSON.stringify({
          max_accepted_payout: "1000000.000 HBD",
          percent_hbd: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [],
        }),
      };
      console.log("Minimal postObj:", postObj);
      console.log("parent_author:", postObj.parent_author);
      console.log("parent_perm:", postObj.parent_perm);
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
      }, 1200);
    } catch (err: any) {
      setRewardError(err.message || "Failed to reward bounty hunters.");
    } finally {
      setIsRewarding(false);
    }
  }

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
              {/* Heart vote button, vote count, and comment count below author/tag */}
              <Flex alignItems="center" gap={2} mt={2}>
                {voted ? (
                  <Icon
                    as={FaHeart}
                    onClick={handleHeartClick}
                    cursor="pointer"
                    color={theme.colors.background}
                  />
                ) : (
                  <Icon
                    as={FaRegHeart}
                    onClick={handleHeartClick}
                    cursor="pointer"
                    color={theme.colors.background}
                    opacity={0.5}
                  />
                )}
                <VoteListPopover
                  trigger={
                    <Button variant="ghost" size="sm" p={1} color={theme.colors.background} _hover={{ textDecoration: 'underline' }}>
                      {activeVotes ? activeVotes.length : 0}
                    </Button>
                  }
                  votes={activeVotes || []}
                  post={post}
                />
                <Icon as={FaComment} color={theme.colors.background} ml={2} />
                <Text fontSize="sm" color={theme.colors.background} ml={1}>
                  {post.children || 0}
                </Text>
              </Flex>
              {showSlider && (
                <Flex mt={2} alignItems="center" w="100%">
                  <Box width="100%" mr={2}>
                    <Slider
                      aria-label="slider-ex-1"
                      min={0}
                      max={100}
                      value={sliderValue}
                      onChange={(val) => setSliderValue(val)}
                    >
                      <SliderTrack
                        bg={theme.colors.muted}
                        height="8px"
                      >
                        <SliderFilledTrack bgGradient={`linear(to-r, ${theme.colors.primary}, ${theme.colors.accent}, red.400)`} />
                      </SliderTrack>
                      <SliderThumb
                        boxSize="30px"
                        bg="transparent"
                        boxShadow={"none"}
                        _focus={{ boxShadow: "none" }}
                        zIndex={1}
                      >
                        <img src="/images/spitfire.png" alt="thumb" style={{ width: "100%", height: "auto", marginRight: 8, marginBottom: 4 }} />
                      </SliderThumb>
                    </Slider>
                  </Box>
                  <Button size="xs" onClick={handleVote} colorScheme="orange" fontWeight="bold">
                    Vote {sliderValue} %
                  </Button>
                  <Button size="xs" onClick={handleHeartClick} ml={2}>
                    X
                  </Button>
                </Flex>
              )}
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
          <Text fontWeight="bold" fontSize="lg" mb={2} mt={2}>
            Submissions
          </Text>
          {/* Composer: Only show if active */}
          {isActive && (
            <SnapComposer
              pa={post.author}
              pp={post.permlink}
              onNewComment={setNewComment as (newComment: Partial<Discussion>) => void}
              onClose={() => null}
            />
          )}
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
                {uniqueCommenters.map((username) => (
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
            <Button variant="ghost" onClick={onClose} isDisabled={isRewarding}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BountyDetail; 