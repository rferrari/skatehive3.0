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
  Switch,
  useToast,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
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
    videos?: string[];
  };
}

export function CoinCreationModal({
  isOpen,
  onClose,
  postData,
}: CoinCreationModalProps) {
  const { createCoinFromPost, isCreating } = useCoinCreation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [usePostMedia, setUsePostMedia] = useState(true);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [customVideoPreview, setCustomVideoPreview] = useState<string | null>(
    null
  );

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

    // Media is required either from post or custom upload
    if (
      usePostMedia &&
      postData.images.length === 0 &&
      (!postData.videos || postData.videos.length === 0)
    ) {
      newErrors.image = "Post must have images or videos to create a coin";
    } else if (!usePostMedia && !customVideoFile) {
      newErrors.image = "Please upload a custom video file";
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

  const fetchVideoAsFile = async (videoUrl: string): Promise<File> => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      // Use actual content type from response
      const contentType = blob.type || "video/mp4";
      const extension = contentType.includes("webm")
        ? ".webm"
        : contentType.includes("quicktime")
        ? ".mov"
        : contentType.includes("x-msvideo")
        ? ".avi"
        : ".mp4";
      const filename =
        videoUrl.split("/").pop()?.split("?")[0] || `coin-video${extension}`;
      return new File([blob], filename, { type: contentType });
    } catch (error) {
      throw new Error("Failed to fetch video from URL");
    }
  };

  const handleCustomVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video file must be less than 100MB",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCustomVideoFile(file);

    // Create preview URL
    if (customVideoPreview) {
      URL.revokeObjectURL(customVideoPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setCustomVideoPreview(previewUrl);
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const clearCustomVideo = () => {
    setCustomVideoFile(null);
    if (customVideoPreview) {
      URL.revokeObjectURL(customVideoPreview);
      setCustomVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    let imageFile: File | undefined;
    let videoFile: File | undefined;

    try {
      if (usePostMedia) {
        // Use media from post
        if (postData.images.length > 0) {
          imageFile = await fetchImageAsFile(postData.images[0]);
        }

        if (postData.videos && postData.videos.length > 0) {
          // For video URLs, we'll generate thumbnails in the useCoinCreation hook
          // Pass the video URL as mediaUrl for thumbnail generation
          console.log(
            "Post has videos - thumbnail will be generated during coin creation"
          );
        }
      } else {
        // Use custom video file
        if (customVideoFile) {
          videoFile = customVideoFile;
        }
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, image: "Failed to load media" }));
      return;
    }

    const coinData: CoinCreationData = {
      name: formData.name,
      symbol: formData.symbol.toUpperCase(),
      description: formData.description,
      image: imageFile,
      mediaFile: videoFile,
      // Add video URL for thumbnail generation if videos are present
      ...(postData.videos &&
        postData.videos.length > 0 && { mediaUrl: postData.videos[0] }),
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
      setUsePostMedia(true);
      clearCustomVideo();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
    setUsePostMedia(true);
    clearCustomVideo();
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
              <FormLabel>Coin Media</FormLabel>
              <VStack spacing={3}>
                {(postData.images.length > 0 ||
                  (postData.videos && postData.videos.length > 0)) && (
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="use-post-media" mb="0">
                      Use media from post
                    </FormLabel>
                    <Switch
                      id="use-post-media"
                      isChecked={usePostMedia}
                      onChange={(e) => {
                        setUsePostMedia(e.target.checked);
                        if (e.target.checked) {
                          clearCustomVideo();
                        }
                        setErrors((prev) => ({ ...prev, image: "" }));
                      }}
                    />
                  </FormControl>
                )}

                {usePostMedia &&
                (postData.images.length > 0 ||
                  (postData.videos && postData.videos.length > 0)) ? (
                  <Box
                    border="1px"
                    borderColor={"primary"}
                    borderRadius="md"
                    p={2}
                    w="full"
                  >
                    {postData.images.length > 0 && (
                      <>
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
                      </>
                    )}
                    {postData.videos && postData.videos.length > 0 && (
                      <>
                        <Text
                          fontSize="xs"
                          mb={2}
                          color="gray.500"
                          mt={postData.images.length > 0 ? 3 : 0}
                        >
                          Video content detected
                        </Text>
                        <Box
                          borderRadius="md"
                          overflow="hidden"
                          maxWidth="300px"
                          mx="auto"
                        >
                          <video
                            src={postData.videos[0]}
                            controls
                            style={{
                              width: "100%",
                              maxHeight: "200px",
                              borderRadius: "8px",
                            }}
                            onError={() => {
                              console.warn(
                                "Failed to load video preview:",
                                postData.videos?.[0]
                              );
                            }}
                          />
                          <Text
                            fontSize="xs"
                            color="blue.400"
                            mt={2}
                            textAlign="center"
                          >
                            ✨ Thumbnail will be generated from video for coin
                            image
                          </Text>
                        </Box>
                      </>
                    )}
                  </Box>
                ) : !usePostMedia ? (
                  <Box w="full">
                    <VStack spacing={3}>
                      <Text fontSize="sm" color="gray.500">
                        Upload a custom video for your post
                      </Text>
                      <Text fontSize="xs" color="orange.400">
                        ⚠️ Note: Videos will be included in your post, but the
                        coin itself will be text-only (Zora SDK only supports
                        images)
                      </Text>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleCustomVideoUpload}
                        style={{ display: "none" }}
                      />

                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                      >
                        Choose Video File
                      </Button>

                      {customVideoFile && customVideoPreview && (
                        <Box
                          border="1px"
                          borderColor="primary"
                          borderRadius="md"
                          p={3}
                          w="full"
                        >
                          <Text fontSize="xs" mb={2} color="gray.500">
                            Custom video: {customVideoFile.name}
                          </Text>
                          <Box
                            borderRadius="md"
                            overflow="hidden"
                            maxWidth="300px"
                            mx="auto"
                          >
                            <video
                              src={customVideoPreview}
                              controls
                              style={{
                                width: "100%",
                                maxHeight: "200px",
                                borderRadius: "8px",
                              }}
                            />
                          </Box>
                          <Button
                            onClick={clearCustomVideo}
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            mt={2}
                            w="full"
                          >
                            Remove Video
                          </Button>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                ) : (
                  <Text color="red.500" fontSize="sm">
                    No images or videos found in post
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
