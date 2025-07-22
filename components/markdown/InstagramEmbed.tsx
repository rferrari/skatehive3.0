import React, { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";

interface InstagramEmbedProps {
  url: string;
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

export const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ url }) => {
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInstagramScript = () => {
      const existing = document.querySelector(
        'script[src="https://www.instagram.com/embed.js"]'
      );

      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        script.onload = () => {
          if (window.instgrm?.Embeds) {
            window.instgrm.Embeds.process();
          }
        };
        script.onerror = () => {
          console.warn("Failed to load Instagram embed script");
        };
        document.body.appendChild(script);
      } else if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    };

    const timeoutId = setTimeout(loadInstagramScript, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Box
      ref={embedRef}
      display="flex"
      justifyContent="center"
      alignItems="center"
      my={8}
      mx="auto"
      maxW="100%"
      sx={{
        "& .instagram-media": {
          display: "block !important",
          marginLeft: "auto !important",
          marginRight: "auto !important",
          marginTop: "2rem !important",
          marginBottom: "2rem !important",
          maxWidth: "100% !important",
          width: "100% !important",
          border: "1px solid",
          borderColor: "primary",
          borderRadius: "md",
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0, 0, 0, 0.12)",
        },
      }}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          borderRadius: "3px",
          boxShadow: "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
          margin: "1px",
          maxWidth: "658px",
          minWidth: "326px",
          padding: 0,
          width: "99.375%",
        }}
      />
    </Box>
  );
};

export default InstagramEmbed;
