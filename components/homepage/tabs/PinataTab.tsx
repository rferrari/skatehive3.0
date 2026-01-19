"use client";

import {
    VStack,
    Box,
    Text,
    HStack,
    Code,
    Badge,
    Image,
    Button,
    Icon,
    Spinner,
    useColorModeValue,
} from "@chakra-ui/react";
import { FaExternalLinkAlt, FaSync, FaImage, FaVideo, FaFile } from "react-icons/fa";
import {
    TabComponentProps,
    PinataFileInfo,
    VIDEO_REGEX,
    IPFS_REGEX,
    FormatFileSizeFunction,
    GetMimeIconFunction,
} from "../types/DevMetadataTypes";
import { APP_CONFIG } from "@/config/app.config";

interface PinataTabProps {
    comment: TabComponentProps["comment"];
    extractedCids: TabComponentProps["extractedCids"];
    pinataData: TabComponentProps["pinataData"];
    pinataLoading: TabComponentProps["pinataLoading"];
    pinataError: TabComponentProps["pinataError"];
    fetchPinataData: TabComponentProps["fetchPinataData"];
    parsedMetadata: TabComponentProps["parsedMetadata"];
}

// Format file size utility
const formatFileSize: FormatFileSizeFunction = (bytes: number): string => {
    if (bytes === 0) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Get icon for mime type
const getMimeIcon: GetMimeIconFunction = (mimeType?: string) => {
    if (!mimeType) return FaFile;
    if (mimeType.startsWith("image/")) return FaImage;
    if (mimeType.startsWith("video/")) return FaVideo;
    return FaFile;
};

export const PinataTab = ({
    comment,
    extractedCids,
    pinataData,
    pinataLoading,
    pinataError,
    fetchPinataData,
    parsedMetadata,
}: PinataTabProps) => {
    const codeBg = useColorModeValue("gray.100", "gray.900");
    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const warningBg = useColorModeValue("yellow.50", "yellow.900");
    const warningBorder = useColorModeValue("yellow.300", "yellow.600");

    return (
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
                <HStack spacing={3} wrap="wrap">
                    <Badge colorScheme={extractedCids.length > 0 ? "green" : "yellow"}>
                        CIDs: {extractedCids.length}
                    </Badge>
                    <Badge colorScheme={Object.values(pinataData).some(Boolean) ? "green" : "yellow"}>
                        Pinata records: {Object.values(pinataData).filter(Boolean).length}
                    </Badge>
                    {Object.values(pinataError).some(Boolean) && (
                        <Badge colorScheme="red">Errors: {Object.values(pinataError).filter(Boolean).length}</Badge>
                    )}
                </HStack>
                {Object.values(pinataError).some(Boolean) && (
                    <Box mt={3} p={3} borderRadius="md" bg={warningBg} border="1px solid" borderColor={warningBorder}>
                        <Text fontSize="xs" color="primary">
                            Some CIDs failed to fetch from Pinata. Check the error rows below for status and retry.
                        </Text>
                    </Box>
                )}

                {extractedCids.length === 0 ? (
                    <Text color="primary" fontSize="sm">No IPFS CIDs found in this post</Text>
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
                                            <Text fontSize="xs" color="primary">Fetching metadata...</Text>
                                        </HStack>
                                    )}

                                    {error && (
                                        <Text fontSize="xs" color="red.400">Error: {error}</Text>
                                    )}

                                    {data && (
                                        <VStack align="stretch" spacing={1} mt={2}>
                                            <HStack>
                                                <Text fontSize="xs" color="primary" w="80px">Size:</Text>
                                                <Text fontSize="xs">{formatFileSize(data.size)}</Text>
                                            </HStack>
                                            {data.name && data.name !== cid && (
                                                <HStack>
                                                    <Text fontSize="xs" color="primary" w="80px">Name:</Text>
                                                    <Text fontSize="xs">{data.name}</Text>
                                                </HStack>
                                            )}
                                            {data.createdAt && (
                                                <HStack>
                                                    <Text fontSize="xs" color="primary" w="80px">Pinned:</Text>
                                                    <Text fontSize="xs">{new Date(data.createdAt).toLocaleString()}</Text>
                                                </HStack>
                                            )}
                                            {data.id && (
                                                <HStack>
                                                    <Text fontSize="xs" color="primary" w="80px">Pinata ID:</Text>
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
                                                                Pinata Keyvalues
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
                                                                    <Text fontSize="xs" color="primary">creator:</Text>
                                                                    <Text fontSize="xs">{kv.creator}</Text>
                                                                </HStack>
                                                            )}
                                                            {/* File info */}
                                                            {kv.fileType && (
                                                                <HStack>
                                                                    <Text fontSize="xs" color="primary">fileType:</Text>
                                                                    <Code fontSize="xs">{kv.fileType}</Code>
                                                                </HStack>
                                                            )}
                                                            {kv.fileSize && (
                                                                <HStack>
                                                                    <Text fontSize="xs" color="primary">fileSize:</Text>
                                                                    <Text fontSize="xs">{formatFileSize(parseInt(kv.fileSize))}</Text>
                                                                </HStack>
                                                            )}
                                                            {kv.uploadDate && (
                                                                <HStack>
                                                                    <Text fontSize="xs" color="primary">uploadDate:</Text>
                                                                    <Text fontSize="xs">{new Date(kv.uploadDate).toLocaleString()}</Text>
                                                                </HStack>
                                                            )}
                                                            {/* App version */}
                                                            {kv.app_version && (
                                                                <HStack>
                                                                    <Text fontSize="xs" color="primary">app_version:</Text>
                                                                    <Code fontSize="xs">{kv.app_version}</Code>
                                                                </HStack>
                                                            )}
                                                            {/* Other fields with filtered display */}
                                                            {Object.entries(kv)
                                                                .filter(([key]) => ![
                                                                    'thumbnailUrl', 'thumbnail', 'source_app', 'platform',
                                                                    'creator', 'fileType', 'fileSize', 'uploadDate',
                                                                    'app_version', 'requestId', 'deviceInfo', 'userHP',
                                                                    'isMobile', 'userAgent', 'clientIP'
                                                                ].includes(key))
                                                                .map(([key, value]) => (
                                                                    <HStack key={key}>
                                                                        <Text fontSize="xs" color="primary">{key}:</Text>
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
                        return <Text color="primary" fontSize="sm">No IPFS URLs found</Text>;
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

            {/* Pinata Gateway Info */}
            <Box p={4} bg={codeBg} borderRadius="md">
                <Text fontWeight="bold" mb={3}>
                    Gateway Reference
                </Text>
                <VStack align="stretch" spacing={2}>
                    <HStack>
                        <Badge colorScheme="green">Primary</Badge>
                        <Code fontSize="xs">{APP_CONFIG.IPFS_GATEWAY}</Code>
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
        </VStack>
    );
};