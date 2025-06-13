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
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { Discussion } from "@hiveio/dhive";
import { FaHeart, FaComment, FaRegHeart } from "react-icons/fa";
import { getPostDate } from "@/lib/utils/GetPostDate";
import { useAioha } from "@aioha/react-ui";
import { getPayoutValue } from "@/lib/hive/client-functions";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";
import useHivePower from "@/hooks/useHivePower";

interface PostDetailsProps {
  post: Discussion;
}

export default function PostDetails({ post }: PostDetailsProps) {
  const { title, author, body, created } = post;
  const postDate = getPostDate(created);
  const { aioha, user } = useAioha();
  const [sliderValue, setSliderValue] = useState(100);
  const [showSlider, setShowSlider] = useState(false);
  const [activeVotes, setActiveVotes] = useState(post.active_votes || []);
  const [payoutValue, setPayoutValue] = useState(parseFloat(getPayoutValue(post)));
  const [voted, setVoted] = useState(
    post.active_votes?.some((item) => item.voter === user)
  );
  const { hivePower, isLoading: isHivePowerLoading, error: hivePowerError, estimateVoteValue } = useHivePower(user);
  const theme = useTheme();

  // Get theme colors
  const primary = theme.colors.primary ?? '#38ff8e';
  const secondary = theme.colors.secondary ?? '#1d211f';
  const accent = theme.colors.accent ?? '#48BB78';
  const muted = theme.colors.muted ?? '#276749';
  const color = theme.colors.color ?? '#F0FFF4';

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
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        flexWrap="nowrap"
        boxShadow={theme.shadows.md}
        bg={detailsGradient}
        p={4}
      >
        <Flex alignItems="center" flexShrink={0}>
          <Avatar
            size="sm"
            name={author}
            src={`https://images.hive.blog/u/${author}/avatar/sm`}
          />
          <Box ml={3} whiteSpace="nowrap">
            <Text fontWeight="medium" fontSize="sm" mb={-2}>
              <Link href={`/@${author}`}>@{author}</Link>
            </Text>
            <Text fontSize="sm" color="primary">
              {postDate}
            </Text>
          </Box>
        </Flex>
        <Divider
          orientation="vertical"
          h="34px"
          borderColor="color"
          mx={4}
          display={["none", "block"]}
        />
        <Box flexGrow={1} ml={4} textAlign="start" minWidth={0}>
          <Text fontSize="lg" fontWeight="bold">
            {title}
          </Text>
        </Box>
        {showSlider ? (
          <Flex
            data-subcomponent="PostDetails/VoteControls"
            mt={4}
            alignItems="center"
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
        ) : (
          <Flex
            data-subcomponent="PostDetails/VoteSummary"
            mt={4}
            justifyContent="flex-end"
            alignItems="center"
          >
            <Flex alignItems="center" mr={4}>
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
              <Text ml={2} fontSize="sm" color={primary}>
                {activeVotes.length}
              </Text>
            </Flex>
            <Text fontWeight="bold" fontSize="sm" color={primary}>
              ${payoutValue.toFixed(2)}
            </Text>
          </Flex>
        )}
      </Flex>

      <Divider />

      <Box
        data-subcomponent="PostDetails/Body"
        maxW={"container.xs"}
        mt={4}
        dangerouslySetInnerHTML={{ __html: markdownRenderer(body) }}
        overflow={"auto"}
        sx={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      />

      <style jsx global>{`
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

