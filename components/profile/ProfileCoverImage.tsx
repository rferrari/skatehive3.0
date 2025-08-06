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
      w={{ base: "100vw", md: "100%" }}
      maxW={{ base: "100vw", md: "container.lg" }}
      mx={{ base: "unset", md: "auto" }}
      overflow="hidden"
      height={{ base: "120px", md: "200px" }}
      p={0}
      m={0}
      mt={{ base: 0, md: 4 }}
    >
      <Image
        src={coverImage}
        alt={`${username} cover`}
        w={{ base: "100vw", md: "100%" }}
        h={{ base: "120px", md: "200px" }}
        objectFit="cover"
        fallback={<Box height="100%" />}
      />
    </Box>
  );
});

export default ProfileCoverImage;
