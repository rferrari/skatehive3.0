import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  useToast,
  Progress,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { useMarkdownCoin } from "@/hooks/useMarkdownCoin";
import { CoverStep } from "./CoverStep";
import { CarouselStep, CarouselImage } from "./CarouselStep";
import { ConfirmStep } from "./ConfirmStep";
import {
  extractThumbnailFromPost,
  cleanContentForCard,
  getVideoThumbnail,
  convertToMarkdownDescription,
  generateMarkdownCoinCard,
  extractMarkdownImages,
} from "@/lib/utils/markdownCoinUtils";

interface MarkdownCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Discussion;
}

type Step = "cover" | "carousel" | "confirm" | "success";

export function MarkdownCoinModal({
  isOpen,
  onClose,
  post,
}: MarkdownCoinModalProps) {
  // Create a stable identifier for the current post
  const postId = useMemo(() => {
    return `${post.author}-${post.permlink}`;
  }, [post.author, post.permlink]);

  console.log("🔄 MarkdownCoinModal render:", {
    isOpen,
    postTitle: post?.title,
    postId,
  });

  const { createMarkdownCoin, isCreating } = useMarkdownCoin();
  const [currentStep, setCurrentStep] = useState<Step>("cover");
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [markdownImages, setMarkdownImages] = useState<string[]>([]);
  const [carouselPreview, setCarouselPreview] = useState<any[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [markdownDescription, setMarkdownDescription] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string>("");
  const toast = useToast();

  // Memoize generatePreview function to prevent unnecessary re-creations
  const generatePreview = useCallback(
    async (providedImages?: string[]) => {
      console.log("🎯 generatePreview called with:", providedImages);

      // Prevent multiple simultaneous calls
      if (isGeneratingPreview) {
        console.log("⚠️ generatePreview already running, skipping");
        return;
      }

      setIsGeneratingPreview(true);
      try {
        const avatarUrl = `https://images.hive.blog/u/${post.author}/avatar/sm`;
        const thumbnailUrl = extractThumbnailFromPost(post);
        const coinCardFile = await generateMarkdownCoinCard(
          post.title,
          post.author,
          post.body,
          avatarUrl,
          thumbnailUrl || undefined
        );

        // Clean up previous blob URL if it exists
        if (cardPreview) {
          URL.revokeObjectURL(cardPreview);
        }

        // Create blob URL for preview
        const previewUrl = URL.createObjectURL(coinCardFile);
        setCardPreview(previewUrl);
        // Create carousel preview
        const carousel = [
          {
            uri: previewUrl,
            mime: "image/png",
            type: "Generated Card",
            isIncluded: true,
            isGenerated: true,
          },
        ];

        // Add markdown images to carousel preview
        const imagesToUse = providedImages || markdownImages;
        console.log(
          "Adding markdown images to carousel. Found images:",
          imagesToUse
        );
        imagesToUse.forEach((imageUrl, index) => {
          console.log(`Adding image ${index + 1} to carousel:`, imageUrl);
          carousel.push({
            uri: imageUrl,
            mime: "image/jpeg",
            type: `Markdown Image ${index + 1}`,
            isIncluded: true,
            isGenerated: false,
          });
        });

        console.log("Final carousel content:", carousel);
        console.log(
          "🎯 Setting carouselImages state with",
          carousel.length,
          "images"
        );
        setCarouselPreview(carousel);
        setCarouselImages(carousel);

        // Verify the state was set
        setTimeout(() => {
          console.log(
            "🔍 Verifying carouselImages state after setTimeout:",
            carouselImages?.length || 0,
            "images"
          );
          console.log(
            "🔍 Verifying carouselPreview state after setTimeout:",
            carouselPreview?.length || 0,
            "images"
          );
        }, 100);
      } catch (error) {
        console.error("❌ Failed to generate preview:", error);
        toast({
          title: "Preview generation failed",
          description: "Unable to generate image preview",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsGeneratingPreview(false);
      }
    },
    [post.author, post.title, post.body, toast]
  ); // Removed state variables to prevent infinite loop

  // Memoize whether we should generate preview to prevent infinite loops
  const shouldGeneratePreview = useMemo(() => {
    const isNewPost = currentPostId !== postId;
    return isOpen && (!hasInitialized || isNewPost) && !isGeneratingPreview;
  }, [isOpen, hasInitialized, isGeneratingPreview, currentPostId, postId]);

  // Reset state when modal opens/closes or when post changes
  useEffect(() => {
    console.log("🔄 useEffect triggered:", {
      isOpen,
      cardPreview: !!cardPreview,
      postTitle: post?.title,
      postId,
      currentPostId,
    });
    if (isOpen) {
      console.log("📂 Modal opening, resetting state");
      setCurrentStep("cover");
      setResult(null);

      // Reset if it's a new post
      if (currentPostId !== postId) {
        console.log("🆕 New post detected, resetting state");
        setHasInitialized(false);
        setCurrentPostId(postId);
        setCardPreview(null);
        setMarkdownImages([]);
        setCarouselPreview([]);
        setCarouselImages([]);
        setMarkdownDescription("");
      }
    } else {
      // Reset state when modal closes (blob cleanup is handled by useEffect)
      setCardPreview(null);
      setHasInitialized(false);
    }
  }, [isOpen, postId, currentPostId]); // Depend on postId to detect post changes

  // Separate effect for generating preview - only when modal is open
  useEffect(() => {
    if (shouldGeneratePreview && isOpen) {
      console.log("🎨 Generating preview for new modal open");
      setHasInitialized(true); // Mark as initialized to prevent multiple calls
      
      // Extract images and generate preview in one go
      const images = extractMarkdownImages(post.body);
      console.log("Modal opened, extracting images from post:", post.title);
      console.log("Extracted markdown images:", images);
      setMarkdownImages(images);

      // Convert content to markdown for description
      convertToMarkdownDescription(post.body).then((markdownDesc) => {
        setMarkdownDescription(markdownDesc);
      });

      generatePreview(images);
    }
  }, [shouldGeneratePreview, post.body, post.title, generatePreview, isOpen]);  // Debug effect to monitor carouselImages state changes
  useEffect(() => {
    console.log("📊 carouselImages state changed:", {
      length: carouselImages?.length || 0,
      images:
        carouselImages?.map((img) => ({
          uri: img.uri,
          isIncluded: img.isIncluded,
        })) || [],
    });
  }, [carouselImages]);

  // Cleanup blob URLs when cardPreview changes or component unmounts
  useEffect(() => {
    // Cleanup function that runs when cardPreview changes or component unmounts
    return () => {
      if (cardPreview) {
        URL.revokeObjectURL(cardPreview);
      }
    };
  }, [cardPreview]);

  // Cleanup all blob URLs on component unmount
  useEffect(() => {
    return () => {
      // Cleanup cardPreview if it exists
      if (cardPreview) {
        URL.revokeObjectURL(cardPreview);
      }
    };
  }, []);

  const handleCreateCoin = async (
    metadata: {
      name: string;
      description: string;
    },
    carouselImagesParam: CarouselImage[]
  ) => {
    console.log("🎯 handleCreateCoin called!");
    console.log("- Current carouselImages state:", carouselImages);
    console.log("- carouselImagesParam received:", carouselImagesParam);

    try {
      // Use the passed carousel images
      const imagesToUse = carouselImagesParam;

      // Filter to only included images and ensure type is defined
      const includedImages = imagesToUse
        .filter((img) => img.isIncluded)
        .map((img) => ({
          ...img,
          type: img.type || "image", // Ensure type is defined
        }));

      console.log("🚀 MARKDOWN MODAL: Calling hook with:");
      console.log("- imagesToUse:", imagesToUse);
      console.log("- imagesToUse length:", imagesToUse?.length || 0);
      console.log("- includedImages:", includedImages);
      console.log("- includedImages length:", includedImages.length);
      console.log(
        "- isIncluded values:",
        imagesToUse?.map((img) => ({
          uri: img.uri,
          isIncluded: img.isIncluded,
        }))
      );

      const coinResult = await createMarkdownCoin(post, includedImages);

      setResult(coinResult);
      setCurrentStep("success");

      toast({
        title: "Coin Created Successfully!",
        description: `Your coin "${metadata.name}" has been created on Zora.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("❌ Failed to create coin:", error);
      toast({
        title: "Coin Creation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // Don't re-throw the error to prevent component crash
      setCurrentStep("confirm"); // Stay on confirm step so user can retry
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const getStepNumber = (step: Step): number => {
    switch (step) {
      case "cover":
        return 1;
      case "carousel":
        return 2;
      case "confirm":
        return 3;
      case "success":
        return 4;
      default:
        return 1;
    }
  };

  const getStepTitle = (step: Step): string => {
    switch (step) {
      case "cover":
        return "Cover Preview";
      case "carousel":
        return "Carousel Images";
      case "confirm":
        return "Review & Create";
      case "success":
        return "Success!";
      default:
        return "Create Coin";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="xl">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent
        bg="background"
        border="1px solid"
        borderColor="primary"
        maxW="800px"
      >
        <ModalHeader color="colorBackground">
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between" align="center">
              <Text fontSize="xl" fontWeight="bold">
                {getStepTitle(currentStep)}
              </Text>
            </HStack>
            {currentStep !== "success" && (
              <Progress
                value={(getStepNumber(currentStep) / 3) * 100}
                colorScheme="green"
                size="sm"
                borderRadius="full"
              />
            )}
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="primary" isDisabled={isCreating} />

        <ModalBody>
          {currentStep === "cover" && (
            <CoverStep
              previewImageUrl={cardPreview}
              postTitle={post.title}
              author={post.author}
              isGeneratingPreview={isGeneratingPreview}
              onRegeneratePreview={() => generatePreview()}
              onNext={() => {
                if (
                  cardPreview &&
                  carouselImages.length > 0 &&
                  !isGeneratingPreview
                ) {
                  setCurrentStep("carousel");
                } else {
                  console.warn("⚠️ Cannot proceed: preview not generated yet", {
                    hasCardPreview: !!cardPreview,
                    carouselImagesCount: carouselImages.length,
                    isGeneratingPreview,
                  });
                  toast({
                    title: "Please wait",
                    description:
                      "Preview is still generating. Please wait a moment.",
                    status: "warning",
                    duration: 3000,
                  });
                }
              }}
              wordCount={post.body.split(" ").length}
              readTime={Math.ceil(post.body.split(" ").length / 200)}
              symbol={`${post.author.toUpperCase().slice(0, 4)}COIN`}
            />
          )}

          {currentStep === "carousel" && (
            <CarouselStep
              carouselPreview={carouselPreview}
              carouselImages={carouselImages}
              onBack={() => setCurrentStep("cover")}
              onNext={() => {
                if (
                  carouselImages &&
                  carouselImages.length > 0 &&
                  !isGeneratingPreview
                ) {
                  setCurrentStep("confirm");
                } else {
                  console.warn(
                    "⚠️ Cannot proceed to confirm step: carousel images not loaded",
                    {
                      carouselImagesCount: carouselImages.length,
                      isGeneratingPreview,
                    }
                  );
                  toast({
                    title: "Please wait",
                    description:
                      "Carousel images are still loading. Please wait a moment.",
                    status: "warning",
                    duration: 3000,
                  });
                }
              }}
              onImagesChange={setCarouselImages}
            />
          )}

          {currentStep === "confirm" && cardPreview && (
            <ConfirmStep
              cardPreview={cardPreview}
              title={post.title}
              carouselImages={carouselImages}
              markdownDescription={markdownDescription}
              isCreating={isCreating}
              onBack={() => setCurrentStep("carousel")}
              onCreate={handleCreateCoin}
            />
          )}

          {currentStep === "success" && result && (
            <VStack spacing={6} align="center" py={8}>
              <Box
                w="100px"
                h="100px"
                borderRadius="full"
                bg="green.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="3xl"
              >
                🎉
              </Box>

              <VStack spacing={2} textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.400">
                  Coin Created Successfully!
                </Text>
                <Text color="accent">
                  Your Zora coin has been minted on the Base network.
                </Text>
              </VStack>

              {result.transactionHash && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      Transaction Hash:
                    </Text>
                    <Text fontSize="xs" fontFamily="mono">
                      {result.transactionHash}
                    </Text>
                  </VStack>
                </Alert>
              )}

              <Button colorScheme="blue" size="lg" onClick={handleClose}>
                Close
              </Button>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
