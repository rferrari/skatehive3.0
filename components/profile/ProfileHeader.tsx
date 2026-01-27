"use client";
import React, { memo, useState } from "react";
import { Box, HStack, Image } from "@chakra-ui/react";
import MobileProfileHeader from "./MobileProfileHeader";
import HiveProfileHeader from "./HiveProfileHeader";
import ZoraProfileHeader from "./ZoraProfileHeader";
import { ProfileData } from "./ProfilePage";
import ProfileDebugControl from "./ProfileDebugControl";

interface ProfileHeaderProps {
  profileData: ProfileData;
  username: string;
  isOwner: boolean;
  isUserbaseOwner?: boolean;
  user: string | null;
  isFollowing: boolean | null;
  isFollowLoading: boolean;
  onFollowingChange: (following: boolean | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onEditModalOpen: () => void;
  onUserbaseEditModalOpen?: () => void;
  debugPayload?: Record<string, any> | null;
}

const ProfileHeader = function ProfileHeader({
  profileData,
  username,
  isOwner,
  isUserbaseOwner,
  user,
  isFollowing,
  isFollowLoading,
  onFollowingChange,
  onLoadingChange,
  onEditModalOpen,
  onUserbaseEditModalOpen,
  debugPayload,
}: ProfileHeaderProps) {
  const [showZoraProfile, setShowZoraProfile] = useState(false);

  // Determine which edit handler to use
  const effectiveEditHandler = isUserbaseOwner && onUserbaseEditModalOpen
    ? onUserbaseEditModalOpen
    : onEditModalOpen;
  const canEdit = isOwner || !!isUserbaseOwner;

  // Debug logging
  console.log("[ProfileHeader] Edit button debug:", {
    username,
    isOwner,
    isUserbaseOwner,
    canEdit,
    hasUserbaseEditHandler: !!onUserbaseEditModalOpen,
    user,
  });

  return (
    <Box position="relative" w="100%">
      {/* Mobile Component */}
      <MobileProfileHeader
        profileData={profileData}
        username={username}
        isOwner={canEdit}
        user={user}
        isFollowing={isFollowing}
        isFollowLoading={isFollowLoading}
        onFollowingChange={onFollowingChange}
        onLoadingChange={onLoadingChange}
        onEditModalOpen={effectiveEditHandler}
        showZoraProfile={showZoraProfile}
        onToggleProfile={setShowZoraProfile}
        cachedZoraData={null}
        zoraLoading={false}
        zoraError={null}
      />

      {/* Desktop Layout */}
      <Box display={{ base: "none", md: "block" }} position="relative">
        <Box w="100%" maxW="container.xl" mx="auto" px={6} py={4}>
          {/* Both Profile Layouts - visibility controlled by CSS */}

          {/* Zora Profile Layout */}
          {profileData.ethereum_address && (
            <Box display={showZoraProfile ? "block" : "none"} w="100%">
              <ZoraProfileHeader
                profileData={profileData}
                username={username}
              />
            </Box>
          )}

          {/* Hive Profile Layout */}
          <Box
            display={
              !showZoraProfile || !profileData.ethereum_address
                ? "block"
                : "none"
            }
            w="100%"
          >
            <HiveProfileHeader
              profileData={profileData}
              username={username}
              isOwner={canEdit}
              user={user}
              isFollowing={isFollowing}
              isFollowLoading={isFollowLoading}
              onFollowingChange={onFollowingChange}
              onLoadingChange={onLoadingChange}
              onEditModalOpen={effectiveEditHandler}
            />
          </Box>

          {/* Profile Type Toggle - Bottom Right Corner */}
            <Box position="absolute" bottom={4} right={6} zIndex={10}>
              <HStack spacing={2}>
                {/* Hive Profile Logo */}
                <Box
                  cursor="pointer"
                  onClick={() => setShowZoraProfile(false)}
                  p={1.5}
                  borderRadius="none"
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
                  borderRadius="none"
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
                {debugPayload && (
                  <ProfileDebugControl payload={debugPayload} />
                )}
              </HStack>
            </Box>
      
        </Box>
      </Box>
    </Box>
  );
};

export default memo(ProfileHeader, (prevProps, nextProps) => {
  return (
    prevProps.username === nextProps.username &&
    prevProps.profileData.ethereum_address ===
      nextProps.profileData.ethereum_address &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.user === nextProps.user &&
    prevProps.isFollowing === nextProps.isFollowing &&
    prevProps.isFollowLoading === nextProps.isFollowLoading &&
    prevProps.debugPayload === nextProps.debugPayload
  );
});
