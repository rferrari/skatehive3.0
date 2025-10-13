import MediaCarousel from "@/components/shared/MediaCarousel";
import OpenGraphPreview from "@/components/shared/OpenGraphPreview";
import SnapshotPreview from "@/components/shared/SnapshotPreview";
import { parseMediaContent, extractLastUrl } from "@/lib/utils/snapUtils";

import { isSnapshotUrl } from "@/lib/utils/snapshotUtils";

interface MediaRendererProps {
  mediaContent: string;
  fullContent: string; // Add full content to extract URLs from
}

const MediaRenderer = ({ mediaContent, fullContent }: MediaRendererProps) => {
  const mediaItems = parseMediaContent(mediaContent);
  const lastUrl = extractLastUrl(fullContent);

  return (
    <>
      {/* Render media content using MediaCarousel for consistent handling */}
      {mediaItems.length > 0 && <MediaCarousel mediaItems={mediaItems} />}

      {/* Render appropriate preview for the last URL */}
      {lastUrl && (
        <>
          {isSnapshotUrl(lastUrl) ? (
            <SnapshotPreview url={lastUrl} />
          ) : (
            <OpenGraphPreview url={lastUrl} />
          )}
        </>
      )}
    </>
  );
};

export default MediaRenderer;
