"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Image,
  Text,
  Alert,
  AlertIcon,
  FormErrorMessage,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { useCoinCreation, CoinCreationData } from "@/hooks/useCoinCreation";

interface CoinCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  postData: {
    title: string;
    body: string;
    author: string;
    permlink: string;
    parent_author: string;
    parent_permlink: string;
    json_metadata: string;
    images: string[];
  };
}

export function CoinCreationModal({
  isOpen,
  onClose,
  postData,
}: CoinCreationModalProps) {
  const { createCoinFromPost, isCreating } = useCoinCreation();

  // Create post link for description
  const postLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/post/${postData.author}/${postData.permlink}`;

  const [formData, setFormData] = useState({
    name: postData.title || "",
    symbol: "",
    description: postData.body
      ? `${postData.body}\n\nOriginal post: ${postLink}`
      : `Original post: ${postLink}`,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Coin name is required";
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    } else if (formData.symbol.length > 8) {
      newErrors.symbol = "Symbol must be 8 characters or less";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    // Image is required from post
    if (postData.images.length === 0) {
      newErrors.image = "Post must have images to create a coin";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchImageAsFile = async (imageUrl: string): Promise<File> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const filename = imageUrl.split("/").pop() || "coin-image.jpg";
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      throw new Error("Failed to fetch image from URL");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Use the first image from the post
    let imageFile: File;
    try {
      imageFile = await fetchImageAsFile(postData.images[0]);
    } catch (error) {
      setErrors((prev) => ({ ...prev, image: "Failed to load post image" }));
      return;
    }

    const coinData: CoinCreationData = {
      name: formData.name,
      symbol: formData.symbol.toUpperCase(),
      description: formData.description,
      image: imageFile,
      postAuthor: postData.author,
      postPermlink: postData.permlink,
      postBody: postData.body,
      postJsonMetadata: postData.json_metadata,
      postTitle: postData.title,
      postParentAuthor: postData.parent_author,
      postParentPermlink: postData.parent_permlink,
    };

    try {
      await createCoinFromPost(coinData);
      onClose();
      // Reset form
      setFormData({
        name: "",
        symbol: "",
        description: `Original post: ${postLink}`,
      });
      setErrors({});
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={"background"} border="1px" borderColor={"primary"}>
        <ModalHeader>Create Coin from Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Create a tradeable coin based on your Skatehive post. This will
                deploy a new coin contract on the blockchain.
              </Text>
            </Alert>

            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Coin Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter coin name (e.g., My Skate Trick)"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.symbol}>
              <FormLabel>Symbol</FormLabel>
              <Input
                value={formData.symbol}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    symbol: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="Enter symbol (e.g., TRICK)"
                maxLength={8}
              />
              <FormErrorMessage>{errors.symbol}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your coin..."
                rows={4}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.image}>
              <FormLabel>Coin Image</FormLabel>
              <VStack spacing={3}>
                {postData.images.length > 0 ? (
                  <Box
                    border="1px"
                    borderColor={"primary"}
                    borderRadius="md"
                    p={2}
                    w="full"
                  >
                    <Text fontSize="xs" mb={2} color="gray.500">
                      Using post image
                    </Text>
                    <Image
                      src={postData.images[0]}
                      alt="Coin image from post"
                      maxH="200px"
                      objectFit="contain"
                      borderRadius="md"
                      mx="auto"
                      display="block"
                    />
                  </Box>
                ) : (
                  <Text color="red.500" fontSize="sm">
                    No images found in post
                  </Text>
                )}
                <FormErrorMessage>{errors.image}</FormErrorMessage>
              </VStack>
            </FormControl>

            <HStack spacing={3} w="full" pt={4}>
              <Button variant="outline" onClick={handleClose} flex={1}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isCreating}
                loadingText="Creating Coin..."
                flex={1}
              >
                Create Coin
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
