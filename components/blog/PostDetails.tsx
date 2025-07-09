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
  background,
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { Discussion } from "@hiveio/dhive";
import { FaHeart, FaComment, FaRegHeart, FaRegComment } from "react-icons/fa";
import { getPostDate } from "@/lib/utils/GetPostDate";
import { useAioha } from "@aioha/react-ui";
import { getPayoutValue } from "@/lib/hive/client-functions";
import useHivePower from "@/hooks/useHivePower";
import VoteListPopover from "./VoteListModal";
import { processMediaContent } from '@/lib/utils/MarkdownRenderer';
import HiveMarkdown from "@/components/shared/HiveMarkdown";
import VideoRenderer from "@/components/layout/VideoRenderer";

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

  // Compose gradient and box shadows using theme color names directly
  const detailsGradient = `linear-gradient(to bottom, var(--chakra-colors-secondary, #1d211f), var(--chakra-colors-primary, #38ff8e))`;
  const boxShadowAccent = `0 0 0 0 var(--chakra-colors-accent, #48BB78B3)`;
  const boxShadowAccent10 = `0 0 0 10px var(--chakra-colors-accent, #48BB7800)`;

  const pulseGreenStyle = {
    background: "primary",
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

  // Replace video-embed divs with a placeholder
  const processedBodyWithPlaceholders = processedBody.replace(/<div class="video-embed" data-ipfs-hash="([^"]+)">[\s\S]*?<\/div>/g, (_, videoID) => `[[VIDEO:${videoID}]]`);

  // Helper to render body with VideoRenderer components and Odysee iframes
  function renderBodyWithVideos(body: string) {
    // Split on all supported video placeholders
    const parts = body.split(/(\[\[(VIDEO|ODYSEE|YOUTUBE|VIMEO):([^\]]+)\]\])/g);
    return parts.map((part, idx) => {
      // Handle IPFS video
      const videoMatch = part.match(/^\[\[VIDEO:([^\]]+)\]\]$/);
      if (videoMatch) {
        const videoID = videoMatch[1];
        return (
          <VideoRenderer key={`video-${videoID}-${idx}`} src={`https://ipfs.skatehive.app/ipfs/${videoID}`} />
        );
      }
      // Handle Odysee iframe and hide the Odysee URL line
      const odyseeMatch = part.match(/^\[\[ODYSEE:([^\]]+)\]\]$/);
      if (odyseeMatch) {
        const odyseeUrl = odyseeMatch[1];
        return (
          <iframe
            key={`odysee-${idx}`}
            src={odyseeUrl}
            style={{ width: '100%', aspectRatio: '16 / 9', border: 0 }}
            allowFullScreen
            id={`odysee-iframe-${idx}`}
          />
        );
      }
      // Handle YouTube
      const youtubeMatch = part.match(/^\[\[YOUTUBE:([^\]]+)\]\]$/);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return (
          <iframe
            key={`youtube-${idx}`}
            src={`https://www.youtube.com/embed/${videoId}`}
            style={{ width: '100%', aspectRatio: '16 / 9', border: 0 }}
            allowFullScreen
            id={`youtube-iframe-${idx}`}
          />
        );
      }
      // Handle Vimeo
      const vimeoMatch = part.match(/^\[\[VIMEO:([^\]]+)\]\]$/);
      if (vimeoMatch) {
        const videoId = vimeoMatch[1];
        return (
          <iframe
            key={`vimeo-${idx}`}
            src={`https://player.vimeo.com/video/${videoId}`}
            style={{ width: '100%', aspectRatio: '16 / 9', border: 0 }}
            allowFullScreen
            id={`vimeo-iframe-${idx}`}
          />
        );
      }
      // Hide Odysee URLs that appear alone on a line
      const partWithoutOdyseeUrl = part.replace(/^https?:\/\/(?:www\.)?odysee.com\/[\S]+$/gm, "");
      // Hide plain CIDs (hashes) that appear alone on a line
      const partWithoutCID = partWithoutOdyseeUrl.replace(/^(Qm[1-9A-HJ-NP-Za-km-z]{44,})$/gm, "");
      return <HiveMarkdown key={`md-${idx}`} markdown={partWithoutCID} />;
    });
  }

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
        bg={"background"}
        p={2}
        mb={2}
        border={"1px solid"}
        borderColor={"primary"}
      >
        <Flex direction="row" alignItems="center" w="100%" flexWrap={["wrap", "nowrap"]}>
          <Flex direction={["column", "row"]} alignItems={["center", "center"]}>
            <Avatar
              size="sm"
              name={author}
              src={`https://images.hive.blog/u/${author}/avatar/sm`}
            />
            <Box ml={[0, 2]} mt={[1, 0]} whiteSpace="nowrap" textAlign={["center", "left"]}>
              <Text fontWeight="medium" fontSize="sm" mb={-2} color="colorBackground">
                <Link href={`/user/${author}`} color="colorBackground">@{author}</Link>
              </Text>
              <Text fontSize="sm" color="colorBackground">
                {postDate}
              </Text>
            </Box>
          </Flex>
          <Divider
            orientation="vertical"
            h={["34px", "34px"]}
            borderColor="color"
            mx={4}
            display={["block", "none"]}
            p={1}
          />
          <Divider
            orientation="vertical"
            h="34px"
            borderColor="color"
            mx={4}
            display={["none", "block"]}
          />
          <Box flexGrow={1} ml={2} mt={0} textAlign="start" minWidth={0} maxW={["60%", "100%"]} overflow="hidden">
            <Text fontSize="lg" fontWeight="bold" color="colorBackground" isTruncated>
              {title}
            </Text>
          </Box>
          <Flex alignItems="center" ml={[0, 2]} mt={[2, 0]}>
            {voted ? (
              <Icon
                as={FaHeart}
                onClick={handleHeartClick}
                cursor="pointer"
                color={"red"}
              />
            ) : (
              <Icon
                as={FaRegHeart}
                onClick={handleHeartClick}
                cursor="pointer"
                color="primary"
                opacity={0.5}
              />
            )}
            <VoteListPopover
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  ml={0}
                  p={-2}
                  _active={{ bg: "transparent" }}
                  color={voted ? "red" : "primary"}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {activeVotes.length}
                </Button>
              }
              votes={activeVotes}
              post={post}
            />
            <Popover placement="top" isOpen={isPayoutOpen} onClose={closePayout} closeOnBlur={true}>
              <PopoverTrigger>
                <span style={{ cursor: "pointer" }} onMouseDown={openPayout} onMouseUp={closePayout}>
                  <Text ml={3} fontWeight="bold" color="primary" fontSize="md">
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
                  bg="muted"
                  height="8px"
                  boxShadow={boxShadowAccent}
                >
                  <SliderFilledTrack bgGradient={`linear(to-r, var(--chakra-colors-primary, #38ff8e), var(--chakra-colors-accent, #48BB78), red.400)`} />
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
        {renderBodyWithVideos(processedBodyWithPlaceholders)}
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
        .markdown-body table {
          border-collapse: collapse;
          width: 100%;
          margin: 2rem 0;
          background: #181c1f;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.12);
          border: 1px solid primary;

        }
        .markdown-body th, .markdown-body td {
          border: 1px solid #333;
          padding: 12px 16px;
          text-align: left;
        }
        .markdown-body th {
          background: #23272b;
          color: #38ff8e;
          font-weight: bold;
          font-size: 1.1em;
        }
        .markdown-body tr:nth-child(even) {
          background: #202426;
        }
        .markdown-body tr:nth-child(odd) {
          background: #181c1f;
        }
        .markdown-body td {
          color: #e0e0e0;
        }
        .pulse-green {
          animation: pulse-green 1.5s infinite;
          background: var(--chakra-colors-primary, #38ff8e);
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