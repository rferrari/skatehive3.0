"use client";

import React, { useState, useEffect } from "react";
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
import useHiveVote from "@/hooks/useHiveVote";
import { Discussion } from "@hiveio/dhive";
import VoteListPopover from "@/components/blog/VoteListModal";
import { DEFAULT_VOTE_WEIGHT } from "@/lib/utils/constants";
import { useVoteWeightContext } from "@/contexts/VoteWeightContext";

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
    const { vote, effectiveUser, canVote } = useHiveVote();
    const toast = useToast();
      const { voteWeight: userVoteWeight, disableSlider, isLoading } = useVoteWeightContext();
    const [sliderValue, setSliderValue] = useState(userVoteWeight);

    // Update slider value when user's vote weight changes
    useEffect(() => {
        setSliderValue(userVoteWeight);
    }, [userVoteWeight]);

    const handleHeartClick = () => {
        if (!canVote) {
            toast({
                title: "Please log in",
                description: "You need to be logged in to vote.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Don't allow voting if user info is still loading
        if (isLoading) {
            toast({
                title: "Please wait",
                description: "Loading user preferences...",
                status: "info",
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        if (disableSlider) {
            // If slider is disabled, vote directly with preferred weight
            handleVoteWithWeight(userVoteWeight);
        } else {
            // Show slider if enabled
            setShowSlider(!showSlider);
        }
    };

    const handleVoteWithWeight = async (votePercentage: number) => {
        try {
            const voteResult = await vote(
                discussion.author,
                discussion.permlink,
                votePercentage * 100
            );

            if (voteResult.success) {
                setVoted(true);
                if (effectiveUser) {
                    setActiveVotes([...activeVotes, { voter: effectiveUser }]);
                }

                // Estimate the value and call onVoteSuccess if provided
                if (estimateVoteValue && onVoteSuccess) {
                    try {
                        const estimatedValue = await estimateVoteValue(votePercentage);
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
        
        // Close slider if it was open
        if (showSlider) {
            setShowSlider(false);
        }
    };

    // Deduplicate votes by voter (keep the last occurrence)
    const uniqueVotesMap = new Map();
    activeVotes.forEach((vote) => {
        uniqueVotesMap.set(vote.voter, vote);
    });
    const uniqueVotes = Array.from(uniqueVotesMap.values());

    // If slider is disabled, don't show the slider interface
    if (disableSlider) {
        return variant === "feed" ? (
            <HStack>
                <Tooltip label="upvote" hasArrow openDelay={1000}>
                    <Box
                        as="span"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={handleHeartClick}
                        p={1}
                        borderRadius="full"
                        bg={!voted ? "muted" : undefined}
                        _hover={!voted ? { bg: "primary" } : undefined}
                        transition="background 0.2s, border-radius 0.2s"
                    >
                        <LuArrowUpRight
                            size={24}
                            color={voted ? "var(--chakra-colors-success)" : "var(--chakra-colors-accent)"}
                            style={{ opacity: 1 }}
                        />
                    </Box>
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
                            color={voted ? "var(--chakra-colors-success)" : "var(--chakra-colors-accent)"}
                            style={{ opacity: 1 }}
                        />
                    }
                    variant="ghost"
                    onClick={handleHeartClick}
                    size={size}
                    _hover={{ bg: "accent" }}
                >
                    {uniqueVotes.length}
                </Button>
            </HStack>
        );
    }

    // Show slider interface if enabled
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
                    size={size}
                    onClick={() => handleVoteWithWeight(sliderValue)}
                    ml={2}
                    bgGradient="linear(to-r, primary, accent)"
                    color="background"
                    _hover={{ bg: "accent" }}
                    fontWeight="bold"
                >
                    Vote {sliderValue}%
                </Button>
                <Button
                    size={size}
                    onClick={() => setShowSlider(false)}
                    ml={2}
                    bg="muted"
                    color="primary"
                    _hover={{ bg: "muted", opacity: 0.8 }}
                >
                    X
                </Button>
            </Flex>
        );
    }

    return variant === "feed" ? (
        <HStack>
            <Tooltip label="upvote" hasArrow openDelay={1000}>
                <Box
                    as="span"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={handleHeartClick}
                    p={1}
                    borderRadius="full"
                    bg={!voted ? "muted" : undefined}
                    _hover={!voted ? { bg: "primary" } : undefined}
                    transition="background 0.2s, border-radius 0.2s"
                >
                    <LuArrowUpRight
                        size={24}
                        color={voted ? "var(--chakra-colors-success)" : "var(--chakra-colors-accent)"}
                        style={{ opacity: 1 }}
                    />
                </Box>
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
                        color={voted ? "var(--chakra-colors-success)" : "var(--chakra-colors-accent)"}
                        style={{ opacity: 1 }}
                    />
                }
                variant="ghost"
                onClick={handleHeartClick}
                size={size}
                _hover={{ bg: "accent" }}
            >
                {uniqueVotes.length}
            </Button>
        </HStack>
    );
};

export default VoteSlider;
