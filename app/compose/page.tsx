"use client";

import React, { useRef, useState } from "react";
import { Flex, Input, Button, Center, Spinner, Box } from "@chakra-ui/react";
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
    setPreviewMode,
    showThumbnailPicker,
    setShowThumbnailPicker,
    placeholders,
    user,
    insertAtCursorWrapper,
    handleSubmit,
    isSubmitting,
  } = useComposeForm();

  // Debug log compose form state
  React.useEffect(() => {
  }, [beneficiaries, title, markdown, hashtags, isSubmitting]);

  // Refs
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);



  // Upload hooks
  const {
    isUploading: isImageUploading,
    isCompressingImage,
    handleImageUpload,
    createImageTrigger,
    setIsUploading: setIsImageUploading,
  } = useImageUpload(insertAtCursorWrapper);

  const { isCompressingVideo, handleVideoUpload, createVideoTrigger } =
    useVideoUpload(insertAtCursorWrapper);

  // GIF upload handler
  const handleGifUpload = async (gifBlob: Blob, fileName: string) => {
    try {
      // Ensure filename has .gif extension
      const gifFileName = fileName.endsWith('.gif') ? fileName : `${fileName}.gif`;
      
      // Create a File object from the blob with proper .gif extension
      const gifFile = new File([gifBlob], gifFileName, { type: "image/gif" });
      
      // Upload to IPFS using the same method as images
      const { uploadToIpfs } = await import("@/lib/markdown/composeUtils");
      const ipfsUrl = await uploadToIpfs(gifFile, gifFileName);
      
      // Insert the GIF into the markdown with proper filename
      insertAtCursorWrapper(`\n![${gifFileName}](${ipfsUrl})\n`);
    } catch (error) {
      console.error("Error uploading GIF to IPFS:", error);
      throw error; // Re-throw so MarkdownEditor can handle fallback
    }
  };

  // Create trigger functions with refs
  const handleImageTrigger = createImageTrigger(imageCompressorRef);
  const handleVideoTrigger = createVideoTrigger(videoUploaderRef);

  // Video duration error handling
  const [videoDurationError, setVideoDurationError] = useState<string | null>(null);

  const handleVideoDurationError = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    setVideoDurationError(`Video is ${minutes}m ${seconds}s long. Long videos will be uploaded without compression to prevent crashes.`);
    // Clear error after 5 seconds
    setTimeout(() => setVideoDurationError(null), 5000);
  };



  const { isUploading: isDropUploading, onDrop } = useFileDropUpload(
    insertAtCursorWrapper
  );
  const { isDragActive } = useDropzone({ onDrop, noClick: true });

  // Combined uploading state
  const isUploading = isImageUploading || isDropUploading;





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
            isProcessing={isCompressingVideo}
            onDurationError={handleVideoDurationError}
          />
        </Box>
      </Flex>

      {videoDurationError && (
        <Center bg="red.50" color="red.800" p={2} borderRadius="md" mb={2}>
          {videoDurationError}
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
          onUpload={handleImageUpload}
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

      <BeneficiariesInput
        beneficiaries={beneficiaries}
        setBeneficiaries={(newBeneficiaries) => {
          setBeneficiaries(newBeneficiaries);
        }}
        isSubmitting={isSubmitting}
      />

      <Flex mt="1" justify="space-between">
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => setShowThumbnailPicker((v) => !v)}
          isDisabled={isSubmitting}
        >
          Thumbnail
        </Button>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Publishing..."
          isDisabled={isSubmitting || !title.trim()}
        >
          Publish
        </Button>
      </Flex>

      <ThumbnailPicker
        show={showThumbnailPicker}
        markdown={markdown}
        selectedThumbnail={selectedThumbnail}
        setSelectedThumbnail={setSelectedThumbnail}
      />
    </Flex>
  );
}
