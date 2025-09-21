import React, { useState, useEffect } from "react";
import markdownRenderer from "@/lib/markdown/MarkdownRenderer";
import SkateErrorBoundary from "./SkateErrorBoundary";
import { Skeleton } from "@chakra-ui/react";

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
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const processMarkdown = async () => {
      try {
        setIsLoading(true);
        // Get sanitized HTML from the updated async markdownRenderer
        const rawHtml = await markdownRenderer(markdown);

        if (!mounted) return;

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
        const processedHtml = processYouTubeEmbeds(rawHtml);
        setRenderedHtml(processedHtml);
      } catch (error) {
        console.error("Error processing markdown:", error);
        // Fallback to displaying original markdown as text
        setRenderedHtml(`<pre>${markdown}</pre>`);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    processMarkdown();

    return () => {
      mounted = false;
    };
  }, [markdown]);

  if (isLoading) {
    return (
      <SkateErrorBoundary>
        <div className={className} style={style}>
          <Skeleton height="20px" mb={2} />
          <Skeleton height="20px" mb={2} />
          <Skeleton height="15px" width="70%" />
        </div>
      </SkateErrorBoundary>
    );
  }

  return (
    <SkateErrorBoundary>
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </SkateErrorBoundary>
  );
};

export default HiveMarkdown;
