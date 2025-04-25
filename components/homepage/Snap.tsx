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
import SocialMediaShareModal from "./SocialMediaShareModal";
import VideoRenderer from "../layout/VideoRenderer";
import SnapComposer from "./SnapComposer"; // <-- add import for inline composer

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
    // Handle markdown images with IPFS link: render using markdownRenderer to preserve styling.
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
    // Handle iframes with IPFS video links using VideoRenderer.
    if (item.includes("<iframe") && item.includes("</iframe>")) {
      const srcMatch = item.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const url = srcMatch[1];
        // If it's a Pinata URL, convert it to skatehive domain.
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
      // Fallback: render the iframe as HTML if no proper match found.
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
    // Fallback: render using markdownRenderer (could be plain text content)
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
  const commentDate = getPostDate(Discussion.created);

  // State declarations
  const [sliderValue, setSliderValue] = useState(5);
  const [showSlider, setShowSlider] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(getPayoutValue(Discussion));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inlineReplies, setInlineReplies] = useState<Discussion[]>([]);
  const [inlineComposerStates, setInlineComposerStates] = useState<
    Record<string, boolean>
  >({});

  // Use native depth; default to 0 if no depth property exists
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
      // No additional property added; rely on the Discussion object as is
      setConversation(Discussion);
    }
  }

  async function handleVote() {
    const votingValue = await calculateUserVoteValue(hiveAccount);
    const newRewardAmount =
      parseFloat(rewardAmount) + votingValue * (sliderValue / 100);
    const vote = await aioha.vote(
      Discussion.author,
      Discussion.permlink,
      sliderValue * 100
    );
    if (vote.success) {
      setVoted(true);
      setRewardAmount(newRewardAmount.toFixed(3));
    }
    handleHeartClick();
  }

  const handleSharePost = async () => {
    const postLink = `@${window.location.origin}/${Discussion.author}/${Discussion.permlink}`;
    await navigator.clipboard.writeText(postLink);
    console.log("Post link copied to clipboard:", postLink);
  };

  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);
  const openTippingModal = () => {
    console.log("Tipping modal opened");
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

  // Ensure replies is always an array
  const replies = Discussion.replies || [];

  return (
    <Box pl={effectiveDepth > 0 ? 1 : 0} ml={effectiveDepth > 0 ? 2 : 0}>
      <Box mt={1} mb={1} borderRadius="base" width="100%">
        <HStack mb={2}>
          <Avatar
            size="sm"
            name={Discussion.author}
            src={`https://images.hive.blog/u/${Discussion.author}/avatar/sm`}
            ml={2}
          />
          <HStack ml={0} width="100%">
            <Text fontWeight="medium" fontSize="sm">
              <Link href={`/@${Discussion.author}`}>{Discussion.author}</Link>
            </Text>
            <Text fontWeight="medium" fontSize="sm" color="gray">
              · {commentDate}
            </Text>
          </HStack>
        </HStack>
        <Box>
          {/* Render text portion with unified markdownRenderer */}
          <Box
            dangerouslySetInnerHTML={{ __html: markdownRenderer(text) }}
            sx={{
              p: { marginBottom: "1rem", lineHeight: "1.6", marginLeft: "4" },
            }}
          />
          {/* Render memoized media portion */}
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

        {/* Existing slider/vote or other buttons */}
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
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
            <Button size="xs" onClick={handleVote}>
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
                    voted ? (
                      <LuArrowUpRight size={24} color="#00b894" />
                    ) : (
                      <LuArrowUpRight size={24} />
                    )
                  }
                  variant="ghost"
                  onClick={handleHeartClick}
                  size="sm"
                >
                  {Discussion.active_votes?.length}
                </Button>
              </Tooltip>
              <Tooltip label="reward amount" hasArrow openDelay={1000}>
                <Text fontWeight="bold" fontSize="sm">
                  ${rewardAmount}
                </Text>
              </Tooltip>
            </HStack>
            <HStack
              onClick={() => {
                console.log(Discussion.depth);
                effectiveDepth > 1
                  ? handleReplyButtonClick(Discussion.permlink)
                  : handleConversation();
              }}
            >
              <FaRegComment cursor="pointer" size={20} />
              {setConversation && (
                <Text cursor="pointer" fontWeight="bold">
                  {Discussion.children}
                </Text>
              )}
            </HStack>
          </HStack>
        )}
      </Box>

      {/* Render replies recursively, merging inline replies */}
      {(replies.length > 0 || inlineReplies.length > 0) && (
        <VStack spacing={2} align="stretch" mt={2}>
          {[...inlineReplies, ...replies]
            .filter((reply): reply is Discussion => typeof reply !== "string")
            .map((reply: Discussion) => {
              // Use the native depth if available; otherwise calculate next depth.
              const nextDepth = effectiveDepth + 1;
              return (
                <Snap
                  key={reply.permlink}
                  Discussion={{ ...reply, depth: nextDepth } as any} // Fix: cast to any so depth is allowed
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
