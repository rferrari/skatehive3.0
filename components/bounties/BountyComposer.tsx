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
  Select,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { Discussion } from "@hiveio/dhive";
import ImageCompressor, { ImageCompressorRef } from "@/lib/utils/ImageCompressor";
import VideoUploader, {
  VideoUploaderRef,
} from "@/components/homepage/VideoUploader";
import { FaImage, FaVideo, FaTimes } from "react-icons/fa";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";
import imageCompression from "browser-image-compression";
import { format, isAfter, parseISO } from "date-fns";
import { useTheme } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { CustomHiveIcon } from "@/components/wallet/CustomHiveIcon";

// Inline HBD SVG as a React component
const HbdIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle fill="#00960f" cx="200" cy="200" r="190" />
    <g transform="translate(90 105)">
      <path fill="#fff" d="M157.13,107.34a.36.36,0,0,0-.3-.17H127.54a.35.35,0,0,0-.3.17l-47,81.35a.36.36,0,0,0,.31.53h29.28a.37.37,0,0,0,.31-.18l47-81.35A.36.36,0,0,0,157.13,107.34Z" />
      <path fill="#fff" d="M128,83.39a.34.34,0,0,0,.3.18h29.29a.35.35,0,0,0,.3-.18.36.36,0,0,0,0-.35L110.14.34a.38.38,0,0,0-.31-.17H80.55a.38.38,0,0,0-.31.17.36.36,0,0,0,0,.35Z" />
      <path fill="#fff" d="M218.21,94.52,163.94.34a.37.37,0,0,0-.31-.17h-29.2a.35.35,0,0,0-.3.17.32.32,0,0,0,0,.35l54.17,94-54.17,94a.32.32,0,0,0,0,.35.34.34,0,0,0,.3.18h29.2a.35.35,0,0,0,.31-.18l54.27-94.17A.36.36,0,0,0,218.21,94.52Z" />
      <path fill="#fff" d="M110.62,94.69,55.34.17A.38.38,0,0,0,55,0h0a.36.36,0,0,0-.3.17L.05,94.7a.32.32,0,0,0,0,.35l55.28,94.52a.38.38,0,0,0,.31.17h0a.36.36,0,0,0,.3-.17L110.62,95A.32.32,0,0,0,110.62,94.69Z" />
    </g>
  </svg>
);

interface BountyComposerProps {
  onNewBounty?: (newBounty: Partial<Discussion>) => void;
  onClose?: () => void;
}

export default function BountyComposer({
  onNewBounty,
  onClose,
}: BountyComposerProps) {
  const { user, aioha } = useAioha();
  const theme = useTheme();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [trick, setTrick] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardCurrency, setRewardCurrency] = useState("HBD");
  const [isLoading, setIsLoading] = useState(false);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const [compressedImages, setCompressedImages] = useState<
    { url: string; fileName: string; caption: string }[]
  >([]);
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
    if (
      !rewardAmount.trim() ||
      isNaN(Number(rewardAmount)) ||
      Number(rewardAmount) <= 0
    ) {
      alert("Please enter a valid numerical reward amount.");
      return;
    }
    if (!rewardCurrency) {
      alert("Please select a reward currency.");
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
    const permlink = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    let bountyBody = `Trick/Challenge: ${trick}\n`;
    bountyBody += `Bounty Rules: ${description}\n`;
    bountyBody += `Reward: ${rewardAmount} ${rewardCurrency}`;
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
      const tags = ["bounty", user ? `bounty-creator-${user}` : ""];
      const commentResponse = await aioha.comment(
        "skatehive",
        "skatehive-bounties",
        permlink,
        "",
        bountyBody,
        {
          app: "Skatehive App 3.0",
          tags,
          images: compressedImages.map((img) => img.url),
        }
      );
      if (commentResponse.success) {
        setTrick("");
        setRewardAmount("");
        setRewardCurrency("HBD");
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
  const handleCompressedImageUpload = async (
    url: string | null,
    fileName?: string
  ) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const blob = await fetch(url).then((res) => res.blob());
      const file = new File([blob], fileName || "compressed.jpg", {
        type: blob.type,
      });
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(
        file,
        signature,
        compressedImages.length
      );
      if (uploadUrl) {
        setCompressedImages((prev) => [
          ...prev,
          { url: uploadUrl, fileName: file.name, caption: "" },
        ]);
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
          alert(
            "Error compressing image: " +
            (err instanceof Error ? err.message : err)
          );
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
      position="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      border={isDragOver ? "2px dashed" : undefined}
      borderColor={isDragOver ? "primary" : "muted"}
      // Fallback: use a subtle rgba for drag-over background since theme-tools is not installed
      bg={isDragOver ? "rgba(0,0,0,0.04)" : "background"}
      transition="border 0.2s, background 0.2s"
    >
      <VStack spacing={3} align="stretch">
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Challenge</FormLabel>
          <Input
            placeholder="e.g. Kickflip down 5 stair"
            value={trick}
            onChange={(e) => setTrick(e.target.value)}
            isDisabled={isLoading}
            bg="background"
            color="text"
          />
        </FormControl>
        <Box borderWidth="1px" borderColor="secondary" borderRadius="md" p={4}>
          <FormControl>
            <FormLabel fontWeight="bold">Rules</FormLabel>
            <Textarea
              ref={descriptionRef}
              placeholder="Describe the rules for this bounty..."
              isDisabled={isLoading}
              minH={24}
              bg="background"
              color="text"
              borderWidth="1px"
              borderColor="muted"
              borderRadius="md"
              _hover={{ borderColor: 'primary' }}
              _focus={{ borderColor: 'primary', boxShadow: 'outline' }}
            />
            <HStack mt={2} spacing={2}>
              <Box fontSize="sm" color="muted" minW="60px">
                Optional:
              </Box>
              <Button
                leftIcon={<FaImage size={20} />}
                variant="ghost"
                isDisabled={isLoading}
                onClick={() => imageCompressorRef.current?.trigger()}
                border="2px solid transparent"
                _hover={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                }}
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
                _hover={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
                }}
                _active={{ borderColor: "accent" }}
              >
                Upload Video
              </Button>
              <VideoUploader
                ref={videoUploaderRef}
                onUpload={handleVideoUpload}
                isProcessing={isLoading}
                username={user || undefined}
              />
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
                      borderWidth="2px"
                      borderColor="primary"
                    />
                    <IconButton
                      icon={<FaTimes />}
                      size="xs"
                      aria-label="Remove image"
                      position="absolute"
                      top={1}
                      right={1}
                      onClick={() =>
                        setCompressedImages((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      colorScheme="primary"
                    />
                  </Box>
                ))}
              </Wrap>
            )}
            {/* Video Preview */}
            {videoUrl && (
              <Box mt={2}>
                <Box as="video" src={videoUrl} controls maxW="100%" borderRadius="md" />
              </Box>
            )}
          </FormControl>
        </Box>
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Reward</FormLabel>
          <HStack>
            <Input
              placeholder="Amount"
              type="number"
              min={0}
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              isDisabled={isLoading}
              width="120px"
              bg="background"
              color="text"
            />
            <Menu isLazy>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                width="100px"
                bg="background"
                color="text"
                borderWidth="1px"
                borderColor="muted"
                borderRadius="md"
                _hover={{ borderColor: 'primary' }}
                _focus={{ borderColor: 'primary', boxShadow: 'outline' }}
                isDisabled={isLoading}
                px={2}
                py={1}
                fontWeight="normal"
              >
                {rewardCurrency === "HBD" ? (
                  <HbdIcon style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                ) : (
                  <CustomHiveIcon style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                )}
                {rewardCurrency}
              </MenuButton>
              <MenuList minW="120px" bg="background" color="text" borderColor="muted">
                <MenuItem
                  icon={<HbdIcon style={{ marginRight: 6 }} />}
                  onClick={() => setRewardCurrency("HBD")}
                  bg={rewardCurrency === "HBD" ? "muted" : "background"}
                  color="text"
                  _hover={{ bg: 'muted', color: 'primary' }}
                >
                  HBD
                </MenuItem>
                <MenuItem
                  icon={<CustomHiveIcon style={{ marginRight: 6 }} />}
                  onClick={() => setRewardCurrency("HIVE")}
                  bg={rewardCurrency === "HIVE" ? "muted" : "background"}
                  color="text"
                  _hover={{ bg: 'muted', color: 'primary' }}
                >
                  Hive
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontWeight="bold" textAlign="center" width="100%">Deadline</FormLabel>
          <Flex justifyContent="center">
            <Input
              type="date"
              value={deadline}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDeadline(e.target.value)}
              isDisabled={isLoading}
              bg="background"
              color="text"
              borderColor="muted"
              _focus={{ borderColor: 'secondary', boxShadow: 'outline' }}
              _hover={{ borderColor: 'secondary' }}
              // Note: Chakra UI does not provide a direct prop for the native calendar icon color.
              // To color the calendar icon, we use a CSS selector for ::-webkit-calendar-picker-indicator.
              sx={{
                '::-webkit-calendar-picker-indicator': {
                  filter: 'invert(38%) sepia(99%) saturate(747%) hue-rotate(80deg) brightness(90%)',
                  // This filter will approximate the secondary color; adjust as needed for your palette.
                },
              }}
              width="30%"
            />
          </Flex>
        </FormControl>
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={handleBounty}
          color="background"
          isDisabled={
            isLoading ||
            !trick.trim() ||
            !rewardAmount.trim() ||
            isNaN(Number(rewardAmount)) ||
            Number(rewardAmount) <= 0 ||
            !rewardCurrency ||
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