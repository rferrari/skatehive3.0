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
  Input,
  FormControl,
  FormLabel,
  VStack,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { CloseIcon } from "@chakra-ui/icons";
import { FaImage } from "react-icons/fa";
import { Discussion } from "@hiveio/dhive";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";

interface SpotSnapComposerProps {
  onNewComment: (newComment: Partial<Discussion>) => void;
  onClose: () => void;
}

export default function SpotSnapComposer({ onNewComment, onClose }: SpotSnapComposerProps) {
  const { user, aioha } = useAioha();
  const postBodyRef = useRef<HTMLTextAreaElement>(null);
  const [images, setImages] = useState<{ file: File, caption: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [spotName, setSpotName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const buttonText = "Post Spot";

  async function handleComment() {
    let description = postBodyRef.current?.value || "";
    if (!spotName.trim() || !lat.trim() || !lon.trim()) {
      alert("Please enter a spot name and location (lat/lon)." );
      return;
    }
    if (!description.trim() && images.length === 0) {
      alert("Please enter a description or upload an image before posting.");
      return;
    }
    setIsLoading(true);
    setUploadProgress([]);
    const permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    let validUrls: string[] = [];
    if (images.length > 0) {
      const uploadedImages = await Promise.all(
        images.map(async (image, index) => {
          const signature = await getFileSignature(image.file);
          try {
            const uploadUrl = await uploadImage(
              image.file,
              signature,
              index,
              setUploadProgress
            );
            return uploadUrl;
          } catch (error) {
            console.error("Error uploading image:", error);
            return null;
          }
        })
      );
      validUrls = uploadedImages.filter((url): url is string => url !== null);
    }
    // Compose the post body
    let commentBody = `Spot Name: ${spotName}\nLocation: ${lat}, ${lon}\n`;
    if (description) commentBody += `\n${description}`;
    if (validUrls.length > 0) {
      const imageMarkup = validUrls
        .map((url: string | null, idx: number) => `![${images[idx]?.caption || spotName}](${url?.toString() || ""})`)
        .join("\n");
      commentBody += `\n\n${imageMarkup}`;
    }
    try {
      const commentResponse = await aioha.comment(
        "web-gnar",
        "about-the-skatehive-spotbook",
        permlink,
        "",
        commentBody,
        { app: "Skatehive App 3.0", tags: ["skatespot"] }
      );
      if (commentResponse.success) {
        postBodyRef.current!.value = "";
        setImages([]);
        setSpotName("");
        setLat("");
        setLon("");
        // Set created to "just now" for optimistic update
        const newComment: Partial<Discussion> = {
          author: user,
          permlink: permlink,
          body: commentBody,
          created: "just now",
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

  // Detect Ctrl+Enter and submit
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey && event.key === "Enter") {
      handleComment();
    }
  }

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <Box p={4} mb={1} borderRadius="base" borderBottom={"1px"} borderColor="muted">
      <VStack spacing={3} align="stretch">
        <FormControl isRequired>
          <FormLabel>Spot Name</FormLabel>
          <Input
            id="spot-name-field"
            placeholder="Enter spot name"
            value={spotName}
            onChange={e => setSpotName(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Latitude</FormLabel>
          <Input
            placeholder="Latitude"
            value={lat}
            onChange={e => setLat(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Longitude</FormLabel>
          <Input
            placeholder="Longitude"
            value={lon}
            onChange={e => setLon(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            placeholder="Describe the spot"
            bg="background"
            borderRadius={"base"}
            mb={3}
            ref={postBodyRef}
            _placeholder={{ color: "text" }}
            isDisabled={isLoading}
            onKeyDown={handleKeyDown}
            _focusVisible={{ border: "tb1" }}
          />
        </FormControl>
        <HStack>
          <Button
            leftIcon={<FaImage size={22} />}
            variant="ghost"
            isDisabled={isLoading}
            onClick={triggerFileInput}
            border="2px solid transparent"
            _hover={{ borderColor: "var(--chakra-colors-tb1, #00FF00)" }}
            _active={{ borderColor: "var(--chakra-colors-tb1, #00FF00)" }}
          >
            Upload Image
          </Button>
          <Input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={event => {
              const files = Array.from(event.target.files || []);
              setImages(prev => [
                ...prev,
                ...files.map(file => ({ file, caption: "" }))
              ]);
            }}
            hidden
          />
        </HStack>
        <Wrap spacing={4}>
          {images.map((imgObj, index) => (
            <Box key={index} position="relative" mb={4}>
              <Image
                alt=""
                src={URL.createObjectURL(imgObj.file)}
                boxSize="100px"
                borderRadius="base"
              />
              <Input
                mt={2}
                placeholder="Enter caption"
                value={imgObj.caption}
                onChange={e => {
                  const newImages = [...images];
                  newImages[index].caption = e.target.value;
                  setImages(newImages);
                }}
                size="sm"
              />
              <IconButton
                aria-label="Remove image"
                icon={<CloseIcon />}
                size="xs"
                position="absolute"
                top="0"
                right="0"
                onClick={() =>
                  setImages(prevImages =>
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
        </Wrap>
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={handleComment}
          isDisabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : buttonText}
        </Button>
      </VStack>
    </Box>
  );
} 