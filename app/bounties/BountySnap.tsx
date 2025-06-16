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
import VideoRenderer from "@/components/layout/VideoRenderer";
import SnapComposer from "@/components/homepage/SnapComposer";
import { FaLink } from "react-icons/fa6";
import useHivePower from "@/hooks/useHivePower";
import VoteListPopover from "@/components/blog/VoteListModal";

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

interface BountySnapProps {
  Discussion: Discussion;
  onOpen: () => void;
  setReply: (Discussion: Discussion) => void;
  setConversation?: (conversation: Discussion) => void;
  hideSubmitButton?: boolean;
  showMedia?: boolean;
  showTitle?: boolean;
}

const BountySnap = ({ Discussion, onOpen, setReply, setConversation, hideSubmitButton, showMedia, showTitle }: BountySnapProps) => {
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
    const postLink = `${window.location.origin}/@${Discussion.author}/${Discussion.permlink}`;
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
  function parsePayout(val: string | { toString: () => string } | undefined): number {
    if (!val) return 0;
    const str = assetToString(val);
    return parseFloat(str.replace(" HBD", "").replace(",", ""));
  }
  const authorPayout = parsePayout(Discussion.total_payout_value);
  const curatorPayout = parsePayout(Discussion.curator_payout_value);
  // Calculate days remaining for pending payout
  const createdDate = new Date(Discussion.created);
  const now = new Date();
  const timeDifferenceInMs = now.getTime() - createdDate.getTime();
  const timeDifferenceInDays = timeDifferenceInMs / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, 7 - Math.floor(timeDifferenceInDays));
  const isPending = timeDifferenceInDays < 7;
  const { isOpen: isPayoutOpen, onOpen: openPayout, onClose: closePayout } = useDisclosure();

  // Extract Trick/Challenge as title
  let title = "";
  const trickMatch = Discussion.body.match(/Trick\/Challenge:\s*(.*)/);
  if (trickMatch && trickMatch[1]) {
    title = trickMatch[1].trim();
  }

  return (
    <Box pl={effectiveDepth > 1 ? 1 : 0} ml={effectiveDepth > 1 ? 2 : 0}>
      <Box mt={1} mb={1} borderRadius="base" width="100%">
        {/* Title as clickable bold text (only if showTitle) */}
        {showTitle !== false && (
          <Box
            as="button"
            width="100%"
            textAlign="left"
            onClick={onOpen}
            bg="transparent"
            border="none"
            p={0}
            mb={2}
            _hover={{ textDecoration: "underline", cursor: "pointer" }}
          >
            <Text fontWeight="bold" fontSize="xl" mb={1}>
              {title || "Untitled Bounty"}
            </Text>
          </Box>
        )}
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
          {showMedia && <Box>{renderedMedia}</Box>}
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
                p={2}
                _hover={{ bg: 'gray.700', borderRadius: 'full' }}
              />
            </Tooltip>
            <VoteListPopover
              trigger={
                <Button variant="ghost" size="sm" ml={1} p={1} _hover={{ textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>
                  {uniqueVotes.length}
                </Button>
              }
              votes={activeVotes}
              post={Discussion}
            />
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default BountySnap; 