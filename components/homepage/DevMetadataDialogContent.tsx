"use client";

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    HStack,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Text,
    Box,
    Input,
    FormControl,
    FormLabel,
    Button,
    VStack,
    useColorModeValue,
} from "@chakra-ui/react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { APP_CONFIG } from "@/config/app.config";
import type { DevMetadataDialogProps } from "./DevMetadataDialog";
import {
    IMAGE_REGEX,
    VIDEO_REGEX,
    IPFS_REGEX,
    CID_REGEX,
    PinataFileInfo,
    PreviewData,
    PostInfo,
} from "./types/DevMetadataTypes";

import { OverviewTab } from "./tabs/OverviewTab";
import { PreviewsTab } from "./tabs/PreviewsTab";
import { MetadataTab } from "./tabs/MetadataTab";
import { PinataTab } from "./tabs/PinataTab";
import { RawDataTab } from "./tabs/RawDataTab";

export default function DevMetadataDialogContent({
    isOpen,
    onClose,
    comment,
}: DevMetadataDialogProps) {
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const inspectorBg = useColorModeValue("gray.900", "gray.800");

    const [pinataData, setPinataData] = useState<Record<string, PinataFileInfo | null>>({});
    const [pinataLoading, setPinataLoading] = useState<Record<string, boolean>>({});
    const [pinataError, setPinataError] = useState<Record<string, string>>({});
    const [renderedMeta, setRenderedMeta] = useState<Record<string, string>>({});
    const [inspectorAuthor, setInspectorAuthor] = useState(comment.author);
    const [inspectorPermlink, setInspectorPermlink] = useState(comment.permlink);
    const [queryAuthor, setQueryAuthor] = useState(comment.author);
    const [queryPermlink, setQueryPermlink] = useState(comment.permlink);

    const hivePostQuery = useQuery({
        queryKey: ["dev-post", queryAuthor, queryPermlink],
        enabled: Boolean(queryAuthor && queryPermlink),
        queryFn: async () => {
            const response = await fetch("https://api.hive.blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "condenser_api.get_content",
                    params: [queryAuthor, queryPermlink],
                    id: 1,
                }),
            });
            const data = await response.json();
            return data.result || null;
        },
    });

    const activeComment = hivePostQuery.data?.author ? hivePostQuery.data : comment;

    const parsedMetadata = useMemo(() => {
        if (typeof activeComment.json_metadata === "string") {
            try {
                return JSON.parse(activeComment.json_metadata);
            } catch {
                return {};
            }
        }
        return activeComment.json_metadata || {};
    }, [activeComment.json_metadata]);

    const isVideoUrl = useCallback((url: string): boolean => {
        if (!url) return false;
        const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)(\?.*)?$/i;
        return videoExtensions.test(url);
    }, []);

    const isImageUrl = useCallback((url: string): boolean => {
        if (!url) return false;
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
        if (imageExtensions.test(url)) return true;
        if (url.includes("thumbnail") || url.includes("thumb")) return true;
        return false;
    }, []);

    const metadataImages = useMemo(() => {
        const images: string[] = [];
        const imageField = parsedMetadata.image;
        const imagesField = parsedMetadata.images;
        if (Array.isArray(imageField)) {
            images.push(...imageField);
        }
        if (Array.isArray(imagesField)) {
            images.push(...imagesField);
        }
        if (typeof imageField === "string") {
            images.push(imageField);
        }
        if (typeof imagesField === "string") {
            images.push(imagesField);
        }
        return images.filter((url: string) => url && !isVideoUrl(url));
    }, [parsedMetadata.image, parsedMetadata.images, isVideoUrl]);

    const metadataThumbnails = useMemo(() => {
        const thumbnails: string[] = [];
        if (parsedMetadata.thumbnail) {
            if (Array.isArray(parsedMetadata.thumbnail)) {
                thumbnails.push(...parsedMetadata.thumbnail);
            } else if (typeof parsedMetadata.thumbnail === "string") {
                thumbnails.push(parsedMetadata.thumbnail);
            }
        }
        if (parsedMetadata.thumbnails && Array.isArray(parsedMetadata.thumbnails)) {
            thumbnails.push(...parsedMetadata.thumbnails);
        }
        if (parsedMetadata.video?.thumbnail) {
            thumbnails.push(parsedMetadata.video.thumbnail);
        }
        if (parsedMetadata.video?.thumbnails && Array.isArray(parsedMetadata.video.thumbnails)) {
            thumbnails.push(...parsedMetadata.video.thumbnails);
        }
        if (parsedMetadata.video?.thumbnailUrl) {
            thumbnails.push(parsedMetadata.video.thumbnailUrl);
        }
        return [...new Set(thumbnails)];
    }, [parsedMetadata]);

    const extractedImages = useMemo(() => {
        const images: string[] = [];
        if (activeComment.body) {
            let match;
            IMAGE_REGEX.lastIndex = 0;
            while ((match = IMAGE_REGEX.exec(activeComment.body)) !== null) {
                const url = match[1];
                if (url && !isVideoUrl(url)) {
                    images.push(url);
                }
            }
            const ipfsMatches = activeComment.body.match(IPFS_REGEX) || [];
            ipfsMatches.forEach((url: string) => {
                if (!isVideoUrl(url) && !images.includes(url)) {
                    if (isImageUrl(url) || !url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)/i)) {
                        images.push(url);
                    }
                }
            });
        }
        return [...new Set(images)].filter((url) => !isVideoUrl(url));
    }, [activeComment.body, isVideoUrl, isImageUrl]);

    const extractedVideos = useMemo(() => {
        const videos: string[] = [];
        if (activeComment.body) {
            const videoMatches = activeComment.body.match(VIDEO_REGEX) || [];
            videos.push(...videoMatches);
            const ipfsMatches = activeComment.body.match(IPFS_REGEX) || [];
            ipfsMatches.forEach((url: string) => {
                if (isVideoUrl(url) && !videos.includes(url)) {
                    videos.push(url);
                }
            });
        }
        return [...new Set(videos)];
    }, [activeComment.body, isVideoUrl]);

    const primaryPreviewImage = useMemo(() => {
        if (metadataThumbnails.length > 0) {
            return metadataThumbnails[0];
        }
        if (metadataImages.length > 0) {
            return metadataImages[0];
        }
        if (extractedImages.length > 0) {
            return extractedImages[0];
        }
        return null;
    }, [metadataThumbnails, metadataImages, extractedImages]);

    const previewImageSource = useMemo(() => {
        if (metadataThumbnails.length > 0) return "metadata.thumbnail";
        if (metadataImages.length > 0) return "metadata.image(s)";
        if (extractedImages.length > 0) return "body image";
        return "none";
    }, [metadataThumbnails, metadataImages, extractedImages]);

    const extractedCids = useMemo(() => {
        const cids: string[] = [];
        if (activeComment.body) {
            const cidMatches = activeComment.body.match(CID_REGEX) || [];
            cids.push(...cidMatches);
        }
        metadataImages.forEach((url: string) => {
            const cidMatches = url.match(CID_REGEX) || [];
            cids.push(...cidMatches);
        });
        metadataThumbnails.forEach((url: string) => {
            const cidMatches = url.match(CID_REGEX) || [];
            cids.push(...cidMatches);
        });
        return [...new Set(cids)];
    }, [activeComment.body, metadataImages, metadataThumbnails]);

    const fetchPinataData = useCallback(async (cid: string) => {
        if (pinataData[cid] !== undefined || pinataLoading[cid]) return;

        setPinataLoading((prev) => ({ ...prev, [cid]: true }));
        setPinataError((prev) => ({ ...prev, [cid]: "" }));

        try {
            try {
                const apiResponse = await fetch(`/api/pinata/metadata/${cid}`, {
                    method: "GET",
                    signal: AbortSignal.timeout(5000),
                });
                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    const fileInfo: PinataFileInfo = {
                        cid: apiData.cid || cid,
                        name: apiData.name || cid,
                        size: apiData.size || 0,
                        id: apiData.id,
                        createdAt: apiData.createdAt,
                        keyvalues: apiData.keyvalues || {},
                        mime_type: apiData.keyvalues?.fileType,
                        metadata: {
                            name: apiData.name,
                            keyvalues: apiData.keyvalues || {},
                        },
                    };
                    setPinataData((prev) => ({ ...prev, [cid]: fileInfo }));
                    return;
                }
            } catch {
                // Fallback to gateway HEAD request
            }

            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, {
                method: "HEAD",
            });

            const contentType = response.headers.get("content-type") || "unknown";
            const contentLength = response.headers.get("content-length");
            const pinataFileName = response.headers.get("x-ipfs-path")?.split("/").pop() || cid;

            let customMetadata: Record<string, string> = {};
            try {
                const skateResponse = await fetch(`https://${APP_CONFIG.IPFS_GATEWAY}/ipfs/${cid}`, {
                    method: "HEAD",
                });
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

    const cleanDescription = useCallback((value?: string) => {
        if (!value) return "";
        return value
            .replace(/<[^>]*>/g, "")
            .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }, []);

    const previewData: PreviewData = useMemo(() => {
        const title = activeComment.title || `Reply by @${activeComment.author}`;
        const metadataDescription = cleanDescription(parsedMetadata.description);
        const cleanedBody = cleanDescription(activeComment.body || "");
        const description = metadataDescription ||
            (cleanedBody ? `${cleanedBody.slice(0, 200)}...` : "No description");
        const origin = typeof window !== "undefined" ? window.location.origin : APP_CONFIG.BASE_URL;
        const url = `${origin}/post/${activeComment.author}/${activeComment.permlink}`;

        return {
            title,
            description,
            image: primaryPreviewImage,
            thumbnails: metadataThumbnails,
            url,
            author: activeComment.author,
            hasVideo: extractedVideos.length > 0,
            isVideoOnlyPost: extractedVideos.length > 0 && extractedImages.length === 0 && metadataImages.length === 0,
            renderedMeta,
        };
    }, [activeComment, parsedMetadata, primaryPreviewImage, metadataThumbnails, extractedVideos, extractedImages, metadataImages, renderedMeta, cleanDescription]);

    const postInfo: PostInfo = useMemo(() => {
        const created = activeComment.created ? new Date(activeComment.created) : null;
        const cashout = activeComment.cashout_time
            ? new Date(activeComment.cashout_time)
            : null;
        const isPending = cashout ? cashout > new Date() : false;

        return {
            created: created?.toLocaleString() || "Unknown",
            cashoutTime: cashout?.toLocaleString() || "Unknown",
            isPending,
            totalPayout: activeComment.total_payout_value || "0.000 HBD",
            curatorPayout: activeComment.curator_payout_value || "0.000 HBD",
            pendingPayout: activeComment.pending_payout_value || "0.000 HBD",
            depth: activeComment.depth || 0,
            children: activeComment.children || 0,
            voteCount: activeComment.active_votes?.length || 0,
        };
    }, [activeComment]);

    useEffect(() => {
        if (!isOpen) return;
        const controller = new AbortController();
        const fetchRenderedMeta = async () => {
            try {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                if (!origin) return;
                const url = `${origin}/post/${activeComment.author}/${activeComment.permlink}`;
                const response = await fetch(url, { signal: controller.signal });
                const html = await response.text();
                const metaTags = html.match(/<meta[^>]+>/gi) || [];
                const meta: Record<string, string> = {};
                metaTags.forEach((tag) => {
                    const nameMatch = tag.match(/name=["']([^"']+)["']/i);
                    const propertyMatch = tag.match(/property=["']([^"']+)["']/i);
                    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
                    const key = nameMatch?.[1] || propertyMatch?.[1];
                    if (key && contentMatch) {
                        meta[key] = contentMatch[1];
                    }
                });
                setRenderedMeta(meta);
            } catch {
                setRenderedMeta({});
            }
        };
        fetchRenderedMeta();
        return () => controller.abort();
    }, [isOpen, activeComment.author, activeComment.permlink]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
            <ModalOverlay bg="blackAlpha.700" />
            <ModalContent bg="background" maxH="90vh">
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
                    <VStack align="stretch" spacing={4} mb={4}>
                        <Box p={4} bg={inspectorBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                            <Text fontWeight="bold" mb={3}>Inspect Another Post</Text>
                            <HStack spacing={3} align="flex-end" wrap="wrap">
                                <FormControl maxW={{ base: "full", md: "240px" }}>
                                    <FormLabel fontSize="xs" color="primary">Author</FormLabel>
                                    <Input
                                        value={inspectorAuthor}
                                        onChange={(event) => setInspectorAuthor(event.target.value.replace(/^@/, ""))}
                                        placeholder="author"
                                        size="sm"
                                    />
                                </FormControl>
                                <FormControl flex="1" minW={{ base: "full", md: "320px" }}>
                                    <FormLabel fontSize="xs" color="primary">Permlink</FormLabel>
                                    <Input
                                        value={inspectorPermlink}
                                        onChange={(event) => setInspectorPermlink(event.target.value)}
                                        placeholder="permlink"
                                        size="sm"
                                    />
                                </FormControl>
                                <Button
                                    size="sm"
                                    colorScheme="purple"
                                    onClick={() => {
                                        setQueryAuthor(inspectorAuthor.trim());
                                        setQueryPermlink(inspectorPermlink.trim());
                                    }}
                                    isLoading={hivePostQuery.isFetching}
                                >
                                    Load Post
                                </Button>
                            </HStack>
                            <Text fontSize="xs" color="primary" mt={2}>
                                Fetches only after clicking Load Post.
                            </Text>
                            {hivePostQuery.data && !hivePostQuery.data.author && (
                                <Text fontSize="xs" color="red.400" mt={2}>
                                    Post not found. Check author and permlink.
                                </Text>
                            )}
                        </Box>
                    </VStack>
                    <Tabs colorScheme="purple" variant="enclosed">
                        <TabList flexWrap="wrap">
                            <Tab>Overview</Tab>
                            <Tab>Previews</Tab>
                            <Tab>Metadata</Tab>
                            <Tab>Pinata/IPFS ({extractedCids.length})</Tab>
                            <Tab>Raw</Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel>
                                <OverviewTab
                                    comment={activeComment}
                                    postInfo={postInfo}
                                    metadataImages={metadataImages}
                                    metadataThumbnails={metadataThumbnails}
                                    extractedImages={extractedImages}
                                    extractedVideos={extractedVideos}
                                    extractedCids={extractedCids}
                                />
                            </TabPanel>

                            <TabPanel>
                                <PreviewsTab
                                    previewData={previewData}
                                    metadataThumbnails={metadataThumbnails}
                                    metadataImages={metadataImages}
                                    extractedImages={extractedImages}
                                    extractedVideos={extractedVideos}
                                    previewImageSource={previewImageSource}
                                />
                            </TabPanel>

                            <TabPanel>
                                <MetadataTab parsedMetadata={parsedMetadata} />
                            </TabPanel>

                            <TabPanel>
                                <PinataTab
                                    comment={activeComment}
                                    extractedCids={extractedCids}
                                    pinataData={pinataData}
                                    pinataLoading={pinataLoading}
                                    pinataError={pinataError}
                                    fetchPinataData={fetchPinataData}
                                    parsedMetadata={parsedMetadata}
                                />
                            </TabPanel>

                            <TabPanel>
                                <RawDataTab comment={activeComment} />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
