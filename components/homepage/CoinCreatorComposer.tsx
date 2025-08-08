"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  Button,
  HStack,
  VStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  IconButton,
  Progress,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { FaImage, FaCoins, FaEthereum, FaVideo } from "react-icons/fa";
import { useAccount } from "wagmi";
import { useCoinCreation } from "@/hooks/useCoinCreation";
import { createSnapAsSkatedev } from "@/lib/hive/server-actions";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";
import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface CoinCreatorComposerProps {
  onClose?: () => void;
}

export default function CoinCreatorComposer({
  onClose,
}: CoinCreatorComposerProps) {
  const { address, isConnected } = useAccount();
  const { createCoin, isCreating } = useCoinCreation();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<{ url: string; fileName: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<File | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Refs
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsLoading(true);

    for (const [index, file] of files.entries()) {
      if (!file.type.startsWith("image/")) {
        alert("Please select only image files.");
        continue;
      }

      try {
        // Compress image
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // Upload to IPFS/storage
        const signature = await getFileSignature(compressedFile);
        const uploadUrl = await uploadImage(
          compressedFile,
          signature,
          index,
          setUploadProgress
        );

        if (uploadUrl) {
          setImages((prev) => [
            ...prev,
            { url: uploadUrl, fileName: compressedFile.name },
          ]);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      }
    }

    setIsLoading(false);
    setUploadProgress([]);
    e.target.value = ""; // Reset input
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate thumbnail from video
  const generateVideoThumbnail = async (file: File): Promise<File | null> => {
    try {
      setIsGeneratingThumbnail(true);

      // Initialize FFmpeg with proper error handling
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();

        // Set up logging for FFmpeg
        ffmpegRef.current.on("log", ({ message }) => {
        });
        await ffmpegRef.current.load();
      }

      const ffmpeg = ffmpegRef.current;

      // Check if FFmpeg is loaded properly
      if (!ffmpeg.loaded) {
        console.error("FFmpeg is not loaded properly");
        throw new Error("FFmpeg failed to load");
      }

      // Generate unique file names to avoid conflicts
      const inputFileName = `input_${Date.now()}.mp4`;
      const outputFileName = `thumbnail_${Date.now()}.jpg`;
      const fileData = await fetchFile(file);
      await ffmpeg.writeFile(inputFileName, fileData);
      // Verify the file exists in FFmpeg's FS
      const files = await ffmpeg.listDir("/");

      if (!files.some((f) => f.name === inputFileName)) {
        throw new Error(`Input file ${inputFileName} not found in FFmpeg FS`);
      }
      // Generate thumbnail with more conservative settings
      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-ss",
        "1", // Use 1 second instead of 2 to avoid seeking past video length
        "-frames:v",
        "1",
        "-vf",
        "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:black",
        "-f",
        "image2", // Use image2 format explicitly
        "-q:v",
        "5", // Use slightly lower quality to avoid issues
        "-y", // Overwrite output file
        outputFileName,
      ]);
      const outputFiles = await ffmpeg.listDir("/");

      if (!outputFiles.some((f) => f.name === outputFileName)) {
        throw new Error(
          `Thumbnail file ${outputFileName} not found after generation`
        );
      }
      const thumbnailData = await ffmpeg.readFile(outputFileName);

      if (!thumbnailData || thumbnailData.length === 0) {
        throw new Error("Generated thumbnail data is empty");
      }

      // Create blob from the data
      const thumbnailBlob = new Blob([thumbnailData], { type: "image/jpeg" });

      // Create a File object from the blob
      const thumbnailFile = new File([thumbnailBlob], "video-thumbnail.jpg", {
        type: "image/jpeg",
      });

      // Clean up FFmpeg files
      try {
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);
      } catch (cleanupError) {
        console.warn("Failed to clean up thumbnail files:", cleanupError);
        // Don't throw here as the main operation succeeded
      }

      return thumbnailFile;
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      console.error("Detailed error information:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ffmpegLoaded: ffmpegRef.current?.loaded,
        videoFile: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
      });

      // Try to clean up any partial files on error
      if (ffmpegRef.current?.loaded) {
        try {
          const files = await ffmpegRef.current.listDir("/");
          for (const fileInfo of files) {
            if (
              fileInfo.name.includes("input_") ||
              fileInfo.name.includes("thumbnail_")
            ) {
              await ffmpegRef.current.deleteFile(fileInfo.name);
            }
          }
        } catch (cleanupError) {
          console.warn("Error during cleanup:", cleanupError);
        }
      }

      return null;
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  // Video upload handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check MIME type first - accept any video format
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }

    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert("Video file must be smaller than 100MB.");
      return;
    }

    // Store the video file
    setVideoFile(file);

    // Generate thumbnail for the Zora SDK
    const thumbnail = await generateVideoThumbnail(file);
    if (thumbnail) {
      setVideoThumbnail(thumbnail);
    } else {
      console.warn(
        "Failed to generate video thumbnail - coin will be created without image"
      );
      alert(
        "Warning: Could not generate thumbnail from video. The coin will be created without an image."
      );
    }

    e.target.value = ""; // Reset input
  };

  // Remove video
  const removeVideo = () => {
    setVideoFile(null);
    setVideoThumbnail(null);
  };

  // Handle coin creation
  const handleCreateCoin = async () => {
    if (!isConnected || !address) {
      alert("Please connect your Ethereum wallet first.");
      return;
    }

    if (!title.trim() || !description.trim() || !symbol.trim()) {
      alert(
        "Please fill in all required fields (title, description, and symbol)."
      );
      return;
    }

    if (symbol.length > 8) {
      alert("Symbol must be 8 characters or less.");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare coin data for Zora SDK - pass files directly to Zora uploader
      const coinData = {
        name: title,
        symbol: symbol.toUpperCase(),
        description: description,
        // Pass video or image file directly to Zora SDK
        ...(videoFile && { mediaFile: videoFile }),
        ...(images.length > 0 && !videoFile && { mediaUrl: images[0].url }),
        postTitle: title,
        postBody: "", // We'll set this later
        postJsonMetadata: JSON.stringify({
          app: "Skatehive App 3.0",
          tags: ["coin-creation", "ethereum", "snaps", symbol.toLowerCase()],
          images: images.map((img) => img.url),
          creator_ethereum_address: address,
          ...(videoFile && {
            has_video: true,
            video_file_name: videoFile.name,
            video_file_size: videoFile.size,
            video_file_type: videoFile.type,
          }),
        }),
        postParentAuthor: "",
        postParentPermlink: "",
      };

      // Create the coin using Zora's native video support
      const coinResult = await createCoin(coinData);

      if (!coinResult?.address) {
        throw new Error("Failed to get coin address from creation result");
      }

      // Generate Zora URL for the coin
      const zoraUrl = `https://zora.co/coin/base:${coinResult.address}`;

      // Now create the snap comment with the coin URL
      const snapBody = `🪙 **New Coin Created: ${title} (${symbol.toUpperCase()})**

${description}

${videoFile ? `🎥 **Video coin with ${videoFile.type} media**\n\n` : ""}---

${zoraUrl}
`;

      const snapResult = await createSnapAsSkatedev({
        body: snapBody,
        tags: ["coin-creation", "ethereum", "zora", symbol.toLowerCase()],
        images: images.map((img) => img.url),
        ethereumAddress: address,
        coinAddress: coinResult.address,
        coinUrl: zoraUrl,
      });

      if (!snapResult.success) {
        console.warn(
          "Coin created but snap creation failed:",
          snapResult.error
        );
        // Don't throw here - coin was created successfully
      }

      // Clear form
      setTitle("");
      setDescription("");
      setSymbol("");
      setImages([]);
      setVideoFile(null);
      setVideoThumbnail(null);

      if (onClose) onClose();
    } catch (error) {
      console.error("Error creating coin:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create coin. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <VStack spacing={3} textAlign="center">
        <FaEthereum size={32} color="#627eea" />
        <Text fontSize="lg" fontWeight="bold">
          Connect Ethereum Wallet
        </Text>
        <Text color={"muted"}>
          Connect your Ethereum wallet to create coins on Skatehive
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Wallet Info */}
      <HStack justify="flex-end" align="center">
        <HStack spacing={2}>
          <FaEthereum color="#627eea" />
          <Text fontSize="sm" color={"muted"}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Text>
        </HStack>
      </HStack>

      {/* Media Upload Section - Zora Style */}
      <VStack spacing={4}>
        {!videoFile && images.length === 0 ? (
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="xl"
            p={12}
            textAlign="center"
            bg="gray.50"
            _dark={{ bg: "gray.800", borderColor: "gray.600" }}
            position="relative"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: "background.400",
              bg: "background.100",
              _dark: { bg: "background.700" },
            }}
            onClick={() => imageUploadRef.current?.click()}
          >
            <Input
              type="file"
              ref={imageUploadRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              disabled={isLoading || isCreating}
            />
            <Input
              type="file"
              ref={videoUploadRef}
              onChange={handleVideoUpload}
              accept="video/*"
              style={{ display: "none" }}
              disabled={isLoading || isCreating}
            />

            <VStack spacing={4}>
              <Box
                w={12}
                h={12}
                bg="background.100"
                _dark={{ bg: "background.900" }}
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">📁</Text>
              </Box>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  Upload photos and videos
                </Text>
              </VStack>
              <Button
                colorScheme="gray"
                variant="solid"
                size="md"
                bg="white"
                color="black"
                _hover={{ bg: "gray.100" }}
                _dark={{
                  bg: "gray.700",
                  color: "white",
                  _hover: { bg: "gray.600" },
                }}
              >
                Browse files
              </Button>
              <Text fontSize="xs" color="gray.400">
                or{" "}
                <Button
                  variant="link"
                  size="xs"
                  color="background.500"
                  onClick={(e) => {
                    e.stopPropagation();
                    videoUploadRef.current?.click();
                  }}
                >
                  upload video
                </Button>
              </Text>
            </VStack>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {/* Show uploaded media */}
            {images.length > 0 && (
              <VStack spacing={2}>
                <HStack spacing={2} flexWrap="wrap" justify="center">
                  {images.map((image, index) => (
                    <Box key={index} position="relative">
                      <Image
                        src={image.url}
                        alt={`Upload ${index + 1}`}
                        maxW="200px"
                        maxH="200px"
                        objectFit="cover"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        _dark={{ borderColor: "gray.600" }}
                      />
                      <IconButton
                        aria-label="Remove image"
                        icon={<Text fontSize="xs">×</Text>}
                        size="xs"
                        position="absolute"
                        top="-1"
                        right="-1"
                        colorScheme="red"
                        borderRadius="full"
                        onClick={() => removeImage(index)}
                      />
                    </Box>
                  ))}
                </HStack>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageUploadRef.current?.click()}
                  disabled={isLoading || isCreating}
                >
                  Add more images
                </Button>
              </VStack>
            )}

            {videoFile && (
              <VStack spacing={3}>
                <Box position="relative" textAlign="center">
                  <Text fontSize="sm" color="green.500" mb={2}>
                    ✓ Video selected: {videoFile.name}
                  </Text>
                  {isGeneratingThumbnail && (
                    <HStack spacing={2} justify="center">
                      <Spinner size="sm" />
                      <Text fontSize="sm">Generating preview...</Text>
                    </HStack>
                  )}
                  {videoThumbnail && (
                    <Image
                      src={URL.createObjectURL(videoThumbnail)}
                      alt="Video preview"
                      maxW="200px"
                      maxH="200px"
                      objectFit="cover"
                      borderRadius="md"
                      border="2px solid"
                      borderColor="green.300"
                      mx="auto"
                    />
                  )}
                  <IconButton
                    aria-label="Remove video"
                    icon={<Text fontSize="xs">×</Text>}
                    size="xs"
                    position="absolute"
                    top="-1"
                    right="calc(50% - 100px)"
                    colorScheme="red"
                    borderRadius="full"
                    onClick={removeVideo}
                  />
                </Box>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => videoUploadRef.current?.click()}
                  disabled={isLoading || isCreating}
                >
                  Replace video
                </Button>
              </VStack>
            )}
          </VStack>
        )}
      </VStack>

      {/* Coin Details Form */}
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Coin name"
            size="lg"
            variant="flushed"
            fontSize="xl"
            fontWeight="bold"
            disabled={isLoading || isCreating}
            _placeholder={{ color: "gray.400" }}
          />
        </FormControl>

        <FormControl>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a caption..."
            minHeight="80px"
            resize="none"
            variant="flushed"
            disabled={isLoading || isCreating}
            _placeholder={{ color: "gray.400" }}
          />
        </FormControl>

        <FormControl isRequired>
          <HStack>
            <Text fontSize="lg" color="gray.500">
              $
            </Text>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Add ticker"
              maxLength={8}
              size="lg"
              variant="flushed"
              disabled={isLoading || isCreating}
              _placeholder={{ color: "gray.400" }}
            />
          </HStack>
        </FormControl>
      </VStack>

      {/* Upload Progress */}
      {uploadProgress.some((p) => p > 0) && (
        <VStack spacing={1}>
          <Text fontSize="sm">Uploading images...</Text>
          {uploadProgress.map(
            (progress, index) =>
              progress > 0 && (
                <Progress
                  key={index}
                  value={progress}
                  size="sm"
                  width="100%"
                  colorScheme="background"
                />
              )
          )}
        </VStack>
      )}

      {/* Create Button - Zora Style */}
      <Button
        w="full"
        size="lg"
        bg="black"
        color="white"
        _hover={{ bg: "gray.800" }}
        _dark={{ bg: "white", color: "black", _hover: { bg: "gray.100" } }}
        onClick={handleCreateCoin}
        disabled={
          isLoading ||
          isCreating ||
          !title.trim() ||
          !description.trim() ||
          !symbol.trim()
        }
        leftIcon={isLoading || isCreating ? <Spinner size="sm" /> : undefined}
        borderRadius="full"
        py={6}
      >
        {isLoading || isCreating ? "Creating..." : "Post"}
      </Button>

      {/* Info */}
      <Text fontSize="xs" color={"gray.500"} textAlign="center">
        Your coin will be created on Zora and posted as a snap to Skatehive
        automatically.
        {videoFile && " Video will be uploaded to IPFS."}
      </Text>
    </VStack>
  );
}
