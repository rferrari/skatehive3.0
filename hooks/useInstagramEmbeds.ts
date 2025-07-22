import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

export function useInstagramEmbeds(hasInstagramEmbeds: boolean) {
  useEffect(() => {
    if (!hasInstagramEmbeds || typeof window === "undefined") {
      return;
    }

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
  }, [hasInstagramEmbeds]);
}
