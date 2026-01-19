"use client";

import {
    Box,
    Text,
    AspectRatio,
    Image,
    useColorModeValue,
} from "@chakra-ui/react";

interface EmbedPreviewCardProps {
    title: string;
    description: string;
    image?: string;
    url: string;
    siteName: string;
    type?: string;
    children?: React.ReactNode;
}

export const EmbedPreviewCard = ({
    title,
    description,
    image,
    url,
    siteName,
    type = "website",
    children,
}: EmbedPreviewCardProps) => {
    const cardBg = useColorModeValue("white", "gray.700");
    const borderCol = useColorModeValue("gray.200", "gray.600");

    return (
        <Box
            border="1px solid"
            borderColor={borderCol}
            borderRadius="lg"
            overflow="hidden"
            bg={cardBg}
            maxW="500px"
        >
            {image && (
                <AspectRatio ratio={1.91 / 1} maxH="260px">
                    <Image
                        src={image}
                        alt={title}
                        objectFit="cover"
                        fallbackSrc="https://via.placeholder.com/500x260?text=No+Image"
                    />
                </AspectRatio>
            )}
            <Box p={3}>
                <Text fontSize="xs" color="primary" textTransform="uppercase">
                    {siteName}
                </Text>
                <Text fontWeight="bold" fontSize="sm" noOfLines={2} mt={1}>
                    {title}
                </Text>
                <Text fontSize="xs" color="primary" noOfLines={2} mt={1}>
                    {description}
                </Text>
                {children}
            </Box>
        </Box>
    );
};