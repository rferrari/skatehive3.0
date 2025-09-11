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
  convertToMarkdownDescription,
  generateMarkdownCoinCard,
  extractMarkdownImages,
  ColorOptions,
} from "@/lib/utils/markdownCoinUtils";

interface MarkdownCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Discussion;
}

type Step = "carousel" | "cover" | "confirm" | "success";

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
  const [currentStep, setCurrentStep] = useState<Step>("carousel");
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [markdownImages, setMarkdownImages] = useState<string[]>([]);
  const [carouselPreview, setCarouselPreview] = useState<any[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [markdownDescription, setMarkdownDescription] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string>("");
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(
    null
  );
  const [editableTitle, setEditableTitle] = useState<string>("");
  const [editableDescription, setEditableDescription] = useState<string>("");
  const [selectedColors, setSelectedColors] = useState<ColorOptions>({
    primary: "#00ff88",
    secondary: "#00ff88",
    gradient: {
      start: "#2a2a2a",
      middle: "#000000",
      end: "#1a1a1a",
    },
  });
  const toast = useToast();

  // Memoize generatePreview function to prevent unnecessary re-creations
  const generatePreview = useCallback(
    async (
      thumbnailUrl?: string,
      customTitle?: string,
      customContent?: string
    ) => {
      console.log("🎯 generatePreview called with thumbnail:", thumbnailUrl);

      // Prevent multiple simultaneous calls
      if (isGeneratingPreview) {
        console.log("⚠️ generatePreview already running, skipping");
        return;
      }

      setIsGeneratingPreview(true);
      try {
        // Use higher quality avatar for better card generation
        // Try large first, fallback to medium if large doesn't exist
        const avatarUrl = `https://images.hive.blog/u/${post.author}/avatar/large`;
        // Use selected thumbnail or fall back to extracted thumbnail
        const finalThumbnail =
          thumbnailUrl || selectedThumbnail || extractThumbnailFromPost(post);

        // Use custom title/content if provided, otherwise use editable state or post defaults
        const titleToUse = customTitle || editableTitle || post.title;
        const contentToUse = customContent || editableDescription || post.body;

        const coinCardFile = await generateMarkdownCoinCard(
          titleToUse,
          post.author,
          contentToUse,
          avatarUrl,
          finalThumbnail || undefined,
          selectedColors
        );

        // Clean up previous blob URL if it exists
        if (cardPreview) {
          URL.revokeObjectURL(cardPreview);
        }

        // Create blob URL for preview
        const previewUrl = URL.createObjectURL(coinCardFile);
        setCardPreview(previewUrl);
        // Create carousel preview - no need to add images here since we'll do it in carousel step
        const carousel = [
          {
            uri: previewUrl,
            mime: "image/png",
            type: "Generated Card",
            isIncluded: true,
            isGenerated: true,
          },
        ];

        console.log("Card preview generated, updating carousel");
        setCarouselPreview(carousel);
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
    [
      post.author,
      post.title,
      post.body,
      toast,
      selectedThumbnail,
      cardPreview,
      editableTitle,
      editableDescription,
      selectedColors,
      isGeneratingPreview,
      post,
    ]
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
      setCurrentStep("carousel");
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
        setSelectedThumbnail(null);
        setEditableTitle("");
        setEditableDescription("");
        setSelectedColors({
          primary: "#00ff88",
          secondary: "#00ff88",
          gradient: {
            start: "#2a2a2a",
            middle: "#000000",
            end: "#1a1a1a",
          },
        });
      }
    } else {
      // Reset state when modal closes (blob cleanup is handled by useEffect)
      setCardPreview(null);
      setHasInitialized(false);
    }
  }, [isOpen, postId, currentPostId]);

  // Initialize carousel images when modal opens
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      console.log("🎨 Initializing carousel for new modal open");
      setHasInitialized(true);

      // Extract images and set up initial carousel
      const images = extractMarkdownImages(post.body);
      console.log("Modal opened, extracting images from post:", post.title);
      console.log("Extracted markdown images:", images);
      setMarkdownImages(images);

      // Convert content to markdown for description
      convertToMarkdownDescription(post.body).then((markdownDesc) => {
        setMarkdownDescription(markdownDesc);
        setEditableDescription(markdownDesc);
      });

      // Initialize editable title
      setEditableTitle(post.title || "");

      // Set up initial carousel with markdown images
      const initialCarousel = images.map((imageUrl: string, index: number) => ({
        uri: imageUrl,
        mime: "image/jpeg",
        type: `Markdown Image ${index + 1}`,
        isIncluded: true,
        isGenerated: false,
      }));

      setCarouselImages(initialCarousel);
      setCarouselPreview(initialCarousel);

      // Set default thumbnail to first image if available
      if (images.length > 0) {
        setSelectedThumbnail(images[0]);
      } else {
        // Use post thumbnail if no images found
        const postThumbnail = extractThumbnailFromPost(post);
        if (postThumbnail) {
          setSelectedThumbnail(postThumbnail);
        }
      }
    }
  }, [isOpen, hasInitialized, post.body, post.title, post, cardPreview]); // Debug effect to monitor carouselImages state changes
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
  }, [cardPreview]);

  // Auto-regenerate preview when colors change
  useEffect(() => {
    if (hasInitialized && post && editableTitle && editableDescription) {
      console.log("🎨 Colors changed, regenerating preview...", selectedColors);
      // Small delay to ensure state has updated
      const timer = setTimeout(() => {
        generatePreview();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedColors, hasInitialized, post, editableTitle, editableDescription, generatePreview]);

  // Auto-regenerate preview when thumbnail selection changes
  useEffect(() => {
    if (hasInitialized && post && editableTitle && editableDescription && cardPreview) {
      console.log("🖼️ Thumbnail changed, regenerating preview...", selectedThumbnail);
      // Small delay to ensure state has updated
      const timer = setTimeout(() => {
        generatePreview();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedThumbnail, hasInitialized, post, editableTitle, editableDescription, cardPreview, generatePreview]);

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
    } catch (error: any) {
      // Don't log the full error to avoid console noise - just log a summary
      console.error(
        "❌ Coin creation failed - check error handling for details"
      );

      // Professional error handling for user-friendly messages
      const errorMessage =
        error?.message || error?.toString() || "Unknown error";
      const errorCode = error?.code || error?.cause?.code;
      const errorName =
        error?.name || error?.cause?.name || error?.constructor?.name;
      const errorDetails = error?.details || "";

      let toastTitle = "Coin Creation Failed";
      let toastDescription = "An unexpected error occurred";
      let toastStatus: "error" | "info" = "error";

      // User cancelled transaction
      if (
        errorCode === 4001 ||
        errorName === "ContractFunctionExecutionError" ||
        errorName === "UserRejectedRequestError" ||
        errorMessage.toLowerCase().includes("user rejected") ||
        errorMessage.toLowerCase().includes("user denied") ||
        errorMessage
          .toLowerCase()
          .includes("user denied transaction signature") ||
        errorMessage.toLowerCase().includes("rejected") ||
        errorMessage.toLowerCase().includes("cancelled") ||
        errorDetails.toLowerCase().includes("user denied") ||
        errorDetails.toLowerCase().includes("user rejected")
      ) {
        toastTitle = "Transaction Cancelled";
        toastDescription =
          "You cancelled the transaction in your wallet. No charges applied!";
        toastStatus = "info";
      }
      // Insufficient funds
      else if (
        errorMessage.toLowerCase().includes("insufficient funds") ||
        errorMessage.toLowerCase().includes("insufficient balance") ||
        errorMessage.toLowerCase().includes("insufficient gas") ||
        errorDetails.toLowerCase().includes("insufficient funds") ||
        errorCode === -32000 ||
        errorCode === -32003
      ) {
        toastTitle = "Insufficient Funds";
        toastDescription =
          "You don't have enough ETH to cover the gas fees. Please add more ETH to your wallet.";
      }
      // Network issues
      else if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("rpc") ||
        errorMessage.toLowerCase().includes("connection")
      ) {
        toastTitle = "Network Error";
        toastDescription =
          "Connection issue. Please check your internet and try again.";
      }
      // Keep it generic and user-friendly for other errors
      else {
        toastTitle = "Coin Creation Failed";
        toastDescription =
          "Something went wrong while creating your coin. Please try again.";
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        status: toastStatus,
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
      case "carousel":
        return 1;
      case "cover":
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
      case "carousel":
        return "Choose Images & Thumbnail";
      case "cover":
        return "Card Preview";
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
          {currentStep === "carousel" && (
            <CarouselStep
              carouselPreview={carouselPreview}
              carouselImages={carouselImages}
              onBack={() => {}} // No back button on first step
              onNext={() => {
                if (carouselImages && carouselImages.length > 0) {
                  // Generate preview when moving to cover step
                  if (!cardPreview) {
                    generatePreview(selectedThumbnail || undefined);
                  }
                  setCurrentStep("cover");
                } else {
                  toast({
                    title: "Please add images",
                    description: "Select at least one image to continue.",
                    status: "warning",
                    duration: 3000,
                  });
                }
              }}
              onImagesChange={setCarouselImages}
              selectedThumbnail={selectedThumbnail}
              onThumbnailSelect={setSelectedThumbnail}
              showThumbnailSelection={true}
            />
          )}

          {currentStep === "cover" && (
            <CoverStep
              previewImageUrl={cardPreview}
              postTitle={editableTitle}
              author={post.author}
              isGeneratingPreview={isGeneratingPreview}
              onRegeneratePreview={() =>
                generatePreview(selectedThumbnail || undefined)
              }
              onTitleChange={(newTitle) => {
                setEditableTitle(newTitle);
                generatePreview(
                  selectedThumbnail || undefined,
                  newTitle,
                  editableDescription
                );
              }}
              onDescriptionChange={(newDescription) => {
                setEditableDescription(newDescription);
                generatePreview(
                  selectedThumbnail || undefined,
                  editableTitle,
                  newDescription
                );
              }}
              editableDescription={editableDescription}
              onNext={() => {
                if (cardPreview && !isGeneratingPreview) {
                  // Add the generated card to the carousel images as the first item
                  const cardItem = {
                    uri: cardPreview,
                    mime: "image/png",
                    type: "Generated Card",
                    isIncluded: true,
                    isGenerated: true,
                  };

                  // Update carousel images to include the card as first item
                  const updatedCarousel = [
                    cardItem,
                    ...carouselImages.filter((img) => !img.isGenerated),
                  ];
                  setCarouselImages(updatedCarousel);

                  setCurrentStep("confirm");
                } else {
                  toast({
                    title: "Please wait",
                    description:
                      "Card preview is still generating. Please wait a moment.",
                    status: "warning",
                    duration: 3000,
                  });
                }
              }}
              onBack={() => setCurrentStep("carousel")}
              wordCount={post.body.split(" ").length}
              readTime={Math.ceil(post.body.split(" ").length / 200)}
              symbol={`${post.author.toUpperCase().slice(0, 4)}COIN`}
              selectedThumbnail={selectedThumbnail}
              onGeneratePreview={() =>
                generatePreview(selectedThumbnail || undefined)
              }
              selectedColors={selectedColors}
              onColorChange={(newColors) => {
                console.log("🎨 Color selection changed:", newColors);
                setSelectedColors(newColors);
              }}
            />
          )}

          {currentStep === "confirm" && cardPreview && (
            <ConfirmStep
              cardPreview={cardPreview}
              title={editableTitle}
              carouselImages={carouselImages}
              markdownDescription={editableDescription}
              isCreating={isCreating}
              onBack={() => setCurrentStep("cover")}
              onCreate={handleCreateCoin}
              author={post.author}
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
