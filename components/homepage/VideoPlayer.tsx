import React, { memo } from "react";
import { Box, Button } from "@chakra-ui/react";
import { FaPlay, FaPause } from "react-icons/fa";

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string;
  isPlaying: boolean;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onTogglePlayPause: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  videoUrl,
  isPlaying,
  onLoadedMetadata,
  onTimeUpdate,
  onTogglePlayPause,
}) => {
  // Debug logging
  console.log("🎥 VideoPlayer rendered with:", {
    hasVideoRef: !!videoRef,
    videoUrl,
    isPlaying,
    videoUrlLength: videoUrl?.length,
  });

  return (
    <Box
      width="100%"
      borderRadius="md"
      overflow="hidden"
      bg="black"
      position="relative"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        style={{
          width: "100%",
          height: window.innerWidth < 768 ? "200px" : "300px",
          objectFit: "contain",
        }}
        onLoadedMetadata={() => {
          console.log("🎬 VideoPlayer: metadata loaded");
          console.log(
            "🎬 Video element ready state:",
            videoRef.current?.readyState
          );
          console.log(
            "🎬 Video duration from element:",
            videoRef.current?.duration
          );
          onLoadedMetadata();
        }}
        onLoadedData={() => {
          console.log("📊 VideoPlayer: loaded data event");
          // Fallback - if loadedmetadata didn't fire, try here
          if (
            videoRef.current &&
            videoRef.current.duration &&
            !isNaN(videoRef.current.duration)
          ) {
            console.log("📊 Fallback: triggering metadata from loadeddata");
            onLoadedMetadata();
          }
        }}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => {
          console.log("▶️ VideoPlayer: play event");
        }}
        onPause={() => {
          console.log("⏸️ VideoPlayer: pause event");
        }}
        onError={(e) => {
          console.error("❌ VideoPlayer error:", e);
          console.error("❌ Video error details:", e.currentTarget.error);
        }}
        onLoadStart={() => {
          console.log("📡 VideoPlayer: load start");
        }}
        onCanPlay={() => {
          console.log("✅ VideoPlayer: can play");
        }}
        playsInline
        controls={false}
        preload="metadata"
      />

      {/* Play/Pause Button Overlay */}
      <Button
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        colorScheme="whiteAlpha"
        variant="solid"
        size={{ base: "md", md: "lg" }}
        borderRadius="full"
        onClick={onTogglePlayPause}
        fontSize={{ base: "16px", md: "20px" }}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </Button>
    </Box>
  );
};

export default memo(VideoPlayer);
