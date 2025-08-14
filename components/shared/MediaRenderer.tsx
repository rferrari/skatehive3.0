import { Box, Text } from "@chakra-ui/react";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";
import VideoRenderer from "@/components/layout/VideoRenderer";
import MediaCarousel from "@/components/shared/MediaCarousel";
import OpenGraphPreview from "@/components/shared/OpenGraphPreview";
import { parseMediaContent, extractLastUrl } from "@/lib/utils/snapUtils";
import { isMeaningfulCaption, extractImageCaption } from "@/lib/utils/captionUtils";

interface MediaRendererProps {
  mediaContent: string;
  fullContent: string; // Add full content to extract URLs from
}

const MediaRenderer = ({ mediaContent, fullContent }: MediaRendererProps) => {
  const mediaItems = parseMediaContent(mediaContent);
  const lastUrl = extractLastUrl(fullContent);

  return (
    <>
      {/* Render media content */}
      {mediaItems.length >= 2 && <MediaCarousel mediaItems={mediaItems} />}

      {mediaItems.length === 1 &&
        (() => {
          const item = mediaItems[0];

          if (item.type === "image") {
            const caption = extractImageCaption(item.content);
            return (
              <Box>
                <Box
                  sx={{
                    img: {
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      marginTop: "0.5rem",
                      marginBottom: "0.5rem",
                    },
                  }}
                >
                  <EnhancedMarkdownRenderer content={item.content} />
                </Box>
                {caption && isMeaningfulCaption(caption) && (
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
          }

          if (item.type === "video" && item.src) {
            return <VideoRenderer src={item.src} />;
          }

          if (item.type === "iframe") {
            return (
              <Box
                dangerouslySetInnerHTML={{ __html: item.content }}
                sx={{
                  iframe: {
                    width: "100%",
                    height: "auto",
                    minHeight: "300px",
                  },
                }}
              />
            );
          }

          return null;
        })()}

      {/* Render OpenGraph preview for the last URL */}
      {lastUrl && <OpenGraphPreview url={lastUrl} />}
    </>
  );
};

export default MediaRenderer;
