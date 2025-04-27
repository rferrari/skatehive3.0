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
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { Discussion } from "@hiveio/dhive";
import { FaHeart, FaComment, FaRegHeart } from "react-icons/fa";
import { getPostDate } from "@/lib/utils/GetPostDate";
import { useAioha } from "@aioha/react-ui";
import { getPayoutValue } from "@/lib/hive/client-functions";
import markdownRenderer from "@/lib/utils/MarkdownRenderer";

interface PostDetailsProps {
  post: Discussion;
}

export default function PostDetails({ post }: PostDetailsProps) {
  const { title, author, body, created } = post;
  const postDate = getPostDate(created);
  const { aioha, user } = useAioha();
  const [sliderValue, setSliderValue] = useState(100);
  const [showSlider, setShowSlider] = useState(false);
  const [voted, setVoted] = useState(
    post.active_votes?.some((item) => item.voter === user)
  );

  function handleHeartClick() {
    setShowSlider(!showSlider);
  }

  async function handleVote() {
    const vote = await aioha.vote(
      post.author,
      post.permlink,
      sliderValue * 100
    );
    setVoted(vote.success);
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
        boxShadow="0px 4px 12px rgba(0, 0, 0, 0.2)"
        bg="linear-gradient(to bottom,rgb(5, 37, 4),rgb(29, 33, 31))"
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
          <Flex
            data-subcomponent="PostDetails/VoteSummary"
            mt={4}
            justifyContent="flex-end" // Align items to the right
            alignItems="center"
          >
            <Flex alignItems="center" mr={4}>
              {" "}
              {/* Group like button and vote count */}
              {voted ? (
                <Icon
                  as={FaHeart}
                  onClick={handleHeartClick}
                  cursor="pointer"
                  color="green.300"
                />
              ) : (
                <Icon
                  as={FaRegHeart}
                  onClick={handleHeartClick}
                  cursor="pointer"
                  color="green.300"
                />
              )}
              <Text ml={2} fontSize="sm" color="green.300">
                {post.active_votes.length}
              </Text>
            </Flex>
            <Text fontWeight="bold" fontSize="sm" color="green.300">
              ${getPayoutValue(post)}
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
    </Box>
  );
}
