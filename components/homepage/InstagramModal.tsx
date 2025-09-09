"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
} from "@chakra-ui/react";
import {
  downloadInstagramMedia,
  isValidInstagramUrl,
  isVideoFile,
  normalizeInstagramUrl,
} from "@/lib/utils/instagramDownload";

interface InstagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaDownloaded: (url: string, filename: string, isVideo: boolean) => void;
}

const InstagramModal: React.FC<InstagramModalProps> = ({
  isOpen,
  onClose,
  onMediaDownloaded,
}) => {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (inputUrl: string) => {
    // Set the original URL first
    setUrl(inputUrl);
    
    // Clear any previous errors when user types
    if (error) {
      setError(null);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError("Please enter an Single video Instagram URL");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const result = await downloadInstagramMedia(url);

      if (result.success && result.url && result.filename) {
        const isVideo = isVideoFile(result.filename);
        onMediaDownloaded(result.url, result.filename, isVideo);
        onClose();
        setUrl("");
      } else {
        // Provide more specific error messages for common Instagram issues
        let errorMessage = result.error || "Failed to download media";

        if (
          errorMessage.includes("rate-limit") ||
          errorMessage.includes("login required")
        ) {
          errorMessage =
            "Instagram rate limit reached or authentication required. Please try again later or use a different post.";
        } else if (errorMessage.includes("not available")) {
          errorMessage =
            "This Instagram content is not available. It may be private, deleted, or restricted.";
        } else if (errorMessage.includes("All servers failed")) {
          errorMessage =
            "Instagram download servers are currently unavailable. Please try again later.";
        }

        setError(errorMessage);
      }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "Download failed";

      // Handle client-side errors
      if (
        errorMessage.includes("rate-limit") ||
        errorMessage.includes("login required")
      ) {
        errorMessage =
          "Instagram rate limit reached or authentication required. Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    if (!isDownloading) {
      setUrl("");
      setError(null);
      onClose();
    }
  };

  const isValidUrl = url.trim() && isValidInstagramUrl(url);
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg="background">
        <ModalHeader>Import from Instagram</ModalHeader>
        <ModalCloseButton isDisabled={isDownloading} />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Paste an Instagram post or reel URL (URLs will be automatically normalized):
              </Text>
              <Input
                placeholder="https://www.instagram.com/p/ABC123... or /reel/ABC123..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                isDisabled={isDownloading}
                focusBorderColor="primary"
              />
            </Box>

            {isDevelopment && url && (
              <Box bg="gray.50" p={3} borderRadius="md" border="1px solid" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                  Original URL:
                </Text>
                <Text fontSize="xs" color="gray.800" fontFamily="mono" wordBreak="break-all" mb={2}>
                  {url}
                </Text>
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                  Normalized URL (will be used):
                </Text>
                <Text fontSize="xs" color="green.600" fontFamily="mono" wordBreak="break-all">
                  {normalizeInstagramUrl(url)}
                </Text>
              </Box>
            )}

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">{error}</AlertDescription>
              </Alert>
            )}

            {isDownloading && (
              <Box>
                <Text fontSize="sm" mb={2}>
                  Downloading media from Instagram...
                </Text>
                <Progress size="sm" isIndeterminate colorScheme="blue" />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isDownloading}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleDownload}
            isLoading={isDownloading}
            loadingText="Downloading..."
          >
            Import Media
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InstagramModal;
