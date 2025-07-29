import React, { useMemo } from "react";
import {
  MarkdownProcessor,
  ProcessedMarkdown,
} from "@/lib/markdown/MarkdownProcessor";
import { VideoEmbed } from "./VideoEmbed";
import InstagramEmbed from "./InstagramEmbed";
import ZoraCoinPreview from "./ZoraCoinPreview";
import HiveMarkdown from "@/components/shared/HiveMarkdown";

interface EnhancedMarkdownRendererProps {
  content: string;
  className?: string;
}

export function EnhancedMarkdownRenderer({
  content,
  className = "markdown-body",
}: EnhancedMarkdownRendererProps) {
  const processedMarkdown = useMemo(() => {
    return MarkdownProcessor.process(content);
  }, [content]);

  const renderedContent = useMemo(() => {
    return renderContentWithVideos(processedMarkdown);
  }, [processedMarkdown]);

  return <div className={className}>{renderedContent}</div>;
}

function renderContentWithVideos(
  processed: ProcessedMarkdown
): React.ReactNode[] {
  // Split on all supported video and social media placeholders
  const parts = processed.contentWithPlaceholders.split(
    /(\[\[(VIDEO|ODYSEE|YOUTUBE|VIMEO|INSTAGRAM|ZORACOIN):([^\]]+)\]\])/g
  );

  return parts
    .map((part, idx) => {
      // Handle video placeholders
      const videoMatch = part.match(
        /^\[\[(VIDEO|ODYSEE|YOUTUBE|VIMEO):([^\]]+)\]\]$/
      );
      if (videoMatch) {
        const type = videoMatch[1] as "VIDEO" | "ODYSEE" | "YOUTUBE" | "VIMEO";
        const id = videoMatch[2];
        return (
          <VideoEmbed key={`video-${idx}`} type={type} id={id} index={idx} />
        );
      }

      // Handle Instagram placeholders
      const instagramMatch = part.match(/^\[\[INSTAGRAM:([^\]]+)\]\]$/);
      if (instagramMatch) {
        const url = instagramMatch[1];
        return <InstagramEmbed key={`instagram-${idx}`} url={url} />;
      }

      // Handle Zora coin placeholders
      const zoraMatch = part.match(/^\[\[ZORACOIN:([^\]]+)\]\]$/);
      if (zoraMatch) {
        const addr = zoraMatch[1];
        return <ZoraCoinPreview key={`zora-${idx}`} address={addr} />;
      }

      // Skip empty parts or parts that are just whitespace
      if (!part || part.trim() === "") {
        return null;
      }

      // Skip if part is just an IPFS CID (bafy... or Qm...)
      if (
        /^(bafy[0-9a-z]{50,}|Qm[1-9A-HJ-NP-Za-km-z]{44,})$/.test(part.trim())
      ) {
        return null;
      }

      // Clean the part of unwanted text artifacts
      const cleanedPart = cleanMarkdownPart(part);

      // Skip if the cleaned part is empty
      if (!cleanedPart || cleanedPart.trim() === "") {
        return null;
      }

      return (
        <HiveMarkdown key={`md-${idx}`} markdown={cleanedPart} className="" />
      );
    })
    .filter(Boolean); // Remove null entries
}

function cleanMarkdownPart(part: string): string {
  return part
    .replace(/^https?:\/\/(?:www\.)?odysee\.com\/.*$/gm, "")
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\/.*$/gm, "")
    .replace(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).*$/gm, "")
    .replace(/^https?:\/\/(?:www\.)?(?:vimeo\.com\/).*$/gm, "")
    .replace(/^ODYSEE\s*$/gm, "")
    .replace(/^VIDEO\s*$/gm, "")
    .replace(/^YOUTUBE\s*$/gm, "")
    .replace(/^VIMEO\s*$/gm, "")
    .replace(/^INSTAGRAM\s*$/gm, "")
    .replace(/^[a-zA-Z0-9_-]{11}$/gm, "") // YouTube video IDs (11 characters)
    .replace(/^[0-9]{8,}$/gm, "") // Vimeo video IDs (8+ digits)
    .replace(/^(Qm[1-9A-HJ-NP-Za-km-z]{44,})$/gm, "")
    .replace(/^(bafy[0-9a-z]{50,})$/gm, "");
}
