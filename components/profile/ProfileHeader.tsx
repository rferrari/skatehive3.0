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
  VStack,
} from "@chakra-ui/react";
import { FaGlobe, FaEdit } from "react-icons/fa";
import FollowButton from "./FollowButton";
import PowerBars from "./PowerBars";
import MobileProfileHeader from "./MobileProfileHeader";
import ZoraProfileCoinDisplay from "./ZoraProfileCoinDisplay";
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
    <Box position="relative" w="100%">
      {/* Mobile Component */}
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

      {/* Desktop Layout - Original Clean Version */}
      <Box display={{ base: "none", md: "block" }}>
        <Flex
          direction="row"
          align="flex-start"
          justify="space-between"
          w="100%"
          maxW="container.md"
          zIndex={2}
          px={8}
          gap={6}
        >
          {/* Desktop: Avatar and Power Bars */}
          <Flex
            direction="row"
            align="flex-start"
            gap={4}
            flexShrink={0}
            flexBasis="25%"
            maxW="25%"
            w="25%"
          >
            <Flex direction="column" align="center" gap={2}>
              <Avatar
                src={profileData.profileImage}
                name={username}
                borderRadius="md"
                boxSize="100px"
              />

              {/* Zora Profile Coin Display */}
            </Flex>
            <VStack>
              <ZoraProfileCoinDisplay
                walletAddress={profileData.ethereum_address}
                size="sm"
              />
              {profileData.vp_percent && profileData.rc_percent && (
                <PowerBars
                  vpPercent={profileData.vp_percent}
                  rcPercent={profileData.rc_percent}
                  height={100}
                  width={25}
                />
              )}
            </VStack>
          </Flex>

          {/* Profile Info */}
          <Flex
            direction="column"
            align="flex-end"
            justify="center"
            flexBasis="75%"
            maxW="75%"
            w="75%"
            gap={3}
            flexShrink={1}
            minWidth={0}
          >
            {/* Name and Action Button Row */}
            <Flex
              direction="row"
              align="center"
              justify="flex-end"
              w="100%"
              gap={2}
            >
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
            {/* About (Desktop Speech Bubble) */}
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
                whiteSpace="normal"
                wordBreak="break-word"
                _after={{
                  content: '""',
                  position: "absolute",
                  left: "-16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  borderWidth: "8px",
                  borderStyle: "solid",
                  borderColor: "transparent",
                  borderRightColor: "transparent",
                }}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "normal",
                }}
              >
                {`"${profileData.about}"`}
              </Box>
            )}
            {/* Stats Row */}
            <Text
              fontSize="sm"
              color="text"
              textAlign="right"
              fontWeight="medium"
            >
              Following: {profileData.following} | Followers:{" "}
              {profileData.followers}
              {profileData.location && ` | ${profileData.location}`}
            </Text>

            {/* Website Link */}
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
