"use client";

import React, { useRef, useState } from "react";
import {
  Flex,
  Input,
  Button,
  Center,
  Spinner,
  Box,
  Text,
  HStack,
  VStack,
  Image,
} from "@chakra-ui/react";
import ImageCompressor, {
  ImageCompressorRef,
} from "@/lib/utils/ImageCompressor";
import VideoUploader, {
  VideoUploaderRef,
} from "../../components/homepage/VideoUploader";

import HashtagInput from "../../components/compose/HashtagInput";
import BeneficiariesInput from "../../components/compose/BeneficiariesInput";

import ThumbnailPicker from "../../components/compose/ThumbnailPicker";
import MarkdownEditor from "../../components/compose/MarkdownEditor";
import { useComposeForm } from "../../hooks/useComposeForm";
import {
  useImageUpload,
  useVideoUpload,
  useFileDropUpload,
} from "../../hooks/useFileUpload";
import { useDropzone } from "react-dropzone";

export default function Composer() {
  const {
    markdown,
    setMarkdown,
    title,
    setTitle,
    hashtagInput,
    setHashtagInput,
    hashtags,
    setHashtags,
    beneficiaries,
    setBeneficiaries,
    placeholderIndex,
    selectedThumbnail,
    setSelectedThumbnail,
    previewMode,
    placeholders,
    user,
    insertAtCursorWrapper,
    handleSubmit: originalHandleSubmit,
    isSubmitting,
  } = useComposeForm();

  // Local state for compose page features
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | null>(
    null
  );
  const [imagesInMarkdown] = useState<Array<{ url: string; alt?: string }>>([]);

  // Placeholder functions - TODO: Implement image caption functionality
  const updateImageCaption = (url: string, caption: string) => {
    console.log("TODO: Update image caption", url, caption);
  };

  // Use the wrapped handleSubmit from useComposeForm
  const handleSubmit = originalHandleSubmit;

  React.useEffect(() => {}, [
    beneficiaries,
    title,
    markdown,
    hashtags,
    isSubmitting,
  ]);

  // Refs
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);

  // Custom image upload handler that inserts inline with editable captions
  const handleImageUploadWithCaption = async (
    url: string | null,
    fileName?: string
  ) => {
    setIsImageUploading(true);
    if (url) {
      try {
        const blob = await fetch(url).then((res) => res.blob());
        const { uploadToIpfs } = await import("@/lib/markdown/composeUtils");
        const ipfsUrl = await uploadToIpfs(
          blob,
          fileName || "compressed-image.jpg"
        );

        // Insert into markdown at cursor position
        insertAtCursorWrapper(`\n![](${ipfsUrl})\n`);
      } catch (error) {
        console.error("Error uploading compressed image to IPFS:", error);
      } finally {
        setIsImageUploading(false);
      }
    } else {
      setIsImageUploading(false);
    }
  };

  // Upload hooks
  const {
    isUploading: isImageUploading,
    isCompressingImage,
    createImageTrigger,
    setIsUploading: setIsImageUploading,
  } = useImageUpload(insertAtCursorWrapper);

  const {
    isCompressingVideo,
    handleVideoUpload,
    createVideoTrigger,
    setIsCompressingVideo,
  } = useVideoUpload(insertAtCursorWrapper);

  // Video error state
  const [videoError, setVideoError] = useState<string | null>(null);

  // GIF upload handler
  const handleGifUpload = async (gifBlob: Blob, fileName: string) => {
    try {
      // Ensure filename has .gif extension
      const gifFileName = fileName.endsWith(".gif")
        ? fileName
        : `${fileName}.gif`;

      // Create a File object from the blob with proper .gif extension
      const gifFile = new File([gifBlob], gifFileName, { type: "image/gif" });

      // Upload to IPFS using the same method as images
      const { uploadToIpfs } = await import("@/lib/markdown/composeUtils");
      const ipfsUrl = await uploadToIpfs(gifFile, gifFileName);

      // Insert into markdown at cursor position
      insertAtCursorWrapper(`\n![](${ipfsUrl})\n`);
    } catch (error) {
      console.error("Error uploading GIF to IPFS:", error);
      throw error; // Re-throw so MarkdownEditor can handle fallback
    }
  };

  // Create trigger functions with refs
  const handleImageTrigger = createImageTrigger(imageCompressorRef);
  const handleVideoTrigger = createVideoTrigger(videoUploaderRef);

  // Video duration error handling
  const [videoDurationError, setVideoDurationError] = useState<string | null>(
    null
  );

  const handleVideoDurationError = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    setVideoDurationError(
      `Video is ${minutes}m ${seconds}s long. Long videos will be uploaded without compression to prevent crashes.`
    );
    // Clear error after 5 seconds
    setTimeout(() => setVideoDurationError(null), 5000);
  };

  const { isUploading: isDropUploading, onDrop } = useFileDropUpload(
    insertAtCursorWrapper
  );
  const { isDragActive } = useDropzone({ onDrop, noClick: true });

  // Combined uploading state
  const isUploading = isImageUploading || isDropUploading;

  // TODO: Implement GIF modal functionality
  // Handle GIF modal effects - currently disabled until GIF modal is implemented
  // React.useEffect(() => {
  //   if (isGifModalOpen) {
  //     gifMakerWithSelectorRef.current?.reset();
  //     setGifUrl(null);
  //     setGifSize(null);
  //     setIsProcessingGif(false);
  //   }
  // }, [isGifModalOpen, setGifUrl, setGifSize, setIsProcessingGif]);

  return (
    <Flex
      width="100%"
      height="92vh"
      bgColor="background"
      justify="center"
      p="1"
      direction="column"
      overflow="hidden"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify={{ base: "flex-start", md: "space-between" }}
        mb={4}
        gap={2}
        width="100%"
        position="relative"
      >
        <Input
          placeholder={placeholders[placeholderIndex]}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="lg"
          borderRadius="base"
          fontSize="3xl"
          fontWeight="bold"
          _placeholder={{ fontSize: "3xl" }}
          maxLength={123}
          flex="1"
          minW={0}
        />
      </Flex>

      {isUploading && (
        <Center>
          <Spinner />
        </Center>
      )}

      <Flex width="100%" justify="flex-end" mb={2}>
        <Box minWidth="220px">
          <VideoUploader
            ref={videoUploaderRef}
            onUpload={handleVideoUpload}
            username={user?.user?.username}
            onUploadStart={() => {
              setVideoError(null);
              setIsCompressingVideo(true);
            }}
            onUploadFinish={() => setIsCompressingVideo(false)}
            onError={setVideoError}
          />
        </Box>
      </Flex>

      {videoDurationError && (
        <Center bg="red.50" color="red.800" p={2} borderRadius="md" mb={2}>
          {videoDurationError}
        </Center>
      )}

      {videoError && (
        <Center bg="red.500" color="white" p={3} borderRadius="md" mb={2}>
          <Flex direction="column" align="center" gap={2}>
            <Text fontSize="sm">❌ {videoError}</Text>
            <Button
              size="xs"
              colorScheme="red"
              variant="outline"
              color="white"
              borderColor="white"
              _hover={{ bg: "red.600" }}
              onClick={() => setVideoError(null)}
            >
              Dismiss
            </Button>
          </Flex>
        </Center>
      )}

      <Flex
        flex="1"
        borderRadius="base"
        justify="center"
        overflow="hidden"
        width="100%"
      >
        <MarkdownEditor
          markdown={markdown}
          setMarkdown={setMarkdown}
          onDrop={onDrop}
          isDragActive={isDragActive}
          previewMode={previewMode}
          user={user}
          handleImageTrigger={handleImageTrigger}
          handleVideoTrigger={handleVideoTrigger}
          isUploading={isUploading}
          insertAtCursor={insertAtCursorWrapper}
          handleGifUpload={handleGifUpload}
        />

        <ImageCompressor
          ref={imageCompressorRef}
          onUpload={handleImageUploadWithCaption}
          isProcessing={isCompressingImage}
          hideStatus={true}
        />
      </Flex>

      <HashtagInput
        hashtags={hashtags}
        hashtagInput={hashtagInput}
        setHashtagInput={setHashtagInput}
        setHashtags={setHashtags}
      />

      {/* Settings Tabs */}
      <Box mt={4}>
        {/* Custom Tab Buttons */}
        <HStack spacing={0} mb={0}>
          {imagesInMarkdown.length > 0 && (
            <Button
              size="sm"
              onClick={() =>
                setActiveSettingsTab(
                  activeSettingsTab === "captions" ? null : "captions"
                )
              }
              border="1px solid"
              borderColor={
                activeSettingsTab === "captions" ? "accent" : "muted"
              }
              borderBottomColor={
                activeSettingsTab === "captions" ? "background" : "muted"
              }
              borderRadius="none"
              borderBottomRadius={0}
              borderRightRadius={0}
              bg={
                activeSettingsTab === "captions" ? "background" : "transparent"
              }
              color={activeSettingsTab === "captions" ? "accent" : "primary"}
              fontWeight="semibold"
              _hover={{
                bg: activeSettingsTab === "captions" ? "background" : "muted",
                borderColor:
                  activeSettingsTab === "captions" ? "accent" : "primary",
              }}
            >
              <HStack spacing={2}>
                <span>📷</span>
                <Text>Image Captions ({imagesInMarkdown.length})</Text>
              </HStack>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() =>
              setActiveSettingsTab(
                activeSettingsTab === "beneficiaries" ? null : "beneficiaries"
              )
            }
            border="1px solid"
            borderColor={
              activeSettingsTab === "beneficiaries" ? "accent" : "muted"
            }
            borderBottomColor={
              activeSettingsTab === "beneficiaries" ? "background" : "muted"
            }
            borderRadius="none"
            borderBottomRadius={0}
            borderRightRadius={imagesInMarkdown.length === 0 ? 0 : 0}
            borderLeftRadius={imagesInMarkdown.length > 0 ? 0 : "md"}
            bg={
              activeSettingsTab === "beneficiaries"
                ? "background"
                : "transparent"
            }
            color={activeSettingsTab === "beneficiaries" ? "accent" : "primary"}
            fontWeight="semibold"
            _hover={{
              bg:
                activeSettingsTab === "beneficiaries" ? "background" : "muted",
              borderColor:
                activeSettingsTab === "beneficiaries" ? "accent" : "primary",
            }}
          >
            <HStack spacing={2}>
              <span>💰</span>
              <Text>
                Beneficiaries{" "}
                {beneficiaries.length > 0 && `(${beneficiaries.length})`}
              </Text>
            </HStack>
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setActiveSettingsTab(
                activeSettingsTab === "thumbnail" ? null : "thumbnail"
              )
            }
            border="1px solid"
            borderColor={activeSettingsTab === "thumbnail" ? "accent" : "muted"}
            borderBottomColor={
              activeSettingsTab === "thumbnail" ? "background" : "muted"
            }
            borderRadius="none"
            borderBottomRadius={0}
            borderLeftRadius={0}
            bg={
              activeSettingsTab === "thumbnail" ? "background" : "transparent"
            }
            color={activeSettingsTab === "thumbnail" ? "accent" : "primary"}
            fontWeight="semibold"
            _hover={{
              bg: activeSettingsTab === "thumbnail" ? "background" : "muted",
              borderColor:
                activeSettingsTab === "thumbnail" ? "accent" : "primary",
            }}
          >
            <HStack spacing={2}>
              <span>🖼️</span>
              <Text>Thumbnail</Text>
            </HStack>
          </Button>
        </HStack>

        {/* Tab Content */}
        {activeSettingsTab === "captions" && imagesInMarkdown.length > 0 && (
          <Box p={4} bg="background" alignSelf="flex-start">
            <VStack spacing={4} align="stretch">
              {imagesInMarkdown.map((image, index) => (
                <HStack key={`${image.url}-${index}`} spacing={4} align="start">
                  <Image
                    src={image.url}
                    alt={image.alt || "Uploaded image"}
                    maxW="120px"
                    maxH="80px"
                    objectFit="cover"
                    borderRadius="none"
                    border="1px solid"
                    borderColor="muted"
                  />
                  <VStack flex="1" align="stretch" spacing={2}>
                    <Text fontSize="sm" color="muted" fontWeight="medium">
                      Image {index + 1}
                    </Text>
                    <Input
                      placeholder="Enter caption for this image..."
                      value={image.alt}
                      onChange={(e) =>
                        updateImageCaption(image.url, e.target.value)
                      }
                      size="sm"
                      bg="background"
                      borderColor="muted"
                      _hover={{ borderColor: "primary" }}
                      _focus={{
                        borderColor: "accent",
                        boxShadow: "0 0 0 1px var(--chakra-colors-accent)",
                      }}
                    />
                    <Text fontSize="xs" color="muted" noOfLines={1}>
                      URL: {image.url}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {activeSettingsTab === "beneficiaries" && (
          <Box p={4} bg="background" alignSelf="flex-start">
            <BeneficiariesInput
              beneficiaries={beneficiaries}
              setBeneficiaries={(newBeneficiaries) => {
                setBeneficiaries(newBeneficiaries);
              }}
              isSubmitting={isSubmitting}
            />
          </Box>
        )}

        {activeSettingsTab === "thumbnail" && (
          <Box p={4} bg="background" alignSelf="flex-start">
            <ThumbnailPicker
              show={true}
              markdown={markdown}
              selectedThumbnail={selectedThumbnail}
              setSelectedThumbnail={setSelectedThumbnail}
            />
          </Box>
        )}
      </Box>

      {/* Publish Button */}
      <Flex mt={4} justify="flex-end">
        <Button
          size="md"
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Publishing..."
          isDisabled={isSubmitting || !title.trim() || !selectedThumbnail}
          px={8}
        >
          Publish
        </Button>
      </Flex>
    </Flex>
  );
}
