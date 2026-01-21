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

  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("thumbnail");

  const handleSubmit = originalHandleSubmit;

  React.useEffect(() => {}, [
    beneficiaries,
    title,
    markdown,
    hashtags,
    isSubmitting,
  ]);

  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);

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

  const [videoError, setVideoError] = useState<string | null>(null);

  const handleGifUpload = async (gifBlob: Blob, fileName: string) => {
    try {
      const gifFileName = fileName.endsWith(".gif")
        ? fileName
        : `${fileName}.gif`;

      const gifFile = new File([gifBlob], gifFileName, { type: "image/gif" });

      const { uploadToIpfs } = await import("@/lib/markdown/composeUtils");
      const ipfsUrl = await uploadToIpfs(gifFile, gifFileName);

      insertAtCursorWrapper(`\n![](${ipfsUrl})\n`);
    } catch (error) {
      console.error("Error uploading GIF to IPFS:", error);
      throw error;
    }
  };

  const handleImageTrigger = createImageTrigger(imageCompressorRef);
  const handleVideoTrigger = createVideoTrigger(videoUploaderRef);

  const { isUploading: isDropUploading, onDrop } = useFileDropUpload(
    insertAtCursorWrapper
  );
  const { isDragActive } = useDropzone({ onDrop, noClick: true });

  const isUploading = isImageUploading || isDropUploading;

  return (
    <Flex
      width="100%"
      minHeight="100vh"
      bg="#0d0e12"
      justify="center"
      p={{ base: 3, md: 6 }}
      direction="column"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify={{ base: "flex-start", md: "space-between" }}
        mb={4}
        gap={3}
        width="100%"
        maxWidth="1200px"
        mx="auto"
      >
        <Input
          placeholder={placeholders[placeholderIndex]}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="lg"
          fontSize="1.5rem"
          fontWeight="600"
          flex="1"
          minW={0}
          border="1px solid rgba(255,255,255,0.08)"
          color="#e0e0e0"
          _placeholder={{ color: "#666" }}
          _hover={{ borderColor: "rgba(255,255,255,0.15)" }}
          _focus={{
            borderColor: "#6a9e6a",
            boxShadow: "0 0 0 1px #6a9e6a",
          }}
          maxLength={123}
        />
      </Flex>

      {isUploading && (
        <Center mb={3}>
          <HStack spacing={2} color="#888">
            <Spinner size="sm" color="#6a9e6a" />
            <Text fontSize="sm">Uploading...</Text>
          </HStack>
        </Center>
      )}

      <Flex width="100%" justify="flex-end" mb={3} maxWidth="1200px" mx="auto">
        <Box minWidth="200px">
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


      {videoError && (
        <Center
          bg="rgba(180,80,80,0.1)"
          color="#c87070"
          p={3}
          mb={3}
          maxWidth="1200px"
          mx="auto"
          width="100%"
        >
          <Flex direction="column" align="center" gap={2} width="100%">
            <Text fontSize="sm">❌ {videoError}</Text>
            <Button
              size="xs"
              bg="rgba(180,80,80,0.2)"
              color="#c87070"
              border="1px solid rgba(180,80,80,0.2)"
              _hover={{ bg: "rgba(180,80,80,0.3)" }}
              onClick={() => setVideoError(null)}
            >
              Dismiss
            </Button>
          </Flex>
        </Center>
      )}

      <Flex
        h="500px"
        justify="center"
        width="100%"
        maxWidth="1200px"
        mx="auto"
        border="1px solid rgba(255,255,255,0.08)"
      >
        <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
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
        </Box>

        <ImageCompressor
          ref={imageCompressorRef}
          onUpload={handleImageUploadWithCaption}
          isProcessing={isCompressingImage}
          hideStatus={true}
        />
      </Flex>

      <Box maxWidth="1200px" mx="auto" width="100%" mt={4}>
        <HashtagInput
          hashtags={hashtags}
          hashtagInput={hashtagInput}
          setHashtagInput={setHashtagInput}
          setHashtags={setHashtags}
        />
      </Box>

      <Box mt={4} maxWidth="1200px" mx="auto" width="100%">
        <HStack spacing={0} mb={0} align="stretch">
          <Button
            size="sm"
            onClick={() => setActiveSettingsTab("thumbnail")}
            border="1px solid"
            borderColor={activeSettingsTab === "thumbnail" ? "#6a9e6a" : "rgba(255,255,255,0.08)"}
            borderBottomColor={activeSettingsTab === "thumbnail" ? "#16191f" : "rgba(255,255,255,0.08)"}
            bg={activeSettingsTab === "thumbnail" ? "#16191f" : "transparent"}
            color={activeSettingsTab === "thumbnail" ? "#6a9e6a" : "#888"}
            fontWeight="medium"
            fontSize="sm"
            _hover={{
              bg: activeSettingsTab === "thumbnail" ? "#16191f" : "rgba(255,255,255,0.03)",
              color: activeSettingsTab === "thumbnail" ? "#6a9e6a" : "#ccc",
            }}
            mr="-1px"
            px={4}
            h="36px"
          >
            🖼️ Thumbnail
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveSettingsTab("beneficiaries")}
            border="1px solid"
            borderColor={activeSettingsTab === "beneficiaries" ? "#6a9e6a" : "rgba(255,255,255,0.08)"}
            borderBottomColor={activeSettingsTab === "beneficiaries" ? "#16191f" : "rgba(255,255,255,0.08)"}
            bg={activeSettingsTab === "beneficiaries" ? "#16191f" : "transparent"}
            color={activeSettingsTab === "beneficiaries" ? "#6a9e6a" : "#888"}
            fontWeight="medium"
            fontSize="sm"
            _hover={{
              bg: activeSettingsTab === "beneficiaries" ? "#16191f" : "rgba(255,255,255,0.03)",
              color: activeSettingsTab === "beneficiaries" ? "#6a9e6a" : "#ccc",
            }}
            ml="-1px"
            px={4}
            h="36px"
          >
            💰 Beneficiaries {beneficiaries.length > 0 && `(${beneficiaries.length})`}
          </Button>
        </HStack>

        {activeSettingsTab === "thumbnail" && (
          <Box
            p={4}
            bg="#16191f"
            border="1px solid rgba(255,255,255,0.08)"
          >
            <ThumbnailPicker
              show={true}
              markdown={markdown}
              selectedThumbnail={selectedThumbnail}
              setSelectedThumbnail={setSelectedThumbnail}
            />
          </Box>
        )}

        {activeSettingsTab === "beneficiaries" && (
          <Box
            p={4}
            bg="#16191f"
            border="1px solid rgba(255,255,255,0.08)"
          >
            <BeneficiariesInput
              beneficiaries={beneficiaries}
              setBeneficiaries={(newBeneficiaries) => {
                setBeneficiaries(newBeneficiaries);
              }}
              isSubmitting={isSubmitting}
            />
          </Box>
        )}
      </Box>

      <Flex mt={4} justify="flex-end" maxWidth="1200px" mx="auto" width="100%">
        <Button
          size="md"
          bg="#5a7a5a"
          color="#fff"
          fontWeight="bold"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Publishing..."
          isDisabled={isSubmitting || !title.trim() || !selectedThumbnail}
          px={10}
          h="44px"
          _hover={{ bg: "#6a8c6a" }}
        >
          Publish
        </Button>
      </Flex>
    </Flex>
  );
}
