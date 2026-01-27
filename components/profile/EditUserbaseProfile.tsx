"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  VStack,
  Avatar,
  Box,
  Text,
  useToast,
  FormErrorMessage,
  HStack,
} from "@chakra-ui/react";
import { useUserbaseAuth } from "@/contexts/UserbaseAuthContext";
import { uploadToIpfs } from "@/lib/markdown/composeUtils";

interface EditUserbaseProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: {
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    bio?: string | null;
    location?: string | null;
  };
  onProfileUpdate?: () => void;
}

export default function EditUserbaseProfile({
  isOpen,
  onClose,
  profileData,
  onProfileUpdate,
}: EditUserbaseProfileProps) {
  const { refresh } = useUserbaseAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    display_name: "",
    handle: "",
    avatar_url: "",
    cover_url: "",
    bio: "",
    location: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        display_name: profileData.display_name || "",
        handle: profileData.handle || "",
        avatar_url: profileData.avatar_url || "",
        cover_url: profileData.cover_url || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
      });
      setHandleError(null);
    }
  }, [isOpen, profileData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "handle") {
      setHandleError(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadToIpfs(file, file.name);
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      toast({
        title: "Avatar uploaded",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to upload avatar",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const url = await uploadToIpfs(file, file.name);
      setFormData((prev) => ({ ...prev, cover_url: url }));
      toast({
        title: "Cover image uploaded",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to upload cover image",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setHandleError(null);

    try {
      const response = await fetch("/api/userbase/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: formData.display_name || null,
          handle: formData.handle || null,
          avatar_url: formData.avatar_url || null,
          cover_url: formData.cover_url || null,
          bio: formData.bio || null,
          location: formData.location || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setHandleError("This handle is already taken");
          return;
        }
        throw new Error(data.error || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        status: "success",
        duration: 2000,
      });

      // Refresh auth context to get updated user data
      await refresh();
      onProfileUpdate?.();
      onClose();
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="background" borderColor="border" borderWidth="1px">
        <ModalHeader color="text">Edit Profile</ModalHeader>
        <ModalCloseButton color="text" />

        <ModalBody>
          <VStack spacing={4}>
            {/* Avatar */}
            <FormControl>
              <FormLabel color="text" fontSize="sm">
                Profile Picture
              </FormLabel>
              <HStack spacing={4}>
                <Avatar
                  size="xl"
                  src={formData.avatar_url}
                  name={formData.display_name || formData.handle || "User"}
                />
                <Box>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    display="none"
                    id="avatar-upload"
                  />
                  <Button
                    as="label"
                    htmlFor="avatar-upload"
                    size="sm"
                    variant="outline"
                    colorScheme="primary"
                    isLoading={isUploadingAvatar}
                    cursor="pointer"
                  >
                    Upload Photo
                  </Button>
                </Box>
              </HStack>
            </FormControl>

            {/* Display Name */}
            <FormControl>
              <FormLabel color="text" fontSize="sm">
                Display Name
              </FormLabel>
              <Input
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Your display name"
                bg="inputBg"
                color="inputText"
                borderColor="inputBorder"
                _placeholder={{ color: "inputPlaceholder" }}
              />
            </FormControl>

            {/* Handle */}
            <FormControl isInvalid={!!handleError}>
              <FormLabel color="text" fontSize="sm">
                Handle
              </FormLabel>
              <Input
                name="handle"
                value={formData.handle}
                onChange={handleInputChange}
                placeholder="your-handle"
                bg="inputBg"
                color="inputText"
                borderColor="inputBorder"
                _placeholder={{ color: "inputPlaceholder" }}
              />
              {handleError && (
                <FormErrorMessage>{handleError}</FormErrorMessage>
              )}
              <Text fontSize="xs" color="dim" mt={1}>
                This will be your unique @handle
              </Text>
            </FormControl>

            {/* Bio */}
            <FormControl>
              <FormLabel color="text" fontSize="sm">
                Bio
              </FormLabel>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={3}
                bg="inputBg"
                color="inputText"
                borderColor="inputBorder"
                _placeholder={{ color: "inputPlaceholder" }}
              />
            </FormControl>

            {/* Location */}
            <FormControl>
              <FormLabel color="text" fontSize="sm">
                Location
              </FormLabel>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Your location"
                bg="inputBg"
                color="inputText"
                borderColor="inputBorder"
                _placeholder={{ color: "inputPlaceholder" }}
              />
            </FormControl>

            {/* Cover Image URL */}
            <FormControl>
              <FormLabel color="text" fontSize="sm">
                Cover Image
              </FormLabel>
              {formData.cover_url && (
                <Box mb={2} borderRadius="md" overflow="hidden">
                  <img
                    src={formData.cover_url}
                    alt="Cover preview"
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                display="none"
                id="cover-upload"
              />
              <Button
                as="label"
                htmlFor="cover-upload"
                size="sm"
                variant="outline"
                colorScheme="primary"
                isLoading={isUploadingCover}
                cursor="pointer"
              >
                Upload Cover Image
              </Button>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} color="text">
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={isUploadingAvatar || isUploadingCover}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
