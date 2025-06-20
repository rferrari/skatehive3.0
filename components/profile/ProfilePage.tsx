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
  Button,
  Spinner,
  useToast,
  useToken,
  Modal,
  ModalOverlay,
  ModalContent,
} from "@chakra-ui/react";
import useHiveAccount from "@/hooks/useHiveAccount";
import { FaGlobe, FaTh, FaBars, FaEdit, FaBookOpen, FaVideo } from "react-icons/fa";
import { MdPersonAdd } from "react-icons/md";
import { TbUserCheck } from "react-icons/tb";
import { getProfile, findPosts, checkFollow, changeFollow } from "@/lib/hive/client-functions";
import LoadingComponent from "../homepage/loadingComponent";
import PostInfiniteScroll from "../blog/PostInfiniteScroll";
import { useAioha } from "@aioha/react-ui";
import EditProfile from "./EditProfile";
import Magazine from "../shared/Magazine";
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoPart } from "@/types/VideoPart";
import VideoPartsView from "./VideoPartsView";

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
  video_parts?: VideoPart[];
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "magazine" | "videoparts">("grid");
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAioha();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const buttonStyle = {
    "&:hover": {
      boxShadow: "4px 4px 6px var(--chakra-colors-primary-alpha)",
    },
    "&:active": {
      transform: "translate(2px, 2px)",
      boxShadow: "2px 2px 3px var(--chakra-colors-primary-alpha)",
    },
  };

  const params = useRef([
    username,
    "",
    new Date().toISOString().split(".")[0],
    12,
  ]);

  // Memoize derived values
  const isOwner = useMemo(() => user === username, [user, username]);

  // Memoized callbacks
  const handleViewModeChange = useCallback((mode: "grid" | "list" | "magazine" | "videoparts") => {
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

  // Replace the useEffect that loads the saved view mode
  useEffect(() => {
    let initialView = "grid";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "magazine") {
        initialView = "magazine";
      }
    }
    setViewMode(initialView as 'grid' | 'list' | 'magazine' | 'videoparts');
  }, []);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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
        let video_parts: VideoPart[] = [];

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

  // Check follow status when user or username changes
  useEffect(() => {
    if (user && username && user !== username) {
      setIsFollowLoading(true);
      checkFollow(user, username)
        .then((res) => setIsFollowing(res))
        .catch(() => setIsFollowing(false))
        .finally(() => setIsFollowLoading(false));
    } else {
      setIsFollowing(null);
    }
  }, [user, username]);

  // Place handleFollowToggle here, before ProfileHeader useMemo
  const handleFollowToggle = useCallback(async () => {
    if (!user || !username || user === username) return;
    const prev = isFollowing;
    const next = !isFollowing;
    setIsFollowing(next);
    setIsFollowLoading(true);
    try {
      const keychainResult = await changeFollow(user, username);
      // Poll for backend confirmation
      let tries = 0;
      const maxTries = 10;
      const poll = async () => {
        tries++;
        const backendState = await checkFollow(user, username);
        if (backendState === next) {
          setIsFollowing(next);
          setIsFollowLoading(false);
        } else if (tries < maxTries) {
          setTimeout(poll, 1000);
        } else {
          setIsFollowing(prev);
          setIsFollowLoading(false);
          toast({
            title: "Follow state not confirmed",
            description: "The blockchain did not confirm your follow/unfollow action. Please try again.",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
      };
      poll();
    } catch (err) {
      setIsFollowing(prev);
      setIsFollowLoading(false);
      toast({
        title: "Follow action failed",
        description: "There was a problem updating your follow status. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }, [user, username, isFollowing, toast]);

  // When viewMode changes, update the URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('view', viewMode);
      router.replace(`?${params.toString()}`);
    }
  }, [viewMode, router]);

  // Back button handler for modal
  const closeMagazine = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('view', 'grid');
      router.replace(`?${params.toString()}`);
    }
    setViewMode('grid');
  };

  const [primary, secondary, background] = useToken('colors', ['primary', 'secondary', 'background']);
  const ProfileHeader = useMemo(
    () => {
      return (
        <Box position="relative" w="100%" p={0} m={0}>
          {/* Follow/Unfollow button in upper right */}
          {!isOwner && user && (
            <Box position="absolute" top={2} right={2} zIndex={3} bg={background} px={0} py={0} borderRadius="md" boxShadow="md">
              <Button
                onClick={handleFollowToggle}
                colorScheme={isFollowing ? 'secondary' : 'primary'}
                isLoading={isFollowLoading}
                isDisabled={isFollowLoading}
                borderRadius="md"
                fontWeight="bold"
                px={2}
                py={0}
                size="xs"
                variant="solid"
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
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
      );
    },
    [profileData, username, speakDescription, isOwner, handleEditModalOpen, isFollowing, isFollowLoading, handleFollowToggle, user]
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
    <>
      {/* Magazine Modal */}
      <Modal isOpen={viewMode === 'magazine'} onClose={closeMagazine} size="full" motionPreset="none">
        <ModalOverlay />
        <ModalContent p={0} m={0} maxW="100vw" maxH="100vh" borderRadius={0} overflow="hidden" bg="background" position="relative">
          <IconButton
            aria-label="Back"
            icon={<ArrowBackIcon />}
            position="absolute"
            top={4}
            left={4}
            zIndex={10}
            onClick={closeMagazine}
            bg="background"
            color="primary"
            _hover={{ bg: "muted" }}
            size="lg"
          />
          <Magazine tag={[{ tag: username, limit: 30 }]} query="created" />
        </ModalContent>
      </Modal>
      {/* Main Profile Content */}
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
        
        <Flex justify="center" align="center" direction="column">
          <ButtonGroup isAttached variant="outline" size="sm" my={4} colorScheme="green">
            <IconButton
              aria-label="Grid view"
              icon={<FaTh />}
              onClick={() => handleViewModeChange("grid")}
              isActive={viewMode === "grid"}
              sx={buttonStyle}
            />
            <IconButton
              aria-label="List view"
              icon={<FaBars />}
              onClick={() => handleViewModeChange("list")}
              isActive={viewMode === "list"}
              sx={buttonStyle}
            />
            <IconButton
              aria-label="Show Magazine"
              icon={<FaBookOpen />}
              onClick={() => handleViewModeChange("magazine")}
              isActive={viewMode === "magazine"}
              sx={buttonStyle}
            />
            <IconButton
              aria-label="Show Videoparts"
              icon={<FaVideo />}
              onClick={() => handleViewModeChange("videoparts")}
              isActive={viewMode === "videoparts"}
              sx={buttonStyle}
            />
          </ButtonGroup>
        </Flex>
        
        {/* Content Views */}
        {viewMode !== "magazine" && viewMode !== "videoparts" && (
          <PostInfiniteScroll
            allPosts={posts}
            fetchPosts={fetchPosts}
            viewMode={viewMode as "grid" | "list"}
            context="profile"
            hideAuthorInfo={true}
          />
        )}
        {viewMode === "videoparts" && (
          <VideoPartsView profileData={profileData} username={username} onProfileUpdate={updateProfileData} />
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
    </>
  );
}
