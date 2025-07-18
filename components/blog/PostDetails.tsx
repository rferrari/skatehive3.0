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
  useToast,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { Discussion } from "@hiveio/dhive";
import {
  FaHeart, FaComment, FaRegHeart, FaRegComment, FaShare, FaCopy, FaShareSquare
} from "react-icons/fa";
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
  const toast = useToast();

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

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${author}/${post.permlink}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: "Link copied!",
        description: "Post URL has been copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy URL to clipboard",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

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
        {/* Mobile and Desktop layouts */}
        <Box display={["block", "none"]}>
          {/* Mobile Layout - Two rows */}
          <Flex direction="row" alignItems="center" w="100%" justifyContent="space-between" mb={2}>
            <Flex direction="row" alignItems="center" flex="0 0 auto" minW="0">
              <Avatar
                size="sm"
                name={author}
                src={`https://images.hive.blog/u/${author}/avatar/sm`}
              />
              <Box ml={2} minW="0">
                <Text fontWeight="medium" fontSize="sm" mb={-1} color="colorBackground" isTruncated>
                  <Link href={`/user/${author}`} color="colorBackground">@{author}</Link>
                </Text>
              </Box>
            </Flex>

            <Flex alignItems="center" gap={1} flex="0 0 auto" justifyContent="flex-end">
              <Popover placement="top" isOpen={isPayoutOpen} onClose={closePayout} closeOnBlur={true}>
                <PopoverTrigger>
                  <span style={{ cursor: "pointer" }} onMouseDown={openPayout} onMouseUp={closePayout}>
                    <Text fontWeight="bold" color="primary" fontSize="sm">
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
              <Divider orientation="vertical" h="20px" mx={2} />
              <IconButton
                aria-label="Share post"
                icon={<FaShareSquare />}
                size="sm"
                variant="ghost"
                color="primary"
                onClick={handleShare}
                _hover={{ bg: "transparent", color: "accent" }}
                fontSize="14px"
                minW="auto"
                h="auto"
                p={1}
              />
              {voted ? (
                <Icon
                  as={FaHeart}
                  onClick={handleHeartClick}
                  cursor="pointer"
                  color={"red"}
                  boxSize="14px"
                />
              ) : (
                <Icon
                  as={FaRegHeart}
                  onClick={handleHeartClick}
                  cursor="pointer"
                  color="primary"
                  opacity={0.5}
                  boxSize="14px"
                />
              )}
              <VoteListPopover
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    minW="auto"
                    px={1}
                    _active={{ bg: "transparent" }}
                    color={voted ? "red" : "primary"}
                    _hover={{ textDecoration: 'underline' }}
                    fontSize="sm"
                    h="auto"
                    p={1}
                  >
                    {activeVotes.length}
                  </Button>
                }
                votes={activeVotes}
                post={post}
              />

            </Flex>
          </Flex>

          {/* Mobile Title Row */}
          <Box w="100%" mt={1}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="colorBackground"
              lineHeight="1.3"
              noOfLines={2}
            >
              {title}
            </Text>
          </Box>
        </Box>

        {/* Desktop Layout - Two rows like mobile */}
        <Flex direction="row" alignItems="center" w="100%" justifyContent="space-between" display={["none", "flex"]} mb={2}>
          <Flex direction="row" alignItems="center" flex="0 0 auto" minW="0">
            <Avatar
              size="sm"
              name={author}
              src={`https://images.hive.blog/u/${author}/avatar/sm`}
            />
            <HStack ml={2} minW="0">
              <Text fontWeight="medium" fontSize="sm" color="colorBackground" isTruncated>
                <Link href={`/user/${author}`} color="colorBackground">@{author}</Link>
              </Text>
              <Text fontSize="sm" color="colorBackground">
                - {postDate} ago
              </Text>
            </HStack>
          </Flex>

          <Flex alignItems="center" gap={2} flex="0 0 auto" justifyContent="flex-end">
            <Popover placement="top" isOpen={isPayoutOpen} onClose={closePayout} >
              <PopoverTrigger>
                <span style={{ cursor: "pointer" }} onMouseDown={openPayout} onMouseUp={closePayout}>
                  <Text fontWeight="bold" color="primary" fontSize="xs" mt={1}>
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
            <Divider orientation="vertical" h="20px" mx={2} />
            <IconButton
              aria-label="Share post"
              icon={<FaShareSquare />}
              size="sm"
              variant="ghost"
              color="primary"
              onClick={handleShare}
              _hover={{ bg: "transparent", color: "accent" }}
              fontSize="14px"
              minW="auto"
              h="auto"
              p={1}
            />
            <IconButton
              aria-label={voted ? "Unvote" : "Vote"}
              icon={voted ? <FaHeart /> : <FaRegHeart />}
              size="sm"
              variant="ghost"
              color={voted ? "accent" : "muted"}
              onClick={handleHeartClick}
              _hover={{ bg: "transparent", color: "accent" }}
              fontSize="14px"
              minW="auto"
              h="auto"
              p={1}
              mr={-2}
            />

            <VoteListPopover
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  minW="auto"
                  px={1}
                  _active={{ bg: "transparent" }}
                  color={voted ? "accent" : "muted"}
                  _hover={{ textDecoration: 'underline' }}
                  fontSize="xs"
                  h="auto"
                  p={1}
                >
                  {activeVotes.length}
                </Button>
              }
              votes={activeVotes}
              post={post}
            />

          </Flex>
        </Flex>

        {/* Desktop Title Row */}
        <Box w="100%" display={["none", "block"]}>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="colorBackground"
            lineHeight="1.3"
            noOfLines={2}
          >
            {title}
          </Text>
        </Box>
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
                  <SliderFilledTrack bgGradient="linear(to-r, success, warning, error)" />
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
              bgGradient="linear(to-r, primary, accent)"
              color="background"
              _hover={{ bg: "accent" }}
              fontWeight="bold"
              className="subtle-pulse"
            >
              &nbsp;&nbsp;&nbsp;Vote {sliderValue} %&nbsp;&nbsp;&nbsp;
            </Button>
            <Button 
              size="xs" 
              onClick={handleHeartClick} 
              ml={2}
              bg="muted"
              color="primary"
              _hover={{ bg: "muted", opacity: 0.8 }}
            >
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
        .subtle-pulse {
          animation: subtle-pulse 2s infinite;
        }
        @keyframes subtle-pulse {
          0% {
            box-shadow: 0 0 0 0 var(--chakra-colors-accent);
          }
          70% {
            box-shadow: 0 0 0 4px rgba(72, 255, 128, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(72, 255, 128, 0);
          }
        }
      `}</style>
    </Box>
  );
}