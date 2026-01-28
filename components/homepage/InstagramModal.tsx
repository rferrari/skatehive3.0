"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  VStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
  HStack,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  downloadInstagramMedia,
  isValidInstagramUrl,
  isVideoFile,
  normalizeInstagramUrl,
} from "@/lib/utils/instagramDownload";
import SkateModal from "@/components/shared/SkateModal";

interface HealthStatus {
  healthy: boolean;
  loading: boolean;
  error?: string;
  lastChecked?: Date;
}

interface InstagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaDownloaded: (url: string, filename: string, isVideo: boolean) => void;
  healthStatus?: HealthStatus;
}

const InstagramModal: React.FC<InstagramModalProps> = ({
  isOpen,
  onClose,
  onMediaDownloaded,
  healthStatus,
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
    <SkateModal
      isOpen={isOpen}
      onClose={handleClose}
      title="instagram-import"
      size="md"
      footer={
        <HStack spacing={3} justify="flex-end">
          <Button
            variant="ghost"
            onClick={handleClose}
            isDisabled={isDownloading}
            color="text"
          >
            Cancel
          </Button>
          <Button
            bg="primary"
            color="background"
            onClick={handleDownload}
            isLoading={isDownloading}
            loadingText="Downloading..."
            isDisabled={!isValidUrl}
            _hover={{ opacity: 0.8 }}
          >
            Import Media
          </Button>
        </HStack>
      }
    >
      <Box p={4}>
        <VStack spacing={4} align="stretch">
            {/* Server Health Status */}
            {healthStatus && (
              <HStack 
                spacing={2} 
                p={2} 
                bg={healthStatus.loading ? "gray.700" : healthStatus.healthy ? "green.900" : "red.900"} 
                borderRadius="md"
                border="1px solid"
                borderColor={healthStatus.loading ? "gray.600" : healthStatus.healthy ? "green.600" : "red.600"}
              >
                {healthStatus.loading ? (
                  <>
                    <Spinner size="xs" color="gray.400" />
                    <Text fontSize="xs" color="gray.400">Checking server status...</Text>
                  </>
                ) : healthStatus.healthy ? (
                  <>
                    <Badge colorScheme="green" fontSize="2xs">ONLINE</Badge>
                    <Text fontSize="xs" color="green.300">Instagram download server is available</Text>
                  </>
                ) : (
                  <>
                    <Badge colorScheme="red" fontSize="2xs">OFFLINE</Badge>
                    <Text fontSize="xs" color="red.300">
                      {healthStatus.error || "Server unavailable - downloads may fail"}
                    </Text>
                  </>
                )}
              </HStack>
            )}

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
        </Box>
      </SkateModal>
    );
  };
  
  export default InstagramModal;
