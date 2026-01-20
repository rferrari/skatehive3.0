"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Image,
  HStack,
  IconButton,
  Text,
  Center,
  Skeleton,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { getIpfsGatewayUrls } from "@/lib/utils/ipfsMetadata";

interface CarouselMedia {
  uri: string;
  mime: string;
}

interface CarouselCoinRendererProps {
  carouselMedia?: CarouselMedia[];
  altText: string;
}

/**
 * Component that renders a carousel of media items
 */
export const CarouselCoinRenderer = React.memo<CarouselCoinRendererProps>(
  ({ carouselMedia, altText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
      {}
    );
    const carouselLength = carouselMedia?.length ?? 0;

    // Handle IPFS URLs
    const getMediaUrl = useCallback((uri: string) => {
      if (uri.startsWith("ipfs://")) {
        const gateways = getIpfsGatewayUrls(uri);
        return gateways[0]; // Use the first gateway
      }
      return uri;
    }, []);

    const nextMedia = useCallback(() => {
      setCurrentIndex((prev) => {
        if (carouselLength === 0) return prev;
        return (prev + 1) % carouselLength;
      });
    }, [carouselLength]);

    const prevMedia = useCallback(() => {
      setCurrentIndex((prev) => {
        if (carouselLength === 0) return prev;
        return (prev - 1 + carouselLength) % carouselLength;
      });
    }, [carouselLength]);

    const goToMedia = useCallback((index: number) => {
      setCurrentIndex(index);
    }, []);

    const handleImageLoad = useCallback((index: number) => {
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
    }, []);

    const handleImageLoadStart = useCallback((index: number) => {
      setLoadingStates((prev) => ({ ...prev, [index]: true }));
    }, []);

    // Reset index when carousel media changes to prevent out of bounds
    useEffect(() => {
      if (carouselLength > 0 && currentIndex >= carouselLength) {
        setCurrentIndex(0);
      }
    }, [carouselLength, currentIndex]);

    // Memoize current media to prevent unnecessary re-renders
    const currentMedia = useMemo(() => {
      if (!carouselMedia || carouselMedia.length === 0) return null;
      return carouselMedia[currentIndex] || null;
    }, [carouselMedia, currentIndex]);

    // Memoize media URL to prevent unnecessary processing
    const currentMediaUrl = useMemo(() => {
      if (!currentMedia?.uri) return "";
      return getMediaUrl(currentMedia.uri);
    }, [currentMedia?.uri, getMediaUrl]);

    if (!carouselMedia || carouselMedia.length === 0) {
      return (
        <Center h="400px" w="100%">
          <Text color="gray.500">No carousel media available</Text>
        </Center>
      );
    }

    if (!currentMedia) {
      return (
        <Center h="400px" w="100%">
          <Text color="gray.500">Invalid media index</Text>
        </Center>
      );
    }

    return (
      <Box position="relative" w="100%" h="100%" maxH="600px">
        {/* Main Media Display */}
        <Box
          position="relative"
          w="100%"
          h="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="black"
          borderRadius="lg"
          overflow="hidden"
        >
          {loadingStates[currentIndex] && (
            <Skeleton
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={1}
            />
          )}

          {currentMedia.mime.startsWith("video/") ? (
            <video
              src={currentMediaUrl}
              controls
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              onLoadStart={() => handleImageLoadStart(currentIndex)}
              onLoadedData={() => handleImageLoad(currentIndex)}
            />
          ) : (
            <Image
              src={currentMediaUrl}
              alt={`${altText} - Image ${currentIndex + 1}`}
              objectFit="contain"
              w="100%"
              h="100%"
              onLoad={() => handleImageLoad(currentIndex)}
              onLoadStart={() => handleImageLoadStart(currentIndex)}
              fallback={
                <Center w="100%" h="100%">
                  <Text color="gray.500">Failed to load image</Text>
                </Center>
              }
            />
          )}

          {/* Navigation Arrows */}
          {carouselMedia.length > 1 && (
            <>
              <IconButton
                aria-label="Previous image"
                icon={<ChevronLeftIcon />}
                position="absolute"
                left={2}
                top="50%"
                transform="translateY(-50%)"
                bg="blackAlpha.600"
                color="white"
                _hover={{ bg: "blackAlpha.800" }}
                onClick={prevMedia}
                size="lg"
                zIndex={2}
              />
              <IconButton
                aria-label="Next image"
                icon={<ChevronRightIcon />}
                position="absolute"
                right={2}
                top="50%"
                transform="translateY(-50%)"
                bg="blackAlpha.600"
                color="white"
                _hover={{ bg: "blackAlpha.800" }}
                onClick={nextMedia}
                size="lg"
                zIndex={2}
              />
            </>
          )}

          {/* Media Counter */}
          {carouselMedia.length > 1 && (
            <Box
              position="absolute"
              bottom={2}
              right={2}
              bg="blackAlpha.700"
              color="white"
              px={3}
              py={1}
              borderRadius="none"
              fontSize="sm"
              zIndex={2}
            >
              {currentIndex + 1} / {carouselMedia.length}
            </Box>
          )}
        </Box>

        {/* Thumbnail Navigation */}
        {carouselMedia.length > 1 && (
          <HStack spacing={2} mt={4} justify="center" overflowX="auto" pb={2}>
            {carouselMedia.map((media, index) => (
              <Box
                key={index}
                cursor="pointer"
                onClick={() => goToMedia(index)}
                border={index === currentIndex ? "2px solid" : "1px solid"}
                borderColor={index === currentIndex ? "blue.500" : "gray.300"}
                borderRadius="none"
                overflow="hidden"
                flexShrink={0}
                opacity={index === currentIndex ? 1 : 0.7}
                _hover={{ opacity: 1 }}
                transition="all 0.2s"
              >
                {media.mime.startsWith("video/") ? (
                  <Box
                    w="60px"
                    h="60px"
                    bg="gray.800"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="xs" color="white">
                      VIDEO
                    </Text>
                  </Box>
                ) : (
                  <Image
                    src={getMediaUrl(media.uri)}
                    alt={`Thumbnail ${index + 1}`}
                    w="60px"
                    h="60px"
                    objectFit="cover"
                    fallback={<Box w="60px" h="60px" bg="gray.200" />}
                  />
                )}
              </Box>
            ))}
          </HStack>
        )}
      </Box>
    );
  }
);

CarouselCoinRenderer.displayName = "CarouselCoinRenderer";
