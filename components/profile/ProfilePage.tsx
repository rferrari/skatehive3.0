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
  Link,
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
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <Box color="text" maxW="container.lg" mx="auto" p={0} m={0}>
      {/* Cover Image */}
      <Box position="relative" w="100vw" left="50%" style={{ transform: 'translateX(-50%)' }} overflow="hidden" height={{ base: '120px', md: '200px' }} p={0} m={0}>
        <Image
          src={profileData.coverImage}
          alt={`${username} cover`}
          w="100vw"
          h={{ base: '120px', md: '200px' }}
          objectFit="cover"
          fallback={<Box height="100%" />}
        />
      </Box>

      {/* Profile Info Layout: PFP/speech bubble overlap banner, info below banner */}
      <Box position="relative" w="100%" p={0} m={0}>
        {/* Absolutely positioned avatar and speech bubble on the left, overlapping banner */}
        <Box
          position={{ base: 'static', md: 'absolute' }}
          left={{ base: 'auto', md: 0 }}
          top={{ base: 'auto', md: '-60px' }}
          transform={{ base: 'none', md: 'none' }}
          display="flex"
          flexDirection="row"
          alignItems="center"
          zIndex={2}
          ml={{ base: 0, md: 8 }}
          p={0}
          m={0}
          w={{ base: '100%', md: 'auto' }}
          mt={{ base: '-32px', md: 0 }}
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
                bg="gray.700"
                color="white"
                px={4}
                py={3}
                borderRadius="lg"
                boxShadow="md"
                maxW={{ base: '90vw', md: '900px' }}
                fontSize="md"
                fontStyle="italic"
                wordBreak="break-word"
                overflowWrap="anywhere"
                _after={{
                  content: '""',
                  position: 'absolute',
                  left: '-16px',
                  top: '24px',
                  borderWidth: '8px',
                  borderStyle: 'solid',
                  borderColor: 'transparent',
                  borderRightColor: 'var(--chakra-colors-gray-700, #2D3748)',
                }}
              >
                {profileData.about}
              </Box>
            </Box>
          )}
        </Box>

        {/* Centered profile info, not affected by avatar/speech bubble, directly under banner */}
        <Flex direction="column" alignItems="center" justifyContent="center" w="100%" px={2} mt={{ base: 2, md: 0 }} mb={0} pt={0} pb={0}>
          <Heading as="h2" size="lg" color="primary" mb={1} textAlign="center">
            {profileData.name}
          </Heading>
          <Text fontSize="xs" color="text" mb={0} textAlign="center">
            Following: {profileData.following} | Followers: {profileData.followers} | Location: {profileData.location}
          </Text>
          {profileData.website && (
            <Flex alignItems="center" justifyContent="center" mb={0} mt={0} pt={0} pb={0}>
              <Link href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} isExternal ml={2} fontSize="xs" color="primary" display="flex" alignItems="center">
                <Icon as={FaGlobe} w={2} h={2} mr={1} />
                {profileData.website}
              </Link>
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Toggle for grid/list view */}
      {!isMobile && (
        <Flex justifyContent="flex-end" alignItems="center" mb={0} mt={0} pt={0} pb={0} gap={2} p={0}>
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
      )}

      {/* Posts */}
      {(viewMode === 'grid' || isMobile) ? (
        <Box mt={0} pt={0} mb={0} pb={0}>
          <Box as={"div"} display="grid" gridTemplateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(3, 1fr)' }} gap={4}>
            {posts.map((post) => (
              <PostCard key={post.permlink} post={post} hideAuthorInfo />
            ))}
          </Box>
        </Box>
      ) : (
        <Box mt={0} pt={0} mb={0} pb={0}>
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
