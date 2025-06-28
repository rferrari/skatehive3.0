import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  Button,
  Spinner,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  IconButton,
  Wrap,
  Image,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { Discussion } from "@hiveio/dhive";
import ImageCompressor, { ImageCompressorRef } from "../../src/components/ImageCompressor";
import VideoUploader, { VideoUploaderRef } from "@/components/homepage/VideoUploader";
import { FaImage, FaVideo, FaTimes } from "react-icons/fa";
import { CloseIcon } from "@chakra-ui/icons";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";
import imageCompression from "browser-image-compression";
import { format, isAfter, parseISO } from "date-fns";

interface BountyComposerProps {
  onNewBounty?: (newBounty: Partial<Discussion>) => void;
  onClose?: () => void;
}

export default function BountyComposer({ onNewBounty, onClose }: BountyComposerProps) {
  const { user, aioha } = useAioha();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [trick, setTrick] = useState("");
  const [reward, setReward] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const [compressedImages, setCompressedImages] = useState<{ url: string; fileName: string; caption: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deadline, setDeadline] = useState("");

  const buttonText = "Post Bounty";

  async function handleBounty() {
    let description = descriptionRef.current?.value || "";
    if (!trick.trim()) {
      alert("Please enter a trick/challenge name.");
      return;
    }
    if (!reward.trim()) {
      alert("Please enter a reward for the bounty.");
      return;
    }
    if (!description.trim()) {
      alert("Please enter a description for the bounty.");
      return;
    }
    if (!deadline) {
      alert("Please select a deadline for the bounty.");
      return;
    }
    const today = new Date();
    const selectedDate = parseISO(deadline);
    if (!isAfter(selectedDate, today)) {
      alert("Deadline must be in the future.");
      return;
    }
    setIsLoading(true);
    const permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    let bountyBody = `Trick/Challenge: ${trick}\n`;
    bountyBody += `Bounty Rules: ${description}\n`;
    bountyBody += `Reward: ${reward}`;
    const formattedDeadline = format(selectedDate, "MM-dd-yyyy");
    bountyBody += `\nDeadline: ${formattedDeadline}`;
    // Add image markdown
    if (compressedImages.length > 0) {
      const imageMarkup = compressedImages
        .map((img) => `![${img.caption || "image"}](${img.url})`)
        .join("\n");
      bountyBody += `\n\n${imageMarkup}`;
    }
    // Add video if present
    if (videoUrl) {
      bountyBody += `\n\n<iframe src=\"${videoUrl}\" frameborder=\"0\" allowfullscreen></iframe>`;
    }
    try {
      const tags = [
        "bounty",
        user ? `bounty-creator-${user}` : "",
      ];
      const commentResponse = await aioha.comment(
        "skatehive",
        "skatehive-bounties",
        permlink,
        "",
        bountyBody,
        { app: "Skatehive App 3.0", tags, images: compressedImages.map(img => img.url) }
      );
      if (commentResponse.success) {
        setTrick("");
        setReward("");
        setDeadline("");
        setCompressedImages([]);
        setVideoUrl(null);
        if (descriptionRef.current) descriptionRef.current.value = "";
        const newBounty: Partial<Discussion> = {
          author: user,
          permlink: permlink,
          body: bountyBody,
          created: "just now",
          pending_payout_value: "0.000 HBD",
        };
        if (onNewBounty) onNewBounty(newBounty);
        if (onClose) onClose();
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey && event.key === "Enter") {
      handleBounty();
    }
  }

  // Handler for compressed image upload
  const handleCompressedImageUpload = async (url: string | null, fileName?: string) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const blob = await fetch(url).then(res => res.blob());
      const file = new File([blob], fileName || "compressed.jpg", { type: blob.type });
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(file, signature, compressedImages.length);
      if (uploadUrl) {
        setCompressedImages(prev => [...prev, { url: uploadUrl, fileName: file.name, caption: "" }]);
      }
    } catch (error) {
      console.error("Error uploading compressed image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        try {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          const url = URL.createObjectURL(compressedFile);
          await handleCompressedImageUpload(url, compressedFile.name);
          URL.revokeObjectURL(url);
        } catch (err) {
          alert("Error compressing image: " + (err instanceof Error ? err.message : err));
        }
      } else if (file.type.startsWith("video/")) {
        if (videoUploaderRef.current && videoUploaderRef.current.handleFile) {
          setIsLoading(true);
          try {
            await videoUploaderRef.current.handleFile(file);
          } catch (error) {
            console.error("Error uploading video:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          alert("Video upload not supported.");
        }
      } else {
        alert("Unsupported file type: " + file.type);
      }
    }
  };

  // Handler for video upload
  const handleVideoUpload = (url: string | null) => {
    if (url) {
      setVideoUrl(url);
    }
  };

  return (
    <Box
      p={4}
      mb={1}
      borderRadius="base"
      borderBottom={"1px"}
      borderColor="muted"
      position="relative"
      bg="background"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragOver ? "2px dashed var(--chakra-colors-primary)" : undefined,
        background: isDragOver ? "rgba(0,0,0,0.04)" : undefined,
        transition: "border 0.2s, background 0.2s",
      }}
    >
      <VStack spacing={3} align="stretch">
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Challenge</FormLabel>
          <Input
            placeholder="e.g. Kickflip down 5 stair"
            value={trick}
            onChange={e => setTrick(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Rules</FormLabel>
          <Textarea
            ref={descriptionRef}
            placeholder="Describe the rules for this bounty..."
            isDisabled={isLoading}
            minH={24}
          />
          <HStack mt={2} spacing={2}>
            <Box fontSize="sm" color="muted" minW="60px">Optional:</Box>
            <Button
              leftIcon={<FaImage size={20} />}
              variant="ghost"
              isDisabled={isLoading}
              onClick={() => imageCompressorRef.current?.trigger()}
              border="2px solid transparent"
              _hover={{ borderColor: "primary", boxShadow: "0 0 0 2px var(--chakra-colors-primary)" }}
              _active={{ borderColor: "accent" }}
            >
              Upload Image
            </Button>
            <ImageCompressor
              ref={imageCompressorRef}
              onUpload={handleCompressedImageUpload}
              isProcessing={isLoading}
            />
            <Button
              leftIcon={<FaVideo size={20} />}
              variant="ghost"
              isDisabled={isLoading}
              onClick={() => videoUploaderRef.current?.trigger()}
              border="2px solid transparent"
              _hover={{ borderColor: "primary", boxShadow: "0 0 0 2px var(--chakra-colors-primary)" }}
              _active={{ borderColor: "accent" }}
            >
              Upload Video
            </Button>
            <VideoUploader ref={videoUploaderRef} onUpload={handleVideoUpload} isProcessing={isLoading} />
          </HStack>
          {/* Image Previews */}
          {compressedImages.length > 0 && (
            <Wrap mt={2} spacing={2}>
              {compressedImages.map((img, idx) => (
                <Box key={img.url} position="relative">
                  <Image
                    src={img.url}
                    alt={img.fileName}
                    boxSize="80px"
                    objectFit="cover"
                    borderRadius="md"
                    border="2px solid var(--chakra-colors-primary)"
                  />
                  <IconButton
                    icon={<FaTimes />}
                    size="xs"
                    aria-label="Remove image"
                    position="absolute"
                    top={1}
                    right={1}
                    onClick={() => setCompressedImages(prev => prev.filter((_, i) => i !== idx))}
                  />
                </Box>
              ))}
            </Wrap>
          )}
          {/* Video Preview */}
          {videoUrl && (
            <Box mt={2}>
              <video src={videoUrl} controls style={{ maxWidth: "100%", borderRadius: 8 }} />
            </Box>
          )}
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Reward</FormLabel>
          <Input
            placeholder="e.g. 10 HBD, Skatehive NFT, etc."
            value={reward}
            onChange={e => setReward(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Deadline</FormLabel>
          <Input
            type="date"
            value={deadline}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={e => setDeadline(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={handleBounty}
          isDisabled={
            isLoading ||
            !trick.trim() ||
            !reward.trim() ||
            !(descriptionRef.current && descriptionRef.current.value.trim()) ||
            !deadline ||
            !isAfter(parseISO(deadline), new Date())
          }
        >
          {isLoading ? <Spinner size="sm" /> : buttonText}
        </Button>
      </VStack>
    </Box>
  );
} 