"use client";
import React, { useState, useMemo, useCallback, memo } from "react";
import { Box, Alert, AlertIcon, Container, Center } from "@chakra-ui/react";
import useHiveAccount from "@/hooks/useHiveAccount";
import LoadingComponent from "../homepage/loadingComponent";
import PostInfiniteScroll from "../blog/PostInfiniteScroll";
import { useAioha } from "@aioha/react-ui";
import EditProfile from "./EditProfile";
import { VideoPart } from "@/types/VideoPart";
import VideoPartsView from "./VideoPartsView";

// Import modular components
import ProfileCoverImage from "./ProfileCoverImage";
import ProfileHeader from "./ProfileHeader";
import ViewModeSelector from "./ViewModeSelector";
import MagazineModal from "./MagazineModal";
import SnapsGrid from "./SnapsGrid";

// Import custom hooks
import useProfileData from "@/hooks/useProfileData";
import useFollowStatus from "@/hooks/useFollowStatus";
import useProfilePosts from "@/hooks/useProfilePosts";
import useViewMode from "@/hooks/useViewMode";
import useIsMobile from "@/hooks/useIsMobile";

// Memoized SnapsGrid to prevent unnecessary re-renders
const MemoizedSnapsGrid = memo(function MemoizedSnapsGrid({
  username,
}: {
  username: string;
}) {
  return <SnapsGrid username={username} />;
});

// Optimized content views component to reduce re-renders
const ContentViews = memo(function ContentViews({
  viewMode,
  postProps,
  videoPartsProps,
  username,
}: {
  viewMode: string;
  postProps: {
    allPosts: any[];
    fetchPosts: () => Promise<void>;
    viewMode: "grid" | "list";
    context: "profile";
    hideAuthorInfo: boolean;
  };
  videoPartsProps: {
    profileData: ProfileData;
    username: string;
    onProfileUpdate: (data: Partial<ProfileData>) => void;
  };
  username: string;
}) {
  switch (viewMode) {
    case "videoparts":
      return <VideoPartsView {...videoPartsProps} />;
    case "snaps":
      return <MemoizedSnapsGrid username={username} />;
    case "magazine":
      return null; // Magazine is handled separately
    default:
      return <PostInfiniteScroll {...postProps} />;
  }
});

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
  vote_weight?: number;
  vp_percent?: string;
  rc_percent?: string;
}

const ProfilePage = memo(function ProfilePage({ username }: ProfilePageProps) {
  const { hiveAccount, isLoading, error } = useHiveAccount(username);
  const { user } = useAioha();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Custom hooks
  const { profileData, updateProfileData } = useProfileData(
    username,
    hiveAccount
  );
  const { isFollowing, isFollowLoading, updateFollowing, updateLoading } =
    useFollowStatus(user, username);
  const { posts, fetchPosts } = useProfilePosts(username);
  const { viewMode, handleViewModeChange, closeMagazine } = useViewMode();
  const isMobile = useIsMobile();

  // Memoize derived values
  const isOwner = useMemo(() => user === username, [user, username]);

  // Modal handlers - Stable references to prevent re-renders
  const handleEditModalOpen = useCallback(() => setIsEditModalOpen(true), []);
  const handleEditModalClose = useCallback(() => setIsEditModalOpen(false), []);

  // Memoize view mode change handler to prevent unnecessary re-renders
  const memoizedViewModeChange = useCallback(
    (mode: "grid" | "list" | "magazine" | "videoparts" | "snaps") => {
      handleViewModeChange(mode);
    },
    [handleViewModeChange]
  );

  // Memoize follow-related props to prevent ProfileHeader re-renders
  const followProps = useMemo(
    () => ({
      isFollowing,
      isFollowLoading,
      onFollowingChange: updateFollowing,
      onLoadingChange: updateLoading,
    }),
    [isFollowing, isFollowLoading, updateFollowing, updateLoading]
  );

  // Memoize post-related props
  const postProps = useMemo(
    () => ({
      allPosts: posts,
      fetchPosts,
      viewMode: viewMode as "grid" | "list",
      context: "profile" as const,
      hideAuthorInfo: true,
    }),
    [posts, fetchPosts, viewMode]
  );

  // Memoize video parts props
  const videoPartsProps = useMemo(
    () => ({
      profileData,
      username,
      onProfileUpdate: updateProfileData,
    }),
    [profileData, username, updateProfileData]
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
      {/* Magazine Modal - Only render when needed */}
      {viewMode === "magazine" && (
        <MagazineModal
          isOpen={true}
          onClose={closeMagazine}
          username={username}
        />
      )}
      <Center>
        <Container maxW="container.md" p={0} m={0}>
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
            {/* Cover Image - Now enabled for mobile too */}
            <ProfileCoverImage
              coverImage={profileData.coverImage}
              username={username}
            />

            {/* Profile Header */}
            <ProfileHeader
              profileData={profileData}
              username={username}
              isOwner={isOwner}
              user={user}
              {...followProps}
              onEditModalOpen={handleEditModalOpen}
            />

            {/* View Mode Selector */}
            <ViewModeSelector
              viewMode={viewMode}
              onViewModeChange={memoizedViewModeChange}
              isMobile={isMobile}
            />

            {/* Content Views - Optimized conditional rendering */}
            <ContentViews
              viewMode={viewMode}
              postProps={postProps}
              videoPartsProps={videoPartsProps}
              username={username}
            />
          </Box>
        </Container>
      </Center>

      {/* Edit Profile Modal - Only render when modal is open */}
      {isEditModalOpen && (
        <EditProfile
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          profileData={profileData}
          onProfileUpdate={updateProfileData}
          username={username}
        />
      )}
    </>
  );
});

export default ProfilePage;
