import {
  Box,
  Image,
  Text,
  Avatar,
  Flex,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  useDisclosure,
  Tooltip,
} from "@chakra-ui/react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Discussion } from "@hiveio/dhive";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { getPostDate } from "@/lib/utils/GetPostDate";
import { useAioha } from "@aioha/react-ui";
import { useRouter } from "next/navigation";
import { getPayoutValue } from "@/lib/hive/client-functions";
import {
  extractYoutubeLinks,
  LinkWithDomain,
  extractImageUrls,
} from "@/lib/utils/extractImageUrls";
import useHivePower from "@/hooks/useHivePower";
import { parseJsonMetadata } from "@/lib/hive/metadata-utils";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";
import { UpvoteButton } from "@/components/shared";

interface PostJsonMetadata {
  app?: string;
  format?: string;
  description?: string;
  tags?: string[];
  users?: string[];
  links?: string[];
  image?: string | string[];
  [key: string]: any;
}

interface PostCardProps {
  post: Discussion;
  listView?: boolean;
  hideAuthorInfo?: boolean;
  maxWidth?: string;
}

export default function PostCard({
  post,
  listView = false,
  hideAuthorInfo = false,
  maxWidth = "100%",
}: PostCardProps) {
  const { title, author, body, json_metadata, created } = post;
  const postDate = getPostDate(created);

  const metadata = useMemo((): PostJsonMetadata => {
    const parsed = parseJsonMetadata(json_metadata);
    return (parsed && typeof parsed === "object") ? parsed : {};
  }, [json_metadata]);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<LinkWithDomain[]>([]);
  const [showSlider, setShowSlider] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const { user } = useAioha();
  const {
    isLoading: isHivePowerLoading,
    error: hivePowerError,
    estimateVoteValue,
  } = useHivePower(user);
  const [activeVotes, setActiveVotes] = useState(post.active_votes || []);
  const [payoutValue, setPayoutValue] = useState(parseFloat(getPayoutValue(post)));
  const [voted, setVoted] = useState(
    post.active_votes?.some((item) => item.voter.toLowerCase() === user?.toLowerCase())
  );
  const router = useRouter();
  const default_thumbnail = "https://images.hive.blog/u/" + author + "/avatar/large";
  const [visibleImages, setVisibleImages] = useState<number>(3);
  const {
    isOpen: isPayoutOpen,
    onOpen: openPayout,
    onClose: closePayout,
    onToggle: togglePayout,
  } = useDisclosure();
  const [showMatrix, setShowMatrix] = useState(false);

  const createdDate = new Date(post.created);
  const now = new Date();
  const timeDifferenceInMs = now.getTime() - createdDate.getTime();
  const timeDifferenceInDays = timeDifferenceInMs / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, 7 - Math.floor(timeDifferenceInDays));
  const isPending = timeDifferenceInDays < 7;

  useEffect(() => {
    let images: string[] = [];
    if (metadata.image) {
      images = Array.isArray(metadata.image) ? metadata.image : [metadata.image];
    }
    const markdownImages = extractImageUrls(body);
    images = images.concat(markdownImages);

    const validImages = images.filter((img) => !failedImages.has(img));
    if (validImages.length > 0) {
      setImageUrls(validImages);
    } else {
      const ytLinks = extractYoutubeLinks(body);
      if (ytLinks.length > 0) {
        setYoutubeLinks(ytLinks);
        setImageUrls([]);
      } else {
        setImageUrls([default_thumbnail]);
      }
    }
  }, [body, metadata, default_thumbnail, post, failedImages]);

  function handleSlideChange(swiper: any) {
    if (swiper.activeIndex === visibleImages - 1 && visibleImages < imageUrls.length) {
      setVisibleImages((prev) => Math.min(prev + 3, imageUrls.length));
    }
  }

  function stopPropagation(e: Event) {
    e.stopPropagation();
  }

  function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const img = e.currentTarget;
    const originalSrc = img.src;

    setFailedImages((prev) => new Set(prev).add(originalSrc));

    if (img.src !== default_thumbnail) {
      img.src = default_thumbnail;
      img.onerror = null;
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  let summarySource = body;
  if (listView) {
    summarySource = summarySource.replace(/!\[[^\]]*\]\([^\)]*\)/g, "");
    summarySource = summarySource.replace(/!\[\]\([^\)]*\)/g, "");
    summarySource = summarySource.replace(/\[[^\]]*\]\([^\)]*\)/g, "");
    summarySource = summarySource.replace(
      /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g,
      ""
    );
    summarySource = summarySource.replace(/<[^>]+>/g, "");
  }
  const summary = summarySource
    .replace(/[#*_`>\[\]()!\-]/g, "")
    .replace(/\n+/g, " ");

  const uniqueVotesMap = new Map();
  activeVotes.forEach((vote) => {
    uniqueVotesMap.set(vote.voter, vote);
  });
  const uniqueVotes = Array.from(uniqueVotesMap.values());

  function assetToString(val: string | { toString: () => string }): string {
    return typeof val === "string" ? val : val.toString();
  }

  function parsePayout(val: string | { toString: () => string } | undefined): number {
    if (!val) return 0;
    const str = assetToString(val);
    return parseFloat(str.replace(" HBD", "").replace(",", ""));
  }
  const authorPayout = parsePayout(post.total_payout_value);
  const curatorPayout = parsePayout(post.curator_payout_value);

  if (listView) {
    return (
      <Box
        overflow="hidden"
        height="200px"
        display="flex"
        flexDirection="row"
        bg="background"
        border="1px solid"
        borderColor="muted"
        maxWidth={maxWidth}
      >
        <Box
          w={{ base: "120px", md: "160px" }}
          h="100%"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="muted"
          maxWidth="100%"
        >
          {imageUrls.length > 0 ? (
            <Image
              src={imageUrls[0]}
              alt={title}
              borderRadius="base"
              objectFit="cover"
              w="100%"
              h="100%"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <Image
              src={default_thumbnail}
              alt="default thumbnail"
              borderRadius="base"
              objectFit="cover"
              w="100%"
              h="100%"
              loading="lazy"
              onError={handleImageError}
            />
          )}
        </Box>
        <Flex direction="column" flex={1} p={4} minW={0} maxWidth="100%">
          <Box flex={1} overflow="hidden">
            <Link
              href={`/post/${author}/${post.permlink}`}
              _hover={{ textDecoration: "underline" }}
            >
              <Text
                fontWeight="bold"
                fontSize={listView ? "sm" : "sm"}
                mb={1}
                isTruncated={false}
                whiteSpace="normal"
                wordBreak="break-word"
                noOfLines={2}
              >
                {title}
              </Text>
            </Link>
            <Text fontSize="xs" color="muted" mb={2} textAlign="right">
              {postDate}
            </Text>
            <Text
              fontSize="sm"
              color="gray.400"
              mb={2}
              noOfLines={3}
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {summary}
            </Text>
          </Box>
          <Flex
            alignItems="center"
            justifyContent="flex-end"
            gap={4}
            mt={2}
            flexShrink={0}
          >
            <UpvoteButton
              discussion={post}
              voted={voted}
              setVoted={setVoted}
              activeVotes={activeVotes}
              setActiveVotes={setActiveVotes}
              onVoteSuccess={(estimatedValue?: number) => {
                if (estimatedValue) {
                  setPayoutValue((prev) => prev + estimatedValue);
                }
              }}
              estimateVoteValue={estimateVoteValue}
              isHivePowerLoading={isHivePowerLoading}
              variant="withVoteCount"
              size="sm"
            />
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
                    ${payoutValue.toFixed(2)}
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
      </Box>
    );
  }

  const postCardPulseGradient =
    "linear-gradient(90deg, var(--chakra-colors-primary, #38ff8e) 0%, var(--chakra-colors-accent, #00e676) 100%)";
  const postCardBoxShadowAccent =
    "0 0 0 0 var(--chakra-colors-accent, rgba(72, 255, 128, 0.7))";
  const postCardBoxShadowAccent10 =
    "0 0 0 10px var(--chakra-colors-accent, rgba(72, 255, 128, 0))";

  return (
    <>
      <style jsx global>{`
        .custom-swiper {
          --swiper-navigation-color: var(--chakra-colors-primary);
          --swiper-pagination-color: var(--chakra-colors-primary);
        }

        .custom-swiper .swiper-button-next,
        .custom-swiper .swiper-button-prev {
          transition: transform 0.18s cubic-bezier(0.4, 0.2, 0.2, 1);
        }
        .custom-swiper .swiper-button-next:active,
        .custom-swiper .swiper-button-prev:active {
          transform: scale(1.18);
        }

        .custom-swiper .swiper-button-next::after,
        .custom-swiper .swiper-button-prev::after {
          font-size: 20px;
        }

        .custom-swiper .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          border-radius: 0;
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
      <Box
        position="relative"
        borderBottom="1px solid"
        borderColor="muted"
        overflow="hidden"
        height="100%"
        maxWidth={maxWidth}
        cursor="default"
      >
        {showMatrix && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            zIndex={1}
            pointerEvents="none"
          >
            <MatrixOverlay />
          </Box>
        )}
        <Box
          py={4}
          px={4}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          height="100%"
          position="relative"
          zIndex={2}
          maxWidth={maxWidth}
        >
          {!hideAuthorInfo && (
            <Box mb={4}>
              <Flex
                alignItems="center"
                minWidth={0}
                justifyContent="space-between"
                maxWidth={maxWidth}
              >
                <Link
                  href={`/@${author}`}
                  display="flex"
                  alignItems="center"
                  _hover={{ textDecoration: "underline" }}
                >
                  <Avatar
                    size="sm"
                    name={author}
                    src={`https://images.hive.blog/u/${author}/avatar/sm`}
                  />
                  <Text
                    fontWeight="bold"
                    fontSize="3xl"
                    ml={2}
                    color="primary"
                    _hover={{ color: "accent" }}
                    isTruncated
                  >
                    {author}
                  </Text>
                </Link>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  ml={2}
                  minWidth="40px"
                  textAlign="right"
                >
                  {postDate}
                </Text>
              </Flex>
            </Box>
          )}

          <Box
            border="2px solid"
            borderColor="muted"
            borderRadius="none"
            overflow="hidden"
            bg="background"
            maxWidth={maxWidth}
          >
            <Box
              flex="1"
              display="flex"
              alignItems="flex-end"
              justifyContent="center"
              zIndex={2}
              maxWidth={maxWidth}
            >
              {imageUrls.length > 0 ? (
                <Swiper
                  spaceBetween={10}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  navigation={true}
                  modules={[Navigation, Pagination]}
                  onSlideChange={handleSlideChange}
                  className="custom-swiper"
                  style={{ maxWidth: "100%" }}
                  onSwiper={(swiper) => {
                    setTimeout(() => {
                      if (!swiper.el) return;
                      const next = swiper.el.querySelector(".swiper-button-next");
                      const prev = swiper.el.querySelector(".swiper-button-prev");
                      if (next) next.addEventListener("click", stopPropagation);
                      if (prev) prev.addEventListener("click", stopPropagation);
                    }, 0);
                  }}
                >
                  {imageUrls.slice(0, visibleImages).map((url, index) => (
                    <SwiperSlide key={index}>
                      <Box h="200px" w="100%" maxWidth="100%" sx={{ userSelect: "none" }}>
                        <Image
                          src={url}
                          alt={title}
                          objectFit="cover"
                          w="100%"
                          h="100%"
                          loading="lazy"
                          onError={handleImageError}
                        />
                      </Box>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : youtubeLinks.length > 0 ? (
                <Swiper
                  spaceBetween={10}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  navigation={true}
                  modules={[Navigation, Pagination]}
                  className="custom-swiper"
                  style={{ maxWidth: "100%" }}
                  onSwiper={(swiper) => {
                    setTimeout(() => {
                      if (!swiper.el) return;
                      const next = swiper.el.querySelector(".swiper-button-next");
                      const prev = swiper.el.querySelector(".swiper-button-prev");
                      if (next) next.addEventListener("click", stopPropagation);
                      if (prev) prev.addEventListener("click", stopPropagation);
                    }, 0);
                  }}
                >
                  {youtubeLinks.map((link, index) => (
                    <SwiperSlide key={index}>
                      <Box
                        h="200px"
                        w="100%"
                        maxWidth="100%"
                        position="relative"
                        paddingTop="56.25%"
                      >
                        <iframe
                          src={link.url}
                          title={`YouTube video from ${link.domain}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            maxWidth: "100%",
                            border: 0,
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </Box>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <Box h="200px" w="100%" maxWidth="100%">
                  <Image
                    src={default_thumbnail}
                    alt="default thumbnail"
                    objectFit="cover"
                    w="100%"
                    h="100%"
                    loading="lazy"
                    onError={handleImageError}
                  />
                </Box>
              )}
            </Box>

            <Link
              href={`/post/${author}/${post.permlink}`}
              _hover={{ textDecoration: "none" }}
              style={{ display: "block" }}
            >
              <Box
                borderTop="1px solid"
                borderColor="primary"
                p={3}
                textAlign="center"
                cursor="pointer"
                bg="background"
                transition="color 0.2s"
                _hover={{
                  "& .post-title-text": { color: "accent" },
                }}
                onMouseEnter={() => setShowMatrix(true)}
                onMouseLeave={() => setShowMatrix(false)}
                position="relative"
                zIndex={3}
                maxWidth={maxWidth}
              >
                <Text
                  className="post-title-text"
                  fontSize={"16px"}
                  isTruncated={false}
                  whiteSpace="normal"
                  wordBreak="break-word"
                  noOfLines={2}
                  color="primary"
                  transition="color 0.2s"
                >
                  {title}
                </Text>
              </Box>
            </Link>
          </Box>
          <Box mt="auto">
            {showSlider ? (
              <UpvoteButton
                discussion={post}
                voted={voted}
                setVoted={setVoted}
                activeVotes={activeVotes}
                setActiveVotes={setActiveVotes}
                showSlider={showSlider}
                setShowSlider={setShowSlider}
                onVoteSuccess={(estimatedValue?: number) => {
                  if (estimatedValue) {
                    setPayoutValue((prev) => prev + estimatedValue);
                  }
                }}
                estimateVoteValue={estimateVoteValue}
                isHivePowerLoading={isHivePowerLoading}
                variant="withSlider"
                size="sm"
              />
            ) : (
              <Flex
                mt={4}
                justifyContent="space-between"
                alignItems="center"
                gap={6}
                maxWidth={maxWidth}
              >
                <UpvoteButton
                  discussion={post}
                  voted={voted}
                  setVoted={setVoted}
                  activeVotes={activeVotes}
                  setActiveVotes={setActiveVotes}
                  showSlider={showSlider}
                  setShowSlider={setShowSlider}
                  onVoteSuccess={(estimatedValue?: number) => {
                    if (estimatedValue) {
                      setPayoutValue((prev) => prev + estimatedValue);
                    }
                  }}
                  estimateVoteValue={estimateVoteValue}
                  isHivePowerLoading={isHivePowerLoading}
                  variant="withSlider"
                  size="sm"
                />
                <Tooltip
                  label={
                    isPending ? (
                      <Box>
                        <div>
                          <b>Pending</b>
                        </div>
                        <div>
                          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} until payout
                        </div>
                      </Box>
                    ) : (
                      <Box>
                        <div>
                          Author: <b>${authorPayout.toFixed(3)}</b>
                        </div>
                        <div>
                          Curators: <b>${curatorPayout.toFixed(3)}</b>
                        </div>
                      </Box>
                    )
                  }
                  aria-label="Payout details"
                  bg="background"
                  color="primary"
                  borderRadius="md"
                  p={2}
                  hasArrow
                  placement="top"
                  openDelay={200}
                >
                  <span style={{ cursor: "pointer" }}>
                    <Text fontWeight="normal" fontSize="md">
                      ${payoutValue.toFixed(2)}
                    </Text>
                  </span>
                </Tooltip>
              </Flex>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
