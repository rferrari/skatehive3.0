"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  Image,
  AspectRatio,
  useToast,
} from "@chakra-ui/react";
import { Address } from "viem";
import { useCoinMetadataUpdate } from "@/hooks/useCoinMetadataUpdate";

interface CoinMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface EditMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinAddress: Address;
  currentMetadata?: CoinMetadata;
}

export function EditMetadataModal({
  isOpen,
  onClose,
  coinAddress,
  currentMetadata,
}: EditMetadataModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [animationUrl, setAnimationUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { updateCoinMetadata, isUpdating, isConnected } =
    useCoinMetadataUpdate();
  const toast = useToast();

  // Initialize form with current metadata
  useEffect(() => {
    if (currentMetadata) {
      setName(currentMetadata.name || "");
      setDescription(currentMetadata.description || "");
      setImageUrl(currentMetadata.image || "");
      setAnimationUrl(currentMetadata.animation_url || "");
      setExternalUrl(currentMetadata.external_url || "");
    }
  }, [currentMetadata]);

  const handleClose = () => {
    // Reset form when closing
    setName("");
    setDescription("");
    setImageUrl("");
    setAnimationUrl("");
    setExternalUrl("");
    setMetadataUri("");
    onClose();
  };

  const uploadMetadataToIPFS = async (): Promise<string> => {
    setIsUploading(true);

    try {
      const metadata: CoinMetadata = {
        name,
        description,
        ...(imageUrl && { image: imageUrl }),
        ...(animationUrl && { animation_url: animationUrl }),
        ...(externalUrl && { external_url: externalUrl }),
      };

      // Upload metadata to IPFS using a public gateway
      const response = await fetch("/api/upload-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Failed to upload metadata to IPFS");
      }

      const { ipfsHash } = await response.json();
      return `ipfs://${ipfsHash}`;
    } catch (error) {
      console.error("Error uploading metadata:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the coin",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      let uri = metadataUri;

      // If no direct URI provided, create metadata and upload to IPFS
      if (!uri && (name || description || imageUrl || animationUrl)) {
        uri = await uploadMetadataToIPFS();
      }

      if (!uri) {
        toast({
          title: "No Metadata",
          description: "Please provide either metadata fields or a direct URI",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await updateCoinMetadata({
        coin: coinAddress,
        newURI: uri,
      });

      handleClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Edit Coin Metadata</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {!isConnected && (
              <Alert status="warning">
                <AlertIcon />
                Please connect your wallet to edit metadata
              </Alert>
            )}

            <Alert status="info" fontSize="sm">
              <AlertIcon />
              Only the coin owner can update metadata. Changes will be reflected
              after the transaction is confirmed.
            </Alert>

            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter coin name"
                bg="gray.700"
                border="none"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter coin description"
                bg="gray.700"
                border="none"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Image URL</FormLabel>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https:// or ipfs://"
                bg="gray.700"
                border="none"
              />
              {imageUrl && (
                <Box mt={2}>
                  <AspectRatio ratio={1} maxW="200px">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      borderRadius="none"
                      objectFit="cover"
                    />
                  </AspectRatio>
                </Box>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Animation URL (optional)</FormLabel>
              <Input
                value={animationUrl}
                onChange={(e) => setAnimationUrl(e.target.value)}
                placeholder="https:// or ipfs:// for video/gif"
                bg="gray.700"
                border="none"
              />
            </FormControl>

            <FormControl>
              <FormLabel>External URL (optional)</FormLabel>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://your-website.com"
                bg="gray.700"
                border="none"
              />
            </FormControl>

            <Box>
              <Text fontSize="sm" color="gray.400" mb={2}>
                Or provide a direct metadata URI:
              </Text>
              <FormControl>
                <FormLabel fontSize="sm">Metadata URI</FormLabel>
                <Input
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  placeholder="ipfs://... or https://..."
                  bg="gray.700"
                  border="none"
                  fontSize="sm"
                />
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdate}
              isLoading={isUpdating || isUploading}
              loadingText={isUploading ? "Uploading..." : "Updating..."}
              isDisabled={!isConnected}
            >
              Update Metadata
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
