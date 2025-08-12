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
  // Split on supported video, social media, and Zora coin placeholders
  const parts = processed.contentWithPlaceholders.split(
    /(\[\[(VIDEO|ODYSEE|YOUTUBE|VIMEO|INSTAGRAM|ZORACOIN):([^\]]+)\]\])/g
  );

  return parts
    .map((part, idx) => {
      // Guard against undefined parts
      if (!part) return null;

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
      const zoraCoinMatch = part.match(/^\[\[ZORACOIN:([^\]]+)\]\]$/);
      if (zoraCoinMatch) {
        const address = zoraCoinMatch[1];
        return <ZoraCoinPreview key={`zora-${idx}`} address={address} />;
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
    .replace(
      /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/).*$/gm,
      ""
    )
    .replace(/^https?:\/\/(?:www\.)?(?:vimeo\.com\/).*$/gm, "")
    .replace(/^https?:\/\/(?:www\.)?zora\.co\/coin\/.*$/gm, "")
    .replace(/^https?:\/\/(?:www\.)?skatehive\.app\/coin\/.*$/gm, "")
    .replace(/^(ODYSEE|VIDEO|YOUTUBE|VIMEO|INSTAGRAM|ZORACOIN)\s*$/gm, "")
    .replace(/^[a-zA-Z0-9_-]{11}$/gm, "") // YouTube video IDs
    .replace(/^[0-9]{8,}$/gm, "") // Vimeo video IDs
    .replace(/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[0-9a-z]{50,})$/gm, "") // IPFS CIDs
    .replace(/^0x[a-fA-F0-9]{40}$/gm, "") // Ethereum addresses
    .replace(/^\?referrer=0x[a-fA-F0-9]{40}$/gm, ""); // Referrer parameters
}
