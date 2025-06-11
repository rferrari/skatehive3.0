"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Image,
  Flex,
  Icon,
  Avatar,
  IconButton,
  Link,
  ButtonGroup,
} from "@chakra-ui/react";
import useHiveAccount from "@/hooks/useHiveAccount";
import { FaGlobe, FaTh, FaBars, FaEdit, FaBookOpen } from "react-icons/fa";
import { getProfile, findPosts } from "@/lib/hive/client-functions";
import LoadingComponent from "../homepage/loadingComponent";
import PostInfiniteScroll from "../blog/PostInfiniteScroll";
import { useAioha } from "@aioha/react-ui";
import EditProfile from "./EditProfile";
import Magazine from "../shared/Magazine";

interface ProfilePageProps {
  username: string;
}

export interface ProfileData {
  profileImage: string;
  coverImage: string;
  website: string;
  name: string;
  followers: number;
  following: number;
  location: string;
  about: string;
  ethereum_address?: string;
  video_parts?: string[];
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
    ethereum_address: "",
    video_parts: [],
  });
  const [posts, setPosts] = useState<any[]>([]);
  const isFetching = useRef(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "magazine">("grid");
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAioha();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const params = useRef([
    username,
    "",
    new Date().toISOString().split(".")[0],
    12,
  ]);

  // Memoize derived values
  const isOwner = useMemo(() => user === username, [user, username]);

  // Memoized callbacks
  const handleViewModeChange = useCallback((mode: "grid" | "list" | "magazine") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("profileViewMode", mode);
    }
  }, []);

  const handleEditModalOpen = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  // Optimized profile data update callback
  const updateProfileData = useCallback((newData: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...newData }));
  }, []);

  const speakDescription = useCallback(() => {
    if ("speechSynthesis" in window && profileData.about) {
      const utterance = new window.SpeechSynthesisUtterance(profileData.about);
      utterance.rate = 0.3;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [profileData.about]);

  // Load saved view mode from localStorage on mount
  useEffect(() => {
    const savedView =
      typeof window !== "undefined"
        ? localStorage.getItem("profileViewMode")
        : null;
    if (savedView === "grid" || savedView === "list" || savedView === "magazine") {
      setViewMode(savedView);
    }
  }, []);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPosts = useCallback(async () => {
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
        console.log("Updated params for next fetch:", params.current);
      }
      isFetching.current = false;
    } catch (err) {
      console.error("Failed to fetch posts", err);
      isFetching.current = false;
    }
  }, [username]);

  // Reset posts when username changes
  useEffect(() => {
    setPosts([]);
    params.current = [username, "", new Date().toISOString().split(".")[0], 12];
    fetchPosts();
  }, [username, fetchPosts]);

  // Optimized profile info fetching
  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        const profileInfo = await getProfile(username);
        let profileImage = "";
        let coverImage = "";
        let website = "";
        let ethereum_address = "";
        let video_parts: string[] = [];

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

        if (hiveAccount?.json_metadata) {
          try {
            const parsedMetadata = JSON.parse(hiveAccount.json_metadata);
            ethereum_address = parsedMetadata?.extensions?.eth_address || "";
            video_parts = parsedMetadata?.extensions?.video_parts || [];
          } catch (err) {
            console.error("Failed to parse json_metadata", err);
          }
        }

        // Batch update to prevent multiple re-renders
        setProfileData({
          profileImage,
          coverImage,
          website,
          name: profileInfo?.metadata?.profile?.name || username,
          followers: profileInfo?.stats?.followers || 0,
          following: profileInfo?.stats?.following || 0,
          location: profileInfo?.metadata?.profile?.location || "",
          about: profileInfo?.metadata?.profile?.about || "",
          ethereum_address: ethereum_address,
          video_parts: video_parts,
        });
      } catch (err) {
        console.error("Failed to fetch profile info", err);
      }
    };

    if (username && hiveAccount) {
      fetchProfileInfo();
    }
  }, [username, hiveAccount]);

  // Memoized components
  const ProfileHeader = useMemo(
    () => (
      <Box position="relative" w="100%" p={0} m={0}>
        <Box
          position={{ base: "static", md: "absolute" }}
          left={{ base: "auto", md: 0 }}
          top={{ base: "auto", md: "-60px" }}
          transform={{ base: "none", md: "none" }}
          display="flex"
          flexDirection="row"
          alignItems="center"
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
                bg="gray.800"
                color="white"
                px={4}
                py={3}
                borderRadius="lg"
                boxShadow="md"
                maxW={{ base: "95vw", sm: "400px", md: "500px" }}
                fontSize="md"
                fontStyle="italic"
                wordBreak="break-word"
                overflowWrap="anywhere"
                cursor="pointer"
                onClick={speakDescription}
                _after={{
                  content: '""',
                  position: "absolute",
                  left: "-16px",
                  top: "24px",
                  borderWidth: "8px",
                  borderStyle: "solid",
                  borderColor: "transparent",
                  borderRightColor: "var(--chakra-colors-gray-800, #2D3748)",
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
            Following: {profileData.following} | Followers:{" "}
            {profileData.followers} | Location: {profileData.location}
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

            {/* Edit icon for profile owner - now outside website conditional */}
            {isOwner && (
              <IconButton
                aria-label="Edit Profile"
                icon={<FaEdit />}
                size="sm"
                variant="ghost"
                colorScheme="primary"
                onClick={handleEditModalOpen}
              />
            )}
          </Flex>
        </Flex>
      </Box>
    ),
    [profileData, username, speakDescription, isOwner, handleEditModalOpen]
  );

  const ViewToggle = useMemo(
    () =>
      !isMobile && (
        <Flex justifyContent="center" alignItems="center" mt={4} mb={4}>
          <Box
            bg="gray.800"
            borderRadius="full"
            boxShadow="md"
            px={2}
            py={1}
            display="flex"
            alignItems="center"
            border="1px solid"
            borderColor="gray.700"
          >
            <ButtonGroup isAttached variant="ghost" size="md">
              <IconButton
                aria-label="Grid view"
                icon={<FaTh />}
                variant={viewMode === "grid" ? "solid" : "ghost"}
                colorScheme={viewMode === "grid" ? "primary" : undefined}
                onClick={() => handleViewModeChange("grid")}
                isActive={viewMode === "grid"}
                borderRadius="full"
                _hover={{ bg: "gray.700" }}
                _active={{ bg: "primary.600" }}
              />
              <IconButton
                aria-label="List view"
                icon={<FaBars />}
                variant={viewMode === "list" ? "solid" : "ghost"}
                colorScheme={viewMode === "list" ? "primary" : undefined}
                onClick={() => handleViewModeChange("list")}
                isActive={viewMode === "list"}
                borderRadius="full"
                _hover={{ bg: "gray.700" }}
                _active={{ bg: "primary.600" }}
              />
              <IconButton
                aria-label={viewMode === "magazine" ? "Show Posts" : "Show Magazine"}
                icon={<FaBookOpen />}
                variant={viewMode === "magazine" ? "solid" : "ghost"}
                colorScheme={viewMode === "magazine" ? "primary" : undefined}
                onClick={() => handleViewModeChange(viewMode === "magazine" ? "grid" : "magazine")}
                isActive={viewMode === "magazine"}
                borderRadius="full"
                _hover={{ bg: "gray.700" }}
                _active={{ bg: "primary.600" }}
              />
            </ButtonGroup>
          </Box>
        </Flex>
      ),
    [isMobile, viewMode, handleViewModeChange]
  );

  if (isLoading || !hiveAccount) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <LoadingComponent />
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
    <Box
      id="scrollableDiv"
      color="text"
      maxW="container.lg"
      mx="auto"
      p={0}
      m={0}
      maxH="100vh"
      overflowY="auto"
      sx={{
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {/* Cover Image */}
      <Box
        position="relative"
        w={{ base: "100vw", md: "100%" }}
        maxW={{ base: "100vw", md: "container.lg" }}
        mx={{ base: "unset", md: "auto" }}
        overflow="hidden"
        height={{ base: "120px", md: "200px" }}
        p={0}
        m={0}
        mt={4}
      >
        <Image
          src={profileData.coverImage}
          alt={`${username} cover`}
          w={{ base: "100vw", md: "100%" }}
          h={{ base: "120px", md: "200px" }}
          objectFit="cover"
          fallback={<Box height="100%" />}
        />
      </Box>

      {ProfileHeader}
      {ViewToggle}

      {/* Posts or Magazine */}
      {viewMode === "magazine" ? (
        <Magazine posts={posts} isLoading={isLoading} error={error} />
      ) : (
        <PostInfiniteScroll
          allPosts={posts}
          fetchPosts={fetchPosts}
          viewMode={viewMode}
          context="profile"
          hideAuthorInfo={true}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfile
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        profileData={profileData}
        onProfileUpdate={updateProfileData}
        username={username}
      />
    </Box>
  );
}
