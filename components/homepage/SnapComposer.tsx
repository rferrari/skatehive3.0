import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  HStack,
  Button,
  Image,
  IconButton,
  Wrap,
  Spinner,
  Progress,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import GiphySelector from "./GiphySelector";
import VideoUploader, { VideoUploaderRef } from "./VideoUploader";
import { IGif } from "@giphy/js-types";
import { FaImage } from "react-icons/fa";
import { MdGif } from "react-icons/md";
import { Discussion } from "@hiveio/dhive";
import {
  getFileSignature,
  getLastSnapsContainer,
  uploadImage,
} from "@/lib/hive/client-functions";
import { FaVideo } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import ImageCompressor, { ImageCompressorRef } from "../../src/components/ImageCompressor";

interface SnapComposerProps {
  pa: string;
  pp: string;
  onNewComment: (newComment: Partial<Discussion>) => void;
  post?: boolean;
  onClose: () => void;
}

export default function SnapComposer({
  pa,
  pp,
  onNewComment,
  post = false,
  onClose,
}: SnapComposerProps) {
  const { user, aioha } = useAioha();
  const postBodyRef = useRef<HTMLTextAreaElement>(null);
  const [selectedGif, setSelectedGif] = useState<IGif | null>(null);
  const [isGiphyModalOpen, setGiphyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const [compressedImages, setCompressedImages] = useState<{ url: string; fileName: string; caption: string }[]>([]);
  const gifWebpInputRef = useRef<HTMLInputElement>(null);

  const buttonText = post ? "Reply" : "Post";

  // Function to extract hashtags from text
  function extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map((hashtag) => hashtag.slice(1)); // Remove the '#' symbol
  }

  // Handler for compressed image upload
  const handleCompressedImageUpload = async (url: string | null, fileName?: string) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const blob = await fetch(url).then(res => res.blob());
      const file = new File([blob], fileName || "compressed.jpg", { type: blob.type });
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(file, signature, compressedImages.length, setUploadProgress);
      if (uploadUrl) {
        setCompressedImages(prev => [...prev, { url: uploadUrl, fileName: file.name, caption: "" }]);
      }
    } catch (error) {
      console.error("Error uploading compressed image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGifWebpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Check file type
    if (!(file.type === "image/gif" || file.type === "image/webp")) {
      alert("Only GIF and WEBP files are allowed.");
      return;
    }
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("GIF or WEBP file size must be 5MB or less.");
      return;
    }
    setIsLoading(true);
    try {
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(file, signature, compressedImages.length, setUploadProgress);
      if (uploadUrl) {
        setCompressedImages(prev => [...prev, { url: uploadUrl, fileName: file.name, caption: "" }]);
      }
    } catch (error) {
      console.error("Error uploading GIF/WEBP:", error);
    } finally {
      setIsLoading(false);
      e.target.value = ""; // Reset input
    }
  };

  async function handleComment() {
    let commentBody = postBodyRef.current?.value || "";

    if (
      !commentBody.trim() &&
      compressedImages.length === 0 &&
      !selectedGif &&
      !videoUrl
    ) {
      alert(
        "Please enter some text, upload an image, select a gif, or upload a video before posting."
      );
      return; // Do not proceed
    }

    setIsLoading(true);
    setUploadProgress([]);

    const permlink = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    let validUrls: string[] = compressedImages.map(img => img.url);
    if (validUrls.length > 0) {
      const imageMarkup = compressedImages
        .map((img) => `![${img.caption || "image"}](${img.url})`)
        .join("\n");
      commentBody += `\n\n${imageMarkup}`;
    }

    if (selectedGif) {
      commentBody += `\n\n![gif](${selectedGif.images.downsized_medium.url})`;
    }

    if (videoUrl) {
      commentBody += `\n\n<iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe>`;
    }

    if (commentBody) {
      let snapsTags: string[] = [];
      try {
        // Add existing `snaps` tag logic
        if (pp === "snaps") {
          pp = (await getLastSnapsContainer()).permlink;
          snapsTags = [
            process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "",
            "snaps",
          ];
        }

        // Extract hashtags from the comment body and add to `snapsTags`
        const hashtags = extractHashtags(commentBody);
        snapsTags = [...new Set([...snapsTags, ...hashtags])]; // Add hashtags without duplicates

        const commentResponse = await aioha.comment(
          pa,
          pp,
          permlink,
          "",
          commentBody,
          { app: "Skatehive App 3.0", tags: snapsTags, images: validUrls }
        );
        if (commentResponse.success) {
          postBodyRef.current!.value = "";
          setCompressedImages([]);
          setSelectedGif(null);
          setVideoUrl(null);

          // Set created to "just now" for optimistic update
          const newComment: Partial<Discussion> = {
            author: user,
            permlink: permlink,
            body: commentBody,
            created: "just now", // use "just now" as the created value for new replies
            pending_payout_value: "0.000 HBD",
          };

          onNewComment(newComment);
          onClose();
        }
      } finally {
        setIsLoading(false);
        setUploadProgress([]);
      }
    }
  }

  // Detect Ctrl+Enter and submit
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey && event.key === "Enter") {
      handleComment();
    }
  }

  return (
    <Box
      p={4}
      mb={1}
      borderRadius="base"
      borderBottom={"1px"}
      borderColor="muted"
    >
      <Textarea
        placeholder="Write here"
        bg="background"
        borderRadius={"base"}
        mb={3}
        ref={postBodyRef}
        _placeholder={{ color: "text" }}
        isDisabled={isLoading}
        onKeyDown={handleKeyDown} // Attach the keydown handler
        _focusVisible={{ border: "tb1" }}
      />
      <HStack justify="space-between" mb={3}>
        <HStack>
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              isDisabled={isLoading}
              border="2px solid transparent"
              _hover={{ borderColor: "var(--chakra-colors-tb1, #00FF00)" }}
              _active={{ borderColor: "var(--chakra-colors-tb1, #00FF00)" }}
            >
              <FaImage size={22} />
            </MenuButton>
            <MenuList bg="background" border="tb1" borderRadius="base">
              <MenuItem
                icon={<FaImage size={22} />}
                bg={"background"}
                _hover={{ bg: "tb1" }}
                _active={{ bg: "tb1" }}
                onClick={() => imageCompressorRef.current?.trigger()}
              >
                Upload Image (JPEG, PNG, HEIC)
              </MenuItem>
              <MenuItem
                icon={<MdGif size={22} />}
                bg={"background"}
                _hover={{ bg: "tb1" }}
                _active={{ bg: "tb1" }}
                onClick={() => gifWebpInputRef.current?.click()}
              >
                Upload GIF or WEBP
                <input
                  type="file"
                  accept=".gif,.webp"
                  style={{ display: "none" }}
                  ref={gifWebpInputRef}
                  onChange={handleGifWebpUpload}
                />
              </MenuItem>
              <MenuItem
                icon={<MdGif size={22} />}
                onClick={() => setGiphyModalOpen(true)}
                bg={"background"}
                _hover={{ bg: "tb1" }}
                _active={{ bg: "tb1" }}
              >
                Use GIFY
              </MenuItem>
            </MenuList>
          </Menu>
          <ImageCompressor
            ref={imageCompressorRef}
            onUpload={handleCompressedImageUpload}
            isProcessing={isLoading}
            hideStatus={true}
          />
          <Button
            variant="ghost"
            isDisabled={isLoading}
            border="2px solid transparent"
            _hover={{ borderColor: "var(--chakra-colors-tb1, #00FF00)" }}
            _active={{ borderColor: "var(--chakra-colors-tb1, #00FF00)" }}
            onClick={() => videoUploaderRef.current?.trigger()}
          >
            <FaVideo size={22} />
          </Button>
        </HStack>
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={handleComment}
          isDisabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : buttonText}
        </Button>
      </HStack>
      <Box width="100%">
        <VideoUploader ref={videoUploaderRef} onUpload={setVideoUrl} isProcessing={isLoading} />
      </Box>
      <Wrap spacing={4}>
        {compressedImages.map((img, index) => (
          <Box key={index} position="relative">
            <Image
              alt={img.fileName}
              src={img.url}
              boxSize="100px"
              borderRadius="base"
            />
            <Input
              mt={2}
              placeholder="Enter caption"
              value={img.caption}
              onChange={e => {
                const newImages = [...compressedImages];
                newImages[index].caption = e.target.value;
                setCompressedImages(newImages);
              }}
              size="sm"
              isDisabled={isLoading}
            />
            <IconButton
              aria-label="Remove image"
              icon={<FaTimes />}
              size="xs"
              position="absolute"
              top="0"
              right="0"
              onClick={() =>
                setCompressedImages((prevImages) =>
                  prevImages.filter((_, i) => i !== index)
                )
              }
              isDisabled={isLoading}
            />
            <Progress
              value={uploadProgress[index]}
              size="xs"
              colorScheme="green"
              mt={2}
            />
          </Box>
        ))}
        {selectedGif && (
          <Box key={selectedGif.id} position="relative">
            <Image
              alt=""
              src={selectedGif.images.downsized_medium.url}
              boxSize="100px"
              borderRadius="base"
            />
            <IconButton
              aria-label="Remove GIF"
              icon={<FaTimes />}
              size="xs"
              position="absolute"
              top="0"
              right="0"
              onClick={() => setSelectedGif(null)}
              isDisabled={isLoading}
            />
          </Box>
        )}
        {videoUrl && (
          <Box position="relative" width="100%">
            <iframe
              src={videoUrl}
              title="Uploaded Video"
              frameBorder="0"
              style={{
                width: "100%",
                minHeight: "435px",
                borderRadius: "8px",
                maxWidth: "100vw",
              }}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <IconButton
              aria-label="Remove video"
              icon={<FaTimes />}
              size="xs"
              position="absolute"
              top="0"
              right="0"
              onClick={() => setVideoUrl(null)}
              isDisabled={isLoading}
            />
          </Box>
        )}
      </Wrap>
      {isGiphyModalOpen && (
        <Box position="relative">
          <GiphySelector
            apiKey={
              process.env.GIPHY_API_KEY || "qXGQXTPKyNJByTFZpW7Kb0tEFeB90faV"
            }
            onSelect={(gif, e) => {
              e.preventDefault();
              setSelectedGif(gif);
              setGiphyModalOpen(false); // Close modal after selecting a GIF
            }}
          />
        </Box>
      )}
    </Box>
  );
}
