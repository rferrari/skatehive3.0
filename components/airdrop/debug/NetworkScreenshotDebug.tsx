"use client";

import {
  VStack,
  HStack,
  Text,
  Box,
  Button,
  Image,
  Code,
  Alert,
  AlertIcon,
  Badge,
  Divider,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useState } from "react";
import { uploadToHiveImagesWithRetry } from "@/lib/utils/imageUpload";

interface NetworkScreenshotDebugProps {
  screenshotDataUrl: string;
  onClose?: () => void;
}

export function NetworkScreenshotDebug({
  screenshotDataUrl,
  onClose,
}: NetworkScreenshotDebugProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const toast = useToast();

  const handleTestUpload = async () => {
    if (!screenshotDataUrl) return;

    setIsUploading(true);
    setUploadError("");
    setUploadedImageUrl("");

    try {
      const uploadResult = await uploadToHiveImagesWithRetry(
        screenshotDataUrl,
        `debug-airdrop-network-${Date.now()}.png`
      );

      setUploadedImageUrl(uploadResult.url);
      toast({
        title: "Upload Successful!",
        description: "Screenshot uploaded to Hive Images",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown upload error";
      setUploadError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
      status: "success",
      duration: 2000,
    });
  };

  const getImageSizeInfo = () => {
    if (!screenshotDataUrl) return null;

    // Estimate size from base64 data
    const base64Length = screenshotDataUrl.split(",")[1]?.length || 0;
    const sizeInBytes = (base64Length * 3) / 4;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    return {
      bytes: sizeInBytes,
      kb: sizeInKB,
      mb: sizeInMB,
    };
  };

  const sizeInfo = getImageSizeInfo();

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.8)"
      zIndex={9999}
      p={4}
      overflowY="auto"
    >
      <VStack
        spacing={6}
        maxW="4xl"
        mx="auto"
        bg="background"
        p={6}
        borderRadius="lg"
      >
        <HStack justify="space-between" w="full">
          <Text fontSize="2xl" fontWeight="bold" color="primary">
            🐛 Network Screenshot Debug
          </Text>
          {onClose && (
            <Button variant="ghost" onClick={onClose} color="textSecondary">
              ✕ Close
            </Button>
          )}
        </HStack>

        <Divider />

        {/* Screenshot Preview */}
        <VStack spacing={4} w="full">
          <Text fontSize="lg" fontWeight="semibold">
            📸 Captured Screenshot Preview
          </Text>

          {screenshotDataUrl ? (
            <Box>
              <Image
                src={screenshotDataUrl}
                alt="Network Screenshot"
                maxH="400px"
                maxW="100%"
                border="2px solid"
                borderColor="border"
                borderRadius="md"
                objectFit="contain"
              />

              {sizeInfo && (
                <HStack mt={2} spacing={4} justify="center">
                  <Badge colorScheme="blue">{sizeInfo.kb} KB</Badge>
                  <Badge colorScheme="green">{sizeInfo.mb} MB</Badge>
                  <Badge colorScheme="purple">PNG Format</Badge>
                </HStack>
              )}
            </Box>
          ) : (
            <VStack spacing={3}>
              <Alert status="warning">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">No screenshot data available</Text>
                  <Text fontSize="sm">
                    Try switching to the Network Flow view and wait a moment for
                    auto-capture, or click the &quot;Capture Now&quot; button in
                    the network view.
                  </Text>
                </VStack>
              </Alert>

              <Text fontSize="sm" color="textSecondary">
                💡 Debug Tips:
              </Text>
              <VStack
                align="start"
                spacing={1}
                fontSize="sm"
                color="textSecondary"
              >
                <Text>
                  • Make sure you&apos;re in Network Flow view (not Table view)
                </Text>
                <Text>• Wait 2-3 seconds for the network to fully render</Text>
                <Text>
                  • Use the &quot;Capture Now&quot; button in the bottom-right
                  of the network
                </Text>
                <Text>• Check browser console for screenshot errors</Text>
              </VStack>
            </VStack>
          )}
        </VStack>

        <Divider />

        {/* Upload Test Section */}
        <VStack spacing={4} w="full">
          <Text fontSize="lg" fontWeight="semibold">
            ☁️ Test Hive Images Upload
          </Text>

          <Button
            colorScheme="blue"
            onClick={handleTestUpload}
            isLoading={isUploading}
            loadingText="Uploading..."
            disabled={!screenshotDataUrl}
            size="lg"
          >
            {uploadedImageUrl
              ? "✅ Re-test Upload"
              : "🚀 Test Upload to Hive Images"}
          </Button>

          {isUploading && (
            <HStack>
              <Spinner size="sm" />
              <Text color="textSecondary">Uploading to Hive Images...</Text>
            </HStack>
          )}

          {uploadError && (
            <Alert status="error">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">Upload Error:</Text>
                <Code colorScheme="red" p={2} fontSize="sm">
                  {uploadError}
                </Code>
              </VStack>
            </Alert>
          )}

          {uploadedImageUrl && (
            <VStack spacing={3} w="full">
              <Alert status="success">
                <AlertIcon />
                <Text>✅ Successfully uploaded to Hive Images!</Text>
              </Alert>

              <Box w="full">
                <Text fontWeight="semibold" mb={2}>
                  📎 Uploaded Image URL:
                </Text>
                <HStack>
                  <Code
                    p={2}
                    fontSize="sm"
                    wordBreak="break-all"
                    flex="1"
                    bg="cardBg"
                  >
                    {uploadedImageUrl}
                  </Code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(uploadedImageUrl)}
                    colorScheme="green"
                  >
                    Copy
                  </Button>
                </HStack>
              </Box>

              <Box w="full">
                <Text fontWeight="semibold" mb={2}>
                  🖼️ Uploaded Image Preview:
                </Text>
                <Image
                  src={uploadedImageUrl}
                  alt="Uploaded Screenshot"
                  maxH="300px"
                  maxW="100%"
                  border="2px solid"
                  borderColor="green.500"
                  borderRadius="md"
                  objectFit="contain"
                />
              </Box>
            </VStack>
          )}
        </VStack>

        <Divider />

        {/* Data URL Debug */}
        <VStack spacing={4} w="full">
          <Text fontSize="lg" fontWeight="semibold">
            🔧 Raw Data URL Debug
          </Text>

          <Box w="full">
            <Text fontWeight="semibold" mb={2}>
              📊 Data URL Info:
            </Text>
            {screenshotDataUrl ? (
              <VStack spacing={2} align="start">
                <Code fontSize="sm" p={2} bg="cardBg">
                  Format: {screenshotDataUrl.split(",")[0]}
                </Code>
                <Code fontSize="sm" p={2} bg="cardBg">
                  Length: {screenshotDataUrl.length.toLocaleString()} characters
                </Code>
                <HStack>
                  <Code
                    fontSize="xs"
                    p={2}
                    wordBreak="break-all"
                    maxH="100px"
                    overflowY="auto"
                    flex="1"
                    bg="cardBg"
                  >
                    {screenshotDataUrl.substring(0, 200)}...
                  </Code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(screenshotDataUrl)}
                    colorScheme="blue"
                  >
                    Copy Full
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <Alert status="info">
                <AlertIcon />
                No data URL captured yet
              </Alert>
            )}
          </Box>
        </VStack>

        <Divider />

        <Text fontSize="sm" color="textSecondary" textAlign="center">
          💡 This debug tool helps you verify that screenshot capture and image
          upload are working correctly before running actual airdrops.
        </Text>
      </VStack>
    </Box>
  );
}
