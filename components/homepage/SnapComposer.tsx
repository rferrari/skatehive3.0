import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  HStack,
  Button,
  Image,
  IconButton,
  Wrap,
  Progress,
  Input,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import GiphySelector from "./GiphySelector";
import VideoUploader, { VideoUploaderRef } from "./VideoUploader";
import VideoTrimModal from "./VideoTrimModal";
import InstagramModal from "./InstagramModal";
import { IGif } from "@giphy/js-types";
import { FaImage } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { Discussion } from "@hiveio/dhive";
import {
  getFileSignature,
  getLastSnapsContainer,
  uploadImage,
} from "@/lib/hive/client-functions";
import { FaVideo } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import ImageCompressor from "@/lib/utils/ImageCompressor";
import { ImageCompressorRef } from "@/lib/utils/ImageCompressor";
import imageCompression from "browser-image-compression";

import GIFMakerWithSelector, { GIFMakerRef as GIFMakerWithSelectorRef } from "./GIFMakerWithSelector";
import useHivePower from "@/hooks/useHivePower";
import { useInstagramHealth } from "@/hooks/useInstagramHealth";
import { TbGif } from "react-icons/tb";
import MatrixOverlay from "@/components/graphics/MatrixOverlay";

interface SnapComposerProps {
  pa: string;
  pp: string;
  onNewComment: (newComment: Partial<Discussion>) => void;
  post?: boolean;
  onClose: () => void;
  submitLabel?: string;
  buttonSize?: "sm" | "md" | "lg";
}

export default function SnapComposer({
  pa,
  pp,
  onNewComment,
  post = false,
  onClose,
  submitLabel,
  buttonSize = "lg",
}: SnapComposerProps) {
  const { user, aioha } = useAioha();
  const postBodyRef = useRef<HTMLTextAreaElement>(null);
  const [selectedGif, setSelectedGif] = useState<IGif | null>(null);
  const [isGiphyModalOpen, setGiphyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoProcessingError, setVideoProcessingError] = useState<
    string | null
  >(null);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const [compressedImages, setCompressedImages] = useState<
    { url: string; fileName: string; caption: string }[]
  >([]);

  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const videoUploadInputRef = useRef<HTMLInputElement>(null);
  const gifVideoInputRef = useRef<HTMLInputElement>(null);

  // GIF maker state and refs (direct integration)
  const [isGifMakerOpen, setGifMakerOpen] = useState(false);
  const gifMakerWithSelectorRef = useRef<GIFMakerWithSelectorRef>(null);
  const [isProcessingGif, setIsProcessingGif] = useState(false);
  const [isUploadingGif, setIsUploadingGif] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifSize, setGifSize] = useState<number | null>(null);
  const [gifCaption, setGifCaption] = useState<string>("skatehive-gif");

  // Instagram modal state
  const [isInstagramModalOpen, setInstagramModalOpen] = useState(false);

  // Instagram server health check
  const instagramHealth = useInstagramHealth(120000); // Check every 2 minutes

  const [gifUrls, setGifUrls] = useState<{ url: string; caption: string }[]>(
    []
  );

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const isUploadingMedia = uploadCount > 0;

  // Video duration error handling
  const [videoDurationError, setVideoDurationError] = useState<string | null>(
    null
  );

  // Video trimming modal state
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  // Get user's Hive Power to determine if they can bypass the 15s limit
  const { hivePower } = useHivePower(user || "");
  const canBypassLimit = hivePower !== null && hivePower >= 100;

  const buttonText = submitLabel || (post ? "Reply" : "Post");

  // Function to extract hashtags from text
  function extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map((hashtag) => hashtag.slice(1)); // Remove the '#' symbol
  }

  // Helper functions to manage upload count
  const startUpload = () => setUploadCount((c) => c + 1);
  const finishUpload = () => setUploadCount((c) => Math.max(0, c - 1));

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        reject(new Error("Failed to load video"));
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle video file selection (with duration check for SnapComposer)
  const handleVideoFile = async (file: File) => {
    try {
      // Clear any previous pending video file to prevent memory leaks
      if (pendingVideoFile) {
        setPendingVideoFile(null);
      }

      const duration = await getVideoDuration(file);

      console.log("🎬 Video file duration check:", {
        fileName: file.name,
        duration: duration,
        durationFormatted: `${duration.toFixed(1)}s`,
        canBypassLimit,
        hivePower,
        user,
        shouldOpenTrimModal: duration > 15 || canBypassLimit,
      });

      // Always open trim modal for video editing options
      // Users with >100HP can choose to use original or trim
      // Users with <100HP must trim if over 15s
      if (duration > 15 || canBypassLimit) {
        console.log(
          "✅ Opening trim modal - duration > 15s or user can bypass"
        );
        setPendingVideoFile(file);
        setIsTrimModalOpen(true);
        return;
      }

      console.log("⚡ Uploading directly - short video and no bypass ability");
      // Only for videos under 15s and users without bypass - upload directly
      if (videoUploaderRef.current) {
        startUpload();
        await videoUploaderRef.current.handleFile(file);
        finishUpload();
      }
    } catch (error) {
      console.error("Error checking video duration:", error);
      alert(
        "Failed to process video file: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  // Handle trim modal completion
  const handleTrimComplete = async (trimmedFile: File) => {
    if (videoUploaderRef.current) {
      // Let VideoUploader handle its own upload state
      await videoUploaderRef.current.handleFile(trimmedFile);
    }
    setPendingVideoFile(null);
  };

  // Handle trim modal close
  const handleTrimModalClose = () => {
    setIsTrimModalOpen(false);
    // Don't immediately clear pendingVideoFile to prevent blob URL errors
    // It will be cleared when upload completes or new file is selected
  };

  // Handler for compressed image upload
  const handleCompressedImageUpload = async (
    url: string | null,
    fileName?: string
  ) => {
    if (!url) return;
    startUpload();
    setIsLoading(true);
    try {
      const blob = await fetch(url).then((res) => res.blob());
      const file = new File([blob], fileName || "compressed.jpg", {
        type: blob.type,
      });
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(
        file,
        signature,
        compressedImages.length,
        setUploadProgress
      );
      if (uploadUrl) {
        setCompressedImages((prev) => [
          ...prev,
          { url: uploadUrl, fileName: file.name, caption: "" },
        ]);
      }
    } catch (error) {
      console.error("Error uploading compressed image:", error);
    } finally {
      setIsLoading(false);
      finishUpload();
    }
  };

  const handleGifWebpUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Check file type
    if (!(file.type === "image/gif" || file.type === "image/webp")) {
      alert("Only GIF and WEBP files are allowed.");
      return;
    }
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("GIF or WEBP file size must be 5MB or less.");
      return;
    }
    startUpload();
    setIsLoading(true);
    try {
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(
        file,
        signature,
        compressedImages.length,
        setUploadProgress
      );
      if (uploadUrl) {
        setCompressedImages((prev) => [
          ...prev,
          { url: uploadUrl, fileName: file.name, caption: "" },
        ]);
      }
    } catch (error) {
      console.error("Error uploading GIF/WEBP:", error);
    } finally {
      setIsLoading(false);
      finishUpload();
      e.target.value = ""; // Reset input
    }
  };

  // Simple video upload handler for ref-based input
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleVideoFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Direct GIF creation handler
  const handleGifCreated = async (gifBlob: Blob, fileName: string) => {
    try {
      startUpload();
      const file = new File([gifBlob], fileName, { type: "image/gif" });
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(
        file,
        signature,
        compressedImages.length,
        setUploadProgress
      );
      if (uploadUrl) {
        setCompressedImages((prev) => [
          ...prev,
          { url: uploadUrl, fileName: fileName, caption: "" },
        ]);
      }
      setGifMakerOpen(false); // Close the GIF maker
    } catch (error) {
      console.error("Error uploading created GIF:", error);
      alert("Failed to upload GIF. Please try again.");
    } finally {
      finishUpload();
    }
  };

  // Unified image upload handler (now includes GIF uploads)
  const handleUnifiedImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) startUpload();
    for (const file of files) {
      if (file.type === "image/gif" || file.type === "image/webp") {
        // Use GIF/WEBP logic (bypasses compression)
        const fakeEvent = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        await handleGifWebpUpload(fakeEvent);
      } else if (file.type.startsWith("image/")) {
        // Use image compression logic for regular images
        try {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          const url = URL.createObjectURL(compressedFile);
          await handleCompressedImageUpload(url, compressedFile.name);
          URL.revokeObjectURL(url);
        } catch (err) {
          alert(
            "Error compressing image: " +
              (err instanceof Error ? err.message : err)
          );
        }
      } else {
        alert("Unsupported file type: " + file.type);
      }
    }
    finishUpload();
    e.target.value = ""; // Reset input
  };

  async function handleComment() {
    let commentBody = postBodyRef.current?.value || "";

    if (
      !commentBody.trim() &&
      compressedImages.length === 0 &&
      !selectedGif &&
      !videoUrl
    ) {
      alert(
        "Please enter some text, upload an image, select a gif, or upload a video before posting."
      );
      return; // Do not proceed
    }

    setIsLoading(true);
    setUploadProgress([]);

    const permlink = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    let validUrls: string[] = compressedImages.map((img) => img.url);
    if (validUrls.length > 0) {
      const imageMarkup = compressedImages
        .map((img) => {
          const caption = img.caption;
          // Only include caption if it's meaningful (not empty and not just "image")
          const meaningfulCaption =
            caption && caption.trim() && caption.trim() !== "image"
              ? caption
              : "";
          return `![${meaningfulCaption}](${img.url})`;
        })
        .join("\n");
      commentBody += `\n\n${imageMarkup}`;
    }

    if (selectedGif) {
      commentBody += `\n\n![gif](${selectedGif.images.downsized_medium.url})`;
    }

    if (videoUrl) {
      commentBody += `\n\n<iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>`;
    }



    if (commentBody) {
      let snapsTags: string[] = [];
      try {
        // Add existing `snaps` tag logic
        if (pp === "snaps") {
          pp = (await getLastSnapsContainer()).permlink;
          snapsTags = [
            process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "",
            "snaps",
          ];
        }

        // Extract hashtags from the comment body and add to `snapsTags`
        const hashtags = extractHashtags(commentBody);
        snapsTags = [...new Set([...snapsTags, ...hashtags])]; // Add hashtags without duplicates

        const commentResponse = await aioha.comment(
          pa,
          pp,
          permlink,
          "",
          commentBody,
          { app: "Skatehive App 3.0", tags: snapsTags, images: validUrls }
        );
        if (commentResponse.success) {
          postBodyRef.current!.value = "";
          setCompressedImages([]);
          setSelectedGif(null);
          setVideoUrl(null);

          setIsProcessingGif(false);

          // Set created to "just now" for optimistic update
          const newComment: Partial<Discussion> = {
            author: user,
            permlink: permlink,
            body: commentBody,
            created: "just now", // use "just now" as the created value for new replies
            pending_payout_value: "0.000 HBD",
          };

          onNewComment(newComment);
          onClose();
        }
      } finally {
        setIsLoading(false);
        setUploadProgress([]);
      }
    }
  }

  // Detect Ctrl+Enter and submit
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey && event.key === "Enter") {
      handleComment();
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Video upload logic in handleDrop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) startUpload();
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        // If GIF or WEBP, use GIF/WEBP upload logic
        if (file.type === "image/gif" || file.type === "image/webp") {
          // Simulate input event for GIF/WEBP
          const fakeEvent = {
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          await handleGifWebpUpload(fakeEvent);
        } else {
          // For other images, resize and compress before upload
          try {
            const options = {
              maxSizeMB: 2,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            const url = URL.createObjectURL(compressedFile);
            await handleCompressedImageUpload(url, compressedFile.name);
            URL.revokeObjectURL(url);
          } catch (err) {
            alert(
              "Error compressing image: " +
                (err instanceof Error ? err.message : err)
            );
          }
        }
      } else if (file.type.startsWith("video/")) {
        // For video, use our new video handling logic with trimming
        try {
          await handleVideoFile(file);
        } catch (error) {
          console.error("Error uploading video:", error);
          alert("Failed to upload video");
        }
      } else {
        alert("Unsupported file type: " + file.type);
      }
    }
    finishUpload();
  };

  // Video upload state integration
  const handleVideoUploadStart = () => {
    setVideoProcessingError(null); // Clear any previous errors
    startUpload();
  };
  const handleVideoUploadFinish = () => finishUpload();
  const handleVideoError = (error: string) => {
    setVideoProcessingError(error);
  };

  // Instagram handler
  const handleInstagramMediaDownloaded = (
    url: string,
    filename: string,
    isVideo: boolean
  ) => {
    if (isVideo) {
      setVideoUrl(url);
    } else {
      // Add to compressed images array for images
      setCompressedImages((prev) => [
        ...prev,
        {
          url: url,
          fileName: filename,
          caption: filename.replace(/\.[^/.]+$/, ""), // Remove file extension for caption
        },
      ]);
    }
  };



  // Only render the composer if user is logged in
  if (!user) return null;

  return (
    <Box position="relative">
      {/* Matrix Overlay during media processing */}
      {isUploadingMedia && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={0}
          pointerEvents="none"
          borderRadius="base"
          overflow="hidden"
        >
          <MatrixOverlay />
        </Box>
      )}
      
      {/* Snap Composer UI, blurred and unclickable if not logged in */}
      <Box
        position="relative"
        zIndex={1}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragOver
            ? "2px dashed var(--chakra-colors-primary)"
            : undefined,
          background: isDragOver ? "rgba(0,0,0,0.04)" : undefined,
          transition: "border 0.2s, background 0.2s",
        }}
      >
        {/* Optionally, overlay a message when dragging */}
        {isDragOver && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={10}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="rgba(0,0,0,0.08)"
            borderRadius="base"
            pointerEvents="none"
          >
            <Box color="primary" fontWeight="bold" fontSize="xl">
              Drop files to upload
            </Box>
          </Box>
        )}
        <Box
          p={4}
          mb={1}
          borderRadius="base"
          borderBottom={"1px"}
          borderColor="muted"
        >
          <Textarea
            id="snap-composer-textarea"
            data-testid="snap-composer-textarea"
            placeholder="Write here"
            bg="background"
            borderRadius={"base"}
            mb={3}
            ref={postBodyRef}
            _placeholder={{ color: "text" }}
            isDisabled={isLoading}
            onKeyDown={handleKeyDown} // Attach the keydown handler
            _focusVisible={{ border: "tb1" }}
          />
          
          {/* Media Preview Section - Videos first, then images/GIFs */}
          {(compressedImages.length > 0 || selectedGif || videoUrl) && (
            <Wrap spacing={4} mb={3}>
              {/* Videos appear first */}
              {videoUrl && (
                <Box position="relative" width="100%" maxW="600px">
                  <Box
                    position="relative"
                    width="100%"
                    paddingBottom="56.25%" // 16:9 aspect ratio (9/16 = 0.5625)
                    height="0"
                    overflow="hidden"
                    borderRadius="8px"
                    bg="transparent"
                  >
                    <iframe
                      src={videoUrl}
                      title="Uploaded Video"
                      frameBorder="0"
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                      }}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </Box>
                  <IconButton
                    id="snap-composer-remove-video"
                    data-testid="snap-composer-remove-video"
                    aria-label="Remove video"
                    icon={<FaTimes />}
                    size="xs"
                    position="absolute"
                    top="2"
                    right="2"
                    onClick={() => setVideoUrl(null)}
                    isDisabled={isLoading}
                    bg="blackAlpha.700"
                    color="white"
                    _hover={{ bg: "blackAlpha.800" }}
                  />
                </Box>
              )}
              
              {/* Then images and GIFs */}
              {compressedImages.map((img, index) => (
                <Box key={index} position="relative" maxW="200px">
                  <Image
                    alt={img.fileName}
                    src={img.url}
                    maxH="100px"
                    maxW="200px"
                    objectFit="contain"
                    borderRadius="base"
                  />
                  <Input
                    mt={2}
                    placeholder="Enter caption"
                    value={img.caption}
                    onChange={(e) => {
                      const newImages = [...compressedImages];
                      newImages[index].caption = e.target.value;
                      setCompressedImages(newImages);
                    }}
                    size="sm"
                    isDisabled={isLoading}
                  />
                  <IconButton
                    id={`snap-composer-remove-image-${index}`}
                    data-testid={`snap-composer-remove-image-${index}`}
                    aria-label="Remove image"
                    icon={<FaTimes />}
                    size="xs"
                    position="absolute"
                    top="0"
                    right="0"
                    onClick={() =>
                      setCompressedImages((prevImages) =>
                        prevImages.filter((_, i) => i !== index)
                      )
                    }
                    isDisabled={isLoading}
                  />
                  <Progress
                    value={uploadProgress[index]}
                    size="xs"
                    colorScheme="green"
                    mt={2}
                  />
                </Box>
              ))}
              {selectedGif && (
                <Box key={selectedGif.id} position="relative" maxW="200px">
                  <Image
                    alt=""
                    src={selectedGif.images.downsized_medium.url}
                    maxH="100px"
                    maxW="200px"
                    objectFit="contain"
                    borderRadius="base"
                  />
                  <IconButton
                    id="snap-composer-remove-gif"
                    data-testid="snap-composer-remove-gif"
                    aria-label="Remove GIF"
                    icon={<FaTimes />}
                    size="xs"
                    position="absolute"
                    top="0"
                    right="0"
                    onClick={() => setSelectedGif(null)}
                    isDisabled={isLoading}
                  />
                </Box>
              )}


            </Wrap>
          )}

          <HStack justify="space-between" mb={1}>
            <HStack>
              {/* Image Upload Button */}
              <Box position="relative">
                <IconButton
                  id="snap-composer-image-upload-btn"
                  data-testid="snap-composer-image-upload"
                  aria-label="Upload Image"
                  icon={
                    <FaImage color="var(--chakra-colors-primary)" size={22} />
                  }
                  variant="ghost"
                  isDisabled={isLoading}
                  border="2px solid transparent"
                  borderRadius="full"
                  height="48px"
                  width="48px"
                  p={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{
                    borderColor: "primary",
                    boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                  }}
                  _active={{ borderColor: "accent" }}
                  onClick={() => imageUploadInputRef.current?.click()}
                />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.heic,.gif,.webp"
                  style={{ display: "none" }}
                  ref={imageUploadInputRef}
                  onChange={handleUnifiedImageUpload}
                  multiple
                />
                {/* Hidden Video Upload Input */}
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  ref={videoUploadInputRef}
                  onChange={handleVideoUpload}
                />
              </Box>
              {/* Giphy Button (only in reply modal) */}
              {post && (
                <IconButton
                  id="snap-composer-giphy-btn"
                  data-testid="snap-composer-giphy"
                  aria-label="Add GIF from Giphy"
                  icon={
                    <TbGif size={22} color="var(--chakra-colors-primary)" />
                  }
                  variant="ghost"
                  isDisabled={isLoading}
                  border="2px solid transparent"
                  borderRadius="full"
                  height="48px"
                  width="48px"
                  p={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{
                    borderColor: "primary",
                    boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                  }}
                  _active={{ borderColor: "accent" }}
                  onClick={() => setGiphyModalOpen((open) => !open)}
                />
              )}
              <ImageCompressor
                ref={imageCompressorRef}
                onUpload={handleCompressedImageUpload}
                isProcessing={isLoading}
              />
              <Button
                id="snap-composer-video-upload-btn"
                data-testid="snap-composer-video-upload"
                variant="ghost"
                isDisabled={isLoading}
                border="2px solid transparent"
                borderRadius="full"
                height="48px"
                width="48px"
                p={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                }}
                _active={{ borderColor: "accent" }}
                onClick={() => videoUploadInputRef.current?.click()}
              >
                <FaVideo color="var(--chakra-colors-primary)" size={22} />
              </Button>
              {/* GIF Maker Button */}
              <IconButton
                id="snap-composer-gif-maker-btn"
                data-testid="snap-composer-gif-maker"
                aria-label="GIF Maker"
                icon={<TbGif color="var(--chakra-colors-primary)" size={22} />}
                variant="ghost"
                isDisabled={isLoading}
                border="2px solid transparent"
                borderRadius="full"
                height="48px"
                width="48px"
                p={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                }}
                _active={{ borderColor: "accent" }}
                onClick={() => {
                  // Reset the GIF maker before opening
                  gifMakerWithSelectorRef.current?.reset();
                  setGifMakerOpen(true);
                }}
              />
              {/* Instagram Button - Show if server is healthy or still loading */}
              {(instagramHealth.healthy || instagramHealth.loading) && (
                <Tooltip label="Import video from Instagram" placement="top">
                  <IconButton
                    id="snap-composer-instagram-btn"
                    data-testid="snap-composer-instagram"
                    aria-label="Import from Instagram"
                    icon={
                      <FaInstagram
                        color="var(--chakra-colors-primary)"
                        size={22}
                      />
                    }
                    variant="ghost"
                    isDisabled={isLoading}
                    border="2px solid transparent"
                    borderRadius="full"
                    height="48px"
                    width="48px"
                    p={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _hover={{
                      borderColor: "primary",
                      boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                    }}
                    _active={{ borderColor: "accent" }}
                    onClick={() => setInstagramModalOpen(true)}
                  />
                </Tooltip>
              )}
            </HStack>
            <Box display={buttonSize === "sm" ? "inline-block" : undefined}>
              <Button
                id="snap-composer-submit-btn"
                data-testid="snap-composer-submit"
                bg="primary"
                color="background"
                _hover={{ bg: "muted", color: "text", border: "tb1" }}
                isLoading={isLoading}
                isDisabled={isLoading || isUploadingMedia}
                onClick={handleComment}
                borderRadius={buttonSize === "sm" ? "sm" : "base"}
                fontWeight="bold"
                px={buttonSize === "sm" ? 1 : 8}
                mt={2}
                mb={1}
                minWidth={buttonSize === "sm" ? undefined : "120px"}
                width={buttonSize === "sm" ? undefined : "30%"}
                maxWidth={buttonSize === "sm" ? undefined : undefined}
                fontSize={buttonSize === "sm" ? "xs" : "lg"}
                lineHeight={buttonSize === "sm" ? "1" : undefined}
                flex={buttonSize === "sm" ? "none" : undefined}
                alignSelf={buttonSize === "sm" ? "flex-start" : undefined}
                display={buttonSize === "sm" ? "inline-flex" : undefined}
                maxH={"2rem"}
              >
                {buttonText}
              </Button>
            </Box>
          </HStack>
          <Box width="100%">
            {videoDurationError && (
              <Box color="error" p={2} mb={2} fontSize="sm" textAlign="center">
                {videoDurationError}
              </Box>
            )}
            {isUploadingMedia && (
              <Box
                bg="primary"
                color="background"
                p={3}
                mb={2}
                borderRadius="md"
                textAlign="center"
                fontSize="sm"
                fontWeight="bold"
              >
                🎬 Processing video... This may take 1-2 minutes for large files
                <Progress
                  size="sm"
                  colorScheme="yellow"
                  isIndeterminate
                  mt={2}
                  borderRadius="full"
                />
                <Text fontSize="xs" mt={1} opacity={0.8}>
                  Please keep this tab open while processing
                </Text>
              </Box>
            )}
            {videoProcessingError && (
              <Box
                bg="red.500"
                color="white"
                p={3}
                mb={2}
                borderRadius="md"
                textAlign="center"
                fontSize="sm"
              >
                ❌ {videoProcessingError}
                <Box
                  as="button"
                  mt={2}
                  p={1}
                  bg="red.600"
                  borderRadius="sm"
                  fontSize="xs"
                  _hover={{ bg: "red.700" }}
                  onClick={() => setVideoProcessingError(null)}
                >
                  Dismiss
                </Box>
              </Box>
            )}
            <VideoUploader
              ref={videoUploaderRef}
              onUpload={setVideoUrl}
              username={user || undefined}
              onUploadStart={handleVideoUploadStart}
              onUploadFinish={handleVideoUploadFinish}
              onError={handleVideoError}
            />
          </Box>
          {isGiphyModalOpen && (
            <Box position="relative">
              <GiphySelector
                apiKey={
                  process.env.GIPHY_API_KEY ||
                  "qXGQXTPKyNJByTFZpW7Kb0tEFeB90faV"
                }
                onSelect={(gif, e) => {
                  e.preventDefault();
                  setSelectedGif(gif);
                  setGiphyModalOpen(false); // Close modal after selecting a GIF
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
      {/* Direct GIF Maker */}
      <GIFMakerWithSelector
        ref={gifMakerWithSelectorRef}
        isOpen={isGifMakerOpen}
        onClose={() => setGifMakerOpen(false)}
        asModal={true}
        onGifCreated={handleGifCreated}
        onUpload={() => {}} // Not used with onGifCreated
        isProcessing={isProcessingGif}
      />
      {/* Video Trim Modal */}
      {isTrimModalOpen && (
        <VideoTrimModal
          isOpen={isTrimModalOpen}
          onClose={handleTrimModalClose}
          videoFile={pendingVideoFile}
          onTrimComplete={handleTrimComplete}
          maxDuration={15}
          canBypass={canBypassLimit}
        />
      )}

      {/* Instagram Modal */}
      <InstagramModal
        isOpen={isInstagramModalOpen}
        onClose={() => setInstagramModalOpen(false)}
        onMediaDownloaded={handleInstagramMediaDownloaded}
      />

      {/* Matrix Overlay and login prompt if not logged in */}
      {!user && <></>}
    </Box>
  );
}
