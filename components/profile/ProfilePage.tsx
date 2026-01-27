"use client";
import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
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
import ZoraTokensView from "./ZoraTokensView";
import SoftSnapsGrid from "./SoftSnapsGrid";

// Import custom hooks
import useProfileData from "@/hooks/useProfileData";
import useFollowStatus from "@/hooks/useFollowStatus";
import useProfilePosts from "@/hooks/useProfilePosts";
import useViewMode from "@/hooks/useViewMode";
import useIsMobile from "@/hooks/useIsMobile";
import useUserbaseProfile from "@/hooks/useUserbaseProfile";
import useUserbaseSoftPosts from "@/hooks/useUserbaseSoftPosts";
import { useTranslations } from "@/lib/i18n/hooks";
import { Discussion } from "@hiveio/dhive";

// Memoized SnapsGrid to prevent unnecessary re-renders
const MemoizedSnapsGrid = memo(function MemoizedSnapsGrid({
  username,
}: {
  username: string;
}) {
  return <SnapsGrid username={username} />;
});

// Memoized PostInfiniteScroll to prevent re-renders
const MemoizedPostInfiniteScroll = memo(function MemoizedPostInfiniteScroll(
  props: any
) {
  return <PostInfiniteScroll {...props} />;
});

// Optimized content views component with conditional mounting to reduce re-renders
const ContentViews = memo(function ContentViews({
  viewMode,
  postProps,
  videoPartsProps,
  username,
  snapsUsername,
  softSnaps,
  ethereumAddress,
  hasHiveProfile,
}: {
  viewMode: string;
  postProps: {
    allPosts: any[];
    fetchPosts: () => Promise<void>;
    viewMode: "grid" | "list";
    context: "profile";
    hideAuthorInfo: boolean;
    isLoading: boolean;
    hasMore: boolean;
  };
  videoPartsProps: {
    profileData: ProfileData;
    username: string;
    onProfileUpdate: (data: Partial<ProfileData>) => void;
  };
  username: string;
  snapsUsername?: string | null;
  softSnaps?: Discussion[];
  ethereumAddress?: string;
  hasHiveProfile: boolean;
}) {
  // Use conditional rendering with style display to avoid unmounting/remounting
  return (
    <>
      {hasHiveProfile && (
        <>
          <Box display={viewMode === "videoparts" ? "block" : "none"}>
            {viewMode === "videoparts" && <VideoPartsView {...videoPartsProps} />}
          </Box>

          <Box display={viewMode === "snaps" ? "block" : "none"}>
            {viewMode === "snaps" && (
              <>
                {snapsUsername ? (
                  <MemoizedSnapsGrid username={snapsUsername} />
                ) : (
                  <SoftSnapsGrid snaps={softSnaps || []} />
                )}
              </>
            )}
          </Box>
        </>
      )}

      <Box display={viewMode === "tokens" ? "block" : "none"}>
        {viewMode === "tokens" && (
          <ZoraTokensView ethereumAddress={ethereumAddress} />
        )}
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
  const { profile: userbaseProfile, isLoading: userbaseLoading } =
    useUserbaseProfile(username);
  const userbaseUser = userbaseProfile?.user ?? null;
  const userbaseIdentities = useMemo(
    () => userbaseProfile?.identities ?? [],
    [userbaseProfile?.identities]
  );
  const userbaseMatch = userbaseProfile?.match ?? null;
  const hiveIdentity = userbaseIdentities.find((item) => item.type === "hive");
  const evmIdentity = userbaseIdentities.find((item) => item.type === "evm");
  const hiveIdentityHandle = hiveIdentity?.handle || null;
  const evmIdentityAddress = evmIdentity?.address || null;
  const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(username);
  const hiveLookupHandle = hiveIdentityHandle || (isEvmAddress ? "" : username);
  const { hiveAccount, isLoading, error } = useHiveAccount(hiveLookupHandle);
  const { user } = useAioha();
  const tCommon = useTranslations("common");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Custom hooks
  const { profileData, updateProfileData } = useProfileData(
    hiveLookupHandle,
    hiveAccount
  );
  const followTarget = hiveAccount ? hiveLookupHandle : "";
  const { isFollowing, isFollowLoading, updateFollowing, updateLoading } =
    useFollowStatus(user, followTarget);
  const hivePostsHandle = hiveIdentityHandle || (hiveAccount ? hiveLookupHandle : "");
  const {
    posts: hivePosts,
    fetchPosts: fetchHivePosts,
    isLoading: postsLoading,
  } = useProfilePosts(hivePostsHandle);
  const { viewMode, handleViewModeChange, closeMagazine } = useViewMode();
  const isMobile = useIsMobile();

  // Debounce timer ref for view mode changes
  const viewModeTimer = useRef<NodeJS.Timeout | null>(null);
  const isTransitioning = useRef(false);

  // Memoize derived values
  const isHiveProfile =
    !!hiveAccount &&
    hiveLookupHandle &&
    hiveLookupHandle.toLowerCase() === username.toLowerCase();
  const canShowHiveViews = isHiveProfile || !!hivePostsHandle;
  const allowSoftPosts =
    userbaseUser &&
    (userbaseMatch === "hive" || (!isHiveProfile && userbaseMatch === "handle"));
  const {
    posts: softPosts,
    isLoading: softPostsLoading,
  } = useUserbaseSoftPosts(allowSoftPosts ? userbaseUser?.id : null);
  const softSnaps = useMemo(
    () => softPosts.filter((post) => (post as any).__softType === "snap"),
    [softPosts]
  );
  const softPages = useMemo(
    () => softPosts.filter((post) => (post as any).__softType !== "snap"),
    [softPosts]
  );
  const hasSoftSnaps = softSnaps.length > 0;
  const isOwner = useMemo(
    () => (isHiveProfile ? user === hiveLookupHandle : false),
    [user, hiveLookupHandle, isHiveProfile]
  );

  const resolvedEthereumAddress =
    profileData.ethereum_address ||
    evmIdentityAddress ||
    (isEvmAddress ? username : "");

  const liteProfileData = useMemo<ProfileData>(() => {
    if (userbaseUser) {
      return {
        profileImage: userbaseUser.avatar_url || "",
        coverImage: userbaseUser.cover_url || "",
        website: "",
        name:
          userbaseUser.handle ||
          userbaseUser.display_name ||
          username ||
          "Skater",
        followers: 0,
        following: 0,
        location: userbaseUser.location || "",
        about: userbaseUser.bio || "",
        ethereum_address: evmIdentityAddress || "",
        video_parts: [],
        vote_weight: 51,
        vp_percent: "",
        rc_percent: "",
        zineCover: "",
        svs_profile: "",
      };
    }
    if (isEvmAddress) {
      return {
        profileImage: "",
        coverImage: "",
        website: "",
        name: username,
        followers: 0,
        following: 0,
        location: "",
        about: "",
        ethereum_address: username,
        video_parts: [],
        vote_weight: 51,
        vp_percent: "",
        rc_percent: "",
        zineCover: "",
        svs_profile: "",
      };
    }
    return {
      profileImage: "",
      coverImage: "",
      website: "",
      name: username,
      followers: 0,
      following: 0,
      location: "",
      about: "",
      ethereum_address: "",
      video_parts: [],
      vote_weight: 51,
      vp_percent: "",
      rc_percent: "",
      zineCover: "",
      svs_profile: "",
    };
  }, [userbaseUser, evmIdentityAddress, username, isEvmAddress]);

  const activeProfileData = useMemo(() => {
    if (isHiveProfile) {
      return {
        ...profileData,
        ethereum_address: resolvedEthereumAddress,
      };
    }
    return {
      ...liteProfileData,
      ethereum_address: resolvedEthereumAddress,
    };
  }, [isHiveProfile, profileData, liteProfileData, resolvedEthereumAddress]);

  // Throttled close handler to prevent rapid clicking
  const throttledCloseMagazine = useCallback(() => {
    closeMagazine();
  }, [closeMagazine]);

  // Modal handlers - Stable references to prevent re-renders
  const handleEditModalOpen = useCallback(() => setIsEditModalOpen(true), []);
  const handleEditModalClose = useCallback(() => setIsEditModalOpen(false), []);

  // Optimized view mode change handler with debouncing to prevent rapid switches
  const memoizedViewModeChange = useCallback(
    (
      mode: "grid" | "list" | "magazine" | "videoparts" | "snaps" | "tokens"
    ) => {
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
          window.requestIdleCallback(
            () => {
              handleViewModeChange(mode);
              // Reset transition flag after a brief delay
              setTimeout(() => {
                isTransitioning.current = false;
              }, 100);
            },
            { timeout: 100 }
          );
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
  const combinedPosts = useMemo(() => {
    // Skip expensive sorting if we're in snaps, videoparts or tokens mode
    if (!["grid", "list", "magazine"].includes(viewMode)) {
      return [];
    }
    return [...hivePosts, ...softPages].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
  }, [hivePosts, softPages, viewMode]);

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
        isLoading: false,
        hasMore: false,
      };
    }

    return {
      allPosts: combinedPosts,
      fetchPosts: hivePostsHandle ? fetchHivePosts : () => Promise.resolve(),
      viewMode: viewMode as "grid" | "list",
      context: "profile" as const,
      hideAuthorInfo: true,
      isLoading: postsLoading || softPostsLoading,
      hasMore: Boolean(hivePostsHandle),
    };
  }, [
    combinedPosts,
    fetchHivePosts,
    viewMode,
    postsLoading,
    softPostsLoading,
    hivePostsHandle,
  ]);

  // Memoize video parts props
  const videoPartsProps = useMemo(
    () => ({
      profileData: hiveAccount ? profileData : activeProfileData,
      username: hiveLookupHandle || username,
      onProfileUpdate: updateProfileData,
    }),
    [activeProfileData, hiveAccount, profileData, hiveLookupHandle, username, updateProfileData]
  );

  const debugPayload = useMemo(() => {
    // Only expose full debug payload in development to prevent sensitive data leakage
    if (process.env.NODE_ENV !== "development") {
      return null;
    }

    return {
      username,
      viewMode,
      isHiveProfile,
      canShowHiveViews,
      hiveLookupHandle,
      hiveIdentityHandle,
      hivePostsHandle,
      userbaseMatch,
      userbaseUser,
      userbaseIdentities,
      resolvedEthereumAddress,
      hiveAccountName: hiveAccount?.name || null,
      hiveAccountMetadata: hiveAccount?.metadata || null,
      profileData: activeProfileData,
      liteProfileData,
    };
  }, [
    username,
    viewMode,
    isHiveProfile,
    canShowHiveViews,
    hiveLookupHandle,
    hiveIdentityHandle,
    hivePostsHandle,
    userbaseMatch,
    userbaseUser,
    userbaseIdentities,
    resolvedEthereumAddress,
    hiveAccount,
    activeProfileData,
    liteProfileData,
  ]);

  const headerUsername = useMemo(() => {
    if (isHiveProfile) {
      return hiveLookupHandle || username;
    }
    if (userbaseUser?.handle) {
      return userbaseUser.handle;
    }
    return username;
  }, [isHiveProfile, hiveLookupHandle, username, userbaseUser?.handle]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (viewModeTimer.current) {
        clearTimeout(viewModeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (canShowHiveViews || hasSoftSnaps) return;
    if (["snaps", "videoparts", "magazine"].includes(viewMode)) {
      handleViewModeChange(resolvedEthereumAddress ? "tokens" : "grid");
    }
  }, [
    canShowHiveViews,
    hasSoftSnaps,
    viewMode,
    handleViewModeChange,
    resolvedEthereumAddress,
  ]);

  const isProfileResolved =
    isHiveProfile || Boolean(userbaseUser) || isEvmAddress;
  if (!isProfileResolved && (isLoading || userbaseLoading)) {
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

  if (!isProfileResolved && !isLoading && !userbaseLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Alert status="error" borderRadius="md" variant="solid">
          <AlertIcon />
          {error || tCommon("profileNotFound")}
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
            hiveUsername={hiveLookupHandle || username}
            posts={combinedPosts}
            zineCover={activeProfileData.zineCover}
            userProfileImage={activeProfileData.profileImage}
            displayName={activeProfileData.name}
            userLocation={activeProfileData.location}
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
              coverImage={activeProfileData.coverImage}
              username={username}
            />

            {/* Profile Header */}
            <ProfileHeader
              profileData={activeProfileData}
              username={headerUsername}
              isOwner={isOwner}
              user={isHiveProfile ? user : null}
              {...followProps}
              onEditModalOpen={handleEditModalOpen}
              debugPayload={debugPayload}
            />

            {/* View Mode Selector */}
            <ViewModeSelector
              viewMode={viewMode}
              onViewModeChange={memoizedViewModeChange}
              isMobile={isMobile}
              hasEthereumAddress={!!resolvedEthereumAddress}
              hasHiveProfile={canShowHiveViews || hasSoftSnaps}
            />

            {/* Content Views - Optimized conditional rendering */}
            <ContentViews
              viewMode={viewMode}
              postProps={postProps}
              videoPartsProps={videoPartsProps}
              username={username}
              snapsUsername={hivePostsHandle || null}
              softSnaps={softSnaps}
              ethereumAddress={resolvedEthereumAddress}
              hasHiveProfile={canShowHiveViews || hasSoftSnaps}
            />
          </Box>
        </Container>
      </Center>

      {/* Edit Profile Modal - Only render when modal is open */}
      {isEditModalOpen && (
        <EditProfile
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          profileData={activeProfileData}
          onProfileUpdate={updateProfileData}
          username={hiveLookupHandle || username}
        />
      )}
    </>
  );
});

export default ProfilePage;
