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
  IconButton,
} from "@chakra-ui/react";
import useHiveAccount from "@/hooks/useHiveAccount";
import { FaGlobe, FaTh, FaBars } from "react-icons/fa";
import { getProfile, findPosts } from "@/lib/hive/client-functions";
import PostGrid from "../blog/PostGrid";
import InfiniteScroll from "react-infinite-scroll-component";
import PostCard from "../blog/PostCard";

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const params = useRef([
    username,
    "",
    new Date().toISOString().split(".")[0],
    12,
  ]);

  // Load saved view mode from localStorage on mount
  useEffect(() => {
    const savedView = typeof window !== 'undefined' ? localStorage.getItem('profileViewMode') : null;
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView);
    }
  }, []);

  // Handler to change and persist view mode
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileViewMode', mode);
    }
  };

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

      {/* Toggle for grid/list view */}
      <Flex justifyContent="flex-end" alignItems="center" mb={2} gap={2}>
        <IconButton
          aria-label="Grid view"
          icon={<FaTh />}
          variant={viewMode === 'grid' ? 'solid' : 'ghost'}
          onClick={() => handleViewModeChange('grid')}
          isActive={viewMode === 'grid'}
          mr={1}
        />
        <IconButton
          aria-label="List view"
          icon={<FaBars />}
          variant={viewMode === 'list' ? 'solid' : 'ghost'}
          onClick={() => handleViewModeChange('list')}
          isActive={viewMode === 'list'}
        />
      </Flex>

      {/* Posts */}
      {viewMode === 'grid' ? (
        <PostGrid posts={posts} columns={3} />
      ) : (
        <Box>
          {posts.map((post) => (
            <Box key={post.permlink} w="100%" maxW="container.lg" mx="auto" mb={1} h="200px">
              <PostCard post={post} listView />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
