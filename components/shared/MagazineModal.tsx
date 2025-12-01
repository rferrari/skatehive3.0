"use client";
import React, { useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  IconButton,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import Magazine from "./Magazine";
import { Discussion } from "@hiveio/dhive";

interface MagazineModalProps {
  isOpen: boolean;
  onClose: () => void;
  // For username-based magazine (profile view) - can provide posts directly
  username?: string;
  posts?: Discussion[];
  isLoading?: boolean;
  // For tag-based magazine (blog view)
  magazineTag?: { tag: string; limit: number }[];
  magazineQuery?: string;
  // Custom magazine cover for user profiles
  zineCover?: string;
  // User profile data
  userProfileImage?: string;
  userName?: string;
  userLocation?: string;
}

/**
 * Unified MagazineModal component that can be used for both profile and blog magazine views.
 *
 * Usage:
 * - For profile magazine: <MagazineModal username="skater123" posts={posts} isLoading={isLoading} />
 *   (Uses pre-fetched user posts from useProfilePosts hook)
 * - For blog magazine: <MagazineModal magazineTag={[{tag: "skatehive", limit: 20}]} magazineQuery="trending" />
 *   (Fetches trending posts from the community, Bridge API max limit is 20)
 */
const MagazineModal = React.memo(function MagazineModal({
  isOpen,
  onClose,
  username,
  posts,
  isLoading,
  magazineTag,
  magazineQuery = "created",
  zineCover,
  userProfileImage,
  userName,
  userLocation,
}: MagazineModalProps) {
  const [currentQuery, setCurrentQuery] = React.useState(magazineQuery);

  // Memoize the tag calculation to prevent unnecessary re-renders
  const tag = useMemo(() => {
    return username ? [{ tag: username, limit: 20 }] : magazineTag || []; // Bridge API max limit is 20
  }, [username, magazineTag]);

  // If posts are provided (profile view), use them directly
  // Otherwise, let Magazine component fetch posts using tag/query (blog view)
  const magazineProps = useMemo(() => {
    if (posts !== undefined) {
      // Don't pass tag/query when providing posts directly
      return {
        posts,
        isLoading,
        error: null,
        zineCover,
        username,
        userProfileImage,
        userName,
        userLocation,
      };
    }
    return {
      tag,
      query: currentQuery,
    };
  }, [
    posts,
    isLoading,
    tag,
    currentQuery,
    zineCover,
    username,
    userProfileImage,
    userName,
    userLocation,
  ]);

  if (!isOpen) return null; // Don't render anything when closed

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      motionPreset="none"
      trapFocus={true}
      blockScrollOnMount={false}
      returnFocusOnClose={false}
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent
        p={0}
        m={0}
        maxW="100vw"
        maxH="100vh"
        borderRadius={0}
        overflow="hidden"
        bg="background"
        position="relative"
        willChange="transform"
      >
        <IconButton
          aria-label="Back"
          icon={<ArrowBackIcon />}
          position="absolute"
          top={4}
          left={4}
          zIndex={10}
          onClick={onClose}
          bg="background"
          color="primary"
          _hover={{ bg: "muted" }}
          size="lg"
        />
        <Magazine {...magazineProps} />
      </ModalContent>
    </Modal>
  );
});

export default MagazineModal;
