"use client";
import React, { memo, useState } from "react";
import { Box, HStack, Image } from "@chakra-ui/react";
import MobileProfileHeader from "./MobileProfileHeader";
import HiveProfileHeader from "./HiveProfileHeader";
import ZoraProfileHeader from "./ZoraProfileHeader";
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
  const [showZoraProfile, setShowZoraProfile] = useState(false);

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
        showZoraProfile={showZoraProfile}
        onToggleProfile={setShowZoraProfile}
        cachedZoraData={null}
        zoraLoading={false}
        zoraError={null}
      />

      {/* Desktop Layout */}
      <Box display={{ base: "none", md: "block" }} position="relative">
        <Box w="100%" maxW="container.xl" mx="auto" px={6} py={4}>
          {/* Conditional Profile Layout */}
          {showZoraProfile && profileData.ethereum_address ? (
            <ZoraProfileHeader profileData={profileData} username={username} />
          ) : (
            <HiveProfileHeader
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
          )}

          {/* Profile Type Toggle - Bottom Right Corner */}
          {profileData.ethereum_address && (
            <Box position="absolute" bottom={4} right={6} zIndex={10}>
              <HStack spacing={2}>
                {/* Hive Profile Logo */}
                <Box
                  cursor="pointer"
                  onClick={() => setShowZoraProfile(false)}
                  p={1.5}
                  borderRadius="md"
                  bg={!showZoraProfile ? "primary" : "whiteAlpha.200"}
                  border="1px solid"
                  borderColor={!showZoraProfile ? "primary" : "whiteAlpha.300"}
                  transition="all 0.2s"
                  _hover={{
                    borderColor: "primary",
                    transform: "scale(1.05)",
                    bg: !showZoraProfile ? "primary" : "whiteAlpha.300",
                  }}
                  backdropFilter="blur(10px)"
                >
                  <Image
                    src="/logos/hiveLogo.png"
                    alt="Hive Profile"
                    boxSize="20px"
                    opacity={!showZoraProfile ? 1 : 0.7}
                    transition="opacity 0.2s"
                  />
                </Box>

                {/* Zora Profile Logo */}
                <Box
                  cursor="pointer"
                  onClick={() => setShowZoraProfile(true)}
                  p={1.5}
                  borderRadius="md"
                  bg={showZoraProfile ? "primary" : "whiteAlpha.200"}
                  border="1px solid"
                  borderColor={showZoraProfile ? "primary" : "whiteAlpha.300"}
                  transition="all 0.2s"
                  _hover={{
                    borderColor: "primary",
                    transform: "scale(1.05)",
                    bg: showZoraProfile ? "primary" : "whiteAlpha.300",
                  }}
                  backdropFilter="blur(10px)"
                >
                  <Image
                    src="/logos/Zorb.png"
                    alt="Zora Profile"
                    boxSize="20px"
                    opacity={showZoraProfile ? 1 : 0.7}
                    transition="opacity 0.2s"
                  />
                </Box>
              </HStack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default ProfileHeader;
