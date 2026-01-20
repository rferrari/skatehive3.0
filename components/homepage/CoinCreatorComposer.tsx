"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Textarea,
  Button,
  HStack,
  VStack,
  Text,
  Input,
  FormControl,
  IconButton,
  Progress,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { FaEthereum } from "react-icons/fa";
import { useAccount } from "wagmi";
import { useCoinCreation } from "@/hooks/useCoinCreation";
import { createSnapAsSkatedev } from "@/lib/hive/server-actions";
import { HIVE_CONFIG } from "@/config/app.config";

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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  // Refs
  const mediaUploadRef = useRef<HTMLInputElement>(null);

  // Handle media upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image or video
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video file.");
      return;
    }

    // For videos, specifically check for MP4
    if (isVideo && file.type !== "video/mp4") {
      alert("Please select an MP4 video file.");
      return;
    }

    // Check file size (limit to 100MB for videos, 10MB for images)
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File must be smaller than ${isVideo ? "100MB" : "10MB"}.`);
      return;
    }

    // Store the media file
    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");

    e.target.value = ""; // Reset input
  };

  // Remove media
  const removeMedia = () => {
    setMediaFile(null);
    setMediaType(null);
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
      // Prepare coin data for Zora SDK - pass media file directly
      const coinData = {
        name: title,
        symbol: symbol.toUpperCase(),
        description: description,
        // Pass media file directly to Zora SDK
        ...(mediaFile && { mediaFile: mediaFile }),
        postTitle: title,
        postBody: "", // We'll set this later
        postJsonMetadata: JSON.stringify({
          app: "Skatehive App 3.0",
          tags: ["coin-creation", "ethereum", HIVE_CONFIG.THREADS.PERMLINK, symbol.toLowerCase()],
          creator_ethereum_address: address,
          ...(mediaFile && {
            media_type: mediaType,
            media_file_name: mediaFile.name,
            media_file_size: mediaFile.size,
            media_file_type: mediaFile.type,
          }),
        }),
        postParentAuthor: "",
        postParentPermlink: "",
      };

      // Create the coin using Zora's native media support
      const coinResult = await createCoin(coinData);

      if (!coinResult?.address) {
        throw new Error("Failed to get coin address from creation result");
      }

      // Generate Zora URL for the coin
      const zoraUrl = `https://zora.co/coin/base:${coinResult.address}`;

      // Now create the snap comment with the coin URL
      const mediaDescription = mediaFile
        ? mediaType === "video"
          ? `🎥 **Video coin with ${mediaFile.type} media**`
          : `🖼️ **Image coin**`
        : "";

      const snapBody = `🪙 **New Coin Created: ${title} (${symbol.toUpperCase()})**

${description}

${mediaDescription ? `${mediaDescription}\n\n` : ""}---

${zoraUrl}
`;

      const snapResult = await createSnapAsSkatedev({
        body: snapBody,
        tags: ["coin-creation", "ethereum", "zora", symbol.toLowerCase()],
        images: [], // No need for separate image URLs anymore
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
      setMediaFile(null);
      setMediaType(null);

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
          <Text fontSize="sm" color={"primary"}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Text>
        </HStack>
      </HStack>

      {/* Media Upload Section */}
      <VStack spacing={4}>
        {!mediaFile ? (
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
            onClick={() => mediaUploadRef.current?.click()}
          >
            <Input
              type="file"
              ref={mediaUploadRef}
              onChange={handleMediaUpload}
              accept="image/*,video/mp4"
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
                  Upload image or video
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Supports images (JPG, PNG, GIF) and MP4 videos
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
            </VStack>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {/* Show uploaded media */}
            <Box position="relative" textAlign="center">
              <HStack justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" color="green.500">
                  ✓ {mediaType === "video" ? "Video" : "Image"} selected:{" "}
                  {mediaFile.name}
                </Text>
                <IconButton
                  aria-label="Remove media"
                  icon={
                    <Text color={"red.500"} fontSize="xs">
                      ×
                    </Text>
                  }
                  size="xs"
                  colorScheme="red"
                  borderRadius="full"
                  onClick={removeMedia}
                />
              </HStack>

              {mediaType === "image" && (
                <Image
                  src={URL.createObjectURL(mediaFile)}
                  alt="Selected image"
                  maxW="300px"
                  maxH="300px"
                  objectFit="cover"
                  borderRadius="none"
                  border="2px solid"
                  borderColor="green.300"
                  mx="auto"
                />
              )}

              {mediaType === "video" && (
                <Box>
                  <video
                    src={URL.createObjectURL(mediaFile)}
                    controls
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      height: "auto",
                      borderRadius: "8px",
                      border: "2px solid",
                      borderColor: "var(--chakra-colors-green-300)",
                      margin: "0 auto",
                      display: "block",
                    }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    MP4 Video • {(mediaFile.size / 1024 / 1024).toFixed(1)}MB
                  </Text>
                </Box>
              )}
            </Box>

            <Button
              variant="outline"
              size="sm"
              onClick={() => mediaUploadRef.current?.click()}
              disabled={isLoading || isCreating}
            >
              Replace {mediaType}
            </Button>
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
        {mediaFile &&
          mediaType === "video" &&
          " Video will be uploaded directly to Zora."}
      </Text>
    </VStack>
  );
}
