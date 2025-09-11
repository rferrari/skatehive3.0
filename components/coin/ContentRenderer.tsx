"use client";

import React, { useMemo } from "react";
import { Box } from "@chakra-ui/react";
import { CoinData } from "@/types/coin";
import { MediaRenderer } from "./MediaRenderer";
import { MarkdownCoinRenderer } from "./MarkdownCoinRenderer";
import { CarouselCoinRenderer } from "./CarouselCoinRenderer";

interface ContentRendererProps {
  coinData: CoinData;
}

/**
 * Component that renders the appropriate content based on coin type
 */
export const ContentRenderer = React.memo<ContentRendererProps>(
  ({ coinData }) => {
    const altText = useMemo(() => coinData.name || "Coin", [coinData.name]);

    switch (coinData.coinType) {
      case "markdown":
        return (
          <Box w="100%" h="100%" overflow="auto" p={4}>
            <MarkdownCoinRenderer
              markdownIpfs={coinData.markdownIpfs}
              altText={altText}
            />
          </Box>
        );

      case "carousel":
        return (
          <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" p={2}>
            <CarouselCoinRenderer
              carouselMedia={coinData.carouselMedia}
              altText={altText}
            />
          </Box>
        );

      case "media":
      default:
        return (
          <Box 
            w="100%" 
            h="100%" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            p={{ base: 2, md: 4 }}
          >
            <Box
              maxW="100%"
              maxH="100%"
              w="auto"
              h="auto"
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MediaRenderer
                videoUrl={coinData.videoUrl}
                imageUrl={coinData.image}
                hasVideo={coinData.hasVideo}
                altText={altText}
                blurDataURL={coinData.blurDataURL}
              />
            </Box>
          </Box>
        );
    }
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    const prev = prevProps.coinData;
    const next = nextProps.coinData;
    
    return (
      prev.coinType === next.coinType &&
      prev.name === next.name &&
      prev.image === next.image &&
      prev.videoUrl === next.videoUrl &&
      prev.hasVideo === next.hasVideo &&
      prev.markdownIpfs === next.markdownIpfs &&
      prev.carouselMedia === next.carouselMedia
    );
  }
);

ContentRenderer.displayName = "ContentRenderer";
