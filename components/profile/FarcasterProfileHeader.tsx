"use client";
import React, { memo } from "react";
import {
  Text,
  Flex,
  Avatar,
  VStack,
  HStack,
  Tooltip,
  Badge,
  Link,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { ProfileData } from "./ProfilePage";

interface FarcasterProfileData {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  custody?: string;
  verifications?: string[];
}

interface FarcasterProfileHeaderProps {
  profileData: ProfileData;
  username: string;
  farcasterProfile?: FarcasterProfileData | null;
}

const FarcasterProfileHeader = function FarcasterProfileHeader({
  profileData,
  username,
  farcasterProfile,
}: FarcasterProfileHeaderProps) {
  const displayName = farcasterProfile?.displayName || farcasterProfile?.username || profileData.name || username;
  const avatarUrl = farcasterProfile?.pfpUrl || profileData.profileImage;
  const bio = farcasterProfile?.bio || profileData.about;
  const farcasterUsername = farcasterProfile?.username;
  const fid = farcasterProfile?.fid;

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
          src={avatarUrl}
          name={displayName}
          borderRadius="full"
          boxSize="100px"
          border="3px solid"
          borderColor="purple.500"
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
              {displayName}
            </Text>
            {farcasterUsername && (
              <Link
                href={`https://warpcast.com/${farcasterUsername}`}
                isExternal
                display="flex"
                alignItems="center"
                aria-label={`View ${farcasterUsername} on Warpcast`}
              >
                <FaExternalLinkAlt size={12} color="var(--chakra-colors-purple-400)" />
              </Link>
            )}
          </HStack>

          <HStack spacing={2}>
            {farcasterUsername && (
              <Text fontSize="sm" color="purple.400" fontWeight="medium">
                @{farcasterUsername}
              </Text>
            )}
            {fid && (
              <Badge
                colorScheme="purple"
                variant="subtle"
                fontSize="2xs"
                px={2}
                py={0.5}
                borderRadius="full"
              >
                FID: {fid}
              </Badge>
            )}
          </HStack>

          {/* Bio/About */}
          {bio && (
            <Tooltip
              label={bio}
              placement="top"
              bg="gray.800"
              color="white"
              fontSize="sm"
              borderRadius="md"
              px={3}
              py={2}
              maxW="300px"
              textAlign="center"
            >
              <Text
                fontSize="sm"
                color="gray.400"
                noOfLines={2}
                cursor="help"
                _hover={{ color: "gray.300" }}
              >
                {bio}
              </Text>
            </Tooltip>
          )}
        </VStack>
      </Flex>
    </Flex>
  );
};

export default memo(FarcasterProfileHeader);
