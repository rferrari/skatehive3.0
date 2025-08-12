"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Image,
  Avatar,
  VStack,
  Text,
  Center,
  Spinner,
  Skeleton,
} from "@chakra-ui/react";
import { getIpfsGatewayUrls } from "@/lib/utils/ipfsMetadata";

interface MediaRendererProps {
  videoUrl?: string;
  imageUrl?: string;
  hasVideo?: boolean;
  altText: string;
  blurDataURL?: string;
}

/**
 * Component that tries multiple IPFS gateways for reliable media loading
 */
export const MediaRenderer = React.memo<MediaRendererProps>(
  ({ videoUrl, imageUrl, hasVideo, altText, blurDataURL }) => {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [videoFailed, setVideoFailed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [loadingTimeoutId, setLoadingTimeoutId] =
      useState<NodeJS.Timeout | null>(null);

    // Handle both IPFS and regular URLs
    const videoGateways = videoUrl
      ? videoUrl.startsWith("ipfs://")
        ? getIpfsGatewayUrls(videoUrl)
        : [videoUrl]
      : [];

    const imageGateways = imageUrl
      ? imageUrl.startsWith("ipfs://")
        ? getIpfsGatewayUrls(imageUrl)
        : [imageUrl]
      : [];

    // Set initial loading state based on available content
    useEffect(() => {
      if (!hasVideo && !imageUrl) {
        setIsLoading(false);
      } else {
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          setIsLoading(false);
          if (hasVideo && videoUrl) {
            setVideoFailed(true);
          }
          if (!hasVideo && imageUrl) {
            setHasError(true);
          }
          setLoadingTimeoutId(null);
        }, 10000); // 10 second timeout

        setLoadingTimeoutId(timeout);

        return () => {
          clearTimeout(timeout);
          setLoadingTimeoutId(null);
        };
      }
    }, [hasVideo, imageUrl, videoUrl]);

    // Clear timeout when media loads successfully
    const clearLoadingTimeout = () => {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
        setLoadingTimeoutId(null);
      }
    };

    const handleVideoError = () => {
      if (currentVideoIndex < videoGateways.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
      } else {
        setVideoFailed(true);
        if (!imageUrl) {
          setIsLoading(false);
        }
      }
    };

    const handleImageError = () => {
      if (currentImageIndex < imageGateways.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleVideoLoad = () => {
      setIsLoading(false);
      clearLoadingTimeout();
    };

    const handleImageLoad = () => {
      setIsLoading(false);
      clearLoadingTimeout();
    };

    // Try to render video first if available and not failed
    if (hasVideo && videoUrl && !videoFailed && videoGateways.length > 0) {
      return (
        <Box position="relative" w="100%" h="100%">
          {/* Preview image as loading background */}
          {isLoading && (blurDataURL || imageUrl) && (
            <Box position="absolute" w="100%" h="100%" zIndex={1}>
              <Image
                src={blurDataURL || imageUrl}
                alt={altText}
                w="100%"
                h="100%"
                objectFit="cover"
                borderRadius="lg"
                filter="blur(2px)"
                opacity={0.8}
              />
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="blackAlpha.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="lg"
              >
                <Spinner size="xl" color="white" />
              </Box>
            </Box>
          )}
          <Box
            as="video"
            src={videoGateways[currentVideoIndex]}
            autoPlay
            loop
            muted
            playsInline
            w="100%"
            h="100%"
            objectFit={{ base: "contain", lg: "cover" }}
            borderRadius="lg"
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onLoadStart={() => {
              setIsLoading(true);
            }}
            onLoadedMetadata={() => {
              setIsLoading(false);
            }}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          />
        </Box>
      );
    }

    // Fallback to image if video failed or not available
    if (imageUrl && imageGateways.length > 0 && !hasError) {
      return (
        <Box position="relative" w="100%" h="100%">
          {/* For images, show a subtle loading state */}
          {isLoading && (
            <Box position="absolute" w="100%" h="100%" zIndex={1}>
              <Skeleton w="100%" h="100%" borderRadius="lg" />
              <Center
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
              >
                <Spinner size="lg" color="blue.500" />
              </Center>
            </Box>
          )}
          <Image
            src={imageGateways[currentImageIndex]}
            alt={altText}
            w="100%"
            h="100%"
            objectFit={{ base: "contain", lg: "cover" }}
            borderRadius="lg"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onLoadStart={() => {
              setIsLoading(true);
            }}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}
          />
        </Box>
      );
    }

    // Final fallback to avatar
    return (
      <Center h="100%">
        <VStack spacing={4}>
          <Avatar size="2xl" name={altText} bg="gray.600" />
          {hasError && (
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Media content unavailable
            </Text>
          )}
        </VStack>
      </Center>
    );
  }
);

MediaRenderer.displayName = "MediaRenderer";
