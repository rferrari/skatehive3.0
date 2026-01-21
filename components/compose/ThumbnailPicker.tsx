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
      borderColor={selectedThumbnail === url ? "accent" : "transparent"}
      borderRadius="none"
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
          bg="accent"
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
          bg="error"
          color="white"
          _hover={{ bg: "error", opacity: 0.8 }}
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
      <Box mb={3} fontWeight="bold" color="primary">
        Choose a thumbnail:
      </Box>
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
          border="2px dashed"
          borderColor="muted"
          borderRadius="none"
          overflow="hidden"
          cursor={isUploading ? "wait" : "pointer"}
          onClick={handleUploadClick}
          _hover={{ borderColor: "primary" }}
          width="96px"
          height="96px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="muted"
          position="relative"
        >
          {isUploading ? (
            <Spinner size="sm" color="primary" />
          ) : (
            <VStack spacing={1}>
              <FaUpload color="var(--chakra-colors-primary)" size={18} />
              <Text fontSize="xs" color="muted" textAlign="center">
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
        <Text color="error" fontSize="sm" mt={2}>
          {uploadError}
        </Text>
      )}
      {selectedThumbnail && (
        <Box mt={2} color="muted" fontSize="sm">
          Selected:{" "}
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
