"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Image,
  Container,
  Flex,
  Icon,
  Avatar,
} from "@chakra-ui/react";
import useHiveAccount from "@/hooks/useHiveAccount";
import { FaGlobe } from "react-icons/fa";
import { getProfile, findPosts } from "@/lib/hive/client-functions";
import PostGrid from "../blog/PostGrid";
import InfiniteScroll from "react-infinite-scroll-component";

interface ProfilePageProps {
  username: string;
}

interface ProfileData {
  profileImage: string;
  coverImage: string;
  website: string;
  name: string;
  followers: number;
  following: number;
  location: string;
  about: string;
}

export default function ProfilePage({ username }: ProfilePageProps) {
  const { hiveAccount, isLoading, error } = useHiveAccount(username);
  const [profileData, setProfileData] = useState<ProfileData>({
    profileImage: "",
    coverImage: "",
    website: "",
    name: "",
    followers: 0,
    following: 0,
    location: "",
    about: "",
  });
  const [posts, setPosts] = useState<any[]>([]);
  const isFetching = useRef(false);

  const params = useRef([
    username,
    "",
    new Date().toISOString().split(".")[0],
    12,
  ]);

  async function fetchPosts() {
    if (isFetching.current) return; // Prevent multiple fetches
    isFetching.current = true;
    try {
      const newPosts = await findPosts("author_before_date", params.current);
      if (newPosts && newPosts.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        params.current = [
          username,
          newPosts[newPosts.length - 1].permlink,
          newPosts[newPosts.length - 1].created,
          12,
        ];
      }
      isFetching.current = false;
    } catch (err) {
      console.error("Failed to fetch posts", err);
      isFetching.current = false;
    }
  }

  useEffect(() => {
    // Reset posts and params when username changes
    setPosts([]);
    params.current = [username, "", new Date().toISOString().split(".")[0], 12];
    fetchPosts();
  }, [username]);

  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        // Get complete profile info
        const profileInfo = await getProfile(username);

        // Extract metadata from hiveAccount if available
        let profileImage = "";
        let coverImage = "";
        let website = "";

        if (hiveAccount?.posting_json_metadata) {
          try {
            const parsedMetadata = JSON.parse(
              hiveAccount.posting_json_metadata
            );
            const profile = parsedMetadata?.profile || {};
            profileImage = profile.profile_image || "";
            coverImage = profile.cover_image || "";
            website = profile.website || "";
          } catch (err) {
            console.error("Failed to parse profile metadata", err);
          }
        }

        setProfileData({
          profileImage,
          coverImage,
          website,
          name: profileInfo?.metadata?.profile?.name || username,
          followers: profileInfo?.stats?.followers || 0,
          following: profileInfo?.stats?.following || 0,
          location: profileInfo?.metadata?.profile?.location || "",
          about: profileInfo?.metadata?.profile?.about || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile info", err);
      }
    };

    if (username && hiveAccount) {
      fetchProfileInfo();
    }
  }, [username, hiveAccount]);

  if (isLoading || !hiveAccount) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Alert status="error" borderRadius="md" variant="solid">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box color="text" maxW="container.lg" mx="auto">
      {/* Cover Image */}
      <Box position="relative" height="200px">
        <Container
          maxW="container.lg"
          p={0}
          overflow="hidden"
          position="relative"
          height="100%"
          border={"1px solid limegreen"}
          borderRadius={"md"}
          mt={{ base: 0, md: 2 }}
        >
          <Image
            src={profileData.coverImage}
            alt={`${username} cover`}
            width="100%"
            height="100%"
            objectFit="cover"
            fallback={<Box height="100%" />}
          />
        </Container>
      </Box>

      {/* Profile Info */}
      <Flex
        position="relative"
        mt={-20}
        alignItems="center"
        p={{ base: 2, md: 8 }}
      >
        <Flex alignItems="center" zIndex={2} position="relative">
          <Avatar
            src={profileData.profileImage}
            name={username}
            borderRadius="md"
            boxSize="100px"
            mr={4}
          />

          <Box mt={5}>
            <Heading as="h2" size="lg" color="primary" mr={2}>
              {profileData.name}
            </Heading>

            <Text fontSize="xs" color="text">
              Following: {profileData.following} | Followers:{" "}
              {profileData.followers} | Location: {profileData.location}
              <br />
              {profileData.about.length > 140
                ? `${profileData.about.substring(0, 140)}...`
                : profileData.about}
            </Text>

            {profileData.website && (
              <Flex alignItems="center">
                <Icon
                  as={FaGlobe}
                  w={2}
                  h={2}
                  onClick={() => window.open(profileData.website, "_blank")}
                  style={{ cursor: "pointer" }}
                />
                <Text ml={2} fontSize="xs" color="primary">
                  {profileData.website}
                </Text>
              </Flex>
            )}
          </Box>
        </Flex>
      </Flex>

      {/* Posts */}
      <Box mt={6} overflow="auto" maxH="calc(100vh - 300px)">
        <InfiniteScroll
          dataLength={posts.length}
          next={fetchPosts}
          hasMore={true}
          loader={
            <Box textAlign="center" py={4}>
              <Spinner size="md" color="primary" />
            </Box>
          }
        >
          {posts && <PostGrid posts={posts} columns={3} />}
        </InfiniteScroll>
      </Box>
    </Box>
  );
}
