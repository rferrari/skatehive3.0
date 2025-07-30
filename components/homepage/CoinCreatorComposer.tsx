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
      console.log(
        "Starting thumbnail generation for:",
        file.name,
        file.type,
        file.size
      );

      // Initialize FFmpeg with proper error handling
      if (!ffmpegRef.current) {
        console.log("Initializing new FFmpeg instance...");
        ffmpegRef.current = new FFmpeg();

        // Set up logging for FFmpeg
        ffmpegRef.current.on("log", ({ message }) => {
          console.log("FFmpeg log:", message);
        });

        console.log("Loading FFmpeg core...");
        await ffmpegRef.current.load();
        console.log("FFmpeg loaded successfully");
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

      console.log("Converting file to FFmpeg format...");
      const fileData = await fetchFile(file);
      console.log("File data converted, size:", fileData.length);

      console.log("Writing video file to FFmpeg virtual FS:", inputFileName);
      await ffmpeg.writeFile(inputFileName, fileData);

      console.log("Verifying file was written...");
      // Verify the file exists in FFmpeg's FS
      const files = await ffmpeg.listDir("/");
      console.log("Files in FFmpeg FS:", files);

      if (!files.some((f) => f.name === inputFileName)) {
        throw new Error(`Input file ${inputFileName} not found in FFmpeg FS`);
      }

      console.log("Executing FFmpeg command to generate thumbnail...");
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

      console.log("Verifying thumbnail was generated...");
      const outputFiles = await ffmpeg.listDir("/");
      console.log("Files after generation:", outputFiles);

      if (!outputFiles.some((f) => f.name === outputFileName)) {
        throw new Error(
          `Thumbnail file ${outputFileName} not found after generation`
        );
      }

      console.log("Reading generated thumbnail data...");
      const thumbnailData = await ffmpeg.readFile(outputFileName);
      console.log("Thumbnail data type:", typeof thumbnailData);
      console.log("Thumbnail data size:", thumbnailData.length);

      if (!thumbnailData || thumbnailData.length === 0) {
        throw new Error("Generated thumbnail data is empty");
      }

      // Create blob from the data
      const thumbnailBlob = new Blob([thumbnailData], { type: "image/jpeg" });
      console.log("Created thumbnail blob:", thumbnailBlob.size, "bytes");

      // Create a File object from the blob
      const thumbnailFile = new File([thumbnailBlob], "video-thumbnail.jpg", {
        type: "image/jpeg",
      });

      console.log("Thumbnail file created successfully:", {
        name: thumbnailFile.name,
        size: thumbnailFile.size,
        type: thumbnailFile.type,
      });

      // Clean up FFmpeg files
      try {
        console.log("Cleaning up temporary files...");
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);
        console.log("Temporary files cleaned up successfully");
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
          console.log("Files in FFmpeg FS during error cleanup:", files);
          for (const fileInfo of files) {
            if (
              fileInfo.name.includes("input_") ||
              fileInfo.name.includes("thumbnail_")
            ) {
              await ffmpegRef.current.deleteFile(fileInfo.name);
              console.log("Cleaned up file:", fileInfo.name);
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
      console.log("Generated video thumbnail for Zora SDK:", {
        originalVideoSize: file.size,
        thumbnailSize: thumbnail.size,
        thumbnailType: thumbnail.type,
      });
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
        console.warn("Coin created but snap creation failed:", snapResult.error);
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
      <Box
        p={6}
        bg={"background"}
        borderRadius="md"
        border="1px solid"
        borderColor={"primary"}
        textAlign="center"
      >
        <VStack spacing={3}>
          <FaEthereum size={32} color="#627eea" />
          <Text fontSize="lg" fontWeight="bold">
            Connect Ethereum Wallet
          </Text>
          <Text color={"muted"}>
            Connect your Ethereum wallet to create coins on Skatehive
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={4}
      bg={"background"}
      borderRadius="md"
      border="1px solid"
      borderColor={"primary"}
      mb={4}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <FaCoins color="#f7931a" />
            <Text fontSize="lg" fontWeight="bold">
              Create a Coin
            </Text>
          </HStack>
          <HStack spacing={2}>
            <FaEthereum color="#627eea" />
            <Text fontSize="sm" color={"primary"}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Text>
          </HStack>
        </HStack>

        {/* Title Input */}
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="bold">
            Coin Name
          </FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter coin name (e.g., My Skate Trick)"
            size="md"
            disabled={isLoading || isCreating}
          />
        </FormControl>

        {/* Symbol Input */}
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="bold">
            Symbol
          </FormLabel>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g., TRICK (max 8 chars)"
            maxLength={8}
            size="md"
            disabled={isLoading || isCreating}
          />
        </FormControl>

        {/* Description Textarea */}
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="bold">
            Description
          </FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your coin, trick, or content..."
            minHeight="100px"
            resize="vertical"
            disabled={isLoading || isCreating}
          />
        </FormControl>

        {/* Image Upload */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="bold">
            Images (Optional)
          </FormLabel>
          <HStack spacing={2}>
            <Input
              type="file"
              ref={imageUploadRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{ display: "none" }}
              disabled={isLoading || isCreating}
            />
            <Button
              leftIcon={<FaImage />}
              size="sm"
              variant="outline"
              onClick={() => imageUploadRef.current?.click()}
              disabled={isLoading || isCreating}
            >
              Add Images
            </Button>
            {images.length > 0 && (
              <Text fontSize="sm" color={"primary"}>
                {images.length} image{images.length > 1 ? "s" : ""} added
              </Text>
            )}
          </HStack>
        </FormControl>

        {/* Image Preview */}
        {images.length > 0 && (
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="bold">
              Image Preview:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {images.map((image, index) => (
                <Box key={index} position="relative">
                  <Image
                    src={image.url}
                    alt={`Preview ${index + 1}`}
                    width="60px"
                    height="60px"
                    objectFit="cover"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={"primary"}
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
          </VStack>
        )}

        {/* Video Upload */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="bold">
            Video (Optional)
          </FormLabel>
          <HStack spacing={2}>
            <Input
              type="file"
              ref={videoUploadRef}
              onChange={handleVideoUpload}
              accept="video/*"
              style={{ display: "none" }}
              disabled={isLoading || isCreating}
            />
            <Button
              leftIcon={<FaVideo />}
              size="sm"
              variant="outline"
              onClick={() => videoUploadRef.current?.click()}
              disabled={isLoading || isCreating}
            >
              Add Video File
            </Button>
            {videoFile && (
              <Text fontSize="sm" color={"primary"}>
                {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)}
                MB)
              </Text>
            )}
          </HStack>
        </FormControl>

        {/* Video Preview */}
        {videoFile && (
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="bold">
              Video Preview:
            </Text>
            {isGeneratingThumbnail ? (
              <HStack spacing={2} align="center">
                <Spinner size="sm" />
                <Text fontSize="xs" color="blue.500">
                  Generating thumbnail for coin...
                </Text>
              </HStack>
            ) : videoThumbnail ? (
              <Text fontSize="xs" color="green.500" mb={2}>
                ✓ Thumbnail generated - video will be uploaded to IPFS and used
                as coin media
              </Text>
            ) : (
              <Text fontSize="xs" color="blue.400" mb={2}>
                ✨ A thumbnail will be generated for preview - video will be
                uploaded to IPFS for coin
              </Text>
            )}
            <Box position="relative" maxWidth="300px">
              <video
                src={URL.createObjectURL(videoFile)}
                controls
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: "var(--chakra-colors-primary)",
                }}
              />
              <IconButton
                aria-label="Remove video"
                icon={<Text fontSize="xs">×</Text>}
                size="xs"
                position="absolute"
                top="-1"
                right="-1"
                colorScheme="red"
                borderRadius="full"
                onClick={removeVideo}
              />
            </Box>
            {videoThumbnail && (
              <VStack spacing={1} align="stretch">
                <Text fontSize="xs" color="gray.500">
                  Generated thumbnail:
                </Text>
                <Box maxWidth="150px">
                  <Image
                    src={URL.createObjectURL(videoThumbnail)}
                    alt="Video thumbnail"
                    width="100%"
                    height="auto"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="green.300"
                  />
                </Box>
              </VStack>
            )}
          </VStack>
        )}

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
                    colorScheme="blue"
                  />
                )
            )}
          </VStack>
        )}

        {/* Create Button */}
        <Button
          colorScheme="orange"
          size="lg"
          onClick={handleCreateCoin}
          disabled={
            isLoading ||
            isCreating ||
            !title.trim() ||
            !description.trim() ||
            !symbol.trim()
          }
          leftIcon={
            isLoading || isCreating ? <Spinner size="sm" /> : <FaCoins />
          }
        >
          {isLoading || isCreating ? "Creating Coin..." : "Create Coin"}
        </Button>

        {/* Info */}
        <Text fontSize="xs" color={"muted"} textAlign="center">
          Your coin will be created on Zora and posted as a snap to Skatehive
          automatically. Make sure your wallet is connected and has sufficient
          Base ETH for gas fees.
          {videoFile && (
            <>
              {" "}
              <Text as="span" color="orange.400">
                Videos will be uploaded to IPFS and the IPFS URL will be used as
                coin media on Zora. Full video content will be available through
                the coin.
              </Text>
            </>
          )}
        </Text>
      </VStack>
    </Box>
  );
}
