"use client";

import {
    Box,
    Button,
    AspectRatio,
    Image,
    useColorModeValue,
} from "@chakra-ui/react";

interface FarcasterFramePreviewProps {
    title: string;
    image?: string;
    buttonText: string;
    postUrl: string;
}

export const FarcasterFramePreview = ({
    title,
    image,
    buttonText,
    postUrl,
}: FarcasterFramePreviewProps) => {
    const cardBg = useColorModeValue("white", "gray.700");
    const borderCol = useColorModeValue("gray.300", "primary");

    return (
        <Box
            border="2px solid"
            borderColor={borderCol}
            borderRadius="xl"
            overflow="hidden"
            bg={cardBg}
            maxW="400px"
        >
            {image && (
                <AspectRatio ratio={1.91 / 1}>
                    <Image
                        src={image}
                        alt={title}
                        objectFit="cover"
                        fallbackSrc="https://via.placeholder.com/400x209?text=Frame+Image"
                    />
                </AspectRatio>
            )}
            <Box p={3}>
                <Button
                    w="full"
                    colorScheme="purple"
                    size="sm"
                    borderRadius="lg"
                >
                    {buttonText}
                </Button>
            </Box>
        </Box>
    );
};