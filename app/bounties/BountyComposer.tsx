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
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { Discussion } from "@hiveio/dhive";
import ImageUploader from "@/components/homepage/ImageUploader";
import VideoUploader, { VideoUploaderRef } from "@/components/homepage/VideoUploader";
import { FaImage, FaVideo } from "react-icons/fa";
import { CloseIcon } from "@chakra-ui/icons";

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
    setIsLoading(true);
    const permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    let bountyBody = `Trick/Challenge: ${trick}\n`;
    bountyBody += `Bounty Rules: ${description}\n`;
    bountyBody += `Reward: ${reward}`;
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
        { app: "Skatehive App 3.0", tags }
      );
      if (commentResponse.success) {
        setTrick("");
        setReward("");
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

  // Handler for image upload
  const handleImageUpload = (files: File[]) => {
    files.forEach(async (file) => {
      // Simulate upload and get a URL (replace with real upload logic if needed)
      const url = URL.createObjectURL(file);
      if (descriptionRef.current) {
        descriptionRef.current.value += `\n![image](${url})`;
      }
    });
  };

  // Handler for video upload
  const handleVideoUpload = (url: string | null) => {
    if (url && descriptionRef.current) {
      descriptionRef.current.value += `\n<iframe src=\"${url}\" frameborder=\"0\" allowfullscreen></iframe>`;
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
    >
      <VStack spacing={3} align="stretch">
        <FormControl isRequired>
          <FormLabel>Trick/Challenge</FormLabel>
          <Input
            placeholder="e.g. Kickflip Back Lip"
            value={trick}
            onChange={e => setTrick(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            placeholder="Describe the bounty, rules, etc."
            bg="background"
            borderRadius={"base"}
            mb={3}
            ref={descriptionRef}
            _placeholder={{ color: "text" }}
            isDisabled={isLoading}
            onKeyDown={handleKeyDown}
            _focusVisible={{ border: "tb1" }}
          />
          <HStack mt={2} spacing={2}>
            <Button
              leftIcon={<FaImage size={20} />}
              variant="ghost"
              isDisabled={isLoading}
              onClick={() => {
                // Use a ref to trigger file input for image upload
                document.querySelector<HTMLInputElement>("input[type='file'][accept^='image']")?.click();
              }}
              border="2px solid transparent"
              _hover={{ borderColor: "primary", boxShadow: "0 0 0 2px var(--chakra-colors-primary)" }}
              _active={{ borderColor: "accent" }}
            >
              Upload Image
            </Button>
            <ImageUploader onUpload={handleImageUpload} onRemove={() => {}} images={[]} />
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
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Reward</FormLabel>
          <Input
            placeholder="e.g. 10 HBD, Skatehive NFT, etc."
            value={reward}
            onChange={e => setReward(e.target.value)}
            isDisabled={isLoading}
          />
        </FormControl>
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={handleBounty}
          isDisabled={isLoading || !trick.trim() || !reward.trim() || !(descriptionRef.current && descriptionRef.current.value.trim())}
        >
          {isLoading ? <Spinner size="sm" /> : buttonText}
        </Button>
      </VStack>
    </Box>
  );
} 