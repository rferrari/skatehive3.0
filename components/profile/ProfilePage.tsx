"use client";
import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
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
import MagazineModal from "../shared/MagazineModal";
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

// Memoized PostInfiniteScroll to prevent re-renders
const MemoizedPostInfiniteScroll = memo(function MemoizedPostInfiniteScroll(props: any) {
  return <PostInfiniteScroll {...props} />;
});

// Optimized content views component with conditional mounting to reduce re-renders
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
  // Use conditional rendering with style display to avoid unmounting/remounting
  return (
    <>
      <Box display={viewMode === "videoparts" ? "block" : "none"}>
        {viewMode === "videoparts" && <VideoPartsView {...videoPartsProps} />}
      </Box>
      
      <Box display={viewMode === "snaps" ? "block" : "none"}>
        {viewMode === "snaps" && <MemoizedSnapsGrid username={username} />}
      </Box>
      
      <Box display={["grid", "list"].includes(viewMode) ? "block" : "none"}>
        {["grid", "list"].includes(viewMode) && (
          <MemoizedPostInfiniteScroll 
            key={`posts-${viewMode}`} 
            {...postProps} 
          />
        )}
      </Box>
    </>
  );
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
  zineCover?: string;
  svs_profile?: string;
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
  const { posts, fetchPosts, isLoading: postsLoading } = useProfilePosts(username);
  const { viewMode, handleViewModeChange, closeMagazine } = useViewMode();
  const isMobile = useIsMobile();
  
  // Debounce timer ref for view mode changes
  const viewModeTimer = useRef<NodeJS.Timeout | null>(null);
  const isTransitioning = useRef(false);

  // Memoize derived values
  const isOwner = useMemo(() => user === username, [user, username]);

  // Throttled close handler to prevent rapid clicking
  const throttledCloseMagazine = useCallback(() => {
    closeMagazine();
  }, [closeMagazine]);

  // Modal handlers - Stable references to prevent re-renders
  const handleEditModalOpen = useCallback(() => setIsEditModalOpen(true), []);
  const handleEditModalClose = useCallback(() => setIsEditModalOpen(false), []);

  // Optimized view mode change handler with debouncing to prevent rapid switches
  const memoizedViewModeChange = useCallback(
    (mode: "grid" | "list" | "magazine" | "videoparts" | "snaps") => {
      // Prevent rapid changes
      if (isTransitioning.current) return;
      
      // Clear previous timer
      if (viewModeTimer.current) {
        clearTimeout(viewModeTimer.current);
      }
      
      isTransitioning.current = true;
      
      // Debounce the view mode change to prevent rapid switching
      viewModeTimer.current = setTimeout(() => {
        // Use requestIdleCallback if available for non-blocking execution
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            handleViewModeChange(mode);
            // Reset transition flag after a brief delay
            setTimeout(() => {
              isTransitioning.current = false;
            }, 100);
          }, { timeout: 100 });
        } else {
          // Fallback to requestAnimationFrame
          requestAnimationFrame(() => {
            handleViewModeChange(mode);
            setTimeout(() => {
              isTransitioning.current = false;
            }, 100);
          });
        }
      }, 100); // Reduced to 100ms for better responsiveness
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

  // Memoize chronologically sorted posts - only when needed for grid/list views
  const sortedPosts = useMemo(() => {
    // Skip expensive sorting if we're in snaps or videoparts mode
    if (!["grid", "list", "magazine"].includes(viewMode)) {
      return [];
    }
    return [...posts].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [posts, viewMode]);

  // Memoize post-related props - only when needed for grid/list views
  const postProps = useMemo(() => {
    // Skip creating props if not in grid/list mode
    if (!["grid", "list"].includes(viewMode)) {
      return {
        allPosts: [],
        fetchPosts: () => Promise.resolve(),
        viewMode: "grid" as const,
        context: "profile" as const,
        hideAuthorInfo: true,
      };
    }
    
    return {
      allPosts: sortedPosts,
      fetchPosts,
      viewMode: viewMode as "grid" | "list",
      context: "profile" as const,
      hideAuthorInfo: true,
    };
  }, [sortedPosts, fetchPosts, viewMode]);

  // Memoize video parts props
  const videoPartsProps = useMemo(
    () => ({
      profileData,
      username,
      onProfileUpdate: updateProfileData,
    }),
    [profileData, username, updateProfileData]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (viewModeTimer.current) {
        clearTimeout(viewModeTimer.current);
      }
    };
  }, []);

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
      {/* Magazine Modal - Only render when needed with performance optimization */}
      {viewMode === "magazine" && (
        <MagazineModal
          isOpen={viewMode === "magazine"}
          onClose={throttledCloseMagazine}
          username={username}
          posts={sortedPosts} // Use pre-sorted posts
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
