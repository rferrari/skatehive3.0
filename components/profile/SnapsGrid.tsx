"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Image,
  Text,
  Icon,
  Spinner,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaImage } from "react-icons/fa";
import useUserSnaps from "@/hooks/useUserSnaps";
import VideoPreview from "./VideoPreview";
import SnapModal, { type SnapWithMedia } from "./SnapModal";
import { preloadThumbnails } from "@/hooks/useVideoThumbnail";

interface SnapsGridProps {
  username: string;
}

const SnapGridItem = React.memo(
  ({ snap, onClick }: { snap: SnapWithMedia; onClick: () => void }) => {
    const firstImage = snap.media.images[0];
    const firstVideo = snap.media.videos[0];
    const hasMultipleMedia =
      snap.media.images.length + snap.media.videos.length > 1;

    return (
      <Box
        position="relative"
        cursor="pointer"
        onClick={onClick}
        _hover={{
          transform: "scale(1.02)",
          transition: "transform 0.2s",
        }}
        overflow="hidden" // Contain hover scaling
        bg="muted"
        width="100%"
        maxWidth="100%" // Prevent exceeding parent width
        aspectRatio="1 / 1" // Standardize aspect ratio
        maxHeight="300px" // Limit height to prevent tall content
      >
        {firstImage ? (
          <Image
            src={firstImage}
            alt="Snap content"
            objectFit="cover"
            width="100%"
            height="100%" // Match aspect ratio
            loading="lazy"
            maxWidth="100%"
          />
        ) : firstVideo ? (
          <Box width="100%" maxWidth="100%" height="100%" overflow="hidden">
            <VideoPreview src={firstVideo} onClick={onClick} />
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%" // Match aspect ratio
            bg="muted"
            width="100%"
            maxWidth="100%"
          >
            <Icon as={FaImage} boxSize={8} color="text" />
          </Box>
        )}

        {/* Multiple media indicator */}
        {hasMultipleMedia && (
          <Box
            position="absolute"
            top={2}
            right={2}
            bg="blackAlpha.700"
            borderRadius="full"
            p={1}
          >
            <Icon as={FaImage} color="white" boxSize={3} />
          </Box>
        )}
      </Box>
    );
  }
);

SnapGridItem.displayName = "SnapGridItem";

export default function SnapsGrid({ username }: SnapsGridProps) {
  const { snaps, isLoading, hasMore, loadMoreSnaps } = useUserSnaps(username);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSnapIndex, setSelectedSnapIndex] = useState<number>(0);
  const [hasCheckedUrl, setHasCheckedUrl] = useState<boolean>(false);

  // Preload thumbnails for video snaps to improve perceived performance
  useEffect(() => {
    if (snaps.length > 0) {
      const videoUrls = snaps
        .filter((snap) => snap.media.videos.length > 0)
        .slice(0, 6)
        .map((snap) => snap.media.videos[0]);

      if (videoUrls.length > 0) {
        preloadThumbnails(videoUrls).catch((error) => {
          // Preload errors handled silently for production
        });
      }
    }
  }, [snaps]);

  // Memoize URL parsing to avoid repeated calculations
  const urlPermlink = useMemo(() => {
    if (typeof window === "undefined") return null;

    const searchParams = new URLSearchParams(window.location.search);
    const snapParam = searchParams.get("snap");
    if (snapParam) {
      return snapParam;
    }

    const pathParts = window.location.pathname.split("/");
    const snapIndex = pathParts.indexOf("snap");
    return snapIndex !== -1 && pathParts.length >= snapIndex + 2
      ? pathParts[snapIndex + 1]
      : null;
  }, []);

  // Check for snap parameter in URL on component mount and when snaps load
  useEffect(() => {
    if (
      urlPermlink &&
      snaps.length > 0 &&
      !isLoading &&
      !isOpen &&
      !hasCheckedUrl
    ) {
      const foundSnapIndex = snaps.findIndex(
        (snap) => snap.permlink === urlPermlink
      );
      if (foundSnapIndex !== -1) {
        setSelectedSnapIndex(foundSnapIndex);
        setHasCheckedUrl(true);
        setTimeout(() => onOpen(), 50);
      } else {
        setHasCheckedUrl(true);
      }
    }
  }, [snaps, isLoading, onOpen, urlPermlink, isOpen, hasCheckedUrl]);

  const handleSnapClick = useCallback(
    (snapIndex: number) => {
      const snap = snaps[snapIndex];
      setSelectedSnapIndex(snapIndex);

      const cleanUrl = `/user/${snap.author}/snap/${snap.permlink}`;
      window.history.pushState({}, "", cleanUrl);

      onOpen();
    },
    [snaps, onOpen]
  );

  const handleSnapChange = useCallback(
    (newSnapIndex: number) => {
      const snap = snaps[newSnapIndex];
      setSelectedSnapIndex(newSnapIndex);

      const cleanUrl = `/user/${snap.author}/snap/${snap.permlink}`;
      window.history.pushState({}, "", cleanUrl);
    },
    [snaps]
  );

  const handleModalClose = useCallback(() => {
    onClose();

    const searchParams = new URLSearchParams(window.location.search);
    const hasSnapParam = searchParams.has("snap");

    if (hasSnapParam) {
      searchParams.delete("snap");
      const baseUrl = `/user/${username}?${searchParams.toString()}`;
      window.history.pushState({}, "", baseUrl);
    } else {
      const baseUrl = `/user/${username}?view=snaps`;
      window.history.pushState({}, "", baseUrl);
    }
  }, [username, onClose]);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition =
            window.innerHeight + document.documentElement.scrollTop;
          const documentHeight = document.documentElement.offsetHeight;

          if (scrollPosition >= documentHeight - 500) {
            if (hasMore && !isLoading) {
              loadMoreSnaps();
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, isLoading, loadMoreSnaps]);

  if (snaps.length === 0 && !isLoading) {
    return (
      <VStack spacing={4} py={8}>
        <Icon as={FaImage} boxSize={12} color="muted" />
        <Text color="muted" textAlign="center">
          No snaps with media found for @{username}
        </Text>
      </VStack>
    );
  }

  return (
    <>
      <Box
        maxWidth="container.lg"
        overflowX="hidden"
        sx={{
          columnCount: { base: 2, md: 3, lg: 4 },
          columnGap: "0px",
        }}
      >
        {snaps.map((snap, index) => (
          <Box
            key={`${snap.author}-${snap.permlink}`}
            mb="0px"
            sx={{ breakInside: "avoid", display: "inline-block", width: "100%" }}
          >
            <SnapGridItem snap={snap} onClick={() => handleSnapClick(index)} />
          </Box>
        ))}
      </Box>

      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <Spinner color="primary" />
        </Box>
      )}

      {isOpen &&
        snaps.length > 0 &&
        selectedSnapIndex >= 0 &&
        selectedSnapIndex < snaps.length && (
          <SnapModal
            snap={snaps[selectedSnapIndex]}
            snaps={snaps}
            currentSnapIndex={selectedSnapIndex}
            isOpen={isOpen}
            onClose={handleModalClose}
            onSnapChange={handleSnapChange}
          />
        )}
    </>
  );
}
