import React from "react";
import { Box, Text, useBreakpointValue } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";
import VideoRenderer from "../layout/VideoRenderer";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface MediaItem {
  type: "image" | "video" | "iframe";
  content: string;
  src?: string;
}

interface MediaCarouselProps {
  mediaItems: MediaItem[];
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ mediaItems }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });



  if (mediaItems.length === 0) return null;

  // If only one media item, render without carousel
  if (mediaItems.length === 1) {
    const item = mediaItems[0];
    return (
      <Box mt={2} mb={2}>
        {renderMediaItem(item)}
      </Box>
    );
  }

  return (
    <Box position="relative" width="100%" mt={2} mb={2}>
      <Swiper
        modules={[Navigation]}
        navigation={!isMobile}
        spaceBetween={0}
        slidesPerView={1}
        loop={mediaItems.length > 2}
        style={
          {
            "--swiper-navigation-color": "var(--chakra-colors-primary)",
            "--swiper-navigation-size": "20px",
          } as React.CSSProperties
        }
        className="media-carousel"
      >
        {mediaItems.map((item, index) => (
          <SwiperSlide key={index}>
            <Box width="100%" display="flex" justifyContent="center">
              {renderMediaItem(item)}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

function renderMediaItem(item: MediaItem) {
  // Function to extract caption from markdown image syntax
  const extractImageCaption = (markdownContent: string): string | null => {
    const match = markdownContent.match(/!\[(.*?)\]\(.*?\)/);
    return match ? match[1] : null;
  };

  switch (item.type) {
    case "image":
      const caption = extractImageCaption(item.content);
      return (
        <Box>
          <Box
            sx={{
              img: {
                width: "100%",
                height: "auto",
                objectFit: "contain",
                maxHeight: "500px",
                borderRadius: "md",
                display: "block",
                margin: "0 auto",
              },
            }}
          >
            <EnhancedMarkdownRenderer content={item.content} />
          </Box>
          {caption && (
            <Text
              fontSize="xs"
              fontStyle="italic"
              textAlign="center"
              color="secondary"
              mt={2}
              mb={2}
            >
              {caption}
          </Text>
          )}
        </Box>
      );
    case "video":
      return item.src ? (
        <Box width="100%">
          <VideoRenderer src={item.src} />
        </Box>
      ) : null;
    case "iframe":
      return (
        <Box
          dangerouslySetInnerHTML={{ __html: item.content }}
          sx={{
            iframe: {
              width: "100%",
              height: "auto",
              minHeight: "300px",
              maxHeight: "500px",
              borderRadius: "md",
            },
          }}
        />
      );
    default:
      return null;
  }
}

export default MediaCarousel;
