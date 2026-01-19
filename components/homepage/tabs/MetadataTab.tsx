"use client";

import {
    VStack,
    Box,
    Text,
    HStack,
    Code,
    Badge,
    useColorModeValue,
} from "@chakra-ui/react";
import { TabComponentProps } from "../types/DevMetadataTypes";

interface MetadataTabProps {
    parsedMetadata: TabComponentProps["parsedMetadata"];
}

const listValues = (value?: string[] | string) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
};

export const MetadataTab = ({ parsedMetadata }: MetadataTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");

    const tags = listValues(parsedMetadata.tags);
    const images = listValues(parsedMetadata.image || parsedMetadata.images);
    const thumbnails = listValues(parsedMetadata.thumbnail || parsedMetadata.thumbnails);
    const video = parsedMetadata.video || {};

    return (
        <VStack align="stretch" spacing={4}>
            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    Metadata Highlights
                </Text>
                <HStack spacing={6} wrap="wrap">
                    <Box>
                        <Text fontSize="xs" color="primary">
                            App
                        </Text>
                        <Badge colorScheme="blue">{parsedMetadata.app || "Unknown"}</Badge>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Format
                        </Text>
                        <Text fontSize="sm">{parsedMetadata.format || "Unknown"}</Text>
                    </Box>
                    {parsedMetadata.canonical_url && (
                        <Box>
                            <Text fontSize="xs" color="primary">
                                Canonical URL
                            </Text>
                            <Code fontSize="xs" wordBreak="break-all">
                                {parsedMetadata.canonical_url}
                            </Code>
                        </Box>
                    )}
                </HStack>
                {tags.length > 0 && (
                    <Box mt={3}>
                        <Text fontSize="xs" color="primary" mb={1}>
                            Tags
                        </Text>
                        <HStack wrap="wrap" spacing={1}>
                            {tags.map((tag: string, i: number) => (
                                <Badge key={i} colorScheme="gray" size="sm">
                                    {tag}
                                </Badge>
                            ))}
                        </HStack>
                    </Box>
                )}
            </Box>

            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={2}>
                    Media Metadata
                </Text>
                <HStack spacing={6} wrap="wrap">
                    <Box>
                        <Text fontSize="xs" color="primary">
                            image/images
                        </Text>
                        <Text fontSize="sm">{images.length || 0}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            thumbnail
                        </Text>
                        <Text fontSize="sm">{thumbnails.length || 0}</Text>
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            video
                        </Text>
                        <Text fontSize="sm">{Object.keys(video).length > 0 ? "Present" : "None"}</Text>
                    </Box>
                </HStack>
                {video.thumbnail && (
                    <Box mt={3}>
                        <Text fontSize="xs" color="primary">Video Thumbnail</Text>
                        <Code fontSize="xs" wordBreak="break-all">
                            {video.thumbnail}
                        </Code>
                    </Box>
                )}
            </Box>

            <Box>
                <Text fontWeight="bold" mb={2}>
                    Raw json_metadata
                </Text>
                <Box
                    p={4}
                    bg={codeBg}
                    borderRadius="md"
                    overflowX="auto"
                    maxH="500px"
                    overflowY="auto"
                >
                    <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                        {JSON.stringify(parsedMetadata, null, 2)}
                    </Code>
                </Box>
            </Box>
        </VStack>
    );
};
