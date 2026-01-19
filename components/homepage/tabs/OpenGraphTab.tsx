"use client";

import {
    VStack,
    Box,
    Text,
    HStack,
    Code,
    Badge,
    Image,
    useColorModeValue,
} from "@chakra-ui/react";
import { TabComponentProps } from "../types/DevMetadataTypes";

interface OpenGraphTabProps {
    comment: TabComponentProps["comment"];
    parsedMetadata: TabComponentProps["parsedMetadata"];
    metadataImages: TabComponentProps["metadataImages"];
    extractedImages: TabComponentProps["extractedImages"];
    extractedVideos: TabComponentProps["extractedVideos"];
}

export const OpenGraphTab = ({
    comment,
    parsedMetadata,
    metadataImages,
    extractedImages,
    extractedVideos,
}: OpenGraphTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");

    return (
        <VStack align="stretch" spacing={4}>
            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    OpenGraph / SEO Preview
                </Text>
                <VStack align="stretch" spacing={3}>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            og:title
                        </Text>
                        <Code fontSize="sm" display="block" p={2}>
                            {comment.title || `Reply by @${comment.author}`}
                        </Code>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            og:description
                        </Text>
                        <Code fontSize="sm" display="block" p={2} whiteSpace="pre-wrap">
                            {parsedMetadata.description ||
                                comment.body?.substring(0, 200).replace(/[#*`\[\]!]/g, "") + "..." ||
                                "No description"}
                        </Code>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            og:image
                        </Text>
                        {(metadataImages[0] || extractedImages[0]) ? (
                            <HStack spacing={3} mt={1}>
                                <Image
                                    src={metadataImages[0] || extractedImages[0]}
                                    alt="OG Image"
                                    maxH="100px"
                                    maxW="200px"
                                    objectFit="cover"
                                    borderRadius="sm"
                                    fallbackSrc="https://via.placeholder.com/200x100?text=Error"
                                />
                                <Code fontSize="xs" wordBreak="break-all">
                                    {metadataImages[0] || extractedImages[0]}
                                </Code>
                            </HStack>
                        ) : (
                            <Text color="primary" fontSize="sm">No image available</Text>
                        )}
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            og:url
                        </Text>
                        <Code fontSize="sm" display="block" p={2}>
                            {typeof window !== "undefined"
                                ? `${window.location.origin}/post/${comment.author}/${comment.permlink}`
                                : `/post/${comment.author}/${comment.permlink}`}
                        </Code>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            og:type
                        </Text>
                        <Code fontSize="sm">article</Code>
                    </Box>
                </VStack>
            </Box>

            {/* Twitter Card Preview */}
            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    Twitter Card Preview
                </Text>
                <VStack align="stretch" spacing={2}>
                    <HStack>
                        <Text fontSize="xs" color="primary" w="120px">
                            twitter:card
                        </Text>
                        <Badge colorScheme="blue">
                            {extractedVideos.length > 0 ? "player" : "summary_large_image"}
                        </Badge>
                    </HStack>
                    <HStack>
                        <Text fontSize="xs" color="primary" w="120px">
                            twitter:site
                        </Text>
                        <Code fontSize="sm">@skatabordhive</Code>
                    </HStack>
                    <HStack>
                        <Text fontSize="xs" color="primary" w="120px">
                            twitter:creator
                        </Text>
                        <Code fontSize="sm">@{comment.author}</Code>
                    </HStack>
                </VStack>
            </Box>

            {/* Hive-specific metadata */}
            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    Hive App Metadata
                </Text>
                <VStack align="stretch" spacing={2}>
                    <HStack>
                        <Text fontSize="xs" color="primary" w="120px">
                            app
                        </Text>
                        <Badge colorScheme="green">{parsedMetadata.app || "Unknown"}</Badge>
                    </HStack>
                    {parsedMetadata.format && (
                        <HStack>
                            <Text fontSize="xs" color="primary" w="120px">
                                format
                            </Text>
                            <Code fontSize="sm">{parsedMetadata.format}</Code>
                        </HStack>
                    )}
                    {parsedMetadata.canonical_url && (
                        <HStack>
                            <Text fontSize="xs" color="primary" w="120px">
                                canonical_url
                            </Text>
                            <Code fontSize="xs" wordBreak="break-all">
                                {parsedMetadata.canonical_url}
                            </Code>
                        </HStack>
                    )}
                </VStack>
            </Box>
        </VStack>
    );
};