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

const separateContent = (body: string) => {
  const textParts: string[] = [];
  const mediaParts: string[] = [];
  const lines = body.split("\n");
  lines.forEach((line: string) => {
    if (line.match(/!\[.*?\]\(.*\)/) || line.match(/<iframe.*<\/iframe>/)) {
      mediaParts.push(line);
    } else {
      textParts.push(line);
    }
  });
  return { text: textParts.join("\n"), media: mediaParts.join("\n") };
};

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
  Discussion: Discussion;
  onOpen: () => void;
  setReply: (Discussion: Discussion) => void;
  setConversation?: (conversation: Discussion) => void;
}

const Snap = ({ Discussion, onOpen, setReply, setConversation }: SnapProps) => {
  const { aioha, user } = useAioha();
  const { hiveAccount } = useHiveAccount(user || "");
  const { hivePower, isLoading: isHivePowerLoading, error: hivePowerError, estimateVoteValue } = useHivePower(user);
  const toast = useToast();
  const commentDate = getPostDate(Discussion.created);

  const [sliderValue, setSliderValue] = useState(5);
  const [showSlider, setShowSlider] = useState(false);
  const [activeVotes, setActiveVotes] = useState(Discussion.active_votes || []);
  const [rewardAmount, setRewardAmount] = useState(parseFloat(getPayoutValue(Discussion)));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inlineReplies, setInlineReplies] = useState<Discussion[]>([]);
  const [inlineComposerStates, setInlineComposerStates] = useState<
    Record<string, boolean>
  >({});

  const effectiveDepth = Discussion.depth || 0;

  const { text, media } = useMemo(
    () => separateContent(Discussion.body),
    [Discussion.body]
  );
  const renderedMedia = useMemo(() => renderMedia(media), [media]);

  const [voted, setVoted] = useState(
    Discussion.active_votes?.some(
      (item: { voter: string }) => item.voter === user
    ) || false
  );

  function handleHeartClick() {
    setShowSlider(!showSlider);
  }

  function handleConversation() {
    if (setConversation) {
      setConversation(Discussion);
    }
  }

  async function handleVote() {
    const vote = await aioha.vote(
      Discussion.author,
      Discussion.permlink,
      sliderValue * 100
    );
    if (vote.success) {
      setVoted(true);
      setActiveVotes([...activeVotes, { voter: user }]);
      // Estimate the value and optimistically update payout
      if (estimateVoteValue) {
        try {
          const estimatedValue = await estimateVoteValue(sliderValue);
          setRewardAmount((prev) => parseFloat((prev + estimatedValue).toFixed(3)));
        } catch (e) {
          // fallback: do not update payout
        }
      }
    }
    handleHeartClick();
  }

  const handleSharePost = async () => {
    const postLink = `@${window.location.origin}/${Discussion.author}/${Discussion.permlink}`;
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
    setInlineReplies((prev: Discussion[]) => [...prev, newReply]);
  }

  function handleReplyButtonClick(permlink: string) {
    setInlineComposerStates((prev: Record<string, boolean>) => ({
      ...prev,
      [permlink]: !prev[permlink],
    }));
  }

  const replies = Discussion.replies || [];

  return (
    <Box pl={effectiveDepth > 1 ? 1 : 0} ml={effectiveDepth > 1 ? 2 : 0}>
      <Box mt={1} mb={1} borderRadius="base" width="100%">
        <HStack mb={2}>
          <Link
            href={`/@${Discussion.author}`}
            _hover={{ textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            role="group"
          >
            <Avatar
              size="sm"
              name={Discussion.author}
              src={`https://images.hive.blog/u/${Discussion.author}/avatar/sm`}
              ml={2}
            />
            <Text
              fontWeight="medium"
              fontSize="sm"
              ml={2}
              whiteSpace="nowrap"
              _groupHover={{ textDecoration: 'underline' }}
            >
              {Discussion.author}
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

        <Box mt={2}>
          {inlineComposerStates[Discussion.permlink] && (
            <Box mt={2}>
              <SnapComposer
                pa={Discussion.author}
                pp={Discussion.permlink}
                onNewComment={handleInlineNewReply}
                onClose={() =>
                  setInlineComposerStates((prev: Record<string, boolean>) => ({
                    ...prev,
                    [Discussion.permlink]: false,
                  }))
                }
                post
              />
            </Box>
          )}
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
            <Button size="xs" onClick={handleVote} ml={2} className="pulse-green">
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
                    <LuArrowUpRight size={24} color={voted ? undefined : "rgb(75, 72, 72)"} style={{ opacity: voted ? 1 : 0.5 }} />
                  }
                  variant="ghost"
                  onClick={handleHeartClick}
                  size="sm"
                >
                  {activeVotes.length}
                </Button>
              </Tooltip>
            </HStack>
            <HStack>
              <Tooltip label="comments" hasArrow openDelay={1000}>
                <Button
                  leftIcon={<FaRegComment size={18} />}
                  variant="ghost"
                  onClick={() => {
                    console.log(Discussion.depth);
                    effectiveDepth > 1
                      ? handleReplyButtonClick(Discussion.permlink)
                      : handleConversation();
                  }}
                  size="sm"
                >
                  {setConversation && Discussion.children}
                </Button>
              </Tooltip>
            </HStack>
            <Tooltip label="reward amount" hasArrow openDelay={1000}>
              <Text fontWeight="bold" fontSize="xl">
                ${rewardAmount.toFixed(2)}
              </Text>
            </Tooltip>
          </HStack>
        )}
      </Box>

      {(replies.length > 0 || inlineReplies.length > 0) && (
        <VStack spacing={2} align="stretch" mt={2}>
          {[...inlineReplies, ...replies]
            .filter((reply): reply is Discussion => typeof reply !== "string")
            .map((reply: Discussion) => {
              const nextDepth = effectiveDepth + 1;
              return (
                <Snap
                  key={reply.permlink}
                  Discussion={{ ...reply, depth: nextDepth } as any}
                  onOpen={onOpen}
                  setReply={setReply}
                  setConversation={setConversation}
                />
              );
            })}
        </VStack>
      )}
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
`}</style>
