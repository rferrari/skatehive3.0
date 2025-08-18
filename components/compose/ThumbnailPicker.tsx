import React from "react";
import { Box, Flex, Image } from "@chakra-ui/react";
import {
  extractImageUrls,
  extractVideoUrls,
} from "@/lib/utils/extractImageUrls";

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
    <Box>
      <Box mb={3} fontWeight="bold" color="primary">
        Choose a thumbnail:
      </Box>
      <Flex wrap="wrap" gap={3}>
        {imageUrls.map((url, idx) => (
          <Box
            key={url + idx}
            border={
              selectedThumbnail === url ? "2px solid" : "2px solid transparent"
            }
            borderColor={selectedThumbnail === url ? "accent" : "transparent"}
            borderRadius="md"
            overflow="hidden"
            cursor="pointer"
            onClick={() => setSelectedThumbnail(url)}
            _hover={{ borderColor: "primary" }}
            width="96px"
            height="96px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="muted"
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
              selectedThumbnail === url ? "2px solid" : "2px solid transparent"
            }
            borderColor={selectedThumbnail === url ? "accent" : "transparent"}
            borderRadius="md"
            overflow="hidden"
            cursor="pointer"
            onClick={() => setSelectedThumbnail(url)}
            _hover={{ borderColor: "primary" }}
            width="96px"
            height="96px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="muted"
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
          <Box color="muted">No media found in your post yet.</Box>
        )}
      </Flex>
      {selectedThumbnail && (
        <Box mt={2} color="muted" fontSize="sm">
          Selected thumbnail:{" "}
          <span
            style={{
              wordBreak: "break-all",
              color: "var(--chakra-colors-primary)",
            }}
          >
            {selectedThumbnail}
          </span>
        </Box>
      )}
    </Box>
  );
}
