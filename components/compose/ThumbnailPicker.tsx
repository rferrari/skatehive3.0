import React from "react";
import { Box, Flex, Image } from "@chakra-ui/react";
import { extractImageUrls, extractVideoUrls } from "@/lib/utils/extractImageUrls";

interface ThumbnailPickerProps {
    show: boolean;
    markdown: string;
    selectedThumbnail: string | null;
    setSelectedThumbnail: (thumbnail: string | null) => void;
}

export default function ThumbnailPicker({
    show,
    markdown,
    selectedThumbnail,
    setSelectedThumbnail,
}: ThumbnailPickerProps) {
    if (!show) return null;

    const imageUrls = extractImageUrls(markdown);
    const videoUrls = extractVideoUrls(markdown);

    return (
        <Box
            mt={4}
            p={3}
            border="1px solid #444"
            borderRadius="md"
            bg="#181818"
        >
            <Box mb={2} fontWeight="bold">
                Choose a thumbnail:
            </Box>
            <Flex wrap="wrap" gap={3}>
                {imageUrls.map((url, idx) => (
                    <Box
                        key={url + idx}
                        border={
                            selectedThumbnail === url
                                ? "2px solid limegreen"
                                : "2px solid transparent"
                        }
                        borderRadius="md"
                        overflow="hidden"
                        cursor="pointer"
                        onClick={() => setSelectedThumbnail(url)}
                        _hover={{ border: "2px solid #3182ce" }}
                        width="96px"
                        height="96px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="#222"
                    >
                        <Image
                            src={url}
                            alt="thumbnail"
                            style={{ maxWidth: 90, maxHeight: 90, objectFit: "cover" }}
                        />
                    </Box>
                ))}
                {videoUrls.map((url, idx) => (
                    <Box
                        key={url + idx}
                        border={
                            selectedThumbnail === url
                                ? "2px solid limegreen"
                                : "2px solid transparent"
                        }
                        borderRadius="md"
                        overflow="hidden"
                        cursor="pointer"
                        onClick={() => setSelectedThumbnail(url)}
                        _hover={{ border: "2px solid #3182ce" }}
                        width="96px"
                        height="96px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="#222"
                    >
                        <video
                            src={url}
                            style={{ maxWidth: 90, maxHeight: 90, objectFit: "cover" }}
                            preload="metadata"
                            muted
                        />
                    </Box>
                ))}
                {imageUrls.length === 0 && videoUrls.length === 0 && (
                    <Box color="#888">No media found in your post yet.</Box>
                )}
            </Flex>
            {selectedThumbnail && (
                <Box mt={2} color="#aaa" fontSize="sm">
                    Selected thumbnail:{" "}
                    <span style={{ wordBreak: "break-all" }}>
                        {selectedThumbnail}
                    </span>
                </Box>
            )}
        </Box>
    );
}
