"use client";
import React from "react";
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

export default function ProfileHeader({
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
    const [background] = useToken('colors', ['background']);

    return (
        <Box position="relative" w="100%" p={0} m={0}>
            {/* Responsive Flex: row on desktop, column on mobile */}
            <Flex
                direction={{ base: "column", md: "row" }}
                align={{ base: "center", md: "flex-start" }}
                justify={{ base: "center", md: "space-between" }}
                w="100%"
                maxW="container.md"
                zIndex={2}
                px={{ base: 2, md: 8 }}
                p={0}
                m={0}
                mt={{ base: "-32px", md: 0 }}
            >
                {/* Avatar and Power Bars */}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  align={{ base: "center", md: "flex-start" }}
                  gap={{ base: 2, md: 4 }}
                  flexShrink={0}
                  flexBasis={{ base: 'auto', md: '25%' }}
                  maxW={{ base: 'none', md: '25%' }}
                  w={{ base: 'auto', md: '25%' }}
                >
                  <Avatar
                      src={profileData.profileImage}
                      name={username}
                      borderRadius="md"
                      boxSize="100px"
                      mb={{ base: 2, md: 0 }}
                  />
                  {/* Power Bars */}
                  {profileData.vp_percent && profileData.rc_percent && (
                    <PowerBars
                      vpPercent={profileData.vp_percent}
                      rcPercent={profileData.rc_percent}
                      height={100}
                      width={25}
                    />
                  )}
                </Flex>
                {/* Profile Info (right-aligned on desktop, constrained width) */}
                <Flex
                  direction="column"
                  align={{ base: "center", md: "flex-end" }}
                  justify="center"
                  flexBasis={{ base: 'auto', md: '75%' }}
                  maxW={{ base: '100%', md: '75%' }}
                  w={{ base: '100%', md: '75%' }}
                  mt={{ base: 2, md: 0 }}
                  gap={1}
                  flexShrink={1}
                  minWidth={0}
                >
                  {/* Name row with Follow button inline */}
                  <Flex direction="row" align="center" justify={{ base: "center", md: "flex-end" }} mb={1} w="100%">
                    {/* Inline Follow/Unfollow button */}
                    {!isOwner && user && (
                      <Box mr={2}>
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
                    <Heading as="h2" 
                      size="lg" 
                      color="primary"
                      textAlign={{ base: "center", md: "right" }}
                      whiteSpace="normal"
                      wordBreak="break-word"
                      fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
                      fontWeight="extrabold"
                      mb={0}
                    >
                      {profileData.name}
                    </Heading>
                    {/* Inline Edit Profile button for owner */}
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
                  <Text fontSize="xs" color="text" mb={0} textAlign={{ base: "center", md: "right" }} whiteSpace="normal" wordBreak="break-word">
                      Following: {profileData.following} | Followers: {profileData.followers} | Location: {profileData.location}
                  </Text>
                  <Flex
                      alignItems="center"
                      justifyContent={{ base: "center", md: "flex-end" }}
                      mb={0}
                      mt={0}
                      pt={0}
                      pb={0}
                      gap={2}
                  >
                      {profileData.website && (
                          <Link
                              href={
                                  profileData.website.startsWith("http")
                                      ? profileData.website
                                      : `https://${profileData.website}`
                              }
                              isExternal
                              fontSize="xs"
                              color="primary"
                              display="flex"
                              alignItems="center"
                              whiteSpace="normal"
                              wordBreak="break-word"
                          >
                              <Icon as={FaGlobe} w={2} h={2} mr={1} />
                              {profileData.website}
                          </Link>
                      )}
                  </Flex>
                  {/* Desktop: Speech bubble/quote */}
                  {profileData.about && (
                    <Box
                      display={{ base: "none", md: "block" }}
                      position="relative"
                      ml={2}
                      color="text"
                      px={4}
                      py={3}
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
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                      }}
                    >
                      {`"${profileData.about}"`}
                    </Box>
                  )}
                </Flex>
            </Flex>
        </Box>
    );
}
