import React, { useState, useRef } from "react";
import {
  Box,
  Flex,
  Image,
  Text,
  VStack,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { FaUpload, FaCheck, FaTimes } from "react-icons/fa";
import {
  extractImageUrls,
  extractVideoUrls,
} from "@/lib/utils/extractImageUrls";
import { uploadToHiveImagesWithRetry } from "@/lib/utils/imageUpload";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(
    null
  );

  if (!show) return null;

  const imageUrls = extractImageUrls(markdown);
  const videoUrls = extractVideoUrls(markdown);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          throw new Error("Failed to read file");
        }

        const result = await uploadToHiveImagesWithRetry(dataUrl, file.name);
        setUploadedThumbnail(result.url);
        setSelectedThumbnail(result.url);
        setUploadError(null);
        setIsUploading(false);
      } catch (error) {
        setIsUploading(false);
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
      }
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      setUploadError("Failed to read file");
    };
    
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleRemoveUploaded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedThumbnail(null);
    if (selectedThumbnail === uploadedThumbnail) {
      setSelectedThumbnail(null);
    }
  };

  const ThumbnailBox = ({
    url,
    isVideo = false,
    onRemove,
  }: {
    url: string;
    isVideo?: boolean;
    onRemove?: (e: React.MouseEvent) => void;
  }) => (
    <Box
      border={
        selectedThumbnail === url ? "2px solid" : "2px solid transparent"
      }
      borderColor={selectedThumbnail === url ? "#6a9e6a" : "transparent"}
      overflow="hidden"
      cursor="pointer"
      onClick={() => setSelectedThumbnail(url)}
      _hover={{ borderColor: "#6a9e6a" }}
      width="96px"
      height="96px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="rgba(255,255,255,0.03)"
      position="relative"
    >
      {isVideo ? (
        <video
          src={url}
          style={{ maxWidth: 90, maxHeight: 90, objectFit: "cover" }}
          preload="metadata"
          muted
        />
      ) : (
        <Image
          src={url}
          alt="thumbnail"
          style={{ maxWidth: 90, maxHeight: 90, objectFit: "cover" }}
        />
      )}
      {selectedThumbnail === url && (
        <Box
          position="absolute"
          top={1}
          right={1}
          bg="#6a9e6a"
          borderRadius="full"
          p={1}
        >
          <FaCheck size={10} color="white" />
        </Box>
      )}
      {onRemove && (
        <IconButton
          aria-label="Remove thumbnail"
          icon={<FaTimes size={12} />}
          size="xs"
          position="absolute"
          top={1}
          left={1}
          bg="rgba(180,80,80,0.5)"
          color="white"
          _hover={{ bg: "rgba(180,80,80,0.7)" }}
          onClick={onRemove}
          borderRadius="full"
          minW="20px"
          h="20px"
        />
      )}
    </Box>
  );

  return (
    <Box>
      <Text
        letterSpacing="0.08em"
        fontSize="11px"
        color="#888"
        mb={3}
        fontWeight="medium"
        textTransform="uppercase"
      >
        Thumbnail
      </Text>
      <Flex wrap="wrap" gap={3} alignItems="flex-start">
        {uploadedThumbnail && (
          <ThumbnailBox
            url={uploadedThumbnail}
            onRemove={handleRemoveUploaded}
          />
        )}
        {imageUrls.map((url, idx) => (
          <ThumbnailBox key={url + idx} url={url} />
        ))}
        {videoUrls.map((url, idx) => (
          <ThumbnailBox key={url + idx} url={url} isVideo />
        ))}
        <Box
          border="2px dashed rgba(255,255,255,0.12)"
          overflow="hidden"
          cursor={isUploading ? "wait" : "pointer"}
          onClick={handleUploadClick}
          _hover={{ borderColor: "#6a9e6a" }}
          width="96px"
          height="96px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(255,255,255,0.02)"
          position="relative"
        >
          {isUploading ? (
            <Spinner size="sm" color="#6a9e6a" />
          ) : (
            <VStack spacing={1}>
              <FaUpload color="#6a9e6a" size={18} />
              <Text fontSize="xs" color="#b0b0b0" textAlign="center">
                Upload
              </Text>
            </VStack>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </Box>
      </Flex>
      {uploadError && (
        <Text color="#c87070" fontSize="sm" mt={2}>
          {uploadError}
        </Text>
      )}
      {selectedThumbnail && (
        <Box mt={2} color="#888" fontSize="sm">
          Selected:{" "}
          <span
            style={{
              wordBreak: "break-all",
              color: "#6a9e6a",
            }}
          >
            {selectedThumbnail}
          </span>
        </Box>
      )}
    </Box>
  );
}
