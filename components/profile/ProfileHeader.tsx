"use client";
import React, { useCallback } from "react";
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

    const speakDescription = useCallback(() => {
        if (!profileData.about) return;

        if ("speechSynthesis" in window && window.speechSynthesis) {
            try {
                const utterance = new window.SpeechSynthesisUtterance(profileData.about);
                utterance.rate = 0.9; // More natural speech rate
                utterance.volume = 0.8;
                utterance.pitch = 1.0;

                // Cancel any ongoing speech before starting new one
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('Speech synthesis failed:', error);
                // Fallback: Could show a toast notification here
                alert('Speech synthesis failed. Please try again.');
            }
        } else {
            // Fallback for browsers without Speech Synthesis API
            console.warn('Speech Synthesis API is not supported in this browser');
            alert('Text-to-speech is not supported in your browser. Please consider updating to a modern browser.');
        }
    }, [profileData.about]);

    return (
        <Box position="relative" w="100%" p={0} m={0}>
            {/* Follow/Unfollow button in upper right */}
            {!isOwner && user && (
                <Box position="absolute" top={2} right={2} zIndex={3} bg={background} px={0} py={0} borderRadius="md" boxShadow="md">
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

            <Box
                position={{ base: "static", md: "absolute" }}
                left={{ base: "auto", md: 0 }}
                top={{ base: "auto", md: "-60px" }}
                transform={{ base: "none", md: "none" }}
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent={{ base: "center", md: "flex-start" }}
                zIndex={2}
                ml={{ base: 0, md: 8 }}
                p={0}
                m={0}
                w={{ base: "100%", md: "auto" }}
                mt={{ base: "-32px", md: 0 }}
            >
                <Avatar
                    src={profileData.profileImage}
                    name={username}
                    borderRadius="md"
                    boxSize="100px"
                    mr={{ base: 0, md: 4 }}
                    mb={{ base: 2, md: 0 }}
                />
                {profileData.about && (
                    <Box position="relative" ml={{ base: 0, md: 2 }} p={0} m={0}>
                        <Box
                            bg="muted"
                            color="text"
                            px={4}
                            py={3}
                            borderRadius="lg"
                            boxShadow="md"
                            maxW="180px"
                            fontSize="0.625rem"
                            fontStyle="italic"
                            cursor="pointer"
                            onClick={speakDescription}
                            noOfLines={4}
                            _after={{
                                content: '""',
                                position: "absolute",
                                left: "-16px",
                                top: "24px",
                                borderWidth: "8px",
                                borderStyle: "solid",
                                borderColor: "transparent",
                                borderRightColor: "muted",
                            }}
                        >
                            {profileData.about}
                        </Box>
                    </Box>
                )}
            </Box>

            <Flex
                direction="column"
                alignItems="center"
                justifyContent="center"
                w="100%"
                px={2}
                mt={{ base: 2, md: 0 }}
                mb={0}
                pt={0}
                pb={0}
            >
                <Heading as="h2" size="lg" color="primary" mb={1} textAlign="center">
                    {profileData.name}
                </Heading>
                <Text fontSize="xs" color="text" mb={0} textAlign="center">
                    Following: {profileData.following} | Followers: {profileData.followers} | Location: {profileData.location}
                </Text>

                <Flex
                    alignItems="center"
                    justifyContent="center"
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
                        >
                            <Icon as={FaGlobe} w={2} h={2} mr={1} />
                            {profileData.website}
                        </Link>
                    )}

                    {/* Edit icon for profile owner */}
                    {isOwner && (
                        <IconButton
                            aria-label="Edit Profile"
                            icon={<FaEdit />}
                            size="sm"
                            variant="ghost"
                            colorScheme="primary"
                            onClick={onEditModalOpen}
                        />
                    )}
                </Flex>
            </Flex>
        </Box>
    );
}
