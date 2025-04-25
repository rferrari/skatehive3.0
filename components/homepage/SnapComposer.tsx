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
import VideoUploader from "./VideoUploader";
import { IGif } from "@giphy/js-types";
import { CloseIcon } from "@chakra-ui/icons";
import { FaImage } from "react-icons/fa";
import { MdGif } from "react-icons/md";
import { Discussion } from "@hiveio/dhive";
import {
  getFileSignature,
  getLastSnapsContainer,
  uploadImage,
} from "@/lib/hive/client-functions";
import { FaVideo } from "react-icons/fa6";

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
  const [images, setImages] = useState<File[]>([]);
  const [selectedGif, setSelectedGif] = useState<IGif | null>(null);
  const [isGiphyModalOpen, setGiphyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buttonText = post ? "Reply" : "Post";

  // Function to extract hashtags from text
  function extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map((hashtag) => hashtag.slice(1)); // Remove the '#' symbol
  }

  async function handleComment() {
    let commentBody = postBodyRef.current?.value || "";

    if (
      !commentBody.trim() &&
      images.length === 0 &&
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

    let validUrls: string[] = [];
    if (images.length > 0) {
      const uploadedImages = await Promise.all(
        images.map(async (image, index) => {
          const signature = await getFileSignature(image);
          try {
            const uploadUrl = await uploadImage(
              image,
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

      if (validUrls.length > 0) {
        const imageMarkup = validUrls
          .map((url: string | null) => `![image](${url?.toString() || ""})`)
          .join("\n");
        commentBody += `\n\n${imageMarkup}`;
      }
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
          setImages([]);
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

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

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
              _hover={{ border: "tb1" }}
              _active={{ border: "tb1" }}
            >
              <FaImage size={22} />
            </MenuButton>
            <MenuList bg="background" border="tb1" borderRadius="base">
              <MenuItem
                icon={<FaImage size={22} />}
                bg={"background"}
                _hover={{ bg: "tb1" }}
                _active={{ bg: "tb1" }}
                onClick={triggerFileInput} // Trigger file input on click
              >
                Upload Image
              </MenuItem>
              <MenuItem
                icon={<MdGif size={22} />}
                onClick={() => setGiphyModalOpen(true)} // Only open the modal
                bg={"background"}
                _hover={{ bg: "tb1" }}
                _active={{ bg: "tb1" }}
              >
                Select GIF
              </MenuItem>
            </MenuList>
          </Menu>
          <Input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              setImages((prev) => [...prev, ...files]);
            }}
            hidden
          />
          <Button
            _hover={{ border: "tb1" }}
            _active={{ border: "tb1" }}
            as="label"
            variant="ghost"
            isDisabled={isLoading}
          >
            <FaVideo size={22} />
            <VideoUploader onUpload={setVideoUrl} />
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
      <Wrap spacing={4}>
        {images.map((image, index) => (
          <Box key={index} position="relative">
            <Image
              alt=""
              src={URL.createObjectURL(image)}
              boxSize="100px"
              borderRadius="base"
            />
            <IconButton
              aria-label="Remove image"
              icon={<CloseIcon />}
              size="xs"
              position="absolute"
              top="0"
              right="0"
              onClick={() =>
                setImages((prevImages) =>
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
              icon={<CloseIcon />}
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
              icon={<CloseIcon />}
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
