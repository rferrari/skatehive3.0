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
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import ImageCompressor, {
  ImageCompressorRef,
} from "@/lib/utils/ImageCompressor";
import VideoUploader, {
  VideoUploaderRef,
} from "@/components/homepage/VideoUploader";
import HashtagInput from "@/components/compose/HashtagInput";
import BeneficiariesInput from "@/components/compose/BeneficiariesInput";
import ThumbnailPicker from "@/components/compose/ThumbnailPicker";
import MarkdownEditor from "@/components/compose/MarkdownEditor";
import { useComposeForm } from "@/hooks/useComposeForm";
import { useImageUpload, useVideoUpload, useFileDropUpload } from "@/hooks/useFileUpload";
import { useDropzone } from "react-dropzone";
import { APP_CONFIG } from "@/config/app.config";

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
    fileName?: string,
    originalFile?: File
  ) => {
    console.log("🔍 handleImageUploadWithCaption called:", { url, fileName, hasOriginalFile: !!originalFile });
    setIsImageUploading(true);
    setUploadError(null);
    if (url) {
      try {
        console.log("📤 Fetching blob and uploading to IPFS...");
        const blob = await fetch(url).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
          return res.blob();
        });
        const { uploadToIpfs } = await import("@/lib/markdown/composeUtils");
        const ipfsUrl = await uploadToIpfs(
          blob,
          fileName || "compressed-image.jpg"
        );
        console.log("✅ IPFS upload successful:", ipfsUrl);

        console.log("📝 Inserting at cursor...");
        insertAtCursorWrapper(`\n![](${ipfsUrl})\n`);
        console.log("✅ Insert complete!");
      } catch (error) {
        console.error("❌ Error uploading image:", error);
        setUploadError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsImageUploading(false);
      }
    } else {
      console.warn("⚠️ No URL provided to handleImageUploadWithCaption");
      setUploadError("Image upload failed. No URL received from compressor.");
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
    createVideoTrigger,
    setIsCompressingVideo,
  } = useVideoUpload(insertAtCursorWrapper);

  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      bg="background"
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
          border="1px solid"
          borderColor="inputBorder"
          color="inputText"
          bg="inputBg"
          _placeholder={{ color: "inputPlaceholder" }}
          _hover={{ borderColor: "primary" }}
          _focus={{
            borderColor: "primary",
            boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
          }}
          maxLength={123}
        />
      </Flex>

      {isUploading && (
        <Center mb={3}>
          <HStack spacing={2} color="dim">
            <Spinner size="sm" color="primary" />
            <Text fontSize="sm">Uploading...</Text>
          </HStack>
        </Center>
      )}

      <Flex width="100%" justify="center" mb={3}>
        <Box width="100%" maxWidth="1200px">
          <VideoUploader
            ref={videoUploaderRef}
            username={user?.user?.username}
            onUploadStart={() => {
              setVideoError(null);
              setIsCompressingVideo(true);
            }}
            onUploadFinish={() => {
              setIsCompressingVideo(false);
            }}
            onError={(error: string) => {
              console.error("Video upload error:", error);
              setVideoError(error);
            }}
            onUpload={(result: { url?: string; hash?: string } | null) => {
              console.log("Video upload result:", result);
              if (result?.url) {
                // Insert iframe into markdown body
                const hashMatch = result.url.match(/\/ipfs\/([\w-]+)/);
                const videoId = hashMatch ? hashMatch[1] : null;
                
                if (videoId) {
                  insertAtCursorWrapper(
                    `\n<iframe src="https://${APP_CONFIG.IPFS_GATEWAY}/ipfs/${videoId}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>\n`
                  );
                } else {
                  insertAtCursorWrapper(
                    `\n<iframe src="${result.url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>\n`
                  );
                }
              }
            }}
          />
        </Box>
      </Flex>

      {videoError && (
        <Alert 
          status="error" 
          mb={3} 
          maxWidth="1200px" 
          mx="auto" 
          width="100%"
          bg="rgba(200, 50, 50, 0.1)"
          border="1px solid"
          borderColor="error"
          color="text"
        >
          <AlertIcon color="error" />
          <Box flex="1">
            <Text fontWeight="bold" mb={1}>Video Upload Failed</Text>
            <Text whiteSpace="pre-wrap" fontSize="sm">{videoError}</Text>
          </Box>
          <Button
            size="sm"
            variant="ghost"
            color="error"
            onClick={() => setVideoError(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      <Flex
        h="500px"
        justify="center"
        width="100%"
        maxWidth="1200px"
        mx="auto"
        border="1px solid"
        borderColor="border"
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

      {uploadError && (
        <Alert 
          status="error" 
          mb={3} 
          maxWidth="1200px" 
          mx="auto" 
          width="100%"
          bg="rgba(200, 50, 50, 0.1)"
          border="1px solid"
          borderColor="error"
          color="text"
        >
          <AlertIcon color="error" />
          <Box flex="1">
            <Text fontWeight="bold" mb={1}>Image Upload Failed</Text>
            <Text whiteSpace="pre-wrap" fontSize="sm">{uploadError}</Text>
          </Box>
          <Button
            size="sm"
            variant="ghost"
            color="error"
            onClick={() => setUploadError(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

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
            borderColor={activeSettingsTab === "thumbnail" ? "primary" : "border"}
            borderBottomColor={activeSettingsTab === "thumbnail" ? "background" : "border"}
            bg={activeSettingsTab === "thumbnail" ? "panel" : "transparent"}
            color={activeSettingsTab === "thumbnail" ? "primary" : "dim"}
            fontWeight="medium"
            fontSize="sm"
            _hover={{
              bg: activeSettingsTab === "thumbnail" ? "panelHover" : "subtle",
              color: activeSettingsTab === "thumbnail" ? "primary" : "text",
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
            borderColor={activeSettingsTab === "beneficiaries" ? "primary" : "border"}
            borderBottomColor={activeSettingsTab === "beneficiaries" ? "background" : "border"}
            bg={activeSettingsTab === "beneficiaries" ? "panel" : "transparent"}
            color={activeSettingsTab === "beneficiaries" ? "primary" : "dim"}
            fontWeight="medium"
            fontSize="sm"
            _hover={{
              bg: activeSettingsTab === "beneficiaries" ? "panelHover" : "subtle",
              color: activeSettingsTab === "beneficiaries" ? "primary" : "text",
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
            bg="panel"
            border="1px solid"
            borderColor="border"
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
            bg="panel"
            border="1px solid"
            borderColor="border"
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
          bg="primary"
          color="background"
          fontWeight="bold"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Publishing..."
          isDisabled={isSubmitting || !title.trim() || !selectedThumbnail}
          px={10}
          h="44px"
          _hover={{ bg: "accent" }}
        >
          Publish
        </Button>
      </Flex>
    </Flex>
  );
}
