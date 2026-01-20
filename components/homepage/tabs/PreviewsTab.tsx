"use client";

import {
    VStack,
    Box,
    Text,
    HStack,
    Code,
    Badge,
    Divider,
    Image,
    Flex,
    SimpleGrid,
    useColorModeValue,
} from "@chakra-ui/react";
import { TabComponentProps } from "../types/DevMetadataTypes";
import { EmbedPreviewCard } from "../../shared/EmbedPreviewCard";
import { FarcasterFramePreview } from "../../shared/FarcasterFramePreview";

interface PreviewsTabProps {
    previewData: TabComponentProps["previewData"];
    metadataThumbnails: TabComponentProps["metadataThumbnails"];
    metadataImages: TabComponentProps["metadataImages"];
    extractedImages: TabComponentProps["extractedImages"];
    extractedVideos: TabComponentProps["extractedVideos"];
    previewImageSource: string;
}

const statusChip = (label: string, ok: boolean) => (
    <Badge colorScheme={ok ? "green" : "yellow"}>
        {label}: {ok ? "ok" : "missing"}
    </Badge>
);

const metaValue = (meta: Record<string, string> | undefined, key: string, fallback: string) => {
    if (!meta) return fallback;
    return meta[key] ?? fallback;
};

const renderMetaField = (label: string, value?: string) => (
    <Box minW={0}>
        <Text fontSize="xs" color="primary">{label}</Text>
        <Code
            fontSize="sm"
            display="block"
            p={2}
            whiteSpace="pre-wrap"
            wordBreak="break-word"
            maxH="120px"
            overflowY="auto"
        >
            {value || "Missing"}
        </Code>
    </Box>
);

const renderList = (items: string[], emptyLabel: string) => {
    if (items.length === 0) {
        return <Text fontSize="xs" color="primary">{emptyLabel}</Text>;
    }
    return (
        <VStack align="stretch" spacing={1} mt={1}>
            {items.slice(0, 3).map((item, idx) => (
                <Code key={idx} fontSize="xs" wordBreak="break-all">
                    {item}
                </Code>
            ))}
            {items.length > 3 && (
                <Text fontSize="xs" color="primary">
                    +{items.length - 3} more
                </Text>
            )}
        </VStack>
    );
};

export const PreviewsTab = ({
    previewData,
    metadataThumbnails,
    metadataImages,
    extractedImages,
    extractedVideos,
    previewImageSource,
}: PreviewsTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");
    const borderColor = useColorModeValue("gray.200", "gray.600");


    return (
        <VStack align="stretch" spacing={6}>
            <Box p={4} bg={codeBg} borderRadius="md">
                <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold">Preview Selection</Text>
                    <Badge colorScheme={previewData.image ? "green" : "yellow"}>
                        {previewData.image ? "Image Ready" : "No Image"}
                    </Badge>
                </HStack>
                <HStack spacing={3} wrap="wrap">
                    <Badge colorScheme={previewData.hasVideo ? "red" : "gray"}>
                        {previewData.hasVideo ? "Has Video" : "No Video"}
                    </Badge>
                    {previewData.isVideoOnlyPost && (
                        <Badge colorScheme="orange">Video Only</Badge>
                    )}
                    <Badge colorScheme={previewData.image ? "green" : "gray"}>
                        Source: {previewImageSource}
                    </Badge>
                </HStack>
                <Divider my={3} />
                <HStack spacing={3} wrap="wrap">
                    {statusChip("og:image", Boolean(metaValue(previewData.renderedMeta, "og:image", previewData.image || "")))}
                    {statusChip("twitter:image", Boolean(metaValue(previewData.renderedMeta, "twitter:image", previewData.image || "")))}
                    {statusChip("fc:frame:image", Boolean(metaValue(previewData.renderedMeta, "fc:frame:image", previewData.image || "")))}
                    {statusChip("og:url", Boolean(metaValue(previewData.renderedMeta, "og:url", previewData.url)))}
                    <Badge colorScheme="blue">Farcaster meta uses name=</Badge>
                </HStack>
                <Divider my={3} />
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Thumbnails ({metadataThumbnails.length})
                        </Text>
                        {renderList(metadataThumbnails, "No thumbnails")}
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Metadata Images ({metadataImages.length})
                        </Text>
                        {renderList(metadataImages, "No metadata images")}
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="primary">
                            Body Images ({extractedImages.length})
                        </Text>
                        {renderList(extractedImages, "No body images")}
                    </Box>
                </SimpleGrid>
                {extractedVideos.length > 0 && (
                    <Box mt={4}>
                        <Text fontSize="xs" color="primary">
                            Videos ({extractedVideos.length})
                        </Text>
                        {renderList(extractedVideos, "No videos")}
                    </Box>
                )}
                <Box mt={4} p={2} bg="green.900" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" color="green.300">
                        Selected Preview Image
                    </Text>
                    {previewData.image ? (
                        <Code fontSize="xs" wordBreak="break-all" color="green.200">
                            {previewData.image}
                        </Code>
                    ) : (
                        <Text fontSize="xs" color="yellow.400">
                            No suitable image found
                        </Text>
                    )}
                </Box>
            </Box>

            <Box>
                <Text fontWeight="bold" mb={3}>
                    Primary Image Preview
                </Text>
                {previewData.image ? (
                    <>
                        <Box
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="lg"
                            overflow="hidden"
                            maxW="600px"
                        >
                            <Image
                                src={previewData.image}
                                alt="Post primary image"
                                maxH="400px"
                                w="full"
                                objectFit="contain"
                                bg="black"
                                fallbackSrc="https://via.placeholder.com/600x400?text=Failed+to+load"
                            />
                        </Box>
                        <Code fontSize="xs" mt={2} display="block" wordBreak="break-all">
                            {previewData.image}
                        </Code>
                    </>
                ) : (
                    <Box
                        border="1px dashed"
                        borderColor="gray.600"
                        borderRadius="lg"
                        p={8}
                        textAlign="center"
                        maxW="600px"
                    >
                        <Text color="primary">No image available for preview</Text>
                        <Text fontSize="xs" color="gray.600" mt={2}>
                            This post has no thumbnail, metadata images, or extracted images
                        </Text>
                    </Box>
                )}
            </Box>

            <Box p={4} bg={codeBg} borderRadius="md">
                <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold">OpenGraph and Twitter Tags</Text>
                    <Badge colorScheme={previewData.renderedMeta && Object.keys(previewData.renderedMeta).length > 0 ? "green" : "yellow"}>
                        {previewData.renderedMeta && Object.keys(previewData.renderedMeta).length > 0 ? "Rendered" : "Fallback"}
                    </Badge>
                </HStack>
                <VStack align="stretch" spacing={3}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <Box minW={0}>
                            <Text fontSize="xs" color="primary">og:title</Text>
                            <Code fontSize="sm" display="block" p={2}>
                                {metaValue(previewData.renderedMeta, "og:title", previewData.title)}
                            </Code>
                        </Box>
                        <Box minW={0}>
                            <Text fontSize="xs" color="primary">og:url</Text>
                            <Code fontSize="sm" display="block" p={2} wordBreak="break-all">
                                {metaValue(previewData.renderedMeta, "og:url", previewData.url)}
                            </Code>
                        </Box>
                    </SimpleGrid>
                    <Box minW={0}>
                        <Text fontSize="xs" color="primary">og:description</Text>
                        <Code fontSize="sm" display="block" p={2} whiteSpace="pre-wrap" wordBreak="break-word" maxH="120px" overflowY="auto">
                            {metaValue(previewData.renderedMeta, "og:description", previewData.description)}
                        </Code>
                    </Box>
                    <Box minW={0}>
                        <Text fontSize="xs" color="primary">og:image</Text>
                        <Code fontSize="sm" display="block" p={2} wordBreak="break-all">
                            {metaValue(previewData.renderedMeta, "og:image", previewData.image || "No image")}
                        </Code>
                    </Box>
                    <Divider />
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <Box>
                            <Text fontSize="xs" color="primary">twitter:card</Text>
                            <Badge colorScheme="blue">
                                {metaValue(previewData.renderedMeta, "twitter:card", previewData.hasVideo ? "player" : "summary_large_image")}
                            </Badge>
                        </Box>
                        {renderMetaField("twitter:title", metaValue(previewData.renderedMeta, "twitter:title", previewData.title))}
                        {renderMetaField("twitter:description", metaValue(previewData.renderedMeta, "twitter:description", previewData.description))}
                        {renderMetaField("twitter:image", metaValue(previewData.renderedMeta, "twitter:image", previewData.image || "No image"))}
                        {renderMetaField("twitter:site", metaValue(previewData.renderedMeta, "twitter:site", "@skatabordhive"))}
                        {renderMetaField("twitter:creator", metaValue(previewData.renderedMeta, "twitter:creator", `@${previewData.author}`))}
                    </SimpleGrid>
                </VStack>
            </Box>

            <Box p={4} bg={codeBg} borderRadius="md">
                <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold">Rendered Meta Snapshot</Text>
                    <Badge colorScheme={previewData.renderedMeta && Object.keys(previewData.renderedMeta).length > 0 ? "green" : "yellow"}>
                        {previewData.renderedMeta && Object.keys(previewData.renderedMeta).length > 0 ? "Live HTML" : "Unavailable"}
                    </Badge>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {renderMetaField("og:title", previewData.renderedMeta?.["og:title"])}
                    {renderMetaField("og:description", previewData.renderedMeta?.["og:description"])}
                    {renderMetaField("og:image", previewData.renderedMeta?.["og:image"])}
                    {renderMetaField("og:url", previewData.renderedMeta?.["og:url"])}
                    {renderMetaField("twitter:card", previewData.renderedMeta?.["twitter:card"])}
                    {renderMetaField("twitter:title", previewData.renderedMeta?.["twitter:title"])}
                    {renderMetaField("twitter:description", previewData.renderedMeta?.["twitter:description"])}
                    {renderMetaField("twitter:image", previewData.renderedMeta?.["twitter:image"])}
                    {renderMetaField("twitter:site", previewData.renderedMeta?.["twitter:site"])}
                    {renderMetaField("twitter:creator", previewData.renderedMeta?.["twitter:creator"])}
                    {renderMetaField("fc:frame", previewData.renderedMeta?.["fc:frame"])}
                    {renderMetaField("fc:frame:image", previewData.renderedMeta?.["fc:frame:image"])}
                    {renderMetaField("fc:frame:post_url", previewData.renderedMeta?.["fc:frame:post_url"])}
                </SimpleGrid>
            </Box>

            <Divider />
            <Text fontWeight="bold" fontSize="lg">
                Preview Cards
            </Text>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box>
                    <HStack mb={2}>
                        <Badge colorScheme="blue">Twitter/X</Badge>
                        <Text fontSize="xs" color="primary">
                            summary_large_image
                        </Text>
                    </HStack>
                    <EmbedPreviewCard
                        title={previewData.title}
                        description={previewData.description}
                        image={previewData.image ?? undefined}
                        url={previewData.url}
                        siteName="skatehive.app"
                    />
                </Box>

                <Box>
                    <HStack mb={2}>
                        <Badge colorScheme="purple">Discord</Badge>
                        <Text fontSize="xs" color="primary">
                            OpenGraph embed
                        </Text>
                    </HStack>
                    <Box
                        borderLeft="4px solid"
                        borderColor="purple.500"
                        bg={codeBg}
                        borderRadius="none"
                        p={3}
                        maxW="400px"
                    >
                        <Text fontSize="xs" color="purple.400" fontWeight="bold">
                            SkateHive
                        </Text>
                        <Text fontWeight="bold" fontSize="sm" color="blue.400" mt={1}>
                            {previewData.title}
                        </Text>
                        <Text fontSize="xs" color="gray.400" noOfLines={3} mt={1}>
                            {previewData.description}
                        </Text>
                        {previewData.image && (
                            <Image
                                src={previewData.image}
                                alt="Discord preview"
                                maxH="200px"
                                mt={2}
                                borderRadius="sm"
                                fallbackSrc="https://via.placeholder.com/300x200?text=No+Image"
                            />
                        )}
                    </Box>
                </Box>

                <Box>
                    <HStack mb={2}>
                        <Badge colorScheme="blue">Telegram</Badge>
                        <Text fontSize="xs" color="primary">
                            Instant View
                        </Text>
                    </HStack>
                    <Box bg="gray.700" borderRadius="lg" p={3} maxW="400px">
                        {previewData.image && (
                            <Image
                                src={previewData.image}
                                alt="Telegram preview"
                                borderRadius="none"
                                mb={2}
                                fallbackSrc="https://via.placeholder.com/400x200?text=No+Image"
                            />
                        )}
                        <Text fontWeight="bold" fontSize="sm" color="white">
                            {previewData.title}
                        </Text>
                        <Text fontSize="xs" color="gray.400" noOfLines={2}>
                            {previewData.description}
                        </Text>
                        <Text fontSize="xs" color="blue.300" mt={1}>
                            skatehive.app
                        </Text>
                    </Box>
                </Box>
            </SimpleGrid>

            <Divider />
            <Box>
                <HStack mb={3}>
                    <Badge colorScheme="purple">Farcaster Frame</Badge>
                    <Text fontSize="xs" color="primary">
                        Mini-app preview
                    </Text>
                </HStack>
                <Flex gap={6} wrap="wrap">
                    <Box>
                        <Text fontSize="sm" color="primary" mb={2}>
                            Default Frame
                        </Text>
                        <FarcasterFramePreview
                            title={previewData.title}
                            image={previewData.image || undefined}
                            buttonText="Open Post"
                            postUrl={previewData.url}
                        />
                    </Box>
                    <Box>
                        <Text fontSize="sm" color="primary" mb={2}>
                            With Video
                        </Text>
                        <FarcasterFramePreview
                            title={previewData.title}
                            image={previewData.image || undefined}
                            buttonText={previewData.hasVideo ? "Play Video" : "View Post"}
                            postUrl={previewData.url}
                        />
                    </Box>
                </Flex>

                <Box mt={4} p={3} bg={codeBg} borderRadius="md">
                    <Text fontWeight="bold" mb={2} fontSize="sm">
                        Frame Meta Tags
                    </Text>
                    <VStack align="stretch" spacing={1}>
                        <Code fontSize="xs">fc:frame = vNext</Code>
                        <Code fontSize="xs">fc:frame:image = {previewData.image || "No image"}</Code>
                        <Code fontSize="xs">fc:frame:post_url = {previewData.url}</Code>
                        <Code fontSize="xs">fc:frame:button:1 = Open post</Code>
                        <Code fontSize="xs">fc:frame:button:1:action = launch_frame</Code>
                        <Code fontSize="xs" wordBreak="break-all">
                            fc:frame:button:1:target = {previewData.url}
                        </Code>
                    </VStack>
                    <Text fontSize="xs" color="primary" mt={2}>
                        Note: the page emits fc:frame tags as meta name attributes.
                    </Text>
                </Box>
            </Box>
        </VStack>
    );
};
