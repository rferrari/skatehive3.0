"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  Button,
  HStack,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  IconButton,
  Progress,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { FaImage, FaCoins, FaEthereum } from "react-icons/fa";
import { useAccount } from "wagmi";
import { useCoinCreation } from "@/hooks/useCoinCreation";
import { createSnapAsSkatedev } from "@/lib/hive/server-actions";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";
import imageCompression from "browser-image-compression";

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

  // Refs
  const imageUploadRef = useRef<HTMLInputElement>(null);

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
      console.log("Creating coin for Ethereum user...");

      // Prepare coin data without post information (we'll create the snap after)
      const coinData = {
        name: title,
        symbol: symbol.toUpperCase(),
        description: description,
        mediaUrl: images[0]?.url || "",
        postTitle: title,
        postBody: "", // We'll set this later
        postJsonMetadata: JSON.stringify({
          app: "Skatehive App 3.0",
          tags: ["coin-creation", "ethereum", "snaps", symbol.toLowerCase()],
          images: images.map((img) => img.url),
          creator_ethereum_address: address,
        }),
        postParentAuthor: "",
        postParentPermlink: "",
      };

      console.log("Creating coin with data:", coinData);

      // Create the coin first
      const coinResult = await createCoin(coinData);

      if (!coinResult?.address) {
        throw new Error("Failed to get coin address from creation result");
      }

      console.log("✅ Coin created:", coinResult);

      // Generate Zora URL for the coin
      const zoraUrl = `https://zora.co/coin/base:${coinResult.address}`;

      // Now create the snap comment with the coin URL
      const snapBody = `🪙 **New Coin Created: ${title} (${symbol.toUpperCase()})**

${description}

---

${zoraUrl}
`;

      console.log("Creating snap with coin URL...");

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
      } else {
        console.log("✅ Snap created:", snapResult);
      }

      // Clear form
      setTitle("");
      setDescription("");
      setSymbol("");
      setImages([]);

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
        </Text>
      </VStack>
    </Box>
  );
}
