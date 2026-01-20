"use client";

import { Box, Image, Icon, Avatar } from "@chakra-ui/react";
import { FaPlay, FaFileAlt, FaVideo } from "react-icons/fa";
import { useState } from "react";

interface NotificationPreviewProps {
  videoPreviewUrl: string | null;
  magPostThumbnail: string;
  inlineImageUrl: string | null;
  notificationType?: string;
  author?: string;
}

/**
 * Check if a URL points to a video file
 */
function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // Check for video extensions
  if (lower.match(/\.(mp4|webm|mov|avi|mkv|m4v|ogv)(\?|$)/)) return true;
  // Check for IPFS video embeds from skatehive
  if (lower.includes("ipfs.skatehive.app") && !lower.includes(".jpg") && !lower.includes(".png") && !lower.includes(".gif")) return true;
  // Check for common video IPFS gateways
  if (lower.includes("/ipfs/") && !lower.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) return true;
  return false;
}

export default function NotificationPreview({
  videoPreviewUrl,
  magPostThumbnail,
  inlineImageUrl,
  notificationType,
  author,
}: NotificationPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const hasMedia = videoPreviewUrl || magPostThumbnail || inlineImageUrl;
  const isVideo = isVideoUrl(videoPreviewUrl);

  // For follow notifications, show a larger avatar instead of media
  if (notificationType === "follow" && author) {
    return (
      <Box
        w={{ base: "96px", md: "120px" }}
        h={{ base: "64px", md: "80px" }}
        borderRadius="base"
        overflow="hidden"
        border="1px solid"
        borderColor="border"
        bg="background"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Avatar
          src={`https://images.hive.blog/u/${author}/avatar`}
          name={author}
          size="lg"
        />
      </Box>
    );
  }

  // If we have a video URL without a proper thumbnail, show video preview with poster
  if (isVideo && videoPreviewUrl && !magPostThumbnail && !inlineImageUrl) {
    return (
      <Box
        w={{ base: "96px", md: "120px" }}
        h={{ base: "64px", md: "80px" }}
        borderRadius="base"
        overflow="hidden"
        border="1px solid"
        borderColor="border"
        bg="gray.900"
        flexShrink={0}
        position="relative"
      >
        {/* Use video element to extract a frame as poster */}
        <video
          src={videoPreviewUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          muted
          playsInline
          preload="metadata"
          // Load first frame by seeking to small time
          onLoadedMetadata={(e) => {
            const video = e.target as HTMLVideoElement;
            video.currentTime = 0.5;
          }}
        />
        {/* Play button overlay */}
        <Box
          position="absolute"
          inset={0}
          bg="rgba(0, 0, 0, 0.45)"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <FaPlay color="white" size={18} />
        </Box>
      </Box>
    );
  }

  if (hasMedia && !imageError) {
    // Determine the best image source
    const imageSrc = (isVideo ? null : videoPreviewUrl) || magPostThumbnail || inlineImageUrl || "";
    
    if (!imageSrc) {
      // All sources are video or empty, show video icon
      return (
        <Box
          w={{ base: "96px", md: "120px" }}
          h={{ base: "64px", md: "80px" }}
          borderRadius="base"
          border="1px solid"
          borderColor="border"
          bg="gray.800"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          <Icon as={FaVideo} color="gray.400" boxSize={6} />
          <Box
            position="absolute"
            bottom={1}
            right={1}
            bg="rgba(0, 0, 0, 0.7)"
            borderRadius="sm"
            p={0.5}
          >
            <FaPlay color="white" size={10} />
          </Box>
        </Box>
      );
    }

    return (
      <Box
        w={{ base: "96px", md: "120px" }}
        h={{ base: "64px", md: "80px" }}
        borderRadius="base"
        overflow="hidden"
        border="1px solid"
        borderColor="border"
        bg="background"
        flexShrink={0}
        position="relative"
      >
        <Image
          src={imageSrc}
          alt="Notification preview"
          objectFit="cover"
          w="100%"
          h="100%"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        {videoPreviewUrl && (
          <Box
            position="absolute"
            inset={0}
            bg="rgba(0, 0, 0, 0.35)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <FaPlay color="white" size={18} />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      w={{ base: "96px", md: "120px" }}
      h={{ base: "64px", md: "80px" }}
      borderRadius="base"
      border="1px solid"
      borderColor="border"
      bg="muted"
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Icon as={FaFileAlt} color="muted" boxSize={5} />
    </Box>
  );
}
