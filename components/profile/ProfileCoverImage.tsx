"use client";
import React, { memo } from "react";
import { Box, Image } from "@chakra-ui/react";

interface ProfileCoverImageProps {
  coverImage: string;
  username: string;
}

const ProfileCoverImage = memo(function ProfileCoverImage({
  coverImage,
  username,
}: ProfileCoverImageProps) {
  return (
    <Box
      position="relative"
      w="100%" // Simplified to 100% for consistency
      maxW="container.lg" // Standardized to container.lg
      mx="auto" // Center across all breakpoints
      overflow="hidden"
      height={{ base: "120px", md: "200px" }}
      p={0}
      m={0}
      mt={{ base: 0, md: 4 }}
    >
      <Image
        src={coverImage}
        alt={`${username} cover`}
        w="100%" // Matches parent width
        h={{ base: "120px", md: "200px" }}
        objectFit="cover"
        fallback={<Box height="100%" />}
      />
    </Box>
  );
});

export default ProfileCoverImage;
