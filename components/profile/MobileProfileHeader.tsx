"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Avatar,
  IconButton,
  Link,
  HStack,
  Button,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { FaGlobe, FaEdit, FaSignOutAlt, FaCog } from "react-icons/fa";
import FollowButton from "./FollowButton";
import { ProfileData } from "./ProfilePage";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { checkFollow } from "@/lib/hive/client-functions";

interface MobileProfileHeaderProps {
  profileData: ProfileData;
  username: string;
  isOwner: boolean;
  user: string | null;
  isFollowing: boolean | null;
  isFollowLoading: boolean;
  onFollowingChange: (following: boolean | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onEditModalOpen: () => void;
}

export default function MobileProfileHeader({
  profileData,
  username,
  isOwner,
  user,
  isFollowing,
  isFollowLoading,
  onFollowingChange,
  onLoadingChange,
  onEditModalOpen,
}: MobileProfileHeaderProps) {
  const router = useRouter();
  const { aioha } = useAioha();
  const [followsBack, setFollowsBack] = useState<boolean>(false);

  // Check if the viewed user follows the current user back
  useEffect(() => {
    const checkMutualFollow = async () => {
      if (user && username && user !== username) {
        try {
          const doesFollow = await checkFollow(username, user);
          setFollowsBack(doesFollow);
        } catch (error) {
          console.error("Error checking mutual follow:", error);
        }
      }
    };

    checkMutualFollow();
  }, [user, username]);

  return (
    <Box display={{ base: "block", md: "none" }} position="relative" w="100%">
      {/* Farcaster-style Profile Section - Overlapping the banner */}
      <Box position="relative" p={4} mt={-12}>
        {/* Avatar positioned to overlap banner */}
        <Flex justify="space-between" align="flex-start" mb={3}>
          <Avatar
            src={profileData.profileImage}
            name={username}
            size="xl"
            border="4px solid"
            borderColor="white"
            bg="white"
            shadow="lg"
          />

          {/* Top-right settings (only for owner) */}
          {isOwner && (
            <IconButton
              aria-label="Settings"
              icon={<FaCog />}
              variant="ghost"
              color="white"
              bg="blackAlpha.600"
              _hover={{ bg: "blackAlpha.800" }}
              size="sm"
              borderRadius="full"
              onClick={() => router.push("/settings")}
            />
          )}
        </Flex>

        {/* Profile Info Section */}
        <VStack align="flex-start" spacing={2} mb={4}>
          {/* Name and Username with Follow Button */}
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="xl" fontWeight="bold" color="white">
              {profileData.name || username}
            </Text>
            <Flex align="center" gap={2}>
              <Text fontSize="sm" color="whiteAlpha.700">
                @{username}
              </Text>
              {/* Follows you badge */}
              {!isOwner && followsBack && (
                <Badge
                  bg="whiteAlpha.200"
                  color="whiteAlpha.800"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  Follows you
                </Badge>
              )}
              {/* Follow/Following Button */}
              {!isOwner && user && (
                <Button
                  onClick={async () => {
                    if (!user || !username || user === username) return;

                    const prev = isFollowing;
                    const next = !isFollowing;
                    onFollowingChange(next);
                    onLoadingChange(true);

                    try {
                      // Import the function locally for this action
                      const { changeFollow } = await import(
                        "@/lib/hive/client-functions"
                      );
                      await changeFollow(user, username);

                      // Update state immediately for better UX
                      onFollowingChange(next);
                      onLoadingChange(false);
                    } catch (error) {
                      console.error("Follow action failed:", error);
                      onFollowingChange(prev);
                      onLoadingChange(false);
                    }
                  }}
                  size="xs"
                  variant={isFollowing ? "outline" : "solid"}
                  colorScheme={isFollowing ? "whiteAlpha" : "primary"}
                  borderColor={isFollowing ? "whiteAlpha.400" : undefined}
                  bg={isFollowing ? "transparent" : undefined}
                  color={isFollowing ? "white" : undefined}
                  isLoading={isFollowLoading}
                  isDisabled={isFollowLoading}
                  fontWeight="bold"
                  px={3}
                  py={1}
                  borderRadius="md"
                  _hover={{
                    bg: isFollowing ? "whiteAlpha.200" : undefined,
                  }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </Flex>
          </VStack>

          {/* Bio */}
          {profileData.about && (
            <Text fontSize="sm" color="whiteAlpha.900" lineHeight={1.4}>
              {profileData.about}
            </Text>
          )}

          {/* Location and Website */}
          <Flex
            wrap="wrap"
            gap={3}
            fontSize="xs"
            color="whiteAlpha.700"
            align="center"
          >
            {profileData.location && (
              <Flex align="center" gap={1}>
                <Text>📍</Text>
                <Text>{profileData.location}</Text>
              </Flex>
            )}
            {profileData.website && (
              <Flex align="center" gap={1}>
                <Text>🌐</Text>
                <Link
                  href={
                    profileData.website.startsWith("http")
                      ? profileData.website
                      : `https://${profileData.website}`
                  }
                  isExternal
                  color="primary"
                  _hover={{ textDecoration: "underline" }}
                  fontSize="xs"
                >
                  {profileData.website}
                </Link>
              </Flex>
            )}
          </Flex>

          {/* Stats Row - Farcaster Style */}
          <Flex gap={4} fontSize="sm">
            <Flex align="center" gap={1}>
              <Text fontWeight="bold" color="white">
                {profileData.following}
              </Text>
              <Text color="whiteAlpha.700">Following</Text>
            </Flex>
            <Flex align="center" gap={1}>
              <Text fontWeight="bold" color="white">
                {profileData.followers}
              </Text>
              <Text color="whiteAlpha.700">Followers</Text>
            </Flex>
            {profileData.vp_percent && (
              <Flex align="center" gap={1}>
                <Text fontWeight="bold" color="white">
                  {Math.round(parseFloat(profileData.vp_percent || "0"))}%
                </Text>
                <Text color="whiteAlpha.700">VP</Text>
              </Flex>
            )}
          </Flex>
        </VStack>

        {/* Action Buttons - Only for Owners */}
        {isOwner && (
          <Flex gap={2}>
            <Button
              flex={1}
              size="sm"
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={onEditModalOpen}
            >
              Edit profile
            </Button>
            <IconButton
              aria-label="Logout"
              icon={<FaSignOutAlt />}
              size="sm"
              variant="solid"
              colorScheme="red"
              onClick={async () => {
                try {
                  await aioha.logout();
                } catch (error) {
                  console.error("Error during logout:", error);
                }
              }}
            />
          </Flex>
        )}
      </Box>
    </Box>
  );
}
