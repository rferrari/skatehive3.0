"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    Flex,
    Image,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Tooltip,
    useToast,
    HStack,
} from "@chakra-ui/react";
import { LuArrowUpRight } from "react-icons/lu";
import { useAioha } from "@aioha/react-ui";
import { Discussion } from "@hiveio/dhive";
import VoteListPopover from "@/components/blog/VoteListModal";

interface VoteSliderProps {
    discussion: Discussion;
    voted: boolean;
    setVoted: (voted: boolean) => void;
    activeVotes: any[];
    setActiveVotes: (votes: any[]) => void;
    showSlider: boolean;
    setShowSlider: (show: boolean) => void;
    onVoteSuccess?: (estimatedValue?: number) => void;
    estimateVoteValue?: (percentage: number) => Promise<number>;
    size?: "sm" | "md" | "lg";
    variant?: "modal" | "feed";
}

const VoteSlider = ({
    discussion,
    voted,
    setVoted,
    activeVotes,
    setActiveVotes,
    showSlider,
    setShowSlider,
    onVoteSuccess,
    estimateVoteValue,
    size = "sm",
    variant = "feed"
}: VoteSliderProps) => {
    const { aioha, user } = useAioha();
    const toast = useToast();
    const [sliderValue, setSliderValue] = useState(5);

    const handleHeartClick = () => {
        setShowSlider(!showSlider);
    };

    const handleVote = async () => {
        try {
            const vote = await aioha.vote(
                discussion.author,
                discussion.permlink,
                sliderValue * 100
            );

            if (vote.success) {
                setVoted(true);
                setActiveVotes([...activeVotes, { voter: user }]);

                // Estimate the value and call onVoteSuccess if provided
                if (estimateVoteValue && onVoteSuccess) {
                    try {
                        const estimatedValue = await estimateVoteValue(sliderValue);
                        onVoteSuccess(estimatedValue);
                    } catch (e) {
                        onVoteSuccess();
                    }
                } else if (onVoteSuccess) {
                    onVoteSuccess();
                }

                toast({
                    title: "Vote submitted!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: "Failed to vote",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
        handleHeartClick();
    };

    // Deduplicate votes by voter (keep the last occurrence)
    const uniqueVotesMap = new Map();
    activeVotes.forEach((vote) => {
        uniqueVotesMap.set(vote.voter, vote);
    });
    const uniqueVotes = Array.from(uniqueVotesMap.values());

    if (showSlider) {
        return (
            <Flex mt={4} alignItems="center">
                <Box width="100%" mr={2}>
                    <Slider
                        aria-label="vote-slider"
                        min={0}
                        max={100}
                        value={sliderValue}
                        onChange={(val) => setSliderValue(val)}
                    >
                        <SliderTrack
                            bg="gray.700"
                            height="8px"
                            boxShadow="0 0 10px rgba(255, 255, 0, 0.8)"
                        >
                            <SliderFilledTrack bgGradient="linear(to-r, green.400, limegreen, red.400)" />
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
                    size={size}
                    onClick={handleVote}
                    ml={2}
                    className={variant === "feed" ? "pulse-green" : undefined}
                    bg={variant === "modal" ? "primary" : undefined}
                    color={variant === "modal" ? "background" : undefined}
                    _hover={variant === "modal" ? { bg: "primary", opacity: 0.8 } : undefined}
                >
                    {variant === "feed" ? `\u00A0\u00A0\u00A0Vote ${sliderValue} %\u00A0\u00A0\u00A0` : `Vote ${sliderValue}%`}
                </Button>
                <Button size={size} onClick={handleHeartClick} ml={2}>
                    {variant === "feed" ? "X" : "✕"}
                </Button>
            </Flex>
        );
    }

    return variant === "feed" ? (
        <HStack>
            <Tooltip label="upvote" hasArrow openDelay={1000}>
                <Button
                    leftIcon={
                        <LuArrowUpRight
                            size={24}
                            color={voted ? undefined : "rgb(75, 72, 72)"}
                            style={{ opacity: voted ? 1 : 0.5 }}
                        />
                    }
                    variant="ghost"
                    onClick={handleHeartClick}
                    size={size}
                    p={2}
                    _hover={{ bg: "gray.700", borderRadius: "full" }}
                />
            </Tooltip>
            <VoteListPopover
                trigger={
                    <Button
                        variant="ghost"
                        size={size}
                        ml={1}
                        p={1}
                        _hover={{ textDecoration: "underline" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {uniqueVotes.length}
                    </Button>
                }
                votes={activeVotes}
                post={discussion}
            />
        </HStack>
    ) : (
        <HStack mt={3} spacing={4}>
            <Button
                leftIcon={
                    <LuArrowUpRight
                        size={20}
                        color={voted ? undefined : "rgb(75, 72, 72)"}
                        style={{ opacity: voted ? 1 : 0.5 }}
                    />
                }
                variant="ghost"
                onClick={handleHeartClick}
                size={size}
                _hover={{ bg: "gray.700" }}
            >
                {uniqueVotes.length}
            </Button>
        </HStack>
    );
};

export default VoteSlider;
