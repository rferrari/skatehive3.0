import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Box,
  Badge,
  useToast,
  Progress,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import { useMarkdownCoin } from "@/hooks/useMarkdownCoin";
import { CoverStep } from "./CoverStep";
import { CustomizationStep } from "./CustomizationStep";
import { CarouselStep, CarouselImage } from "./CarouselStep";
import { ConfirmStep } from "./ConfirmStep";
import { ColorOptions, generateMarkdownCoinCard } from "@/lib/utils/markdownCoinUtils";

interface MarkdownCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Discussion;
}

type Step = "cover" | "customization" | "carousel" | "confirm" | "success";

// Helper function to extract thumbnail from post
const extractThumbnailFromPost = (post: Discussion): string | null => {
  try {
    // First try to get from json_metadata
    if (post.json_metadata) {
      const metadata = JSON.parse(post.json_metadata);
      if (
        metadata.image &&
        Array.isArray(metadata.image) &&
        metadata.image[0]
      ) {
        return metadata.image[0];
      }
      if (
        metadata.thumbnail &&
        Array.isArray(metadata.thumbnail) &&
        metadata.thumbnail[0]
      ) {
        return metadata.thumbnail[0];
      }
    }

    // Extract from markdown content
    const imageMatch = post.body.match(/!\[.*?\]\((.*?)\)/);
    if (imageMatch && imageMatch[1]) {
      return imageMatch[1];
    }

    return null;
  } catch (error) {
    console.warn("Failed to extract thumbnail:", error);
    return null;
  }
};

// Clean HTML and markdown syntax for card display (plain text only)
const cleanContentForCard = (content: string): string => {
  // Remove HTML tags
  let cleaned = content.replace(/<[^>]*>/g, " ");

  // Remove markdown syntax
  cleaned = cleaned.replace(/!\[.*?\]\([^)]*\)/g, ""); // Images
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // Links
  cleaned = cleaned.replace(/\*\*([^*]*)\*\*/g, "$1"); // Bold
  cleaned = cleaned.replace(/\*([^*]*)\*/g, "$1"); // Italic
  cleaned = cleaned.replace(/#{1,6}\s*/g, ""); // Headers
  cleaned = cleaned.replace(/`([^`]*)`/g, "$1"); // Inline code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ""); // Code blocks
  cleaned = cleaned.replace(/>\s*/g, ""); // Blockquotes
  cleaned = cleaned.replace(/[-*+]\s+/g, ""); // List markers
  cleaned = cleaned.replace(/\d+\.\s+/g, ""); // Numbered lists

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
};

// Convert HTML content to clean markdown for description
const convertToMarkdown = (content: string): string => {
  let markdown = content;

  // Convert iframe videos to image buttons with thumbnails
  markdown = markdown.replace(
    /<iframe[^>]*src=["']([^"']*)["'][^>]*><\/iframe>/gi,
    (match, srcAttribute) => {
      try {
        // Parse the URL safely to validate it
        const url = new URL(srcAttribute);

        // Whitelist allowed hosts
        const allowedHosts = [
          "www.youtube.com",
          "youtube.com",
          "youtu.be",
          "vimeo.com",
          "player.vimeo.com",
        ];

        if (!allowedHosts.includes(url.hostname)) {
          return ""; // Return empty string for non-whitelisted hosts
        }

        // Validate and extract video IDs based on platform
        let videoId = "";
        let thumbnailUrl = "";
        let videoUrl = "";

        if (
          url.hostname.includes("youtube.com") &&
          url.pathname.startsWith("/embed/")
        ) {
          // YouTube embed: /embed/VIDEO_ID
          const pathParts = url.pathname.split("/");
          if (pathParts.length >= 3) {
            videoId = pathParts[2];
          }
        } else if (url.hostname === "youtu.be") {
          // YouTube short: youtu.be/VIDEO_ID
          videoId = url.pathname.slice(1); // Remove leading slash
        } else if (url.hostname.includes("vimeo.com")) {
          // Vimeo: player.vimeo.com/video/VIDEO_ID or vimeo.com/VIDEO_ID
          const pathParts = url.pathname.split("/");
          if (pathParts.length >= 2) {
            videoId = pathParts[pathParts.length - 1]; // Get last part
          }
        }

        // Validate video ID with strict pattern (alphanumeric, dashes, underscores only)
        const validIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!videoId || !validIdPattern.test(videoId) || videoId.length > 50) {
          return ""; // Return empty string for invalid IDs
        }

        // Additional security: check for dangerous characters
        const dangerousPatterns = [
          /</,
          />/,
          /javascript:/i,
          /data:/i,
          /vbscript:/i,
          /"/,
          /'/,
          /&/,
          /;/,
          /\(/,
          /\)/,
        ];

        if (dangerousPatterns.some((pattern) => pattern.test(videoId))) {
          return ""; // Return empty string if dangerous patterns found
        }

        // Build safe URLs based on validated platform and ID
        if (
          url.hostname.includes("youtube.com") ||
          url.hostname === "youtu.be"
        ) {
          thumbnailUrl = `https://img.youtube.com/vi/${encodeURIComponent(
            videoId
          )}/maxresdefault.jpg`;
          videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(
            videoId
          )}`;
        } else if (url.hostname.includes("vimeo.com")) {
          // For Vimeo, use generic thumbnail since API requires auth
          thumbnailUrl = "https://i.vimeocdn.com/video/default_300x169.jpg";
          videoUrl = `https://vimeo.com/${encodeURIComponent(videoId)}`;
        }

        // Only return markdown if we have valid URLs
        if (thumbnailUrl && videoUrl) {
          return `[![🎥 Watch Video](${thumbnailUrl})](${videoUrl})`;
        } else {
          return ""; // Return empty string if URLs couldn't be constructed
        }
      } catch (error) {
        // If URL parsing fails, return empty string
        console.warn("Failed to parse iframe src URL:", error);
        return "";
      }
    }
  );

  // Convert other HTML elements to markdown
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, "`$1`");
  markdown = markdown.replace(
    /<h([1-6])>(.*?)<\/h[1-6]>/gi,
    (match, level, text) => {
      return "#".repeat(parseInt(level)) + " " + text + "\n\n";
    }
  );

  // Convert links
  markdown = markdown.replace(
    /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );

  // Convert images
  markdown = markdown.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi,
    "![$2]($1)"
  );
  markdown = markdown.replace(
    /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi,
    "![$1]($2)"
  );
  markdown = markdown.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*>/gi,
    "![]($1)"
  );

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");

  // Clean up extra whitespace and line breaks
  markdown = markdown.replace(/\n\s*\n\s*\n/g, "\n\n");
  markdown = markdown.replace(/^\s+|\s+$/gm, "");

  return markdown.trim();
};

// Extract images from markdown content
const extractMarkdownImages = (content: string): string[] => {
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return images.filter(
    (img) => img.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !img.includes("avatar") // Filter out avatar images
  );
};

export function MarkdownCoinModal({
  isOpen,
  onClose,
  post,
}: MarkdownCoinModalProps) {
  const { createMarkdownCoin, isCreating } = useMarkdownCoin();
  const [currentStep, setCurrentStep] = useState<Step>("cover");
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const cardPreviewRef = useRef<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [markdownImages, setMarkdownImages] = useState<string[]>([]);
  const [carouselPreview, setCarouselPreview] = useState<any[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [markdownDescription, setMarkdownDescription] = useState<string>("");
  const [result, setResult] = useState<any>(null);
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

  const generatePreview = useCallback(async () => {
    console.log("🎯 Starting generatePreview function");
    setIsGeneratingPreview(true);
    try {
      const avatarUrl = `https://images.hive.blog/u/${post.author}/avatar/sm`;
      const thumbnailUrl = extractThumbnailFromPost(post);

      // Clean content for card display (remove HTML/markdown)
      const cleanedContent = cleanContentForCard(post.body);

      const coinCardFile = await generateMarkdownCoinCard(
        post.title,
        post.author,
        cleanedContent,
        avatarUrl,
        thumbnailUrl || undefined,
        selectedColors
      );

      // Create blob URL for preview
      const previewUrl = URL.createObjectURL(coinCardFile);
      cardPreviewRef.current = previewUrl;
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

      console.log("🎠 Building carousel with markdown images:", markdownImages);

      // Add markdown images to carousel preview
      markdownImages.forEach((imageUrl, index) => {
        carousel.push({
          uri: imageUrl,
          mime: "image/jpeg",
          type: `Markdown Image ${index + 1}`,
          isIncluded: true,
          isGenerated: false,
        });
      });

      console.log("🎠 Final carousel preview:", carousel);

      setCarouselPreview(carousel);
      setCarouselImages(carousel);
    } catch (error) {
      console.error("❌ Preview generation failed:", error);
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
  }, [markdownImages, post, selectedColors, toast]);

  // Extract images from markdown when modal opens and regenerate when colors change
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("cover");
      setResult(null);
      // Always generate preview when modal opens to ensure carousel is populated
      console.log("🔄 Modal opened, generating preview...");
      generatePreview();
      return;
    }

    if (cardPreviewRef.current) {
      URL.revokeObjectURL(cardPreviewRef.current);
      cardPreviewRef.current = null;
      setCardPreview(null);
    }

    setCarouselImages([]);
    setCarouselPreview([]);
    setMarkdownImages([]);
  }, [isOpen, selectedColors, markdownImages, generatePreview]);

  // Extract images from markdown when modal opens
  useEffect(() => {
    if (isOpen) {
      const images = extractMarkdownImages(post.body);
      console.log("🖼️ Extracted markdown images:", images);
      setMarkdownImages(images);
    }
  }, [isOpen, post.body]);

  const handleCreateCoin = async (
    metadata: {
      name: string;
      description: string;
    },
    carouselImagesParam?: CarouselImage[]
  ) => {
    console.log("🎯 handleCreateCoin called with:");
    console.log("- metadata:", metadata);
    console.log("- carouselImagesParam:", carouselImagesParam);
    console.log(
      "- carouselImagesParam length:",
      carouselImagesParam?.length || 0
    );

    // Use the passed carousel images or fall back to state
    const imagesToUse = carouselImagesParam || carouselImages;

    // Filter to only included images and ensure type is defined
    const includedImages = imagesToUse
      .filter((img) => img.isIncluded)
      .map((img) => ({
        ...img,
        type: img.type || "image", // Ensure type is defined
      }));

    console.log("🔍 DEBUGGING CAROUSEL IMAGES:");
    console.log("- carouselImages state:", imagesToUse);
    console.log("- carouselImages length:", imagesToUse.length);
    console.log("- includedImages:", includedImages);
    console.log("- includedImages length:", includedImages.length);

    // Check if we have any included images
    if (includedImages.length === 0) {
      console.warn(
        "⚠️ No included images found! This will cause metadata generation to fail."
      );
      console.log("Carousel images state:", imagesToUse);
      console.log("Carousel images param:", carouselImagesParam);
      throw new Error(
        "No carousel images are included. Please select at least one image in the carousel step."
      );
    }

    // Log the metadata format for comparison with Zora carousel example
    console.log("=== COIN METADATA FORMAT ===");
    console.log("Post title:", post.title);
    console.log("Metadata name:", metadata.name);
    console.log("Metadata description:", metadata.description);
    console.log("Included carousel images:", includedImages);
    console.log("Total carousel images in modal state:", imagesToUse);
    console.log(
      "Carousel images with isIncluded:",
      imagesToUse.map((img) => ({ uri: img.uri, isIncluded: img.isIncluded }))
    );
    console.log(
      "Carousel images structure:",
      JSON.stringify(includedImages, null, 2)
    );
    console.log("============================");

    try {
      console.log("🚀 CALLING HOOK WITH:");
      console.log("- includedImages:", includedImages);
      console.log("- includedImages length:", includedImages.length);
      console.log("- post:", post.title);

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
      console.error("Failed to create coin:", error);
      throw error; // Re-throw so ConfirmStep can handle it
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
      case "customization":
        return 2;
      case "carousel":
        return 3;
      case "confirm":
        return 4;
      case "success":
        return 5;
      default:
        return 1;
    }
  };

  const getStepTitle = (step: Step): string => {
    switch (step) {
      case "cover":
        return "Cover Preview";
      case "customization":
        return "Color Customization";
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
              <Badge colorScheme="blue" fontSize="sm">
                Step {getStepNumber(currentStep)} of 4
              </Badge>
            </HStack>
            {currentStep !== "success" && (
              <Progress
                value={(getStepNumber(currentStep) / 4) * 100}
                colorScheme="blue"
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
              onRegeneratePreview={generatePreview}
              onNext={() => setCurrentStep("customization")}
              wordCount={post.body.split(" ").length}
              readTime={Math.ceil(post.body.split(" ").length / 200)}
              symbol={`${post.author.toUpperCase().slice(0, 4)}COIN`}
            />
          )}

          {currentStep === "customization" && (
            <CustomizationStep
              selectedColors={selectedColors}
              onColorsChange={setSelectedColors}
              onBack={() => setCurrentStep("cover")}
              onNext={() => setCurrentStep("carousel")}
              onPreviewUpdate={generatePreview}
            />
          )}

          {currentStep === "carousel" && (
            <CarouselStep
              carouselPreview={carouselPreview}
              carouselImages={carouselImages}
              onBack={() => setCurrentStep("customization")}
              onNext={() => {
                if (carouselImages && carouselImages.length > 0) {
                  setCurrentStep("confirm");
                } else {
                  console.warn(
                    "⚠️ Cannot proceed to confirm step: carousel images not loaded"
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
                <Text color="muted">
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
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
