"use client";
import React, { memo, useState, useEffect } from "react";
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
  HStack,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
  Image,
} from "@chakra-ui/react";
import { FaGlobe, FaEdit } from "react-icons/fa";
import FollowButton from "./FollowButton";
import PowerBars from "./PowerBars";
import MobileProfileHeader from "./MobileProfileHeader";
import ZoraProfileCoinDisplay from "./ZoraProfileCoinDisplay";
import ZoraProfileLayout from "./ZoraProfileLayout";
import { ProfileData } from "./ProfilePage";
import {
  useZoraProfileCoin,
  ZoraProfileData,
} from "@/hooks/useZoraProfileCoin";

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
  const [showZoraProfile, setShowZoraProfile] = useState(false);
  const [cachedZoraData, setCachedZoraData] = useState<ZoraProfileData | null>(
    null
  );
  const [zoraDataFetched, setZoraDataFetched] = useState(false);

  // Only fetch Zora data when needed and not already cached
  const shouldFetchZora =
    showZoraProfile && !zoraDataFetched && profileData.ethereum_address;
  const {
    profileData: zoraProfileData,
    loading: zoraLoading,
    error: zoraError,
  } = useZoraProfileCoin(
    shouldFetchZora ? profileData.ethereum_address : undefined
  );

  // Cache the Zora data once it's loaded
  useEffect(() => {
    if (zoraProfileData && !zoraLoading && !zoraError) {
      setCachedZoraData(zoraProfileData);
      setZoraDataFetched(true);
    }
  }, [zoraProfileData, zoraLoading, zoraError]);

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
        cachedZoraData={cachedZoraData}
        zoraLoading={zoraLoading}
        zoraError={zoraError}
      />

      {/* Desktop Layout - Properly Balanced */}
      <Box display={{ base: "none", md: "block" }} position="relative">
        <Box w="100%" maxW="container.xl" mx="auto" px={6} py={4}>
          {/* Single Row Layout - Everything Balanced */}
          {/* Conditional Profile Layout */}
          {showZoraProfile ? (
            <ZoraProfileLayout
              walletAddress={profileData.ethereum_address}
              username={username}
              profileData={cachedZoraData}
              loading={zoraLoading}
              error={zoraError}
            />
          ) : (
            <Flex
              direction="row"
              align="center"
              justify="space-between"
              w="100%"
              gap={6}
              minH="100px"
            >
              {/* Left Section: Avatar + Basic Info */}
              <Flex
                direction="row"
                align="flex-start"
                gap={4}
                flexBasis="60%"
                maxW="60%"
              >
                <Avatar
                  src={profileData.profileImage}
                  name={username}
                  borderRadius="lg"
                  boxSize="100px"
                  border="2px solid"
                  borderColor="primary"
                />

                <VStack align="flex-start" spacing={0} flex="1">
                  <HStack>
                    <Text
                      fontSize="sm"
                      color="gray.400"
                      fontWeight="medium"
                      isTruncated
                      w="100%"
                    >
                      {profileData.about ? (
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
                          textAlign="center"
                        >
                          <Text
                            as="span"
                            cursor="help"
                            _hover={{ color: "primary" }}
                          >
                            @{username}
                          </Text>
                        </Tooltip>
                      ) : (
                        <>@{username}</>
                      )}
                    </Text>
                    {isOwner && (
                      <IconButton
                        aria-label="Edit Profile"
                        icon={<FaEdit />}
                        size="md"
                        variant="ghost"
                        colorScheme="primary"
                        onClick={onEditModalOpen}
                      />
                    )}
                  </HStack>

                  {/* Compact Stats */}
                  <HStack spacing={3} fontSize="sm">
                    <Text color="text" whiteSpace="nowrap">
                      <Text as="span" fontWeight="bold" color="primary">
                        {profileData.following}
                      </Text>{" "}
                      Following
                    </Text>
                    <Text color="text" whiteSpace="nowrap">
                      <Text as="span" fontWeight="bold" color="primary">
                        {profileData.followers}
                      </Text>{" "}
                      Followers
                    </Text>
                  </HStack>

                  {/* Vote Power Bar - Left Aligned */}
                  {profileData.vp_percent && profileData.rc_percent && (
                    <Box w="100%" mt={2}>
                      <PowerBars
                        vpPercent={profileData.vp_percent}
                        rcPercent={profileData.rc_percent}
                        username={username}
                        height={250}
                        width={18}
                      />
                    </Box>
                  )}
                </VStack>
              </Flex>

              {/* Right Section: Actions + Market Cap */}
              <VStack align="flex-end" spacing={3} flexBasis="40%" maxW="40%">
                {/* Action Buttons */}
                <HStack spacing={2}>
                  {!isOwner && user && (
                    <FollowButton
                      user={user}
                      username={username}
                      isFollowing={isFollowing}
                      isFollowLoading={isFollowLoading}
                      onFollowingChange={onFollowingChange}
                      onLoadingChange={onLoadingChange}
                    />
                  )}
                </HStack>
              </VStack>
            </Flex>
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
