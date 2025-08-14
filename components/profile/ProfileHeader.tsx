"use client";
import React, { memo } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Icon,
  Avatar,
  IconButton,
  Link,
  useToken,
} from "@chakra-ui/react";
import { FaGlobe, FaEdit } from "react-icons/fa";
import FollowButton from "./FollowButton";
import PowerBars from "./PowerBars";
import MobileProfileHeader from "./MobileProfileHeader";
import { ProfileData } from "./ProfilePage";

interface ProfileHeaderProps {
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

const ProfileHeader = memo(function ProfileHeader({
  profileData,
  username,
  isOwner,
  user,
  isFollowing,
  isFollowLoading,
  onFollowingChange,
  onLoadingChange,
  onEditModalOpen,
}: ProfileHeaderProps) {
  const [background] = useToken("colors", ["background"]);

  return (
    <Box position="relative" w="100%" maxWidth="container.lg" overflowX="hidden" mx="auto">
      {/* Mobile */}
      <MobileProfileHeader
        profileData={profileData}
        username={username}
        isOwner={isOwner}
        user={user}
        isFollowing={isFollowing}
        isFollowLoading={isFollowLoading}
        onFollowingChange={onFollowingChange}
        onLoadingChange={onLoadingChange}
        onEditModalOpen={onEditModalOpen}
      />

      {/* Desktop */}
      <Box display={{ base: "none", md: "block" }}>
        <Flex
          direction="row"
          align="flex-start"
          gap={8}
          w="100%"
        >
          {/* Avatar + Power Bars */}
          <Flex align="center" gap={6} flexShrink={0}>
            <Avatar
              src={profileData.profileImage}
              name={username}
              borderRadius="md"
              boxSize="100px"
            />
            {profileData.vp_percent && profileData.rc_percent && (
              <PowerBars
                vpPercent={profileData.vp_percent}
                rcPercent={profileData.rc_percent}
              />
            )}
          </Flex>

          {/* Profile Info */}
          <Flex
            direction="column"
            flex="1"
            minW={0}
            align="flex-end"
            gap={3}
          >
            {/* Name + Actions */}
            <Flex align="center" justify="flex-end" w="100%" gap={2}>
              {!isOwner && user && (
                <Box mr={3}>
                  <FollowButton
                    user={user}
                    username={username}
                    isFollowing={isFollowing}
                    isFollowLoading={isFollowLoading}
                    onFollowingChange={onFollowingChange}
                    onLoadingChange={onLoadingChange}
                  />
                </Box>
              )}
              <Heading
                as="h2"
                size="lg"
                color="primary"
                textAlign="right"
                fontSize={{ md: "3xl", lg: "4xl" }}
                fontWeight="bold"
                lineHeight="1.2"
              >
                {profileData.name}
              </Heading>
              {isOwner && (
                <Box ml={2}>
                  <IconButton
                    aria-label="Edit Profile"
                    icon={<FaEdit />}
                    size="sm"
                    variant="ghost"
                    colorScheme="primary"
                    onClick={onEditModalOpen}
                  />
                </Box>
              )}
            </Flex>

            {/* About */}
            {profileData.about && (
              <Box
                position="relative"
                ml={2}
                color="text"
                borderRadius="lg"
                maxW="100%"
                fontSize="0.625rem"
                fontStyle="italic"
                noOfLines={4}
                wordBreak="break-word"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {`"${profileData.about}"`}
              </Box>
            )}

            {/* Stats */}
            <Text
              fontSize="sm"
              color="text"
              textAlign="right"
              fontWeight="medium"
            >
              Following: {profileData.following} | Followers: {profileData.followers}
              {profileData.location && ` | ${profileData.location}`}
            </Text>

            {/* Website */}
            {profileData.website && (
              <Flex alignItems="center" justifyContent="flex-end">
                <Link
                  href={
                    profileData.website.startsWith("http")
                      ? profileData.website
                      : `https://${profileData.website}`
                  }
                  isExternal
                  fontSize="sm"
                  color="primary"
                  display="flex"
                  alignItems="center"
                  _hover={{ textDecoration: "underline" }}
                >
                  <Icon as={FaGlobe} w={3} h={3} mr={2} />
                  {profileData.website}
                </Link>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
});

export default ProfileHeader;
