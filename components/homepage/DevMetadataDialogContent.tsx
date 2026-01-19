"use client";

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Box,
    Text,
    VStack,
    HStack,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Code,
    Divider,
    Image,
    useColorModeValue,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Spinner,
    Button,
    AspectRatio,
    Flex,
    Icon,
} from "@chakra-ui/react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { FaExternalLinkAlt, FaSync, FaImage, FaVideo, FaFile } from "react-icons/fa";
import type { DevMetadataDialogProps } from "./DevMetadataDialog";

// Image regex patterns
const IMAGE_REGEX = /!\[.*?\]\((.*?)\)/g;
const VIDEO_REGEX =
    /https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)(\?[^\s]*)?/gi;
const IPFS_REGEX =
    /https?:\/\/(?:ipfs\.skatehive\.app|gateway\.ipfs\.io|ipfs\.io\/ipfs)\/[^\s\)]+/gi;
const CID_REGEX = /(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-zA-Z0-9]{50,})/g;

// Pinata API response types - matches /api/pinata/metadata/[hash] response
interface PinataKeyValues {
    creator?: string;
    thumbnailUrl?: string;
    thumbnail?: string;  // alternate field from transcoder
    fileType?: string;
    uploadDate?: string;
    platform?: string;
    isMobile?: string;
    userAgent?: string;
    fileSize?: string;
    source_app?: string;  // 'webapp' | 'mobile' | 'unknown'
    app_version?: string;
    requestId?: string;
    deviceInfo?: string;
    userHP?: string;
    clientIP?: string;
    [key: string]: string | undefined;
}

interface PinataFileInfo {
    cid: string;
    name: string;
    size: number;
    createdAt?: string;  // date_pinned from Pinata
    id?: string;
    keyvalues?: PinataKeyValues;  // Direct keyvalues at root
    mime_type?: string;  // Legacy field
    created_at?: string; // Legacy field
    metadata?: {
        name?: string;
        keyvalues?: PinataKeyValues;
    };
    number_of_files?: number;
}

// Preview Card Component for social embeds
const EmbedPreviewCard = ({
    title,
    description,
    image,
    url,
    siteName,
    type = "website",
    children,
}: {
    title: string;
    description: string;
    image?: string;
    url: string;
    siteName: string;
    type?: string;
    children?: React.ReactNode;
}) => {
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
                <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                    {siteName}
                </Text>
                <Text fontWeight="bold" fontSize="sm" noOfLines={2} mt={1}>
                    {title}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={2} mt={1}>
                    {description}
                </Text>
                {children}
            </Box>
        </Box>
    );
};

// Farcaster Frame Preview Component
const FarcasterFramePreview = ({
    title,
    image,
    buttonText,
    postUrl,
}: {
    title: string;
    image?: string;
    buttonText: string;
    postUrl: string;
}) => {
    const cardBg = useColorModeValue("white", "gray.700");
    const borderCol = useColorModeValue("gray.300", "gray.500");

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

export default function DevMetadataDialogContent({
    isOpen,
    onClose,
    comment,
}: DevMetadataDialogProps) {
    const bgColor = useColorModeValue("white", "gray.800");
    const codeBg = useColorModeValue("gray.100", "gray.900");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    // State for Pinata API data
    const [pinataData, setPinataData] = useState<Record<string, PinataFileInfo | null>>({});
    const [pinataLoading, setPinataLoading] = useState<Record<string, boolean>>({});
    const [pinataError, setPinataError] = useState<Record<string, string>>({});

    // Parse json_metadata
    const parsedMetadata = useMemo(() => {
        if (typeof comment.json_metadata === "string") {
            try {
                return JSON.parse(comment.json_metadata);
            } catch {
                return {};
            }
        }
        return comment.json_metadata || {};
    }, [comment.json_metadata]);

    // Helper function to check if URL is a video
    const isVideoUrl = useCallback((url: string): boolean => {
        if (!url) return false;
        const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)(\?.*)?$/i;
        return videoExtensions.test(url);
    }, []);

    // Helper function to check if URL is an image
    const isImageUrl = useCallback((url: string): boolean => {
        if (!url) return false;
        // Check for image extensions
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
        if (imageExtensions.test(url)) return true;
        // Check for image keywords in URL (for IPFS without extension)
        if (url.includes('thumbnail') || url.includes('thumb')) return true;
        return false;
    }, []);

    // Extract all images from metadata (filtering out videos)
    const metadataImages = useMemo(() => {
        const images: string[] = [];
        // Get images from metadata.image array
        if (parsedMetadata.image && Array.isArray(parsedMetadata.image)) {
            images.push(...parsedMetadata.image.filter((url: string) => !isVideoUrl(url)));
        }
        return images;
    }, [parsedMetadata.image, isVideoUrl]);

    // Extract thumbnails specifically (for video posts)
    const metadataThumbnails = useMemo(() => {
        const thumbnails: string[] = [];
        // Check metadata.thumbnail (can be string or array)
        if (parsedMetadata.thumbnail) {
            if (Array.isArray(parsedMetadata.thumbnail)) {
                thumbnails.push(...parsedMetadata.thumbnail);
            } else if (typeof parsedMetadata.thumbnail === 'string') {
                thumbnails.push(parsedMetadata.thumbnail);
            }
        }
        // Check metadata.thumbnails
        if (parsedMetadata.thumbnails && Array.isArray(parsedMetadata.thumbnails)) {
            thumbnails.push(...parsedMetadata.thumbnails);
        }
        // Check video object for thumbnail
        if (parsedMetadata.video?.thumbnail) {
            thumbnails.push(parsedMetadata.video.thumbnail);
        }
        if (parsedMetadata.video?.thumbnails && Array.isArray(parsedMetadata.video.thumbnails)) {
            thumbnails.push(...parsedMetadata.video.thumbnails);
        }
        // Check for thumbnailUrl in video metadata
        if (parsedMetadata.video?.thumbnailUrl) {
            thumbnails.push(parsedMetadata.video.thumbnailUrl);
        }
        return [...new Set(thumbnails)];
    }, [parsedMetadata]);

    // Extract images from body (filtering out videos)
    const extractedImages = useMemo(() => {
        const images: string[] = [];
        if (comment.body) {
            let match;
            // Reset regex lastIndex
            IMAGE_REGEX.lastIndex = 0;
            // Markdown images
            while ((match = IMAGE_REGEX.exec(comment.body)) !== null) {
                const url = match[1];
                if (url && !isVideoUrl(url)) {
                    images.push(url);
                }
            }
            // IPFS URLs that look like images (not videos)
            const ipfsMatches = comment.body.match(IPFS_REGEX) || [];
            ipfsMatches.forEach((url) => {
                if (!isVideoUrl(url) && !images.includes(url)) {
                    // Only add if it looks like an image or doesn't have a video extension
                    if (isImageUrl(url) || !url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)/i)) {
                        // Check if this URL is not already in videos
                        images.push(url);
                    }
                }
            });
        }
        // Filter out any URLs that are clearly videos
        return [...new Set(images)].filter((url) => !isVideoUrl(url));
    }, [comment.body, isVideoUrl, isImageUrl]);

    // Extract videos from body
    const extractedVideos = useMemo(() => {
        const videos: string[] = [];
        if (comment.body) {
            const videoMatches = comment.body.match(VIDEO_REGEX) || [];
            videos.push(...videoMatches);
            // Also check IPFS URLs for video extensions
            const ipfsMatches = comment.body.match(IPFS_REGEX) || [];
            ipfsMatches.forEach((url) => {
                if (isVideoUrl(url) && !videos.includes(url)) {
                    videos.push(url);
                }
            });
        }
        return [...new Set(videos)];
    }, [comment.body, isVideoUrl]);

    // Determine the best image for OG/preview (prioritize thumbnails for video posts)
    const primaryPreviewImage = useMemo(() => {
        // Priority order:
        // 1. Explicit thumbnail from metadata (best for video posts)
        if (metadataThumbnails.length > 0) {
            return metadataThumbnails[0];
        }
        // 2. First non-video image from metadata
        if (metadataImages.length > 0) {
            return metadataImages[0];
        }
        // 3. First extracted image from body (not a video)
        if (extractedImages.length > 0) {
            return extractedImages[0];
        }
        // 4. No image available - return null for fallback handling
        return null;
    }, [metadataThumbnails, metadataImages, extractedImages]);

    // Extract all CIDs from the post
    const extractedCids = useMemo(() => {
        const cids: string[] = [];
        if (comment.body) {
            const cidMatches = comment.body.match(CID_REGEX) || [];
            cids.push(...cidMatches);
        }
        // Also check metadata images for CIDs
        metadataImages.forEach((url: string) => {
            const cidMatches = url.match(CID_REGEX) || [];
            cids.push(...cidMatches);
        });
        // Check thumbnails for CIDs
        metadataThumbnails.forEach((url: string) => {
            const cidMatches = url.match(CID_REGEX) || [];
            cids.push(...cidMatches);
        });
        return [...new Set(cids)];
    }, [comment.body, metadataImages, metadataThumbnails]);

    // Fetch Pinata metadata for a CID
    const fetchPinataData = useCallback(async (cid: string) => {
        if (pinataData[cid] !== undefined || pinataLoading[cid]) return;

        setPinataLoading((prev) => ({ ...prev, [cid]: true }));
        setPinataError((prev) => ({ ...prev, [cid]: "" }));

        try {
            // First try our internal API for full metadata
            try {
                const apiResponse = await fetch(`/api/pinata/metadata/${cid}`, {
                    method: "GET",
                    signal: AbortSignal.timeout(5000),
                });
                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    // API returns: { name, keyvalues, id, cid, size, createdAt }
                    const fileInfo: PinataFileInfo = {
                        cid: apiData.cid || cid,
                        name: apiData.name || cid,
                        size: apiData.size || 0,
                        id: apiData.id,
                        createdAt: apiData.createdAt,
                        keyvalues: apiData.keyvalues || {},
                        mime_type: apiData.keyvalues?.fileType,
                        // Also keep in metadata for backwards compatibility
                        metadata: {
                            name: apiData.name,
                            keyvalues: apiData.keyvalues || {},
                        },
                    };
                    setPinataData((prev) => ({ ...prev, [cid]: fileInfo }));
                    return;
                }
            } catch {
                // Fallback to HEAD request
            }

            // Fallback: Try to get file info from Pinata gateway headers
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, {
                method: "HEAD",
            });

            const contentType = response.headers.get("content-type") || "unknown";
            const contentLength = response.headers.get("content-length");
            const pinataFileName = response.headers.get("x-ipfs-path")?.split("/").pop() || cid;

            // Also try to get from ipfs.skatehive.app for custom metadata
            let customMetadata: Record<string, string> = {};
            try {
                const skateResponse = await fetch(`https://ipfs.skatehive.app/ipfs/${cid}`, {
                    method: "HEAD",
                });
                // Extract any custom headers
                const headers: Record<string, string> = {};
                skateResponse.headers.forEach((value, key) => {
                    if (key.startsWith("x-")) {
                        headers[key] = value;
                    }
                });
                customMetadata = headers;
            } catch {
                // Ignore errors from skatehive gateway
            }

            const fileInfo: PinataFileInfo = {
                cid,
                name: pinataFileName,
                size: contentLength ? parseInt(contentLength, 10) : 0,
                mime_type: contentType,
                created_at: response.headers.get("last-modified") || undefined,
                metadata: {
                    keyvalues: customMetadata,
                },
            };

            setPinataData((prev) => ({ ...prev, [cid]: fileInfo }));
        } catch (error) {
            setPinataError((prev) => ({
                ...prev,
                [cid]: error instanceof Error ? error.message : "Failed to fetch",
            }));
            setPinataData((prev) => ({ ...prev, [cid]: null }));
        } finally {
            setPinataLoading((prev) => ({ ...prev, [cid]: false }));
        }
    }, [pinataData, pinataLoading]);

    // Generate preview data with proper thumbnail handling
    const previewData = useMemo(() => {
        const title = comment.title || `Reply by @${comment.author}`;
        const description = parsedMetadata.description ||
            comment.body?.substring(0, 200).replace(/[#*`\[\]!()]/g, "").trim() + "..." ||
            "No description";
        const url = typeof window !== "undefined"
            ? `${window.location.origin}/post/${comment.author}/${comment.permlink}`
            : `/post/${comment.author}/${comment.permlink}`;

        return {
            title,
            description,
            image: primaryPreviewImage,
            thumbnails: metadataThumbnails,
            url,
            author: comment.author,
            hasVideo: extractedVideos.length > 0,
            isVideoOnlyPost: extractedVideos.length > 0 && extractedImages.length === 0 && metadataImages.length === 0,
        };
    }, [comment, parsedMetadata, primaryPreviewImage, metadataThumbnails, extractedVideos, extractedImages, metadataImages]);

    // Calculate post info
    const postInfo = useMemo(() => {
        const created = comment.created ? new Date(comment.created) : null;
        const cashout = comment.cashout_time
            ? new Date(comment.cashout_time)
            : null;
        const isPending = cashout ? cashout > new Date() : false;

        return {
            created: created?.toLocaleString() || "Unknown",
            cashoutTime: cashout?.toLocaleString() || "Unknown",
            isPending,
            totalPayout: comment.total_payout_value || "0.000 HBD",
            curatorPayout: comment.curator_payout_value || "0.000 HBD",
            pendingPayout: comment.pending_payout_value || "0.000 HBD",
            depth: comment.depth || 0,
            children: comment.children || 0,
            voteCount: comment.active_votes?.length || 0,
        };
    }, [comment]);

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "Unknown";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Get icon for mime type
    const getMimeIcon = (mimeType?: string) => {
        if (!mimeType) return FaFile;
        if (mimeType.startsWith("image/")) return FaImage;
        if (mimeType.startsWith("video/")) return FaVideo;
        return FaFile;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
            <ModalOverlay bg="blackAlpha.700" />
            <ModalContent bg={bgColor} maxH="90vh">
                <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
                    <HStack spacing={3}>
                        <Badge colorScheme="purple" fontSize="sm">
                            DEV MODE
                        </Badge>
                        <Text>Post Metadata Inspector</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Tabs colorScheme="purple" variant="enclosed">
                        <TabList flexWrap="wrap">
                            <Tab>Overview</Tab>
                            <Tab>Previews</Tab>
                            <Tab>JSON Metadata</Tab>
                            <Tab>OpenGraph</Tab>
                            <Tab>Pinata/IPFS ({extractedCids.length})</Tab>
                            <Tab>Media ({extractedImages.length + extractedVideos.length})</Tab>
                            <Tab>Raw Data</Tab>
                            <Tab>Votes ({postInfo.voteCount})</Tab>
                        </TabList>

                        <TabPanels>
                            {/* Overview Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Box p={4} bg={codeBg} borderRadius="md">
                                        <Text fontWeight="bold" mb={2}>
                                            Post Identity
                                        </Text>
                                        <HStack spacing={4} wrap="wrap">
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Author
                                                </Text>
                                                <Code>@{comment.author}</Code>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Permlink
                                                </Text>
                                                <Code fontSize="xs">{comment.permlink}</Code>
                                            </Box>
                                            {comment.parent_author && (
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500">
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
                                        <Text fontWeight="bold" mb={2}>
                                            Timing & Payouts
                                        </Text>
                                        <HStack spacing={6} wrap="wrap">
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Created
                                                </Text>
                                                <Text fontSize="sm">{postInfo.created}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Cashout Time
                                                </Text>
                                                <Text fontSize="sm">{postInfo.cashoutTime}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
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
                                                <Text fontSize="xs" color="gray.500">
                                                    Total Payout
                                                </Text>
                                                <Text fontSize="sm" fontWeight="bold">
                                                    {postInfo.totalPayout}
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Curator Payout
                                                </Text>
                                                <Text fontSize="sm">{postInfo.curatorPayout}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
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
                                                <Text fontSize="xs" color="gray.500">
                                                    Votes
                                                </Text>
                                                <Text fontSize="lg" fontWeight="bold">
                                                    {postInfo.voteCount}
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Comments
                                                </Text>
                                                <Text fontSize="lg" fontWeight="bold">
                                                    {postInfo.children}
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    Depth
                                                </Text>
                                                <Text fontSize="lg" fontWeight="bold">
                                                    {postInfo.depth}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            {/* Previews Tab - Visual embed previews */}
                            <TabPanel>
                                <VStack align="stretch" spacing={6}>
                                    {/* Thumbnail Source Debug Section */}
                                    <Box p={4} bg={codeBg} borderRadius="md">
                                        <HStack justify="space-between" mb={3}>
                                            <Text fontWeight="bold">
                                                🔍 Thumbnail Source Analysis
                                            </Text>
                                            {extractedCids.length > 0 && Object.keys(pinataData).length < extractedCids.length && (
                                                <Button
                                                    size="xs"
                                                    colorScheme="cyan"
                                                    onClick={() => extractedCids.forEach((cid) => fetchPinataData(cid))}
                                                    isLoading={Object.values(pinataLoading).some(Boolean)}
                                                >
                                                    Fetch Pinata Data ({extractedCids.length} CIDs)
                                                </Button>
                                            )}
                                        </HStack>
                                        <VStack align="stretch" spacing={3}>
                                            <HStack spacing={4} wrap="wrap">
                                                <Badge colorScheme={previewData.hasVideo ? "red" : "gray"}>
                                                    {previewData.hasVideo ? "Has Video" : "No Video"}
                                                </Badge>
                                                {previewData.isVideoOnlyPost && (
                                                    <Badge colorScheme="orange">Video-Only Post</Badge>
                                                )}
                                            </HStack>

                                            {/* Explicit Thumbnails */}
                                            <Box>
                                                <Text fontSize="sm" fontWeight="medium" color="green.400">
                                                    📸 Explicit Thumbnails (metadata.thumbnail):
                                                </Text>
                                                {metadataThumbnails.length > 0 ? (
                                                    <VStack align="stretch" spacing={1} mt={1}>
                                                        {metadataThumbnails.map((thumb, idx) => (
                                                            <HStack key={idx}>
                                                                <Badge colorScheme="green" size="sm">
                                                                    {idx === 0 ? "USED" : idx + 1}
                                                                </Badge>
                                                                <Code fontSize="xs" wordBreak="break-all">
                                                                    {thumb}
                                                                </Code>
                                                            </HStack>
                                                        ))}
                                                    </VStack>
                                                ) : (
                                                    <Text fontSize="xs" color="gray.500" ml={2}>
                                                        None found
                                                    </Text>
                                                )}
                                            </Box>

                                            {/* Metadata Images (filtered) */}
                                            <Box>
                                                <Text fontSize="sm" fontWeight="medium" color="blue.400">
                                                    🖼️ Metadata Images (filtered, no videos):
                                                </Text>
                                                {metadataImages.length > 0 ? (
                                                    <VStack align="stretch" spacing={1} mt={1}>
                                                        {metadataImages.slice(0, 5).map((img: string, idx: number) => (
                                                            <HStack key={idx}>
                                                                <Badge
                                                                    colorScheme={metadataThumbnails.length === 0 && idx === 0 ? "green" : "gray"}
                                                                    size="sm"
                                                                >
                                                                    {metadataThumbnails.length === 0 && idx === 0 ? "USED" : idx + 1}
                                                                </Badge>
                                                                <Code fontSize="xs" wordBreak="break-all">
                                                                    {img}
                                                                </Code>
                                                            </HStack>
                                                        ))}
                                                        {metadataImages.length > 5 && (
                                                            <Text fontSize="xs" color="gray.500">
                                                                +{metadataImages.length - 5} more...
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                ) : (
                                                    <Text fontSize="xs" color="gray.500" ml={2}>
                                                        None found
                                                    </Text>
                                                )}
                                            </Box>

                                            {/* Extracted Videos (for reference) */}
                                            {extractedVideos.length > 0 && (
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" color="red.400">
                                                        🎬 Detected Videos (excluded from images):
                                                    </Text>
                                                    <VStack align="stretch" spacing={1} mt={1}>
                                                        {extractedVideos.slice(0, 3).map((vid, idx) => (
                                                            <HStack key={idx}>
                                                                <Badge colorScheme="red" size="sm">
                                                                    {idx + 1}
                                                                </Badge>
                                                                <Code fontSize="xs" wordBreak="break-all">
                                                                    {vid}
                                                                </Code>
                                                            </HStack>
                                                        ))}
                                                        {extractedVideos.length > 3 && (
                                                            <Text fontSize="xs" color="gray.500">
                                                                +{extractedVideos.length - 3} more...
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                </Box>
                                            )}

                                            {/* Pinata Thumbnail URLs (from keyvalues) */}
                                            {Object.keys(pinataData).length > 0 && (
                                                <Box>
                                                    <Text fontSize="sm" fontWeight="medium" color="cyan.400">
                                                        📌 Pinata Metadata (from API):
                                                    </Text>
                                                    <VStack align="stretch" spacing={2} mt={1}>
                                                        {Object.entries(pinataData)
                                                            .filter(([, data]) => data !== null)
                                                            .map(([cid, data]) => {
                                                                const kv = data?.keyvalues || data?.metadata?.keyvalues || {};
                                                                const thumbUrl = kv.thumbnailUrl || kv.thumbnail;
                                                                return (
                                                                    <Box key={cid} p={2} bg="gray.800" borderRadius="md">
                                                                        <HStack mb={1}>
                                                                            <Badge colorScheme="cyan" size="sm">
                                                                                {cid.slice(0, 12)}...
                                                                            </Badge>
                                                                            <Text fontSize="xs" color="gray.400">
                                                                                {data?.name}
                                                                            </Text>
                                                                        </HStack>
                                                                        <VStack align="stretch" spacing={1} pl={2}>
                                                                            {thumbUrl && (
                                                                                <HStack>
                                                                                    <Badge colorScheme="green" size="sm">thumbnail</Badge>
                                                                                    <Code fontSize="xs" wordBreak="break-all">
                                                                                        {thumbUrl}
                                                                                    </Code>
                                                                                </HStack>
                                                                            )}
                                                                            {kv.creator && (
                                                                                <HStack>
                                                                                    <Text fontSize="xs" color="gray.500">creator:</Text>
                                                                                    <Text fontSize="xs">{kv.creator}</Text>
                                                                                </HStack>
                                                                            )}
                                                                            {kv.source_app && (
                                                                                <HStack>
                                                                                    <Text fontSize="xs" color="gray.500">source_app:</Text>
                                                                                    <Badge size="sm" colorScheme={kv.source_app === 'mobile' ? 'purple' : 'blue'}>
                                                                                        {kv.source_app}
                                                                                    </Badge>
                                                                                </HStack>
                                                                            )}
                                                                            {kv.platform && (
                                                                                <HStack>
                                                                                    <Text fontSize="xs" color="gray.500">platform:</Text>
                                                                                    <Text fontSize="xs">{kv.platform}</Text>
                                                                                </HStack>
                                                                            )}
                                                                            {kv.fileType && (
                                                                                <HStack>
                                                                                    <Text fontSize="xs" color="gray.500">fileType:</Text>
                                                                                    <Text fontSize="xs">{kv.fileType}</Text>
                                                                                </HStack>
                                                                            )}
                                                                            {kv.uploadDate && (
                                                                                <HStack>
                                                                                    <Text fontSize="xs" color="gray.500">uploadDate:</Text>
                                                                                    <Text fontSize="xs">{kv.uploadDate}</Text>
                                                                                </HStack>
                                                                            )}
                                                                            {!thumbUrl && !kv.creator && !kv.source_app && !kv.platform && (
                                                                                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                                                                    No relevant keyvalues found
                                                                                </Text>
                                                                            )}
                                                                        </VStack>
                                                                    </Box>
                                                                );
                                                            })}
                                                        {Object.entries(pinataData).filter(([, data]) => data !== null).length === 0 && (
                                                            <Text fontSize="xs" color="gray.500">
                                                                No Pinata data fetched yet
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                    {extractedCids.length > 0 && Object.keys(pinataData).length < extractedCids.length && (
                                                        <Text fontSize="xs" color="yellow.400" mt={1}>
                                                            💡 Click &quot;Fetch Pinata Data&quot; above to load all metadata
                                                        </Text>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Final Selection */}
                                            <Box mt={2} p={2} bg="green.900" borderRadius="md">
                                                <Text fontSize="sm" fontWeight="bold" color="green.300">
                                                    ✅ Selected Preview Image:
                                                </Text>
                                                {previewData.image ? (
                                                    <Code fontSize="xs" wordBreak="break-all" color="green.200">
                                                        {previewData.image}
                                                    </Code>
                                                ) : (
                                                    <Text fontSize="xs" color="yellow.400">
                                                        ⚠️ No suitable image found - fallback will be used
                                                    </Text>
                                                )}
                                            </Box>
                                        </VStack>
                                    </Box>

                                    {/* Image Preview */}
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
                                                <Text color="gray.500">No image available for preview</Text>
                                                <Text fontSize="xs" color="gray.600" mt={2}>
                                                    This post has no thumbnail, metadata images, or extracted images
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Social Media Embed Previews */}
                                    <Divider />
                                    <Text fontWeight="bold" fontSize="lg">
                                        Social Media Embed Previews
                                    </Text>

                                    <Flex gap={6} wrap="wrap">
                                        {/* Twitter/X Preview */}
                                        <Box>
                                            <HStack mb={2}>
                                                <Badge colorScheme="blue">Twitter/X</Badge>
                                                <Text fontSize="xs" color="gray.500">
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

                                        {/* Discord Preview */}
                                        <Box>
                                            <HStack mb={2}>
                                                <Badge colorScheme="purple">Discord</Badge>
                                                <Text fontSize="xs" color="gray.500">
                                                    OpenGraph embed
                                                </Text>
                                            </HStack>
                                            <Box
                                                borderLeft="4px solid"
                                                borderColor="purple.500"
                                                bg={codeBg}
                                                borderRadius="md"
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
                                    </Flex>

                                    {/* Farcaster Frame Preview */}
                                    <Divider />
                                    <Box>
                                        <HStack mb={3}>
                                            <Badge colorScheme="purple">Farcaster Frame</Badge>
                                            <Text fontSize="xs" color="gray.500">
                                                Mini-app preview
                                            </Text>
                                        </HStack>
                                        <Flex gap={6} wrap="wrap">
                                            <Box>
                                                <Text fontSize="sm" color="gray.500" mb={2}>
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
                                                <Text fontSize="sm" color="gray.500" mb={2}>
                                                    With Video
                                                </Text>
                                                <FarcasterFramePreview
                                                    title={previewData.title}
                                                    image={previewData.image || undefined}
                                                    buttonText={previewData.hasVideo ? "▶️ Play Video" : "View Post"}
                                                    postUrl={previewData.url}
                                                />
                                            </Box>
                                        </Flex>

                                        {/* Frame Meta Tags */}
                                        <Box mt={4} p={3} bg={codeBg} borderRadius="md">
                                            <Text fontWeight="bold" mb={2} fontSize="sm">
                                                Frame Meta Tags
                                            </Text>
                                            <VStack align="stretch" spacing={1}>
                                                <Code fontSize="xs">
                                                    fc:frame = vNext
                                                </Code>
                                                <Code fontSize="xs">
                                                    fc:frame:image = {previewData.image || "No image"}
                                                </Code>
                                                <Code fontSize="xs">
                                                    fc:frame:button:1 = Open Post
                                                </Code>
                                                <Code fontSize="xs">
                                                    fc:frame:button:1:action = link
                                                </Code>
                                                <Code fontSize="xs" wordBreak="break-all">
                                                    fc:frame:button:1:target = {previewData.url}
                                                </Code>
                                            </VStack>
                                        </Box>
                                    </Box>

                                    {/* Telegram Preview */}
                                    <Divider />
                                    <Box>
                                        <HStack mb={3}>
                                            <Badge colorScheme="blue">Telegram</Badge>
                                            <Text fontSize="xs" color="gray.500">
                                                Instant View preview
                                            </Text>
                                        </HStack>
                                        <Box
                                            bg="gray.700"
                                            borderRadius="lg"
                                            p={3}
                                            maxW="400px"
                                        >
                                            {previewData.image && (
                                                <Image
                                                    src={previewData.image}
                                                    alt="Telegram preview"
                                                    borderRadius="md"
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
                                </VStack>
                            </TabPanel>

                            {/* JSON Metadata Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>
                                            Parsed Metadata
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

                                    {parsedMetadata.app && (
                                        <Box p={4} bg={codeBg} borderRadius="md">
                                            <HStack spacing={4}>
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500">
                                                        App
                                                    </Text>
                                                    <Badge colorScheme="blue">{parsedMetadata.app}</Badge>
                                                </Box>
                                                {parsedMetadata.tags && (
                                                    <Box>
                                                        <Text fontSize="xs" color="gray.500">
                                                            Tags
                                                        </Text>
                                                        <HStack wrap="wrap" spacing={1}>
                                                            {parsedMetadata.tags.map((tag: string, i: number) => (
                                                                <Badge key={i} colorScheme="gray" size="sm">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </HStack>
                                                    </Box>
                                                )}
                                            </HStack>
                                        </Box>
                                    )}
                                </VStack>
                            </TabPanel>

                            {/* OpenGraph Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Box p={4} bg={codeBg} borderRadius="md">
                                        <Text fontWeight="bold" mb={3}>
                                            OpenGraph / SEO Preview
                                        </Text>
                                        <VStack align="stretch" spacing={3}>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    og:title
                                                </Text>
                                                <Code fontSize="sm" display="block" p={2}>
                                                    {comment.title || `Reply by @${comment.author}`}
                                                </Code>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    og:description
                                                </Text>
                                                <Code fontSize="sm" display="block" p={2} whiteSpace="pre-wrap">
                                                    {parsedMetadata.description ||
                                                        comment.body?.substring(0, 200).replace(/[#*`\[\]!]/g, "") + "..." ||
                                                        "No description"}
                                                </Code>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
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
                                                    <Text color="gray.500" fontSize="sm">No image available</Text>
                                                )}
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
                                                    og:url
                                                </Text>
                                                <Code fontSize="sm" display="block" p={2}>
                                                    {typeof window !== "undefined"
                                                        ? `${window.location.origin}/post/${comment.author}/${comment.permlink}`
                                                        : `/post/${comment.author}/${comment.permlink}`}
                                                </Code>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="gray.500">
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
                                                <Text fontSize="xs" color="gray.500" w="120px">
                                                    twitter:card
                                                </Text>
                                                <Badge colorScheme="blue">
                                                    {extractedVideos.length > 0 ? "player" : "summary_large_image"}
                                                </Badge>
                                            </HStack>
                                            <HStack>
                                                <Text fontSize="xs" color="gray.500" w="120px">
                                                    twitter:site
                                                </Text>
                                                <Code fontSize="sm">@skatabordhive</Code>
                                            </HStack>
                                            <HStack>
                                                <Text fontSize="xs" color="gray.500" w="120px">
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
                                                <Text fontSize="xs" color="gray.500" w="120px">
                                                    app
                                                </Text>
                                                <Badge colorScheme="green">{parsedMetadata.app || "Unknown"}</Badge>
                                            </HStack>
                                            {parsedMetadata.format && (
                                                <HStack>
                                                    <Text fontSize="xs" color="gray.500" w="120px">
                                                        format
                                                    </Text>
                                                    <Code fontSize="sm">{parsedMetadata.format}</Code>
                                                </HStack>
                                            )}
                                            {parsedMetadata.canonical_url && (
                                                <HStack>
                                                    <Text fontSize="xs" color="gray.500" w="120px">
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
                            </TabPanel>

                            {/* Pinata/IPFS Tab */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    {/* CID Details with API Fetch */}
                                    <Box p={4} bg={codeBg} borderRadius="md">
                                        <HStack justify="space-between" mb={3}>
                                            <Text fontWeight="bold">
                                                Detected CIDs ({extractedCids.length})
                                            </Text>
                                            {extractedCids.length > 0 && (
                                                <Button
                                                    size="xs"
                                                    leftIcon={<FaSync />}
                                                    onClick={() => extractedCids.forEach(fetchPinataData)}
                                                    isLoading={Object.values(pinataLoading).some(Boolean)}
                                                >
                                                    Fetch All Metadata
                                                </Button>
                                            )}
                                        </HStack>

                                        {extractedCids.length === 0 ? (
                                            <Text color="gray.500" fontSize="sm">No IPFS CIDs found in this post</Text>
                                        ) : (
                                            <VStack align="stretch" spacing={3}>
                                                {extractedCids.map((cid) => {
                                                    const data = pinataData[cid];
                                                    const loading = pinataLoading[cid];
                                                    const error = pinataError[cid];
                                                    const isVideo = data?.mime_type?.startsWith("video/");
                                                    const isImage = data?.mime_type?.startsWith("image/");

                                                    return (
                                                        <Box
                                                            key={cid}
                                                            p={3}
                                                            bg={bgColor}
                                                            borderRadius="md"
                                                            border="1px solid"
                                                            borderColor={borderColor}
                                                        >
                                                            <HStack justify="space-between" mb={2}>
                                                                <HStack>
                                                                    <Icon
                                                                        as={getMimeIcon(data?.mime_type)}
                                                                        color={isVideo ? "red.400" : isImage ? "blue.400" : "gray.400"}
                                                                    />
                                                                    <Badge
                                                                        colorScheme={isVideo ? "red" : isImage ? "blue" : "gray"}
                                                                    >
                                                                        {data?.mime_type || "Unknown type"}
                                                                    </Badge>
                                                                </HStack>
                                                                <HStack>
                                                                    {!data && !loading && (
                                                                        <Button
                                                                            size="xs"
                                                                            variant="ghost"
                                                                            onClick={() => fetchPinataData(cid)}
                                                                        >
                                                                            Fetch Info
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="xs"
                                                                        variant="ghost"
                                                                        leftIcon={<FaExternalLinkAlt />}
                                                                        as="a"
                                                                        href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                                                                        target="_blank"
                                                                    >
                                                                        Open
                                                                    </Button>
                                                                </HStack>
                                                            </HStack>

                                                            <Code fontSize="xs" display="block" wordBreak="break-all" mb={2}>
                                                                {cid}
                                                            </Code>

                                                            {loading && (
                                                                <HStack spacing={2}>
                                                                    <Spinner size="xs" />
                                                                    <Text fontSize="xs" color="gray.500">Fetching metadata...</Text>
                                                                </HStack>
                                                            )}

                                                            {error && (
                                                                <Text fontSize="xs" color="red.400">Error: {error}</Text>
                                                            )}

                                                            {data && (
                                                                <VStack align="stretch" spacing={1} mt={2}>
                                                                    <HStack>
                                                                        <Text fontSize="xs" color="gray.500" w="80px">Size:</Text>
                                                                        <Text fontSize="xs">{formatFileSize(data.size)}</Text>
                                                                    </HStack>
                                                                    {data.name && data.name !== cid && (
                                                                        <HStack>
                                                                            <Text fontSize="xs" color="gray.500" w="80px">Name:</Text>
                                                                            <Text fontSize="xs">{data.name}</Text>
                                                                        </HStack>
                                                                    )}
                                                                    {data.createdAt && (
                                                                        <HStack>
                                                                            <Text fontSize="xs" color="gray.500" w="80px">Pinned:</Text>
                                                                            <Text fontSize="xs">{new Date(data.createdAt).toLocaleString()}</Text>
                                                                        </HStack>
                                                                    )}
                                                                    {data.id && (
                                                                        <HStack>
                                                                            <Text fontSize="xs" color="gray.500" w="80px">Pinata ID:</Text>
                                                                            <Text fontSize="xs">{data.id}</Text>
                                                                        </HStack>
                                                                    )}

                                                                    {/* Keyvalues - structured display */}
                                                                    {(() => {
                                                                        const kv = data.keyvalues || data.metadata?.keyvalues || {};
                                                                        if (Object.keys(kv).length === 0) return null;
                                                                        
                                                                        return (
                                                                            <Box mt={2} p={2} bg="gray.800" borderRadius="md">
                                                                                <Text fontSize="xs" color="cyan.400" fontWeight="bold" mb={2}>
                                                                                    📌 Pinata Keyvalues
                                                                                </Text>
                                                                                <VStack align="stretch" spacing={1}>
                                                                                    {/* Thumbnail URL - highlighted */}
                                                                                    {(kv.thumbnailUrl || kv.thumbnail) && (
                                                                                        <Box p={1} bg="green.900" borderRadius="sm">
                                                                                            <HStack>
                                                                                                <Badge colorScheme="green" size="sm">thumbnail</Badge>
                                                                                                <Code fontSize="xs" wordBreak="break-all" color="green.200">
                                                                                                    {kv.thumbnailUrl || kv.thumbnail}
                                                                                                </Code>
                                                                                            </HStack>
                                                                                        </Box>
                                                                                    )}
                                                                                    {/* Source app & platform */}
                                                                                    {(kv.source_app || kv.platform) && (
                                                                                        <HStack wrap="wrap" spacing={2}>
                                                                                            {kv.source_app && (
                                                                                                <Badge colorScheme={kv.source_app === 'mobile' ? 'purple' : 'blue'} size="sm">
                                                                                                    source: {kv.source_app}
                                                                                                </Badge>
                                                                                            )}
                                                                                            {kv.platform && (
                                                                                                <Badge colorScheme="gray" size="sm">
                                                                                                    platform: {kv.platform}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* Creator */}
                                                                                    {kv.creator && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">creator:</Text>
                                                                                            <Text fontSize="xs">{kv.creator}</Text>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* File info */}
                                                                                    {kv.fileType && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">fileType:</Text>
                                                                                            <Code fontSize="xs">{kv.fileType}</Code>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {kv.fileSize && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">fileSize:</Text>
                                                                                            <Text fontSize="xs">{formatFileSize(parseInt(kv.fileSize))}</Text>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {kv.uploadDate && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">uploadDate:</Text>
                                                                                            <Text fontSize="xs">{new Date(kv.uploadDate).toLocaleString()}</Text>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* App version */}
                                                                                    {kv.app_version && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">app_version:</Text>
                                                                                            <Code fontSize="xs">{kv.app_version}</Code>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* Request ID */}
                                                                                    {kv.requestId && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">requestId:</Text>
                                                                                            <Code fontSize="xs">{kv.requestId}</Code>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* Device info */}
                                                                                    {kv.deviceInfo && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">device:</Text>
                                                                                            <Text fontSize="xs" noOfLines={1}>{kv.deviceInfo}</Text>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* User HP */}
                                                                                    {kv.userHP && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">userHP:</Text>
                                                                                            <Text fontSize="xs">{kv.userHP}</Text>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* isMobile flag */}
                                                                                    {kv.isMobile && (
                                                                                        <HStack>
                                                                                            <Text fontSize="xs" color="gray.500">isMobile:</Text>
                                                                                            <Badge size="sm" colorScheme={kv.isMobile === 'true' ? 'purple' : 'gray'}>
                                                                                                {kv.isMobile}
                                                                                            </Badge>
                                                                                        </HStack>
                                                                                    )}
                                                                                    {/* User agent (truncated) */}
                                                                                    {kv.userAgent && (
                                                                                        <Box>
                                                                                            <Text fontSize="xs" color="gray.500">userAgent:</Text>
                                                                                            <Code fontSize="xs" wordBreak="break-all" display="block">
                                                                                                {kv.userAgent}
                                                                                            </Code>
                                                                                        </Box>
                                                                                    )}
                                                                                    {/* Any other unknown fields */}
                                                                                    {Object.entries(kv)
                                                                                        .filter(([key]) => ![
                                                                                            'thumbnailUrl', 'thumbnail', 'source_app', 'platform', 
                                                                                            'creator', 'fileType', 'fileSize', 'uploadDate',
                                                                                            'app_version', 'requestId', 'deviceInfo', 'userHP',
                                                                                            'isMobile', 'userAgent', 'clientIP'
                                                                                        ].includes(key))
                                                                                        .map(([key, value]) => (
                                                                                            <HStack key={key}>
                                                                                                <Text fontSize="xs" color="gray.500">{key}:</Text>
                                                                                                <Code fontSize="xs">{value}</Code>
                                                                                            </HStack>
                                                                                        ))
                                                                                    }
                                                                                </VStack>
                                                                            </Box>
                                                                        );
                                                                    })()}

                                                                    {/* Preview for images */}
                                                                    {isImage && (
                                                                        <Box mt={2}>
                                                                            <Image
                                                                                src={`https://gateway.pinata.cloud/ipfs/${cid}`}
                                                                                alt="IPFS Preview"
                                                                                maxH="150px"
                                                                                borderRadius="sm"
                                                                                fallbackSrc="https://via.placeholder.com/200x150?text=Load+Error"
                                                                            />
                                                                        </Box>
                                                                    )}
                                                                </VStack>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </VStack>
                                        )}
                                    </Box>

                                    {/* IPFS URLs found in post */}
                                    <Box p={4} bg={codeBg} borderRadius="md">
                                        <Text fontWeight="bold" mb={3}>
                                            IPFS/Pinata Full URLs
                                        </Text>
                                        {(() => {
                                            const ipfsUrls = comment.body?.match(IPFS_REGEX) || [];
                                            const uniqueIpfs = [...new Set(ipfsUrls)];
                                            if (uniqueIpfs.length === 0) {
                                                return <Text color="gray.500" fontSize="sm">No IPFS URLs found</Text>;
                                            }
                                            return (
                                                <VStack align="stretch" spacing={2}>
                                                    {uniqueIpfs.map((url, i) => {
                                                        const cidMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
                                                        const cid = cidMatch ? cidMatch[1] : "Unknown";
                                                        const isVideo = url.match(VIDEO_REGEX);
                                                        return (
                                                            <Box key={i} p={2} bg={bgColor} borderRadius="sm" border="1px solid" borderColor={borderColor}>
                                                                <HStack justify="space-between" mb={1}>
                                                                    <Badge colorScheme={isVideo ? "red" : "blue"}>
                                                                        {isVideo ? "VIDEO" : "IMAGE"}
                                                                    </Badge>
                                                                    <Badge colorScheme="purple" fontSize="xs">
                                                                        CID: {cid.substring(0, 12)}...
                                                                    </Badge>
                                                                </HStack>
                                                                <Code fontSize="xs" wordBreak="break-all" display="block">
                                                                    {url}
                                                                </Code>
                                                            </Box>
                                                        );
                                                    })}
                                                </VStack>
                                            );
                                        })()}
                                    </Box>

                                    {/* Pinata Gateway Info */}
                                    <Box p={4} bg={codeBg} borderRadius="md">
                                        <Text fontWeight="bold" mb={3}>
                                            Gateway Reference
                                        </Text>
                                        <VStack align="stretch" spacing={2}>
                                            <HStack>
                                                <Badge colorScheme="green">Primary</Badge>
                                                <Code fontSize="xs">ipfs.skatehive.app</Code>
                                            </HStack>
                                            <HStack>
                                                <Badge colorScheme="blue">Pinata</Badge>
                                                <Code fontSize="xs">gateway.pinata.cloud</Code>
                                            </HStack>
                                            <HStack>
                                                <Badge colorScheme="gray">Public</Badge>
                                                <Code fontSize="xs">ipfs.io/ipfs/</Code>
                                            </HStack>
                                        </VStack>
                                    </Box>

                                    {/* Video Transcoding Metadata */}
                                    {parsedMetadata.video && (
                                        <Box p={4} bg={codeBg} borderRadius="md">
                                            <Text fontWeight="bold" mb={3}>
                                                Video Transcoding Metadata
                                            </Text>
                                            <Box p={2} bg={bgColor} borderRadius="sm">
                                                <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                                                    {JSON.stringify(parsedMetadata.video, null, 2)}
                                                </Code>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Source App Info (from our transcoder) */}
                                    {(parsedMetadata.source_app || parsedMetadata.sourceApp) && (
                                        <Box p={4} bg={codeBg} borderRadius="md">
                                            <Text fontWeight="bold" mb={3}>
                                                Video Upload Source
                                            </Text>
                                            <HStack spacing={4} wrap="wrap">
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Source App
                                                    </Text>
                                                    <Badge colorScheme="green" fontSize="md">
                                                        {parsedMetadata.source_app || parsedMetadata.sourceApp}
                                                    </Badge>
                                                </Box>
                                                {(parsedMetadata.app_version || parsedMetadata.appVersion) && (
                                                    <Box>
                                                        <Text fontSize="xs" color="gray.500">
                                                            App Version
                                                        </Text>
                                                        <Code fontSize="sm">
                                                            {parsedMetadata.app_version || parsedMetadata.appVersion}
                                                        </Code>
                                                    </Box>
                                                )}
                                                {parsedMetadata.platform && (
                                                    <Box>
                                                        <Text fontSize="xs" color="gray.500">
                                                            Platform
                                                        </Text>
                                                        <Code fontSize="sm">{parsedMetadata.platform}</Code>
                                                    </Box>
                                                )}
                                                {parsedMetadata.userHP && (
                                                    <Box>
                                                        <Text fontSize="xs" color="gray.500">
                                                            User HP
                                                        </Text>
                                                        <Badge colorScheme="orange">{parsedMetadata.userHP} HP</Badge>
                                                    </Box>
                                                )}
                                            </HStack>
                                        </Box>
                                    )}

                                    {/* Links metadata */}
                                    {parsedMetadata.links && (
                                        <Box p={4} bg={codeBg} borderRadius="md">
                                            <Text fontWeight="bold" mb={3}>
                                                External Links
                                            </Text>
                                            <VStack align="stretch" spacing={1}>
                                                {Object.entries(parsedMetadata.links).map(([key, value]) => (
                                                    <HStack key={key}>
                                                        <Text fontSize="xs" color="gray.500" w="100px">
                                                            {key}
                                                        </Text>
                                                        <Code fontSize="xs" wordBreak="break-all">
                                                            {Array.isArray(value) ? value.join(", ") : String(value)}
                                                        </Code>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}
                                </VStack>
                            </TabPanel>

                            {/* Media Tab */}
                            <TabPanel>
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
                                            <Text color="gray.500">No media found in this post</Text>
                                        )}
                                </VStack>
                            </TabPanel>

                            {/* Raw Data Tab */}
                            <TabPanel>
                                <Accordion allowMultiple>
                                    <AccordionItem>
                                        <AccordionButton>
                                            <Box flex="1" textAlign="left" fontWeight="bold">
                                                Full Post Object
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel>
                                            <Box
                                                p={4}
                                                bg={codeBg}
                                                borderRadius="md"
                                                overflowX="auto"
                                                maxH="400px"
                                                overflowY="auto"
                                            >
                                                <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                                                    {JSON.stringify(comment, null, 2)}
                                                </Code>
                                            </Box>
                                        </AccordionPanel>
                                    </AccordionItem>

                                    <AccordionItem>
                                        <AccordionButton>
                                            <Box flex="1" textAlign="left" fontWeight="bold">
                                                Post Body (Raw Markdown)
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel>
                                            <Box
                                                p={4}
                                                bg={codeBg}
                                                borderRadius="md"
                                                overflowX="auto"
                                                maxH="400px"
                                                overflowY="auto"
                                            >
                                                <Code display="block" whiteSpace="pre-wrap" fontSize="xs">
                                                    {comment.body || "No body content"}
                                                </Code>
                                            </Box>
                                        </AccordionPanel>
                                    </AccordionItem>
                                </Accordion>
                            </TabPanel>

                            {/* Votes Tab */}
                            <TabPanel>
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
                                                                <Text fontSize="xs" color="gray.500">
                                                                    Weight
                                                                </Text>
                                                                <Badge
                                                                    colorScheme={vote.weight >= 0 ? "green" : "red"}
                                                                >
                                                                    {(vote.weight / 100).toFixed(0)}%
                                                                </Badge>
                                                            </Box>
                                                            <Box textAlign="right">
                                                                <Text fontSize="xs" color="gray.500">
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
                                        <Text color="gray.500">No votes on this post</Text>
                                    )}
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
