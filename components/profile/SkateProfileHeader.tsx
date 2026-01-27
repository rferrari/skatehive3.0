"use client";
import React, { memo, useState, useEffect } from "react";
import {
  Text,
  Flex,
  Avatar,
  IconButton,
  VStack,
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import { FaEdit } from "react-icons/fa";
import { ProfileData } from "./ProfilePage";

interface SkateProfileHeaderProps {
  profileData: ProfileData;
  username: string;
  isOwner: boolean;
  onEditModalOpen: () => void;
}

const SkateProfileHeader = function SkateProfileHeader({
  profileData,
  username,
  isOwner,
  onEditModalOpen,
}: SkateProfileHeaderProps) {
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Preload avatar image to prevent flickering
  useEffect(() => {
    if (profileData.profileImage && !avatarLoaded) {
      const img = new Image();
      img.onload = () => setAvatarLoaded(true);
      img.onerror = () => setAvatarLoaded(true);
      img.src = profileData.profileImage;
    }
  }, [profileData.profileImage, avatarLoaded]);

  return (
    <Flex
      direction="row"
      align="center"
      justify="space-between"
      w="100%"
      gap={6}
      minH="100px"
    >
      {/* Left Section: Avatar + Basic Info */}
      <Flex direction="row" align="flex-start" gap={4} flex="1">
        <Avatar
          src={profileData.profileImage}
          name={username}
          borderRadius="lg"
          boxSize="100px"
          border="2px solid"
          borderColor="primary"
        />

        <VStack align="flex-start" spacing={1} flex="1">
          <HStack>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="text"
              isTruncated
              maxW="250px"
            >
              {profileData.name || username}
            </Text>
            {isOwner && (
              <IconButton
                aria-label="Edit Profile"
                icon={<FaEdit />}
                size="sm"
                variant="ghost"
                colorScheme="primary"
                onClick={onEditModalOpen}
              />
            )}
          </HStack>

          <Text fontSize="sm" color="gray.400" fontWeight="medium">
            @{username}
          </Text>

          {/* Bio/About */}
          {profileData.about && (
            <Tooltip
              label={profileData.about}
              placement="top"
              bg="gray.800"
              color="white"
              fontSize="sm"
              borderRadius="md"
              px={3}
              py={2}
              maxW="300px"
            >
              <Text
                fontSize="sm"
                color="gray.500"
                noOfLines={2}
                cursor="help"
                mt={1}
              >
                {profileData.about}
              </Text>
            </Tooltip>
          )}

          {/* Location if available */}
          {profileData.location && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              📍 {profileData.location}
            </Text>
          )}
        </VStack>
      </Flex>
    </Flex>
  );
};

export default memo(SkateProfileHeader, (prevProps, nextProps) => {
  return (
    prevProps.username === nextProps.username &&
    prevProps.profileData === nextProps.profileData &&
    prevProps.isOwner === nextProps.isOwner
  );
});
