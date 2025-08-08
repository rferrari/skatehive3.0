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
}

/**
 * Unified MagazineModal component that can be used for both profile and blog magazine views.
 *
 * Usage:
 * - For profile magazine: <MagazineModal username="skater123" posts={posts} isLoading={isLoading} />
 *   (Uses pre-fetched user posts from useProfilePosts hook)
 * - For blog magazine: <MagazineModal magazineTag={[{tag: "skatehive", limit: 30}]} magazineQuery="trending" />
 *   (Fetches trending posts from the community)
 */
const MagazineModal = React.memo(function MagazineModal({
  isOpen,
  onClose,
  username,
  posts,
  isLoading,
  magazineTag,
  magazineQuery = "created",
}: MagazineModalProps) {
  if (!isOpen) return null; // Don't render anything when closed

  // Memoize the tag calculation to prevent unnecessary re-renders
  const tag = useMemo(() => {
    return username ? [{ tag: username, limit: 30 }] : magazineTag || [];
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
      };
    }
    return {
      tag,
      query: magazineQuery,
    };
  }, [posts, isLoading, tag, magazineQuery]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="none">
      <ModalOverlay />
      <ModalContent
        p={0}
        m={0}
        maxW="100vw"
        maxH="100vh"
        borderRadius={0}
        overflow="hidden"
        bg="background"
        position="relative"
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
