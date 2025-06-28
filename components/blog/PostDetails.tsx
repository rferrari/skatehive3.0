import {
  Box,
  Text,
  Avatar,
  Flex,
  Icon,
  Button,
  Link,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Divider,
  Image,
  useTheme,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { Discussion } from "@hiveio/dhive";
import { FaHeart, FaComment, FaRegHeart, FaRegComment } from "react-icons/fa";
import { getPostDate } from "@/lib/utils/GetPostDate";
import { useAioha } from "@aioha/react-ui";
import { getPayoutValue } from "@/lib/hive/client-functions";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";
import useHivePower from "@/hooks/useHivePower";
import VoteListPopover from "./VoteListModal";
import ReactMarkdown from 'react-markdown';
import rehypeMentionLinks from '@/lib/utils/rehypeMentionLinks';
import rehypeRaw from 'rehype-raw';
import { processMediaContent } from '@/lib/utils/MarkdownRenderer';

interface PostDetailsProps {
  post: Discussion;
  onOpenConversation: () => void;
}

export default function PostDetails({ post, onOpenConversation }: PostDetailsProps) {
  const { title, author, body, created } = post;
  const postDate = getPostDate(created);
  const { aioha, user } = useAioha();
  const [sliderValue, setSliderValue] = useState(100);
  const [showSlider, setShowSlider] = useState(false);
  const [activeVotes, setActiveVotes] = useState(post.active_votes || []);
  const [payoutValue, setPayoutValue] = useState(parseFloat(getPayoutValue(post)));
  const [voted, setVoted] = useState(
    post.active_votes?.some((item) => item.voter.toLowerCase() === user?.toLowerCase())
  );

  const { hivePower, isLoading: isHivePowerLoading, error: hivePowerError, estimateVoteValue } = useHivePower(user);
  const theme = useTheme();

  // Get theme colors
  const primary = theme.colors.primary ?? '#38ff8e';
  const secondary = theme.colors.secondary ?? '#1d211f';
  const accent = theme.colors.accent ?? '#48BB78';
  const muted = theme.colors.muted ?? '#276749';
  const color = theme.colors.color ?? '#F0FFF4';
  const colorBackground = theme.colors.background ?? '#121212';

  // Compose gradient and box shadows using theme colors
  const detailsGradient = `linear-gradient(to bottom, ${primary}, ${secondary})`;
  const boxShadowAccent = `0 0 0 0 ${accent}B3`;
  const boxShadowAccent10 = `0 0 0 10px ${accent}00`;

  const pulseGreenStyle = {
    background: primary,
    color: 'black',
    fontWeight: 'bold',
    border: 'none',
  };

  const processedBody = processMediaContent(body);
  const markdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (processedBody.includes("<!--INSTAGRAM_EMBED_SCRIPT-->") && typeof window !== "undefined") {
      // Remove any existing Instagram embed script
      const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      } else {
        // @ts-ignore
        const instgrm = (window as any).instgrm;
        if (instgrm && instgrm.Embeds) {
          instgrm.Embeds.process();
        }
      }
    }
  }, [processedBody]);

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
      // Estimate the value and optimistically update payout
      if (estimateVoteValue) {
        try {
          const estimatedValue = await estimateVoteValue(sliderValue);
          setPayoutValue((prev) => prev + estimatedValue);
        } catch (e) {
          // fallback: do not update payout
        }
      }
    }
    handleHeartClick();
  }

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
  // Payout logic copied from PostCard
  const createdDate = new Date(post.created);
  const now = new Date();
  const timeDifferenceInMs = now.getTime() - createdDate.getTime();
  const timeDifferenceInDays = timeDifferenceInMs / (1000 * 60 * 60 * 24);
  const isPending = timeDifferenceInDays < 7;
  let daysRemaining = 0;
  if (isPending) {
    daysRemaining = Math.max(0, 7 - Math.floor(timeDifferenceInDays));
  }
  const authorPayout = parsePayout(post.total_payout_value);
  const curatorPayout = parsePayout(post.curator_payout_value);
  // Popover state for payout split
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  function openPayout() { setIsPayoutOpen(true); }
  function closePayout() { setIsPayoutOpen(false); }

  return (
    <Box
      data-component="PostDetails"
      borderRadius="base"
      overflow="hidden"
      bg="muted"
      mb={3}
      p={4}
      w="100%"
      mt={{ base: "0px", md: "10px" }}
    >
      <Flex
        data-subcomponent="PostDetails/Header"
        direction="column"
        boxShadow={theme.shadows.md}
        bg={detailsGradient}
        p={4}
        mb={4}
      >
        <Flex direction={["column", "row"]} alignItems={["flex-start", "center"]} w="100%">
          <Avatar
            size="sm"
            name={author}
            src={`https://images.hive.blog/u/${author}/avatar/sm`}
          />
          <Box ml={[0, 3]} mt={[2, 0]} whiteSpace="nowrap">
            <Text fontWeight="medium" fontSize="sm" mb={-2} color={colorBackground}>
              <Link href={`/user/${author}`} color={colorBackground}>@{author}</Link>
            </Text>
            <Text fontSize="sm" color={colorBackground}>
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
            <Text fontSize="lg" fontWeight="bold" color={colorBackground}>
              {title}
            </Text>
          </Box>
          <Flex alignItems="center" ml={[0, 4]} mt={[2, 0]}>
            {voted ? (
              <Icon
                as={FaHeart}
                onClick={handleHeartClick}
                cursor="pointer"
                color={primary}
              />
            ) : (
              <Icon
                as={FaRegHeart}
                onClick={handleHeartClick}
                cursor="pointer"
                color={primary}
                opacity={0.5}
              />
            )}
            <VoteListPopover
              trigger={
                <Button variant="ghost" size="sm" ml={2} p={1} color={primary} _hover={{ textDecoration: 'underline' }}>
                  {activeVotes.length}
                </Button>
              }
              votes={activeVotes}
              post={post}
            />
            <Popover placement="top" isOpen={isPayoutOpen} onClose={closePayout} closeOnBlur={true}>
              <PopoverTrigger>
                <span style={{ cursor: "pointer" }} onMouseDown={openPayout} onMouseUp={closePayout}>
                  <Text ml={3} fontWeight="bold" color={primary} fontSize="md">
                    ${payoutValue.toFixed(2)}
                  </Text>
                </span>
              </PopoverTrigger>
              <PopoverContent w="auto" bg="gray.800" color="white" borderRadius="md" boxShadow="lg" p={2}>
                <PopoverArrow />
                <PopoverBody>
                  {isPending ? (
                    <div>
                      <div>
                        <b>Pending</b>
                      </div>
                      <div>
                        {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} until payout
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
          </Flex>
        </Flex>
        {showSlider ? (
          <Flex
            data-subcomponent="PostDetails/VoteControls"
            mt={2}
            alignItems="center"
            w="100%"
          >
            <Box width="100%" mr={2}>
              <Slider
                aria-label="slider-ex-1"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(val) => setSliderValue(val)}
              >
                <SliderTrack
                  bg={muted}
                  height="8px"
                  boxShadow={boxShadowAccent}
                >
                  <SliderFilledTrack bgGradient={`linear(to-r, ${primary}, ${accent}, red.400)`} />
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
            <Button size="xs" onClick={handleVote} className="pulse-green">
              &nbsp;&nbsp;&nbsp;Vote {sliderValue} %&nbsp;&nbsp;&nbsp;
            </Button>
            <Button size="xs" onClick={handleHeartClick} ml={2}>
              X
            </Button>
          </Flex>
        ) : null}
      </Flex>

      <Divider />

      <Box mt={4} className="markdown-body" ref={markdownRef}>
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: markdownRenderer(processedBody.replace("<!--INSTAGRAM_EMBED_SCRIPT-->", "")) }}
        />
      </Box>

      <style jsx global>{`
        .markdown-body .instagram-media {
          display: block;
          margin-left: auto !important;
          margin-right: auto !important;
          margin-top: 2rem;
          margin-bottom: 2rem;
          max-width: 100%;
        }
        .pulse-green {
          animation: pulse-green 1.5s infinite;
          background: ${primary};
          color: black;
          font-weight: bold;
          border: none;
        }
        @keyframes pulse-green {
          0% {
            box-shadow: ${boxShadowAccent} ${boxShadowAccent10};
          }
          70% {
            box-shadow: ${boxShadowAccent} ${boxShadowAccent10};
          }
          100% {
            box-shadow: ${boxShadowAccent} ${boxShadowAccent10};
          }
        }
      `}</style>
    </Box>
  );
}
