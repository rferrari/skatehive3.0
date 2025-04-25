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
import { Comment } from "@hiveio/dhive";
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

// Extend the Comment type to include the level property and missing properties
interface ExtendedComment extends Comment {
  level?: number;
  replies?: ExtendedComment[];
  active_votes?: { voter: string }[];
}

interface SnapProps {
  comment: ExtendedComment;
  onOpen: () => void;
  setReply: (comment: Comment) => void;
  setConversation?: (conversation: ExtendedComment) => void;
  level?: number;
}

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

const Snap = ({
  comment,
  onOpen,
  setReply,
  setConversation,
  level = 0,
}: SnapProps) => {
  const { aioha, user } = useAioha();
  const { hiveAccount } = useHiveAccount(user || "");
  const commentDate = getPostDate(comment.created);

  // State declarations
  const [sliderValue, setSliderValue] = useState(5);
  const [showSlider, setShowSlider] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(getPayoutValue(comment));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inlineReplies, setInlineReplies] = useState<Comment[]>([]);
  const [inlineComposerStates, setInlineComposerStates] = useState<
    Record<string, boolean>
  >({});

  // Force level 1 if parent's permlink contains "snaps" when current level is 0
  const effectiveLevel =
    level === 0 &&
    comment.parent_permlink &&
    comment.parent_permlink.includes("snaps")
      ? 1
      : level; // Fix me: I am just a clanky way of setting level so the snapcomposer opens on click

  const { text, media } = useMemo(
    () => separateContent(comment.body),
    [comment.body]
  );
  const renderedMedia = useMemo(() => renderMedia(media), [media]);

  const [voted, setVoted] = useState(
    comment.active_votes?.some(
      (item: { voter: string }) => item.voter === user
    ) || false
  );

  function handleHeartClick() {
    setShowSlider(!showSlider);
  }

  function handleConversation() {
    if (setConversation) {
      setConversation({ ...comment, level: effectiveLevel });
    }
  }

  async function handleVote() {
    const votingValue = await calculateUserVoteValue(hiveAccount);
    const newRewardAmount =
      parseFloat(rewardAmount) + votingValue * (sliderValue / 100);
    const vote = await aioha.vote(
      comment.author,
      comment.permlink,
      sliderValue * 100
    );
    if (vote.success) {
      setVoted(true);
      setRewardAmount(newRewardAmount.toFixed(3));
    }
    handleHeartClick();
  }

  const handleSharePost = async () => {
    const postLink = `@${window.location.origin}/${comment.author}/${comment.permlink}`;
    await navigator.clipboard.writeText(postLink);
    console.log("Post link copied to clipboard:", postLink);
  };

  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);
  const openTippingModal = () => {
    console.log("Tipping modal opened");
  };

  function handleInlineNewReply(newComment: Partial<Comment>) {
    const newReply = newComment as Comment;
    setInlineReplies((prev: Comment[]) => [...prev, newReply]);
  }

  function handleReplyButtonClick(permlink: string) {
    setInlineComposerStates((prev: Record<string, boolean>) => ({
      ...prev,
      [permlink]: !prev[permlink],
    }));
  }

  // Ensure replies is always an array
  const replies = comment.replies || [];

  return (
    <Box pl={effectiveLevel > 0 ? 1 : 0} ml={effectiveLevel > 0 ? 2 : 0}>
      <Box mt={1} mb={1} borderRadius="base" width="100%">
        <HStack mb={2}>
          <Avatar
            size="sm"
            name={comment.author}
            src={`https://images.hive.blog/u/${comment.author}/avatar/sm`}
            ml={2}
          />
          <HStack ml={0} width="100%">
            <Text fontWeight="medium" fontSize="sm">
              <Link href={`/@${comment.author}`}>{comment.author}</Link>
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
          {inlineComposerStates[comment.permlink] && (
            <Box mt={2}>
              <SnapComposer
                pa={comment.author}
                pp={comment.permlink}
                onNewComment={handleInlineNewReply}
                onClose={() =>
                  setInlineComposerStates((prev: Record<string, boolean>) => ({
                    ...prev,
                    [comment.permlink]: false,
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
                  {comment.active_votes?.length}
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
                effectiveLevel > 0
                  ? handleReplyButtonClick(comment.permlink)
                  : handleConversation();
              }}
            >
              <FaRegComment cursor="pointer" size={20} />
              {setConversation && (
                <Text cursor="pointer" fontWeight="bold">
                  {comment.children}
                </Text>
              )}
            </HStack>
          </HStack>
        )}
      </Box>

      {/* Render replies recursively, merging inline replies */}
      {(replies.length > 0 || inlineReplies.length > 0) && (
        <VStack spacing={2} align="stretch" mt={2}>
          {[...inlineReplies, ...replies].map((reply: ExtendedComment) => {
            const nextLevel = effectiveLevel + 1;
            return (
              <Snap
                key={reply.permlink}
                comment={reply}
                onOpen={onOpen}
                setReply={setReply}
                setConversation={setConversation}
                level={nextLevel}
              />
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

export default Snap;
