"use client";

import {
    VStack,
    Box,
    Text,
    HStack,
    Badge,
    useColorModeValue,
} from "@chakra-ui/react";
import { TabComponentProps } from "../types/DevMetadataTypes";

interface VotesTabProps {
    comment: TabComponentProps["comment"];
}

export const VotesTab = ({ comment }: VotesTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");

    return (
        <VStack align="stretch" spacing={2}>
            {comment.active_votes && comment.active_votes.length > 0 ? (
                <Box maxH="500px" overflowY="auto">
                    {comment.active_votes
                        .sort(
                            (a, b) =>
                                Math.abs(Number(b.rshares)) -
                                Math.abs(Number(a.rshares))
                        )
                        .map((vote, i) => (
                            <HStack
                                key={i}
                                p={2}
                                bg={codeBg}
                                borderRadius="md"
                                mb={1}
                                justify="space-between"
                            >
                                <HStack>
                                    <Text fontWeight="medium">@{vote.voter}</Text>
                                </HStack>
                                <HStack spacing={3}>
                                    <Box textAlign="right">
                                        <Text fontSize="xs" color="primary">
                                            Weight
                                        </Text>
                                        <Badge
                                            colorScheme={vote.weight >= 0 ? "green" : "red"}
                                        >
                                            {(vote.weight / 100).toFixed(0)}%
                                        </Badge>
                                    </Box>
                                    <Box textAlign="right">
                                        <Text fontSize="xs" color="primary">
                                            Rshares
                                        </Text>
                                        <Text fontSize="xs">
                                            {Number(vote.rshares).toExponential(2)}
                                        </Text>
                                    </Box>
                                </HStack>
                            </HStack>
                        ))}
                </Box>
            ) : (
                <Text color="primary">No votes on this post</Text>
            )}
        </VStack>
    );
};