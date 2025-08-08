"use client";

import React, { useRef, useState } from "react";
import { Flex, Input, Button, Center, Spinner, Box } from "@chakra-ui/react";
import ImageCompressor, {
  ImageCompressorRef,
} from "@/lib/utils/ImageCompressor";
import VideoUploader, {
  VideoUploaderRef,
} from "../../components/homepage/VideoUploader";
import { GIFMakerRef as GIFMakerWithSelectorRef } from "../../components/homepage/GIFMakerWithSelector";
import MediaUploadButtons from "../../components/compose/MediaUploadButtons";
import HashtagInput from "../../components/compose/HashtagInput";
import BeneficiariesInput from "../../components/compose/BeneficiariesInput";
import GifModal from "../../components/compose/GifModal";
import ThumbnailPicker from "../../components/compose/ThumbnailPicker";
import MarkdownEditor from "../../components/compose/MarkdownEditor";
import { useComposeForm } from "../../hooks/useComposeForm";
import {
  useImageUpload,
  useVideoUpload,
  useGifUpload,
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
  const gifMakerWithSelectorRef = useRef<GIFMakerWithSelectorRef>(null);

  // Modal state
  const [isGifModalOpen, setGifModalOpen] = useState(false);

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

  const {
    isProcessingGif,
    isUploadingGif,
    gifUrl,
    gifSize,
    gifCaption,
    setIsProcessingGif,
    setIsUploadingGif,
    setGifUrl,
    setGifSize,
    setGifCaption,
    handleGifUpload,
  } = useGifUpload();

  const { isUploading: isDropUploading, onDrop } = useFileDropUpload(
    insertAtCursorWrapper
  );
  const { isDragActive } = useDropzone({ onDrop, noClick: true });

  // Combined uploading state
  const isUploading = isImageUploading || isDropUploading;

  // Handle GIF modal effects
  React.useEffect(() => {
    if (isGifModalOpen) {
      gifMakerWithSelectorRef.current?.reset();
      setGifUrl(null);
      setGifSize(null);
      setIsProcessingGif(false);
    }
  }, [isGifModalOpen, setGifUrl, setGifSize, setIsProcessingGif]);



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

        <MediaUploadButtons
          user={user}
          handleImageTrigger={handleImageTrigger}
          handleVideoTrigger={handleVideoTrigger}
          setGifModalOpen={setGifModalOpen}
          isUploading={isUploading}
          isGifModalOpen={isGifModalOpen}
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
        />

        <ImageCompressor
          ref={imageCompressorRef}
          onUpload={handleImageUpload}
          isProcessing={isCompressingImage}
          hideStatus={true}
        />

        <GifModal
          isOpen={isGifModalOpen}
          onClose={() => setGifModalOpen(false)}
          gifMakerWithSelectorRef={gifMakerWithSelectorRef}
          handleGifUpload={handleGifUpload}
          isProcessingGif={isProcessingGif}
          gifUrl={gifUrl}
          gifSize={gifSize}
          isUploadingGif={isUploadingGif}
          setIsUploadingGif={setIsUploadingGif}
          insertAtCursor={insertAtCursorWrapper}
          gifCaption={gifCaption}
          setGifUrl={setGifUrl}
          setGifSize={setGifSize}
          setIsProcessingGif={setIsProcessingGif}
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
