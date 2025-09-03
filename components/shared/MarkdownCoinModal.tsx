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
import { CoverStep } from "./MarkdownCoinModal/CoverStep";
import { CarouselStep } from "./MarkdownCoinModal/CarouselStep";
import { ConfirmStep } from "./MarkdownCoinModal/ConfirmStep";

interface MarkdownCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Discussion;
}

type Step = "cover" | "carousel" | "confirm" | "success";

interface CarouselImage {
  uri: string;
  mime: string;
  type: string;
  isIncluded: boolean;
  isGenerated?: boolean;
}

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

// Clean content for card display (remove all HTML/markdown, plain text only)
const cleanContentForCard = (content: string): string => {
  let cleaned = content;

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, " ");

  // Remove markdown syntax
  cleaned = cleaned.replace(/!\[.*?\]\([^)]+\)/g, ""); // Images
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Links -> text only
  cleaned = cleaned.replace(/#{1,6}\s*/g, ""); // Headers
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1"); // Bold
  cleaned = cleaned.replace(/\*(.*?)\*/g, "$1"); // Italic
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1"); // Code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ""); // Code blocks
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ""); // Lists
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ""); // Numbered lists
  cleaned = cleaned.replace(/^\s*>\s+/gm, ""); // Blockquotes
  cleaned = cleaned.replace(/---+/g, ""); // Horizontal rules

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
};

// Get video thumbnail from OpenGraph/oEmbed (placeholder function)
const getVideoThumbnail = async (videoUrl: string): Promise<string | null> => {
  try {
    // For YouTube videos
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const videoId = videoUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      )?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // For Vimeo videos
    if (videoUrl.includes("vimeo.com")) {
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        // Note: In production, you'd need to call Vimeo API for thumbnail
        return `https://vumbnail.com/${videoId}.jpg`;
      }
    }

    // For other videos, try to extract a generic thumbnail or return null
    return null;
  } catch (error) {
    console.warn("Failed to get video thumbnail:", error);
    return null;
  }
};

// Convert HTML content to clean markdown for description
const convertToMarkdownDescription = async (
  content: string
): Promise<string> => {
  let markdown = content;

  // Convert iframe videos to markdown image buttons
  const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*><\/iframe>/gi;
  const iframes = [...markdown.matchAll(iframeRegex)];

  for (const iframe of iframes) {
    const [fullMatch, src] = iframe;
    const thumbnail = await getVideoThumbnail(src);

    if (thumbnail) {
      // Create a markdown image button that links to the video
      const videoButton = `[![Video Thumbnail](${thumbnail})](${src})`;
      markdown = markdown.replace(fullMatch, videoButton);
    } else {
      // Fallback: convert to simple link
      markdown = markdown.replace(fullMatch, `[🎥 Watch Video](${src})`);
    }
  }

  // Convert other HTML to markdown
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**"); // Bold
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**"); // Bold
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*"); // Italic
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "*$1*"); // Italic
  markdown = markdown.replace(/<u>(.*?)<\/u>/gi, "*$1*"); // Underline -> italic
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, "`$1`"); // Code
  markdown = markdown.replace(/<pre>(.*?)<\/pre>/gi, "```\n$1\n```"); // Code blocks

  // Convert links
  markdown = markdown.replace(
    /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );

  // Convert headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1");

  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1");
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, "$1");
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1");

  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");

  // Clean up extra whitespace and newlines
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

  return markdown;
};

// Generate coin card matching the reference design exactly
const generateMarkdownCoinCard = async (
  title: string,
  author: string,
  content: string,
  avatarUrl: string,
  thumbnailUrl?: string
): Promise<File> => {
  // Clean content for card display (remove all HTML/markdown)
  const cleanedContent = cleanContentForCard(content);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 600;

  if (ctx) {
    // Black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer lime green border with glow
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 20;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.shadowBlur = 0;

    // Header section - dark background with lime border
    const headerHeight = 50;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(16, 16, canvas.width - 32, headerHeight);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 10;
    ctx.strokeRect(16, 16, canvas.width - 32, headerHeight);
    ctx.shadowBlur = 0;

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

      // Lime green border around avatar
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2 + 1,
        0,
        2 * Math.PI
      );
      ctx.stroke();
      ctx.shadowBlur = 0;
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

        // Lime green border around thumbnail
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 10;
        ctx.strokeRect(
          thumbnailX - 2,
          thumbnailY - 2,
          thumbnailWidth + 4,
          thumbnailHeight + 4
        );
        ctx.shadowBlur = 0;

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

    const contentWords = cleanedContent.slice(0, 500).split(" ");
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

    // Bottom border glow
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 20;
    ctx.strokeRect(16, canvas.height - 25, canvas.width - 32, 2);
    ctx.shadowBlur = 0;
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
  console.log(
    "Extracting images from content:",
    content.substring(0, 500) + "..."
  );

  // Multiple regex patterns to catch different image formats
  const patterns = [
    /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g, // Standard markdown ![](url)
    /!\[[^\]]*\]\(([^)]+)\)/g, // More permissive markdown
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi, // HTML img tags
    /https?:\/\/[^\s<>"{}|\\^`\[\]]*\.(jpg|jpeg|png|gif|webp|bmp)/gi, // Direct image URLs
    // Hive-specific image patterns
    /https?:\/\/images\.hive\.blog\/[^\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/files\.peakd\.com\/[^\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/cdn\.steemitimages\.com\/[^\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/ipfs\.io\/ipfs\/[^\s)]+/gi,
    /https?:\/\/gateway\.pinata\.cloud\/ipfs\/[^\s)]+/gi,
  ];

  const images: string[] = [];

  patterns.forEach((pattern, index) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const imageUrl = match[1] || match[0]; // For direct URLs, use match[0]
      console.log(`Pattern ${index + 1} found image:`, imageUrl);
      if (imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl);
      }
    }
  });

  // Remove duplicates
  const uniqueImages = [...new Set(images)];

  // Filter for valid image URLs and exclude avatars
  const validImages = uniqueImages.filter((img) => {
    // More permissive image file check - include IPFS and other formats
    const isImageFile =
      img.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
      img.includes("ipfs") ||
      img.includes("images.hive.blog") ||
      img.includes("files.peakd.com") ||
      img.includes("steemitimages.com");

    const isNotAvatar =
      !img.includes("avatar") &&
      !img.includes("/u/") &&
      !img.toLowerCase().includes("profile");

    const isValidUrl = img.startsWith("http");

    console.log(
      `Checking image: ${img} - isImageFile: ${!!isImageFile}, isNotAvatar: ${isNotAvatar}, isValidUrl: ${isValidUrl}`
    );

    return isImageFile && isNotAvatar && isValidUrl;
  });

  console.log("Final extracted images:", validImages);
  return validImages;
};

export function MarkdownCoinModal({
  isOpen,
  onClose,
  post,
}: MarkdownCoinModalProps) {
  console.log("🔄 MarkdownCoinModal render:", {
    isOpen,
    postTitle: post?.title,
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
  const toast = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    console.log("🔄 useEffect triggered:", {
      isOpen,
      cardPreview,
      postTitle: post?.title,
    });
    if (isOpen) {
      console.log("📂 Modal opening, resetting state");
      setCurrentStep("cover");
      setResult(null);
      if (!cardPreview && !isGeneratingPreview) {
        console.log("🎨 No cardPreview and not generating, generating preview");
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
    } else {
      // Clean up blob URLs
      if (cardPreview) {
        URL.revokeObjectURL(cardPreview);
        setCardPreview(null);
      }
    }
  }, [isOpen]);

  // Debug effect to monitor carouselImages state changes
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

  const generatePreview = async (providedImages?: string[]) => {
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
  };

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

      // Filter to only included images
      const includedImages = imagesToUse.filter((img) => img.isIncluded);

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
