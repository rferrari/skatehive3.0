"use client";

import {
    VStack,
    Box,
    Text,
    HStack,
    Code,
    Badge,
    Divider,
    SimpleGrid,
    useColorModeValue,
} from "@chakra-ui/react";
import { TabComponentProps } from "../types/DevMetadataTypes";

interface OverviewTabProps {
    comment: TabComponentProps["comment"];
    postInfo: TabComponentProps["postInfo"];
    metadataImages: TabComponentProps["metadataImages"];
    metadataThumbnails: TabComponentProps["metadataThumbnails"];
    extractedImages: TabComponentProps["extractedImages"];
    extractedVideos: TabComponentProps["extractedVideos"];
    extractedCids: TabComponentProps["extractedCids"];
}

export const OverviewTab = ({
    comment,
    postInfo,
    metadataImages,
    metadataThumbnails,
    extractedImages,
    extractedVideos,
    extractedCids,
}: OverviewTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");

    return (
        <VStack align="stretch" spacing={4}>
            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    Post Identity
                </Text>
                <HStack spacing={4} wrap="wrap">
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Author
                        </Text>
                        <Code>@{comment.author}</Code>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Permlink
                        </Text>
                        <Code fontSize="xs">{comment.permlink}</Code>
                    </Box>
                    {comment.parent_author && (
                        <Box>
                            <Text fontSize="xs" color="primary">
                                Parent
                            </Text>
                            <Code fontSize="xs">
                                @{comment.parent_author}/{comment.parent_permlink}
                            </Code>
                        </Box>
                    )}
                </HStack>
            </Box>

            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    Media Summary
                </Text>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Metadata Images
                        </Text>
                        <Text fontWeight="bold">{metadataImages.length}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Thumbnails
                        </Text>
                        <Text fontWeight="bold">{metadataThumbnails.length}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Body Images
                        </Text>
                        <Text fontWeight="bold">{extractedImages.length}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Videos
                        </Text>
                        <Text fontWeight="bold">{extractedVideos.length}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            IPFS CIDs
                        </Text>
                        <Text fontWeight="bold">{extractedCids.length}</Text>
                    </Box>
                </SimpleGrid>
            </Box>

            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={2}>
                    Timing & Payouts
                </Text>
                <HStack spacing={6} wrap="wrap">
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Created
                        </Text>
                        <Text fontSize="sm">{postInfo.created}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Cashout Time
                        </Text>
                        <Text fontSize="sm">{postInfo.cashoutTime}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Status
                        </Text>
                        <Badge colorScheme={postInfo.isPending ? "yellow" : "green"}>
                            {postInfo.isPending ? "Pending" : "Paid Out"}
                        </Badge>
                    </Box>
                </HStack>
                <Divider my={3} />
                <HStack spacing={6} wrap="wrap">
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Total Payout
                        </Text>
                        <Text fontSize="sm" fontWeight="bold">
                            {postInfo.totalPayout}
                        </Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Curator Payout
                        </Text>
                        <Text fontSize="sm">{postInfo.curatorPayout}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Pending Payout
                        </Text>
                        <Text fontSize="sm">{postInfo.pendingPayout}</Text>
                    </Box>
                </HStack>
            </Box>

            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={2}>
                    Engagement
                </Text>
                <HStack spacing={6}>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Votes
                        </Text>
                        <Text fontSize="lg" fontWeight="bold">
                            {postInfo.voteCount}
                        </Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Comments
                        </Text>
                        <Text fontSize="lg" fontWeight="bold">
                            {postInfo.children}
                        </Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Depth
                        </Text>
                        <Text fontSize="lg" fontWeight="bold">
                            {postInfo.depth}
                        </Text>
                    </Box>
                </HStack>
            </Box>
        </VStack>
    );
};
