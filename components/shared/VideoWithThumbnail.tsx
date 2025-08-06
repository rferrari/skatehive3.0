"use client";

import { Box } from "@chakra-ui/react";
import React, { useState, useRef } from "react";
import { LuPlay } from "react-icons/lu";
import { useVideoThumbnail } from "@/hooks/useVideoThumbnail";

interface VideoWithThumbnailProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const VideoWithThumbnail: React.FC<VideoWithThumbnailProps> = ({
  src,
  className,
  style,
  ...props
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPoster, setShowPoster] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use optimized thumbnail hook
  const { thumbnailUrl, isLoading } = useVideoThumbnail(src, {
    enabled: true,
    lazy: false, // Load immediately for this component
  });

  const handlePlayClick = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
        setShowPoster(false);
      } catch (error) {
        console.error("Video play failed:", error);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowPoster(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleLoadedData = () => {
    // Video loaded successfully - no state update needed since we removed isLoading
  };

  return (
    <Box
      position="relative"
      width="100%"
      height="100%"
      className={className}
      style={style}
    >
      <video
        {...props}
        ref={videoRef}
        src={src}
        controls={!showPoster}
        playsInline
        onEnded={handleVideoEnded}
        onLoadedData={handleLoadedData}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: showPoster ? "none" : "block",
        }}
      />

      {/* Thumbnail Poster */}
      {showPoster && thumbnailUrl && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          backgroundImage={`url(${thumbnailUrl})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          cursor="pointer"
          onClick={handlePlayClick}
          display="flex"
          alignItems="center"
          justifyContent="center"
          _hover={{
            "& > div": {
              bg: "rgba(50, 205, 50, 0.8)",
              transform: "scale(1.1)",
            },
          }}
        >
          {/* Play Button */}
          <Box
            bg="rgba(0,0,0,0.7)"
            borderRadius="50%"
            p={4}
            transition="all 0.3s ease"
            border="2px solid white"
          >
            <LuPlay size={24} color="white" />
          </Box>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && !thumbnailUrl && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="rgba(0,0,0,0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          Loading...
        </Box>
      )}

      {/* Fallback when no thumbnail */}
      {!isLoading && !thumbnailUrl && showPoster && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="rgba(0,0,0,0.8)"
          cursor="pointer"
          onClick={handlePlayClick}
          display="flex"
          alignItems="center"
          justifyContent="center"
          _hover={{
            "& > div": {
              bg: "rgba(50, 205, 50, 0.8)",
              transform: "scale(1.1)",
            },
          }}
        >
          <Box
            bg="rgba(0,0,0,0.7)"
            borderRadius="50%"
            p={4}
            transition="all 0.3s ease"
            border="2px solid white"
          >
            <LuPlay size={24} color="white" />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VideoWithThumbnail;
