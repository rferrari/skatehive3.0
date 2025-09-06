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
  FormHelperText,
  Box,
  useToast,
  Badge,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepSeparator,
} from "@chakra-ui/react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useCoinCreation, CoinCreationData } from "@/hooks/useCoinCreation";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";

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

// Subcomponents
interface ImagePreviewProps {
  images: string[];
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images }) => (
  <Box border="1px" borderColor={"primary"} borderRadius="md" p={2} w="full">
    <Text fontSize="xs" mb={2} color="muted">
      Using post image
    </Text>
    <Image
      src={images[0]}
      alt="Coin image from post"
      maxH="200px"
      objectFit="contain"
      borderRadius="md"
      mx="auto"
      display="block"
    />
    {images[0].toLowerCase().endsWith(".gif") && (
      <Text fontSize="xs" color="primary" mt={2} textAlign="center">
        GIF will be used as coin image
      </Text>
    )}
  </Box>
);

interface VideoPreviewProps {
  videos: string[];
  thumbnailUrl?: string;
  thumbnailFile?: File;
  onThumbnailCapture: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoLoad: () => void;
  onThumbnailUpload?: (file: File) => void;
  onThumbnailClear?: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videos,
  thumbnailUrl,
  thumbnailFile,
  onThumbnailCapture,
  videoRef,
  onVideoLoad,
  onThumbnailUpload,
  onThumbnailClear,
}) => {
  // Process video URL
  const videoUrl = videos[0];
  const iframeSrcMatch = videoUrl.match(/src=["']([^"']+)["']/);
  let src = iframeSrcMatch ? iframeSrcMatch[1] : videoUrl;
  src = src.replace(/^['"]+|['"]+$/g, "");

  try {
    src = src.replace(/&amp;/g, "&");
    src = decodeURIComponent(src);
  } catch (e) {}

  let finalSrc = src;
  if (src.startsWith("/ipfs/")) {
    finalSrc = `https://ipfs.skatehive.app${src}`;
  } else if (src.startsWith("ipfs://")) {
    finalSrc = `https://ipfs.skatehive.app/ipfs/${src.replace("ipfs://", "")}`;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onThumbnailUpload) {
      onThumbnailUpload(file);
    }
  };

  return (
    <VStack spacing={4} w="full">
      {/* Video Player */}
      <Box
        border="1px"
        borderColor="primary"
        borderRadius="md"
        overflow="hidden"
        maxWidth="400px"
        mx="auto"
      >
        <video
          key={finalSrc}
          src={finalSrc}
          controls
          ref={videoRef}
          crossOrigin="anonymous"
          style={{
            width: "100%",
            maxHeight: "200px",
            background: "#111",
          }}
          poster={thumbnailUrl}
          onLoadedMetadata={onVideoLoad}
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            target.poster = "https://placehold.co/300x200?text=Video+not+found";
            console.warn("Video loading failed:", e);
          }}
          preload="metadata"
        >
          Sorry, your browser doesnt support embedded videos.
        </video>
      </Box>

      {/* Thumbnail Controls */}
      <VStack spacing={3} w="full" maxW="400px" mx="auto">
        <Text fontSize="sm" color="muted" textAlign="center">
          Optional: Capture or upload a custom thumbnail
        </Text>

        <HStack spacing={3} w="full">
          <Button
            size="sm"
            colorScheme="blue"
            onClick={onThumbnailCapture}
            flex="1"
            leftIcon={<span>📸</span>}
          >
            Capture Frame
          </Button>

          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onClick={handleCustomUploadClick}
            flex="1"
            leftIcon={<span>📁</span>}
          >
            Upload Image
          </Button>

          {thumbnailUrl && onThumbnailClear && (
            <Button
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={onThumbnailClear}
            >
              🗑️
            </Button>
          )}
        </HStack>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <Box textAlign="center">
            <Image
              src={thumbnailUrl}
              alt="Selected thumbnail"
              maxH="120px"
              mx="auto"
              borderRadius="md"
              border="1px"
              borderColor="primary"
            />
          </Box>
        )}
      </VStack>
    </VStack>
  );
};

// Step Components
interface Step1Props {
  formData: { name: string; symbol: string };
  errors: { [key: string]: string };
  onFormChange: (field: string, value: string) => void;
}

const Step1BasicInfo: React.FC<Step1Props> = ({
  formData,
  errors,
  onFormChange,
}) => (
  <VStack spacing={4} align="stretch">
    <Text fontSize="lg" fontWeight="bold" color="primary" textAlign="center">
      Step 1: Basic Information
    </Text>

    <FormControl isInvalid={!!errors.name}>
      <FormLabel>Coin Name</FormLabel>
      <Input
        value={formData.name}
        onChange={(e) => onFormChange("name", e.target.value)}
        placeholder="Enter coin name (e.g., My Skate Trick)"
        size="lg"
      />
      <FormErrorMessage>{errors.name}</FormErrorMessage>
      <FormHelperText>{formData.name.length}/50 characters</FormHelperText>
    </FormControl>

    <FormControl isInvalid={!!errors.symbol}>
      <FormLabel>Symbol (You can ignore this)</FormLabel>
      <Input
        value={formData.symbol}
        onChange={(e) => onFormChange("symbol", e.target.value.toUpperCase())}
        placeholder="TRICK"
        maxLength={8}
        size="lg"
      />
      <FormErrorMessage>{errors.symbol}</FormErrorMessage>
    </FormControl>
  </VStack>
);

interface Step2Props {
  formData: { description: string };
  errors: { [key: string]: string };
  onFormChange: (field: string, value: string) => void;
}

const Step2Description: React.FC<Step2Props> = ({
  formData,
  errors,
  onFormChange,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="lg" fontWeight="bold" color="primary" textAlign="center">
        Step 2: Description
      </Text>

      <FormControl isInvalid={!!errors.description}>
        <FormLabel>Coin Description</FormLabel>
        <Textarea
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          placeholder="Describe your coin..."
          rows={6}
          size="lg"
        />
        <FormErrorMessage>{errors.description}</FormErrorMessage>
        <HStack justify="space-between" mt={1}>
          <Text fontSize="xs" color="primary">
            This description will be displayed on the coin&apos;s page and help
            users understand what your coin represents.
          </Text>
          <Text fontSize="xs" color="muted">
            {formData.description.length}/300 characters
          </Text>
        </HStack>
      </FormControl>
    </VStack>
  );
};

interface Step3Props {
  getMediaContent: () => React.ReactNode;
  errors: { [key: string]: string };
}

const Step3Media: React.FC<Step3Props> = ({ getMediaContent, errors }) => (
  <VStack spacing={4} align="stretch">
    <Text fontSize="lg" fontWeight="bold" color="primary" textAlign="center">
      Step 3: Media & Thumbnail
    </Text>

    <FormControl isInvalid={!!errors.image}>
      <VStack spacing={4}>
        {getMediaContent()}
        <FormErrorMessage>{errors.image}</FormErrorMessage>
      </VStack>
    </FormControl>
  </VStack>
);

export function CoinCreationModal({
  isOpen,
  onClose,
  postData,
}: CoinCreationModalProps) {
  const { createCoinFromPost, isCreating } = useCoinCreation();
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Basic Info", "Description", "Media & Thumbnail"];

  // Network validation hooks
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Create post link for description
  const postLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/post/${postData.author}/${postData.permlink}`;

  // Function to auto-generate symbol from title
  const generateSymbol = useCallback((name: string): string => {
    if (!name.trim()) return "";

    // Clean and split the name into words
    const words = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0)
      // Filter out common words
      .filter(
        (word) =>
          ![
            "THE",
            "AND",
            "OR",
            "OF",
            "IN",
            "ON",
            "AT",
            "TO",
            "FOR",
            "A",
            "AN",
          ].includes(word)
      );

    if (words.length === 0) return "";

    // If single word, take first 4-6 characters
    if (words.length === 1) {
      return words[0].substring(0, Math.min(6, words[0].length));
    }

    // If multiple words, take first letter of each word, max 8 chars
    const acronym = words
      .map((word) => word[0])
      .join("")
      .substring(0, 8);

    // If acronym is too short (less than 3), add more letters from first word
    if (acronym.length < 3 && words[0].length > 1) {
      return (words[0].substring(0, 4) + acronym.substring(1)).substring(0, 8);
    }

    return acronym;
  }, []);

  // Clean description by removing only iframes and markdown images, keep all text content
  const cleanDescription = useCallback((rawDescription: string): string => {
    if (!rawDescription) return "";

    let cleaned = rawDescription;

    // Remove iframe tags (for embedded videos) - handle both single and multi-line
    cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

    // Remove specific IPFS iframe patterns common in Hive posts
    cleaned = cleaned.replace(
      /<iframe[^>]*src="[^"]*ipfs[^"]*"[^>]*>[\s\S]*?<\/iframe>/gi,
      ""
    );

    // Remove markdown image syntax ![alt](url) but keep alt text if meaningful
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match, altText) => {
      // If alt text is meaningful (not empty, not just filename), keep it
      if (
        altText &&
        altText.trim() &&
        !altText.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      ) {
        return altText.trim();
      }
      return ""; // Remove if just filename or empty
    });

    // Keep markdown link text but remove URLs [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove standalone URLs that are not part of meaningful text
    cleaned = cleaned.replace(/(?:^|\s)(https?:\/\/[^\s]+)(?=\s|$)/g, " ");

    // Clean up HTML tags but preserve content (only basic cleanup)
    cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n"); // Convert br tags to newlines
    cleaned = cleaned.replace(/<\/(p|div|h[1-6])\s*>/gi, "\n"); // Add newlines after block elements
    cleaned = cleaned.replace(/<[^>]+>/g, " "); // Remove remaining HTML tags

    // Normalize whitespace but preserve paragraph breaks
    cleaned = cleaned.replace(/[ \t]+/g, " "); // Multiple spaces/tabs to single space
    cleaned = cleaned.replace(/\n\s+/g, "\n"); // Remove spaces at start of lines
    cleaned = cleaned.replace(/\s+\n/g, "\n"); // Remove spaces at end of lines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines
    cleaned = cleaned.trim();

    // Return the cleaned content as-is, even if short
    // Don't fall back to default text unless truly empty
    if (cleaned.length === 0) {
      return "A unique coin created from a Skatehive post";
    }

    // Limit length to reasonable size for coin description but preserve word boundaries
    if (cleaned.length > 300) {
      const truncated = cleaned.substring(0, 297);
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > 250) {
        cleaned = truncated.substring(0, lastSpace) + "...";
      } else {
        cleaned = truncated + "...";
      }
    }

    return cleaned;
  }, []);

  const [formData, setFormData] = useState({
    name: postData.title || "",
    symbol: generateSymbol(postData.title || ""),
    description: postData.body
      ? cleanDescription(postData.body)
      : "A unique coin created from a Skatehive post",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // For video thumbnail picker
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(
    undefined
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    undefined
  );
  const [hasAutoCapture, setHasAutoCapture] = useState(false);

  const handleFormChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Auto-generate symbol when name changes
        if (field === "name") {
          newData.symbol = generateSymbol(value);
        }

        return newData;
      });
    },
    [generateSymbol]
  );

  const handleThumbnailCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      toast({
        title: "Video Not Ready",
        description:
          "Please wait for the video to load before capturing a thumbnail.",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    // Check if video has loaded and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Video Not Loaded",
        description:
          "Video dimensions are not available. Please wait for the video to fully load.",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    // For cross-origin videos (like IPFS), we can't use canvas due to CORS
    // We'll try canvas first, but handle CORS gracefully
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // This will fail for cross-origin videos due to CORS
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setThumbnailUrl(url);
              setThumbnailFile(
                new File([blob], "thumbnail.jpg", { type: blob.type })
              );
              toast({
                title: "Thumbnail Captured",
                description:
                  "Successfully captured thumbnail from current video frame.",
                status: "success",
                duration: 2000,
              });
            }
          },
          "image/jpeg",
          0.92
        );
      }
    } catch (error) {
      console.warn("Failed to capture thumbnail due to CORS:", error);

      // For IPFS or cross-origin videos, we can try to generate a fallback thumbnail
      // or provide alternative options
      toast({
        title: "Thumbnail Capture Failed",
        description:
          "Cannot capture thumbnail from cross-origin video due to security restrictions. Consider uploading a custom thumbnail image.",
        status: "warning",
        duration: 4000,
      });

      // Set a placeholder or try alternative method
      // You could add a file input for custom thumbnail upload here
    }
  }, [toast, setThumbnailUrl, setThumbnailFile]);

  // Auto-capture first frame when video loads
  const handleVideoLoad = useCallback(() => {
    // Prevent multiple auto-captures
    if (hasAutoCapture || thumbnailFile || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    // Ensure video is actually loaded with dimensions
    if (
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      video.readyState >= 2
    ) {
      setHasAutoCapture(true); // Set flag to prevent multiple calls

      // Wait a bit for video to be ready and seek to a better frame
      setTimeout(() => {
        // Try to seek to 1 second or 10% of video duration for a better thumbnail
        const seekTime = Math.min(1, video.duration * 0.1);
        if (seekTime > 0 && !isNaN(seekTime)) {
          video.currentTime = seekTime;
          // Wait for seek to complete
          setTimeout(() => {
            handleThumbnailCapture();
          }, 200);
        } else {
          handleThumbnailCapture();
        }
      }, 100);
    }
  }, [hasAutoCapture, thumbnailFile, handleThumbnailCapture]);

  // Handle custom thumbnail upload
  const handleThumbnailUpload = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setThumbnailUrl(url);
        setThumbnailFile(file);
        toast({
          title: "Thumbnail Uploaded",
          description: "Custom thumbnail image uploaded successfully.",
          status: "success",
          duration: 2000,
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a valid image file.",
          status: "error",
          duration: 2000,
        });
      }
    },
    [toast]
  );

  // Handle thumbnail clear
  const handleThumbnailClear = useCallback(() => {
    if (thumbnailUrl && thumbnailUrl.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailUrl);
    }
    setThumbnailUrl(undefined);
    setThumbnailFile(undefined);
    setHasAutoCapture(false); // Reset auto-capture flag
    toast({
      title: "Thumbnail Cleared",
      description: "Thumbnail has been removed.",
      status: "info",
      duration: 2000,
    });
  }, [thumbnailUrl, toast]);

  // Reset auto-capture flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setHasAutoCapture(false);
      setThumbnailUrl(undefined);
      setThumbnailFile(undefined);
    }
  }, [isOpen]);

  // Step navigation
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const canProceedToStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1: // Can go to step 2 if name and symbol are valid
          const hasValidName = formData.name.trim().length > 0;
          const hasValidSymbol =
            formData.symbol.trim().length > 0 && formData.symbol.length <= 8;
          return hasValidName && hasValidSymbol;
        case 2: // Can go to step 3 if description is valid
          return formData.description.trim().length > 0;
        default:
          return true;
      }
    },
    [formData.name, formData.symbol, formData.description]
  );

  // Get help text for next button when disabled
  const getNextButtonHelp = (): string => {
    switch (currentStep) {
      case 0:
        if (!formData.name.trim()) return "Enter a coin name to continue";
        if (!formData.symbol.trim()) return "Symbol is required";
        if (formData.symbol.length > 8)
          return "Symbol must be 8 characters or less";
        return "";
      case 1:
        if (!formData.description.trim())
          return "Description is required to continue";
        return "";
      default:
        return "";
    }
  };

  // Network validation
  const validateNetwork = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create coins.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id });
        toast({
          title: "Network Switched",
          description: "Successfully switched to Base network.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        return true;
      } catch (error) {
        toast({
          title: "Network Switch Required",
          description:
            "Please switch to Base network to create coins. Go to your wallet and switch networks manually.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    }

    return true;
  }, [isConnected, chainId, switchChain, toast]);

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
    // Don't require image/video here - let the submit handle it
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

    // Check network before proceeding
    const isNetworkValid = await validateNetwork();
    if (!isNetworkValid) return;

    let imageFile: File | undefined;
    let videoUrl: string | undefined;

    // Handle images
    if (postData.images.length > 0) {
      try {
        imageFile = await fetchImageAsFile(postData.images[0]);
      } catch (error) {
        setErrors((prev) => ({ ...prev, image: "Failed to load image" }));
        return;
      }
    }

    // Handle videos - similar to CoinCreatorComposer
    if (postData.videos && postData.videos.length > 0) {
      // Extract and clean video URL
      const rawVideoUrl = postData.videos[0];
      const iframeSrcMatch = rawVideoUrl.match(/src=["']([^"']+)["']/);
      let cleanVideoUrl = iframeSrcMatch ? iframeSrcMatch[1] : rawVideoUrl;
      cleanVideoUrl = cleanVideoUrl.replace(/^['"]+|['"]+$/g, "");

      try {
        cleanVideoUrl = cleanVideoUrl.replace(/&amp;/g, "&");
        cleanVideoUrl = decodeURIComponent(cleanVideoUrl);
      } catch (e) {}

      if (cleanVideoUrl.startsWith("/ipfs/")) {
        cleanVideoUrl = `https://ipfs.skatehive.app${cleanVideoUrl}`;
      } else if (cleanVideoUrl.startsWith("ipfs://")) {
        cleanVideoUrl = `https://ipfs.skatehive.app/ipfs/${cleanVideoUrl.replace(
          "ipfs://",
          ""
        )}`;
      }

      videoUrl = cleanVideoUrl;

      // If user captured a thumbnail, use it. Otherwise, let Zora SDK handle it
      if (thumbnailFile) {
        imageFile = thumbnailFile;
      }
      // If no thumbnail and no image, we'll still proceed and let Zora handle thumbnail generation
    }

    // Ensure we have either an image or video
    if (!imageFile && !videoUrl) {
      setErrors((prev) => ({
        ...prev,
        image: "Post must have images or videos to create a coin",
      }));
      return;
    }

    const coinData: CoinCreationData = {
      name: formData.name,
      symbol: formData.symbol.toUpperCase(),
      description: formData.description,
      // For videos: use thumbnail as image, video URL as mediaUrl
      image: imageFile,
      ...(videoUrl && {
        mediaUrl: videoUrl,
        animationUrl: videoUrl,
      }),
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
      setCurrentStep(0);
      setFormData({
        name: "",
        symbol: "",
        description: `Original post: ${postLink}`,
      });
      setErrors({});
      setThumbnailFile(undefined);
      setThumbnailUrl(undefined);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    onClose();
    setCurrentStep(0);
    setErrors({});
    setThumbnailFile(undefined);
    setThumbnailUrl(undefined);
  };

  // Get modal content based on post data
  const getMediaContent = () => {
    const hasImages = postData.images.length > 0;
    const hasVideos = postData.videos && postData.videos.length > 0;

    if (hasImages && !hasVideos) {
      return <ImagePreview images={postData.images} />;
    }

    if (hasVideos && !hasImages) {
      return (
        <VideoPreview
          videos={postData.videos!}
          thumbnailUrl={thumbnailUrl}
          thumbnailFile={thumbnailFile}
          onThumbnailCapture={handleThumbnailCapture}
          videoRef={videoRef}
          onVideoLoad={handleVideoLoad}
          onThumbnailUpload={handleThumbnailUpload}
          onThumbnailClear={handleThumbnailClear}
        />
      );
    }

    return (
      <Text color="error" fontSize="sm">
        No images or videos found in post
      </Text>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1BasicInfo
            formData={formData}
            errors={errors}
            onFormChange={handleFormChange}
          />
        );
      case 1:
        return (
          <Step2Description
            formData={formData}
            errors={errors}
            onFormChange={handleFormChange}
          />
        );
      case 2:
        return <Step3Media getMediaContent={getMediaContent} errors={errors} />;
      default:
        return null;
    }
  };

  // Get step navigation buttons
  const getStepButtons = () => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const canProceed = canProceedToStep(currentStep + 1);

    return (
      <VStack spacing={2} w="full" pt={4}>
        <HStack spacing={3} w="full">
          <Button
            variant="outline"
            onClick={isFirstStep ? handleClose : prevStep}
            flex={1}
          >
            {isFirstStep ? "Cancel" : "Back"}
          </Button>

          {isLastStep ? (
            <Button
              bg="primary"
              color="background"
              _hover={{ bg: "accent" }}
              onClick={handleSubmit}
              isLoading={isCreating}
              loadingText="Creating Coin..."
              isDisabled={!isConnected || chainId !== base.id}
              flex={1}
            >
              {!isConnected
                ? "Connect Wallet"
                : chainId !== base.id
                ? "Switch to Base Network"
                : "Create Coin"}
            </Button>
          ) : (
            <Button
              bg="primary"
              color="background"
              _hover={{ bg: "accent" }}
              onClick={nextStep}
              isDisabled={!canProceed}
              flex={1}
            >
              Next Step
            </Button>
          )}
        </HStack>

        {/* Help text for disabled next button */}
        {!isLastStep && !canProceed && (
          <Text fontSize="xs" color="gray.500" textAlign="center" w="full">
            {getNextButtonHelp()}
          </Text>
        )}
      </VStack>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent bg={"background"} border="1px" borderColor={"primary"}>
        <ModalHeader>
          <HStack justify="space-between" align="center">
            <Text>Create Coin from Post</Text>
            {isConnected && (
              <Badge
                colorScheme={chainId === base.id ? "green" : "red"}
                fontSize="xs"
              >
                {chainId === base.id ? "✓ Base Network" : "⚠️ Wrong Network"}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6}>
            {/* Progress Stepper */}
            <Box w="full">
              <Stepper index={currentStep} colorScheme="blue" size="sm">
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>
                    <Box flexShrink="0">
                      <StepTitle>{step}</StepTitle>
                    </Box>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Info Alert - only show on first step */}
            {currentStep === 0 && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Create a tradeable coin based on your Skatehive post. This
                  will deploy a new coin contract on the blockchain.
                </Text>
              </Alert>
            )}

            {/* Network Connection Alerts */}
            {!isConnected && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Please connect your wallet to create coins. Make sure
                  you&apos;re on the Base network.
                </Text>
              </Alert>
            )}

            {isConnected && chainId !== base.id && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm">
                    You&apos;re connected to the wrong network. Please switch to
                    Base network to create coins.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => validateNetwork()}
                    isLoading={isCreating}
                  >
                    Switch to Base Network
                  </Button>
                </VStack>
              </Alert>
            )}

            {/* Step Content */}
            <Box w="full">{renderStepContent()}</Box>

            {/* Step Navigation */}
            {getStepButtons()}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
