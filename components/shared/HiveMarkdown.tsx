import React from "react";
import markdownRenderer from "@/lib/markdown/MarkdownRenderer";
import SkateErrorBoundary from "./SkateErrorBoundary";

interface HiveMarkdownProps {
  markdown: string;
  className?: string;
  style?: React.CSSProperties;
}

const HiveMarkdown: React.FC<HiveMarkdownProps> = ({
  markdown,
  className = "markdown-body",
  style,
}) => {
  // Get sanitized HTML from the updated markdownRenderer
  let rawHtml = markdownRenderer(markdown);

  // Post-process YouTube tags in the HTML
  const processYouTubeEmbeds = (html: string) => {
    // Replace all [[YOUTUBE:VIDEOID]] with responsive iframes
    return html.replace(
      /\[\[YOUTUBE:([a-zA-Z0-9_-]{11})\]\]/g,
      (_match, videoId) => {
        return `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      `;
      }
    );
  };

  // Process YouTube embeds
  rawHtml = processYouTubeEmbeds(rawHtml);

  return (
    <SkateErrorBoundary>
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: rawHtml }}
      />
    </SkateErrorBoundary>
  );
};

export default HiveMarkdown;
