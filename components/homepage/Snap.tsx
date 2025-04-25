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
import { ExtendedComment } from "@/hooks/useComments";
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

interface SnapProps {
  comment: ExtendedComment;
  onOpen: () => void;
  setReply: (comment: Comment) => void;
  setConversation?: (conversation: Comment) => void;
  level?: number; // Added level for indentation
}

const separateContent = (body: string) => {
  const textParts: string[] = [];
  const mediaParts: string[] = [];
  const lines = body.split("\n");
  lines.forEach((line) => {
    if (line.match(/!\[.*?\]\(.*\)/) || line.match(/<iframe.*<\/iframe>/)) {
      mediaParts.push(line);
    } else {
      textParts.push(line);
    }
  });
  return { text: textParts.join("\n"), media: mediaParts.join("\n") };
};

const renderMedia = (mediaContent: string) => {
  return mediaContent.split("\n").map((item, index) => {
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
  const commentDate = getPostDate(comment.created);
  const { aioha, user } = useAioha();
  const { hiveAccount } = useHiveAccount(user || "");
  const [voted, setVoted] = useState(
    comment.active_votes?.some((item) => item.voter === user)
  );
  const [sliderValue, setSliderValue] = useState(5);
  const [showSlider, setShowSlider] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(getPayoutValue(comment));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const calculateVotingPower = () => {
    if (!hiveAccount || !hiveAccount.voting_manabar) return 0;
    const { voting_manabar, voting_power } = hiveAccount;
    const elapsedTime = Date.now() / 1000 - voting_manabar.last_update_time;
    const regeneratedMana = (elapsedTime * 10000) / 432000;
    const currentMana = Math.min(
      Number(voting_manabar.current_mana) + regeneratedMana,
      10000
    );
    return (currentMana / 10000) * voting_power;
  };

  const currentVotingPower = calculateVotingPower();

  useEffect(() => {
    const logVotingValue = async () => {
      if (hiveAccount) {
        const votingValue = await calculateUserVoteValue(hiveAccount);
      }
    };
    logVotingValue();
  }, [hiveAccount]);

  const replies = comment.replies;

  function handleHeartClick() {
    setShowSlider(!showSlider);
  }

  function handleReplyModal() {
    setReply(comment);
    onOpen();
  }

  function handleConversation() {
    if (setConversation) setConversation(comment);
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
    // Placeholder for tipping modal logic
    console.log("Tipping modal opened");
  };

  // Memoize splitting the comment body into text and media parts
  const { text, media } = useMemo(
    () => separateContent(comment.body),
    [comment.body]
  );

  // Memoize the rendered media portion
  const renderedMedia = useMemo(() => renderMedia(media), [media]);

  return (
    <Box pl={level > 0 ? 1 : 0} ml={level > 0 ? 2 : 0}>
      <Box
        mt={1}
        mb={1}
        borderRadius="base" // This will apply the borderRadius from your theme
        width="100%"
      >
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
              p: {
                marginBottom: "1rem",
                lineHeight: "1.6",
                marginLeft: "4",
              },
            }}
          />
          {/* Render memoized media portion */}
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
            <HStack onClick={handleConversation}>
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
      {/* Render Social Media Share Modal */}
      {isShareModalOpen && (
        <SocialMediaShareModal
          isOpen={isShareModalOpen}
          onClose={closeShareModal}
          comment={comment}
        />
      )}
      {/* Render replies recursively */}
      {replies && replies.length > 0 && (
        <VStack spacing={2} align="stretch" mt={2}>
          {replies.map((reply: Comment) => (
            <Snap
              key={reply.permlink}
              comment={reply}
              onOpen={onOpen}
              setReply={setReply}
              setConversation={setConversation}
              level={level + 1} // Increment level for indentation
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default Snap;
