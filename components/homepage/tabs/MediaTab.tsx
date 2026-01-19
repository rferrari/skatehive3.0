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

interface MediaTabProps {
    metadataImages: TabComponentProps["metadataImages"];
    extractedImages: TabComponentProps["extractedImages"];
    extractedVideos: TabComponentProps["extractedVideos"];
}

export const MediaTab = ({
    metadataImages,
    extractedImages,
    extractedVideos,
}: MediaTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");

    return (
        <VStack align="stretch" spacing={4}>
            {/* Metadata Images */}
            {metadataImages.length > 0 && (
                <Box>
                    <Text fontWeight="bold" mb={2}>
                        Metadata Images ({metadataImages.length})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                        {metadataImages.map((url: string, i: number) => (
                            <Box key={i} p={2} bg={codeBg} borderRadius="md">
                                <HStack spacing={3}>
                                    <Image
                                        src={url}
                                        alt={`Image ${i + 1}`}
                                        maxH="60px"
                                        maxW="100px"
                                        objectFit="cover"
                                        borderRadius="sm"
                                        fallbackSrc="https://via.placeholder.com/100x60?text=Error"
                                    />
                                    <Code fontSize="xs" wordBreak="break-all">
                                        {url}
                                    </Code>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            )}

            {/* Extracted Images */}
            {extractedImages.length > 0 && (
                <Box>
                    <Text fontWeight="bold" mb={2}>
                        Extracted Images from Body ({extractedImages.length})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                        {extractedImages.map((url, i) => (
                            <Box key={i} p={2} bg={codeBg} borderRadius="md">
                                <HStack spacing={3}>
                                    <Image
                                        src={url}
                                        alt={`Extracted ${i + 1}`}
                                        maxH="60px"
                                        maxW="100px"
                                        objectFit="cover"
                                        borderRadius="sm"
                                        fallbackSrc="https://via.placeholder.com/100x60?text=Error"
                                    />
                                    <Code fontSize="xs" wordBreak="break-all">
                                        {url}
                                    </Code>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            )}

            {/* Extracted Videos */}
            {extractedVideos.length > 0 && (
                <Box>
                    <Text fontWeight="bold" mb={2}>
                        Extracted Videos ({extractedVideos.length})
                    </Text>
                    <VStack align="stretch" spacing={2}>
                        {extractedVideos.map((url, i) => (
                            <Box key={i} p={2} bg={codeBg} borderRadius="md">
                                <Badge colorScheme="red" mr={2}>
                                    VIDEO
                                </Badge>
                                <Code fontSize="xs" wordBreak="break-all">
                                    {url}
                                </Code>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            )}

            {extractedImages.length === 0 &&
                extractedVideos.length === 0 &&
                metadataImages.length === 0 && (
                    <Text color="primary">No media found in this post</Text>
                )}
        </VStack>
    );
};