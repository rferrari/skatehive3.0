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

  // Replace <mention data-username="username">@username</mention> with inline HTML
  const processMentions = (html: string) => {
    return html.replace(
      /<mention data-username="([a-zA-Z0-9._-]+)">@([a-zA-Z0-9._-]+)<\/mention>/g,
      (_, username) => {
        return `<a href="/@${username}" style="display: inline; text-decoration: underline; color: #3182ce; white-space: nowrap;"><img src="https://images.ecency.com/webp/u/${username}/avatar/small" alt="@${username}" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover; vertical-align: text-bottom; display: inline; margin-right: 4px; margin-bottom: 2px;" loading="lazy" />${username}</a>`;
      }
    );
  };

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

  // Process mentions and YouTube embeds
  rawHtml = processYouTubeEmbeds(rawHtml);
  rawHtml = processMentions(rawHtml);

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
