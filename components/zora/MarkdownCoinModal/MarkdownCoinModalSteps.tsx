import React, { useState, useEffect } from "react";
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
  Badge,
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

interface MarkdownCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Discussion;
}

type Step = "cover" | "carousel" | "confirm" | "success";

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

// Generate coin card matching the reference design exactly
const generateMarkdownCoinCard = async (
  title: string,
  author: string,
  content: string,
  avatarUrl: string,
  thumbnailUrl?: string
): Promise<File> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 600;

  if (ctx) {
    // Black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header section - dark background
    const headerHeight = 50;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(16, 16, canvas.width - 32, headerHeight);

    // Load and draw circular avatar
    try {
      const avatarImg = document.createElement("img");
      avatarImg.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        avatarImg.onload = resolve;
        avatarImg.onerror = reject;
        avatarImg.src = avatarUrl;
      });

      const avatarSize = 30;
      const avatarX = 25;
      const avatarY = 26;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        2 * Math.PI
      );
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch (error) {
      console.warn("Failed to load avatar image:", error);
    }

    // Author name with lime green glow
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Arial', sans-serif";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;
    ctx.fillText(`@${author}`, 70, 45);
    ctx.shadowBlur = 0;

    // Skatehive badge
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 10px 'Arial', sans-serif";
    ctx.fillText("SKATEHIVE", canvas.width - 85, 30);
    ctx.fillText("COIN", canvas.width - 85, 45);

    // Main content area
    const contentY = 80;
    const contentHeight = canvas.height - contentY - 80;

    // Load and draw thumbnail if available
    let thumbnailHeight = 0;
    if (thumbnailUrl) {
      try {
        const thumbnailImg = document.createElement("img");
        thumbnailImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          thumbnailImg.onload = resolve;
          thumbnailImg.onerror = reject;
          thumbnailImg.src = thumbnailUrl;
        });

        thumbnailHeight = 180;
        const thumbnailWidth = canvas.width - 32;
        const thumbnailX = 16;
        const thumbnailY = contentY;

        ctx.drawImage(
          thumbnailImg,
          thumbnailX,
          thumbnailY,
          thumbnailWidth,
          thumbnailHeight
        );
      } catch (error) {
        console.warn("Failed to load thumbnail image:", error);
      }
    }

    // Title
    const titleY = contentY + thumbnailHeight + 20;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Arial', sans-serif";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;

    const words = title.split(" ");
    let line = "";
    let y = titleY;
    const lineHeight = 22;
    const maxWidth = canvas.width - 32;
    let titleLines = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 16, y);
        line = words[n] + " ";
        y += lineHeight;
        titleLines++;
        if (titleLines >= 2) break;
      } else {
        line = testLine;
      }
    }

    if (titleLines < 2) {
      ctx.fillText(line, 16, y);
      y += lineHeight;
    }

    ctx.shadowBlur = 0;

    // Content preview
    const contentStartY = y + 15;
    const availableHeight = canvas.height - contentStartY - 50;

    ctx.fillStyle = "#cccccc";
    ctx.font = "12px 'Arial', sans-serif";

    const contentWords = content.slice(0, 500).split(" ");
    let contentLine = "";
    let contentY_text = contentStartY;
    const contentLineHeight = 16;
    const maxContentLines = Math.floor(availableHeight / contentLineHeight);
    let contentLines = 0;

    for (
      let n = 0;
      n < contentWords.length && contentLines < maxContentLines;
      n++
    ) {
      const testLine = contentLine + contentWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(contentLine, 16, contentY_text);
        contentLine = contentWords[n] + " ";
        contentY_text += contentLineHeight;
        contentLines++;
      } else {
        contentLine = testLine;
      }
    }

    if (contentLines < maxContentLines && contentLine.trim()) {
      ctx.fillText(contentLine, 16, contentY_text);
    }

    // Glowing footer with skatehive branding
    const footerY = canvas.height - 40;
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 12px 'Arial', sans-serif";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;
    ctx.textAlign = "center";
    ctx.fillText("🛹 SKATEHIVE CREW 🛹", canvas.width / 2, footerY);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "coin-card.png", {
            type: "image/png",
          });
          resolve(file);
        }
      },
      "image/png",
      0.95
    );
  });
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
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [markdownImages, setMarkdownImages] = useState<string[]>([]);
  const [carouselPreview, setCarouselPreview] = useState<any[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [markdownDescription, setMarkdownDescription] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const toast = useToast();

  // Extract images from markdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("cover");
      setResult(null);
      // Always generate preview when modal opens to ensure carousel is populated
      console.log("🔄 Modal opened, generating preview...");
      generatePreview();
    } else {
      // Clean up blob URLs
      if (cardPreview) {
        URL.revokeObjectURL(cardPreview);
        setCardPreview(null);
      }
      // Reset carousel images when modal closes
      setCarouselImages([]);
      setCarouselPreview([]);
      setMarkdownImages([]);
    }
  }, [isOpen, cardPreview]);

  // Extract images from markdown when modal opens
  useEffect(() => {
    if (isOpen) {
      const images = extractMarkdownImages(post.body);
      console.log("🖼️ Extracted markdown images:", images);
      setMarkdownImages(images);
    }
  }, [isOpen, post.body]);

  const generatePreview = async () => {
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
        thumbnailUrl || undefined
      );

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
      console.log(
        "🎯 Setting carouselImages state with",
        carousel.length,
        "images"
      );
      setCarouselPreview(carousel);
      setCarouselImages(carousel);

      // Generate markdown description
      const markdown = convertToMarkdown(post.body);
      setMarkdownDescription(markdown);
    } catch (error) {
      console.error("Failed to generate preview:", error);
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
  };

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
              <Badge colorScheme="blue" fontSize="sm">
                Step {getStepNumber(currentStep)} of 3
              </Badge>
            </HStack>
            {currentStep !== "success" && (
              <Progress
                value={(getStepNumber(currentStep) / 3) * 100}
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
              onNext={() => setCurrentStep("carousel")}
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
