import {
  Box,
  Text,
  HStack,
  Button,
  Avatar,
  Link,
  VStack,
  Flex,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  useToast,
  Image,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  useDisclosure,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { FaRegComment } from "react-icons/fa";
import { LuArrowUpRight } from "react-icons/lu";
import { useAioha } from "@aioha/react-ui";
import { useState, useEffect, useMemo } from "react";
import {
  getPayoutValue,
  calculateUserVoteValue,
} from "@/lib/hive/client-functions";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";
import { getPostDate } from "@/lib/utils/GetPostDate";
import useHiveAccount from "@/hooks/useHiveAccount";
import VideoRenderer from "../layout/VideoRenderer";
import SnapComposer from "./SnapComposer";
import { FaLink } from "react-icons/fa6";
import useHivePower from "@/hooks/useHivePower";
import VoteListPopover from "@/components/blog/VoteListModal";
import { fetchComments } from "@/lib/hive/fetchComments";
import { separateContent } from "@/utils/snapUtils";


const renderMedia = (mediaContent: string) => {
  return mediaContent.split("\n").map((item: string, index: number) => {
    if (!item.trim()) return null;
    if (item.includes("![") && item.includes("ipfs.skatehive.app/ipfs/")) {
      return (
        <Box
          key={index}
          dangerouslySetInnerHTML={{ __html: markdownRenderer(item) }}
          sx={{
            img: {
              width: "100%",
              height: "auto",
              objectFit: "contain",
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            },
          }}
        />
      );
    }
    if (item.includes("<iframe") && item.includes("</iframe>")) {
      const srcMatch = item.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const url = srcMatch[1];
        // Skip YouTube iframes (handled by auto-embed logic)
        if (
          url.includes("youtube.com/embed/") ||
          url.includes("youtube-nocookie.com/embed/") ||
          url.includes("youtu.be/")
        ) {
          return null;
        }
        if (url.includes("gateway.pinata.cloud/ipfs/")) {
          const ipfsHash = url.match(/\/ipfs\/([\w-]+)/)?.[1];
          if (ipfsHash) {
            const skatehiveUrl = `https://ipfs.skatehive.app/ipfs/${ipfsHash}`;
            return <VideoRenderer key={index} src={skatehiveUrl} />;
          }
        } else if (url.includes("ipfs.skatehive.app/ipfs/")) {
          return <VideoRenderer key={index} src={url} />;
        }
      }
      return (
        <Box
          key={index}
          dangerouslySetInnerHTML={{ __html: item }}
          sx={{
            iframe: {
              width: "100%",
              height: "auto",
              minHeight: "300px",
            },
          }}
        />
      );
    }
    return (
      <Box
        key={index}
        dangerouslySetInnerHTML={{ __html: markdownRenderer(item) }}
        sx={{
          img: {
            width: "100%",
            height: "auto",
            objectFit: "contain",
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
          },
        }}
      />
    );
  });
};

interface SnapProps {
  discussion: Discussion;
  onOpen: () => void;
  setReply: (discussion: Discussion) => void;
  setConversation?: (conversation: Discussion) => void;
}

const Snap = ({ discussion, onOpen, setReply, setConversation }: SnapProps) => {
  const { aioha, user } = useAioha();
  const { hiveAccount } = useHiveAccount(user || "");
  const {
    hivePower,
    isLoading: isHivePowerLoading,
    error: hivePowerError,
    estimateVoteValue,
  } = useHivePower(user);
  const toast = useToast();
  const commentDate = getPostDate(discussion.created);

  const [sliderValue, setSliderValue] = useState(5);
  const [showSlider, setShowSlider] = useState(false);
  const [activeVotes, setActiveVotes] = useState(discussion.active_votes || []);
  const [rewardAmount, setRewardAmount] = useState(
    parseFloat(getPayoutValue(discussion))
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inlineRepliesMap, setInlineRepliesMap] = useState<
    Record<string, Discussion[]>
  >({});
  const [inlineRepliesLoading, setInlineRepliesLoading] = useState<
    Record<string, boolean>
  >({});
  const [inlineComposerStates, setInlineComposerStates] = useState<
    Record<string, boolean>
  >({});

  const effectiveDepth = discussion.depth || 0;

  const { text, media } = useMemo(
    () => separateContent(discussion.body),
    [discussion.body]
  );
  const renderedMedia = useMemo(() => renderMedia(media), [media]);

  const [voted, setVoted] = useState(
    discussion.active_votes?.some(
      (item: { voter: string }) => item.voter === user
    ) || false
  );

  function handleHeartClick() {
    setShowSlider(!showSlider);
  }

  function handleConversation() {
    if (setConversation) {
      setConversation(discussion);
    }
  }

  async function handleVote() {
    const vote = await aioha.vote(
      discussion.author,
      discussion.permlink,
      sliderValue * 100
    );
    if (vote.success) {
      setVoted(true);
      setActiveVotes([...activeVotes, { voter: user }]);
      // Estimate the value and optimistically update payout
      if (estimateVoteValue) {
        try {
          const estimatedValue = await estimateVoteValue(sliderValue);
          setRewardAmount((prev) =>
            parseFloat((prev + estimatedValue).toFixed(3))
          );
        } catch (e) {
          // fallback: do not update payout
        }
      }
    }
    handleHeartClick();
  }

  const handleSharePost = async () => {
    // Validate permlink to prevent [object Object] URLs
    if (typeof discussion.permlink !== "string") {
      console.error(
        "🚨 Snap: Invalid permlink type:",
        typeof discussion.permlink
      );
      return;
    }

    const postLink = `${window.location.origin}/post/${discussion.author}/${discussion.permlink}`;
    await navigator.clipboard.writeText(postLink);
    toast({
      title: "Post link copied to clipboard.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  function handleInlineNewReply(newComment: Partial<Discussion>) {
    const newReply = newComment as Discussion;
    setInlineRepliesMap((prev) => ({
      ...prev,
      [discussion.permlink]: [...(prev[discussion.permlink] || []), newReply],
    }));
  }

  async function handleReplyButtonClick(permlink: string) {
    setInlineComposerStates((prev: Record<string, boolean>) => ({
      ...prev,
      [permlink]: !prev[permlink],
    }));
    // If opening, fetch replies if not already loaded
    if (!inlineComposerStates[permlink]) {
      setInlineRepliesLoading((prev) => ({ ...prev, [permlink]: true }));
      try {
        const replies = await fetchRepliesForPermlink(
          discussion.author,
          permlink
        );
        setInlineRepliesMap((prev) => ({ ...prev, [permlink]: replies }));
      } catch (e) {
        setInlineRepliesMap((prev) => ({ ...prev, [permlink]: [] }));
      } finally {
        setInlineRepliesLoading((prev) => ({ ...prev, [permlink]: false }));
      }
    }
  }

  // Helper to fetch replies for a given author/permlink
  async function fetchRepliesForPermlink(author: string, permlink: string) {
    return fetchComments(author, permlink, false);
  }

  // Deduplicate votes by voter (keep the last occurrence)
  const uniqueVotesMap = new Map();
  activeVotes.forEach((vote) => {
    uniqueVotesMap.set(vote.voter, vote);
  });
  const uniqueVotes = Array.from(uniqueVotesMap.values());

  // Helper to convert Asset or string to string
  function assetToString(val: string | { toString: () => string }): string {
    return typeof val === "string" ? val : val.toString();
  }
  // Helper to parse payout strings like "1.234 HBD"
  function parsePayout(
    val: string | { toString: () => string } | undefined
  ): number {
    if (!val) return 0;
    const str = assetToString(val);
    return parseFloat(str.replace(" HBD", "").replace(",", ""));
  }
  const authorPayout = parsePayout(discussion.total_payout_value);
  const curatorPayout = parsePayout(discussion.curator_payout_value);
  // Calculate days remaining for pending payout
  const createdDate = new Date(discussion.created);
  const now = new Date();
  const timeDifferenceInMs = now.getTime() - createdDate.getTime();
  const timeDifferenceInDays = timeDifferenceInMs / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, 7 - Math.floor(timeDifferenceInDays));
  const isPending = timeDifferenceInDays < 7;
  const {
    isOpen: isPayoutOpen,
    onOpen: openPayout,
    onClose: closePayout,
  } = useDisclosure();

  return (
    <Box pl={effectiveDepth > 1 ? 1 : 0} ml={effectiveDepth > 1 ? 2 : 0}>
      <Box mt={1} mb={1} borderRadius="base" width="100%">
        <HStack mb={2}>
          <Link
            href={`/user/${discussion.author}`}
            _hover={{ textDecoration: "none" }}
            display="flex"
            alignItems="center"
            role="group"
          >
            <Avatar
              size="sm"
              name={discussion.author}
              src={`https://images.hive.blog/u/${discussion.author}/avatar/sm`}
              ml={2}
            />
            <Text
              fontWeight="medium"
              fontSize="sm"
              ml={2}
              whiteSpace="nowrap"
              _groupHover={{ textDecoration: "underline" }}
            >
              {discussion.author}
            </Text>
          </Link>
          <HStack ml={0} width="100%">
            <Text fontWeight="medium" fontSize="sm" color="gray">
              · {commentDate}
            </Text>
            <FaLink
              size={16}
              color="gray"
              cursor="pointer"
              onClick={handleSharePost}
              style={{ marginRight: "2px" }}
            />
          </HStack>
        </HStack>
        <Box>
          <Box
            dangerouslySetInnerHTML={{ __html: markdownRenderer(text) }}
            sx={{
              p: { marginBottom: "1rem", lineHeight: "1.6", marginLeft: "4" },
            }}
          />
          <Box>{renderedMedia}</Box>
        </Box>

        {showSlider ? (
          <Flex mt={4} alignItems="center">
            <Box width="100%" mr={2}>
              <Slider
                aria-label="slider-ex-1"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(val) => setSliderValue(val)}
              >
                <SliderTrack
                  bg="gray.700"
                  height="8px"
                  boxShadow="0 0 10px rgba(255, 255, 0, 0.8)"
                >
                  <SliderFilledTrack bgGradient="linear(to-r, green.400, limegreen, red.400)" />
                </SliderTrack>
                <SliderThumb
                  boxSize="30px"
                  bg="transparent"
                  boxShadow={"none"}
                  _focus={{ boxShadow: "none" }}
                  zIndex={1}
                >
                  <Image
                    src="/images/spitfire.png"
                    alt="thumb"
                    w="100%"
                    h="auto"
                    mr={2}
                    mb={1}
                  />
                </SliderThumb>
              </Slider>
            </Box>
            <Button
              size="xs"
              onClick={handleVote}
              ml={2}
              className="pulse-green"
            >
              &nbsp;&nbsp;&nbsp;Vote {sliderValue} %&nbsp;&nbsp;&nbsp;
            </Button>
            <Button size="xs" onClick={handleHeartClick} ml={2}>
              X
            </Button>
          </Flex>
        ) : (
          <HStack justify="center" spacing={8} mt={3}>
            <HStack>
              <Tooltip label="upvote" hasArrow openDelay={1000}>
                <Button
                  leftIcon={
                    <LuArrowUpRight
                      size={24}
                      color={voted ? undefined : "rgb(75, 72, 72)"}
                      style={{ opacity: voted ? 1 : 0.5 }}
                    />
                  }
                  variant="ghost"
                  onClick={handleHeartClick}
                  size="sm"
                  p={2}
                  _hover={{ bg: "gray.700", borderRadius: "full" }}
                />
              </Tooltip>
              <VoteListPopover
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    ml={1}
                    p={1}
                    _hover={{ textDecoration: "underline" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {uniqueVotes.length}
                  </Button>
                }
                votes={activeVotes}
                post={discussion}
              />
            </HStack>
            <HStack>
              <Tooltip label="comments" hasArrow openDelay={1000}>
                <Button
                  leftIcon={<FaRegComment size={18} />}
                  variant="ghost"
                  onClick={() => handleReplyButtonClick(discussion.permlink)}
                  size="sm"
                >
                  {discussion.children ?? 0}
                </Button>
              </Tooltip>
            </HStack>
            <Tooltip label="reward amount" hasArrow openDelay={1000}>
              <Popover
                placement="top"
                isOpen={isPayoutOpen}
                onClose={closePayout}
                closeOnBlur={true}
              >
                <PopoverTrigger>
                  <span
                    style={{ cursor: "pointer" }}
                    onMouseDown={openPayout}
                    onMouseUp={closePayout}
                  >
                    <Text fontWeight="bold" fontSize="xl">
                      ${rewardAmount.toFixed(2)}
                    </Text>
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  w="auto"
                  bg="gray.800"
                  color="white"
                  borderRadius="md"
                  boxShadow="lg"
                  p={2}
                >
                  <PopoverArrow />
                  <PopoverBody>
                    {isPending ? (
                      <div>
                        <div>
                          <b>Pending</b>
                        </div>
                        <div>
                          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}{" "}
                          until payout
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          Author: <b>${authorPayout.toFixed(3)}</b>
                        </div>
                        <div>
                          Curators: <b>${curatorPayout.toFixed(3)}</b>
                        </div>
                      </>
                    )}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Tooltip>
          </HStack>
        )}
        {inlineComposerStates[discussion.permlink] && (
          <Box mt={2}>
            <SnapComposer
              pa={discussion.author}
              pp={discussion.permlink}
              onNewComment={handleInlineNewReply}
              onClose={() =>
                setInlineComposerStates((prev: Record<string, boolean>) => ({
                  ...prev,
                  [discussion.permlink]: false,
                }))
              }
              post
            />
            {/* Replies loading indicator */}
            {inlineRepliesLoading[discussion.permlink] && (
              <Text mt={2} color="gray.400" fontSize="sm">
                Loading replies...
              </Text>
            )}
            {/* Show replies for this permlink */}
            {inlineRepliesMap[discussion.permlink] &&
              inlineRepliesMap[discussion.permlink].length > 0 && (
                <VStack spacing={2} align="stretch" mt={2}>
                  {inlineRepliesMap[discussion.permlink].map(
                    (reply: Discussion) => {
                      const nextDepth = effectiveDepth + 1;
                      return (
                        <Snap
                          key={reply.permlink}
                          discussion={{ ...reply, depth: nextDepth } as any}
                          onOpen={onOpen}
                          setReply={setReply}
                          setConversation={setConversation}
                        />
                      );
                    }
                  )}
                </VStack>
              )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Snap;

<style jsx global>{`
  .pulse-green {
    animation: pulse-green 1.5s infinite;
    background: var(--chakra-colors-primary, #38ff8e);
    color: var(--chakra-colors-background, black);
    font-weight: bold;
    border: none;
  }
  @keyframes pulse-green {
    0% {
      box-shadow: 0 0 0 0 var(--chakra-colors-accent, rgba(72, 255, 128, 0.7));
    }
    70% {
      box-shadow: 0 0 0 10px var(--chakra-colors-accent, rgba(72, 255, 128, 0));
    }
    100% {
      box-shadow: 0 0 0 0 var(--chakra-colors-accent, rgba(72, 255, 128, 0));
    }
  }
  /* Responsive YouTube iframe for Hive-rendered markdown in Snap */
  .markdown-body iframe[src*="youtube.com"],
  .markdown-body iframe[src*="youtube-nocookie.com"] {
    width: 100% !important;
    height: 100% !important;
    aspect-ratio: 16 / 9;
    min-height: 200px;
    max-width: 100%;
    display: block;
  }
  /* Optional: wrap iframes in a responsive container if needed */
  .markdown-body .responsive-embed {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 */
    height: 0;
    overflow: hidden;
    margin: 16px 0;
  }
  .markdown-body .responsive-embed iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100% !important;
    height: 100% !important;
    border: 0;
  }
`}</style>;
