export interface MediaItem {
  type: "image" | "video" | "iframe";
  content: string;
  src?: string;
}

export const separateContent = (body: string) => {
    // First remove the last URL if it's at the end of the content
    const cleanedBody = removeLastUrlFromContent(body);
    
    const textParts: string[] = [];
    const mediaParts: string[] = [];
    const lines = cleanedBody.split("\n");
    lines.forEach((line: string) => {
        if (line.match(/!\[.*?\]\(.*\)/) || line.match(/<iframe.*<\/iframe>/)) {
            mediaParts.push(line);
        } else {
            textParts.push(line);
        }
    });
    return { text: textParts.join("\n"), media: mediaParts.join("\n") };
};

// Extract the last URL from content for OpenGraph preview
export const extractLastUrl = (content: string): string | null => {
  const urlRegex = /https?:\/\/[^\s<>"'`]+/g;
  const urls: string[] = [];
  let match;
  
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[0];
    
    // Skip if it's already handled by other systems
    if (
      // Skip image URLs
      url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) ||
      // Skip video URLs
      url.match(/\.(mp4|webm|mov|avi|wmv|flv|mkv)$/i) ||
      // Skip YouTube URLs (handled by markdown processor)
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      // Skip 3speak URLs
      url.includes('3speak.tv') ||
      // Skip Zora URLs
      url.includes('zora.co/coin') ||
      // Skip Instagram URLs
      url.includes('instagram.com') ||
      // Skip Vimeo URLs
      url.includes('vimeo.com') ||
      // Skip Odysee URLs
      url.includes('odysee.com') ||
      // Skip IPFS URLs
      url.includes('ipfs')
      // Skip Hive Imaages URLs
        || url.includes('images.hive.blog')
      // Skip Farcaster Urls
      || url.includes('farcaster.xyz')
      // Skip imgbb urls 
      || url.includes('ibb.co')
      // skip imgurl urls
      || url.includes('imgurl')
    ) {
      continue;
    }
    
    urls.push(url);
  }
  
  if (urls.length === 0) return null;
  
  const lastUrl = urls[urls.length - 1];
  
  // Check if the URL is at the very end of the content (with minimal trailing content)
  const urlPosition = content.lastIndexOf(lastUrl);
  const afterUrl = content.substring(urlPosition + lastUrl.length).trim();
  
  // Hide the URL if it's at the end with only whitespace or minimal punctuation after it
  if (afterUrl === '' || afterUrl.match(/^[\s\n.!?]*$/)) {
    // Return the URL but mark it as "end-url" so we can hide it in the text
    return lastUrl;
  }
  
  return lastUrl;
};

// Function to remove the last URL from content if it's at the end
export const removeLastUrlFromContent = (content: string): string => {
  const lastUrl = extractLastUrl(content);
  if (!lastUrl) return content;
  
  const urlPosition = content.lastIndexOf(lastUrl);
  const afterUrl = content.substring(urlPosition + lastUrl.length).trim();
  
  // Only remove if it's at the end with minimal trailing content
  if (afterUrl === '' || afterUrl.match(/^[\s\n.!?]*$/)) {
    return content.substring(0, urlPosition).trim();
  }
  
  return content;
};

export const parseMediaContent = (mediaContent: string): MediaItem[] => {
  const mediaItems: MediaItem[] = [];

  mediaContent.split("\n").forEach((item: string) => {
    const trimmedItem = item.trim();
    if (!trimmedItem) return;

    // Handle markdown images with IPFS
    if (
      trimmedItem.includes("![") &&
      trimmedItem.includes("ipfs.skatehive.app/ipfs/")
    ) {
      mediaItems.push({
        type: "image",
        content: trimmedItem,
      });
      return;
    }

    // Handle other markdown images
    if (
      trimmedItem.includes("![") &&
      (trimmedItem.includes("http") || trimmedItem.includes("ipfs:"))
    ) {
      mediaItems.push({
        type: "image",
        content: trimmedItem,
      });
      return;
    }

    // Handle iframes
    if (trimmedItem.includes("<iframe") && trimmedItem.includes("</iframe>")) {
      const srcMatch = trimmedItem.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const url = srcMatch[1];

        // Skip YouTube iframes (handled by auto-embed logic)
        if (
          url.includes("youtube.com/embed/") ||
          url.includes("youtube-nocookie.com/embed/") ||
          url.includes("youtu.be/")
        ) {
          return;
        }

        // Handle IPFS videos
        if (url.includes("gateway.pinata.cloud/ipfs/")) {
          const ipfsHash = url.match(/\/ipfs\/([\w-]+)/)?.[1];
          if (ipfsHash) {
            const skatehiveUrl = `https://ipfs.skatehive.app/ipfs/${ipfsHash}`;
            mediaItems.push({
              type: "video",
              content: trimmedItem,
              src: skatehiveUrl,
            });
            return;
          }
        } else if (url.includes("ipfs.skatehive.app/ipfs/")) {
          mediaItems.push({
            type: "video",
            content: trimmedItem,
            src: url,
          });
          return;
        }
      }

      // Other iframes
      mediaItems.push({
        type: "iframe",
        content: trimmedItem,
      });
      return;
    }
  });

  return mediaItems;
};
