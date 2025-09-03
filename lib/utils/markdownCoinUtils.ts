/**
 * Utility functions for detecting and handling longform markdown content
 */

import { Discussion } from "@hiveio/dhive";

// Debug utility that only logs in development mode and sanitizes PII
const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
};

// Sanitize content for logging (remove PII unless in debug mode)
const sanitizeForLogging = (content: string | undefined, maxLength: number = 50): string => {
  if (!content) return '[empty]';
  if (process.env.NODE_ENV === "development") {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
  return '[content hidden]';
};

/**
 * Helper function to extract thumbnail from post
 */
export function extractThumbnailFromPost(post: Discussion): string | null {
  try {
    // First try to get from json_metadata
    if (post.json_metadata) {
      const metadata = JSON.parse(post.json_metadata);
      if (
        metadata.image &&
        Array.isArray(metadata.image) &&
        metadata.image[0]
      ) {
        return metadata.image[0];
      }
      if (
        metadata.thumbnail &&
        Array.isArray(metadata.thumbnail) &&
        metadata.thumbnail[0]
      ) {
        return metadata.thumbnail[0];
      }
    }

    // Extract from markdown content
    const imageMatch = post.body.match(/!\[.*?\]\((.*?)\)/);
    if (imageMatch && imageMatch[1]) {
      return imageMatch[1];
    }

    return null;
  } catch (error) {
    console.warn("Failed to extract thumbnail:", error);
    return null;
  }
}

/**
 * Clean content for card display (remove all HTML/markdown, plain text only)
 */
export function cleanContentForCard(content: string): string {
  let cleaned = content;

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, " ");

  // Remove markdown syntax
  cleaned = cleaned.replace(/!\[.*?\]\([^)]+\)/g, ""); // Images
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Links -> text only
  cleaned = cleaned.replace(/#{1,6}\s*/g, ""); // Headers
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1"); // Bold
  cleaned = cleaned.replace(/\*(.*?)\*/g, "$1"); // Italic
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1"); // Code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ""); // Code blocks
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ""); // Lists
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ""); // Numbered lists
  cleaned = cleaned.replace(/^\s*>\s+/gm, ""); // Blockquotes
  cleaned = cleaned.replace(/---+/g, ""); // Horizontal rules

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Get video thumbnail from OpenGraph/oEmbed
 */
export async function getVideoThumbnail(videoUrl: string): Promise<string | null> {
  try {
    // For YouTube videos
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const videoId = videoUrl.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      )?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // For Vimeo videos
    if (videoUrl.includes("vimeo.com")) {
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        // Note: In production, you'd need to call Vimeo API for thumbnail
        return `https://vumbnail.com/${videoId}.jpg`;
      }
    }

    // For other videos, try to extract a generic thumbnail or return null
    return null;
  } catch (error) {
    console.warn("Failed to get video thumbnail:", error);
    return null;
  }
}

/**
 * Convert HTML content to clean markdown for description
 */
export async function convertToMarkdownDescription(
  content: string
): Promise<string> {
  let markdown = content;

  // Convert iframe videos to markdown image buttons
  const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*><\/iframe>/gi;
  const iframes = [...markdown.matchAll(iframeRegex)];

  for (const iframe of iframes) {
    const [fullMatch, src] = iframe;
    const thumbnail = await getVideoThumbnail(src);

    if (thumbnail) {
      // Create a markdown image button that links to the video
      const videoButton = `[![Video Thumbnail](${thumbnail})](${src})`;
      markdown = markdown.replace(fullMatch, videoButton);
    } else {
      // Fallback: convert to simple link
      markdown = markdown.replace(fullMatch, `[🎥 Watch Video](${src})`);
    }
  }

  // Convert other HTML to markdown
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**"); // Bold
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**"); // Bold
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*"); // Italic
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "*$1*"); // Italic
  markdown = markdown.replace(/<u>(.*?)<\/u>/gi, "*$1*"); // Underline -> italic
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, "`$1`"); // Code
  markdown = markdown.replace(/<pre>(.*?)<\/pre>/gi, "```\n$1\n```"); // Code blocks

  // Convert links
  markdown = markdown.replace(
    /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );

  // Convert headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1");

  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1");
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, "$1");
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1");

  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");

  // Clean up extra whitespace and newlines
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

  return markdown;
}

/**
 * Extract images from markdown content
 */
export function extractMarkdownImages(content: string): string[] {
  console.log(
    "Extracting images from content:",
    content.substring(0, 500) + "..."
  );

  // Multiple regex patterns to catch different image formats
  const patterns = [
    /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g, // Standard markdown ![](url)
    /!\[[^\]]*\]\(([^)]+)\)/g, // More permissive markdown
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi, // HTML img tags
    /https?:\/\/[^\s<>"{}|\\^`\[\]]*\.(jpg|jpeg|png|gif|webp|bmp)/gi, // Direct image URLs
    // Hive-specific image patterns
    /https?:\/\/images\.hive\.blog\/[^\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/files\.peakd\.com\/[^\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/cdn\.steemitimages\.com\/[^\s)]+\.(jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/ipfs\.io\/ipfs\/[^\s)]+/gi,
    /https?:\/\/gateway\.pinata\.cloud\/ipfs\/[^\s)]+/gi,
  ];

  const images: string[] = [];

  patterns.forEach((pattern, index) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const imageUrl = match[1] || match[0]; // For direct URLs, use match[0]
      console.log(`Pattern ${index + 1} found image:`, imageUrl);
      if (imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl);
      }
    }
  });

  // Remove duplicates
  const uniqueImages = [...new Set(images)];

  // Filter for valid image URLs and exclude avatars
  const validImages = uniqueImages.filter((img) => {
    // More permissive image file check - include IPFS and other formats
    const isImageFile =
      img.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
      img.includes("ipfs") ||
      img.includes("images.hive.blog") ||
      img.includes("files.peakd.com") ||
      img.includes("steemitimages.com");

    const isNotAvatar =
      !img.includes("avatar") &&
      !img.includes("/u/") &&
      !img.toLowerCase().includes("profile");

    const isValidUrl = img.startsWith("http");

    console.log(
      `Checking image: ${img} - isImageFile: ${!!isImageFile}, isNotAvatar: ${isNotAvatar}, isValidUrl: ${isValidUrl}`
    );

    return isImageFile && isNotAvatar && isValidUrl;
  });

  console.log("Final extracted images:", validImages);
  return validImages;
}

/**
 * Generate coin card matching the reference design exactly
 */
export async function generateMarkdownCoinCard(
  title: string,
  author: string,
  content: string,
  avatarUrl: string,
  thumbnailUrl?: string
): Promise<File> {
  try {
    // Clean content for card display (remove all HTML/markdown)
    const cleanedContent = cleanContentForCard(content);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Validate canvas context
    if (!ctx) {
      throw new Error(
        "Failed to get 2D canvas context. Canvas may not be supported in this environment."
      );
    }

    canvas.width = 400;
    canvas.height = 600;

    // Helper function for rounded rectangles
    const drawRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Basic drawing operations with error handling
    try {
      // First, clip the entire canvas to rounded corners
      ctx.save();
      drawRoundedRect(0, 0, canvas.width, canvas.height, 12);
      ctx.clip();

      // Black background with rounded corners
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer lime green border with glow and rounded corners
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 20;
      drawRoundedRect(8, 8, canvas.width - 16, canvas.height - 16, 8);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Header section - dark background with lime border and rounded corners
      const headerHeight = 50;
      ctx.fillStyle = "#0a0a0a";
      drawRoundedRect(16, 16, canvas.width - 32, headerHeight, 6);
      ctx.fill();

      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 10;
      drawRoundedRect(16, 16, canvas.width - 32, headerHeight, 6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (error) {
      console.error("Failed to draw background and border:", error);
      throw new Error("Canvas drawing failed during initial setup");
    }

    // Load and draw circular avatar
    try {
      const avatarImg = document.createElement("img");
      avatarImg.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Avatar image load timeout after 5 seconds"));
        }, 5000);

        const cleanup = () => {
          clearTimeout(timeout);
          avatarImg.onload = null;
          avatarImg.onerror = null;
        };

        avatarImg.onload = () => {
          cleanup();
          resolve(avatarImg);
        };

        avatarImg.onerror = () => {
          cleanup();
          reject(new Error(`Failed to load avatar image from: ${avatarUrl}`));
        };

        avatarImg.src = avatarUrl;
      });

      const avatarSize = 30;
      const avatarX = 25;
      const avatarY = 26;

      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          avatarX + avatarSize / 2,
          avatarY + avatarSize / 2,
          avatarSize / 2,
          0,
          2 * Math.PI
        );
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Lime green border around avatar
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(
          avatarX + avatarSize / 2,
          avatarY + avatarSize / 2,
          avatarSize / 2 + 1,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
      } catch (drawError) {
        console.error("Failed to draw avatar image:", drawError);
        throw new Error("Canvas drawing failed while rendering avatar");
      }
    } catch (error) {
      console.warn("Avatar loading/drawing failed, rendering fallback:", error);
      // Fallback avatar - simple circle with initial
      try {
        const avatarSize = 30;
        const avatarX = 25;
        const avatarY = 26;

        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(
          avatarX + avatarSize / 2,
          avatarY + avatarSize / 2,
          avatarSize / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();

        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 14px 'Arial', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          author[0]?.toUpperCase() || "?",
          avatarX + avatarSize / 2,
          avatarY + avatarSize / 2 + 5
        );
        ctx.textAlign = "left";
      } catch (fallbackError) {
        console.error("Failed to draw fallback avatar:", fallbackError);
        // Continue without avatar rather than failing completely
      }
    }

    // Rest of the drawing code with error handling
    try {
      // Author name with lime green glow
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'Arial', sans-serif";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 8;
      ctx.fillText(`${author}`, 70, 45);
      ctx.shadowBlur = 0;

      // Skatehive logo stamp
      try {
        const logoImg = document.createElement("img");
        logoImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Logo image load timeout after 5 seconds"));
          }, 5000);

          const cleanup = () => {
            clearTimeout(timeout);
            logoImg.onload = null;
            logoImg.onerror = null;
          };

          logoImg.onload = () => {
            cleanup();
            resolve(logoImg);
          };

          logoImg.onerror = () => {
            cleanup();
            reject(
              new Error(
                "Failed to load logo image from: /logos/skatehive-logo-rounded.png"
              )
            );
          };

          logoImg.src = "/logos/skatehive-logo-rounded.png";
        });

        const logoSize = 40; // Reduced size for better proportions
        const logoX = canvas.width - logoSize - 25; // Increased margin from right edge
        const logoY = 20; // Increased margin from top

        // Draw the logo with rounded corners and glow effect
        ctx.save();
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 10;
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch (error) {
        console.warn("Logo loading failed, falling back to text:", error);
        // Fallback to original text if logo fails to load
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 10px 'Arial', sans-serif";
        ctx.fillText("SKATEHIVE", canvas.width - 95, 35); // Adjusted for better margin
        ctx.fillText("COIN", canvas.width - 95, 50); // Adjusted for better margin
      }

      // Main content area
      const contentY = 80;
      const contentHeight = canvas.height - contentY - 80;

      // Load and draw thumbnail if available
      let thumbnailHeight = 0;
      if (thumbnailUrl) {
        try {
          const thumbnailImg = document.createElement("img");
          thumbnailImg.crossOrigin = "anonymous";

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Thumbnail image load timeout after 5 seconds"));
            }, 5000);

            const cleanup = () => {
              clearTimeout(timeout);
              thumbnailImg.onload = null;
              thumbnailImg.onerror = null;
            };

            thumbnailImg.onload = () => {
              cleanup();
              resolve(thumbnailImg);
            };

            thumbnailImg.onerror = () => {
              cleanup();
              reject(
                new Error(
                  `Failed to load thumbnail image from: ${thumbnailUrl}`
                )
              );
            };

            thumbnailImg.src = thumbnailUrl;
          });

          thumbnailHeight = 180;
          const thumbnailWidth = canvas.width - 32;
          const thumbnailX = 16;
          const thumbnailY = contentY;

          // Lime green border around thumbnail with rounded corners
          ctx.strokeStyle = "#00ff88";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#00ff88";
          ctx.shadowBlur = 10;
          drawRoundedRect(
            thumbnailX - 2,
            thumbnailY - 2,
            thumbnailWidth + 4,
            thumbnailHeight + 4,
            8
          );
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw thumbnail with rounded corners using clipping
          ctx.save();
          drawRoundedRect(
            thumbnailX,
            thumbnailY,
            thumbnailWidth,
            thumbnailHeight,
            6
          );
          ctx.clip();
          ctx.drawImage(
            thumbnailImg,
            thumbnailX,
            thumbnailY,
            thumbnailWidth,
            thumbnailHeight
          );
          ctx.restore();
        } catch (error) {
          console.warn("Failed to load/draw thumbnail image:", error);
          // Continue without thumbnail
        }
      }

      // Title (centered)
      const titleY = contentY + thumbnailHeight + 35;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Arial', sans-serif";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 8;
      ctx.textAlign = "center";

      const words = title.split(" ");
      let line = "";
      let y = titleY;
      const lineHeight = 22;
      const maxWidth = canvas.width - 32;
      let titleLines = 0;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + " ";
          y += lineHeight;
          titleLines++;
          if (titleLines >= 2) break;
        } else {
          line = testLine;
        }
      }

      if (titleLines < 2) {
        ctx.fillText(line, canvas.width / 2, y);
        y += lineHeight;
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = "left";

      // Content preview with text box
      const contentStartY = y + 15;
      const availableHeight = canvas.height - contentStartY - 60;
      const contentBoxPadding = 12;
      const contentBoxX = 16;
      const contentBoxWidth = canvas.width - 32;
      const contentBoxHeight = Math.min(availableHeight, 120);

      // Draw rounded text box background
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.strokeStyle = "rgba(0, 255, 136, 0.3)";
      ctx.lineWidth = 1;
      
      drawRoundedRect(contentBoxX, contentStartY, contentBoxWidth, contentBoxHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Content text inside the box
      ctx.fillStyle = "#cccccc";
      ctx.font = "12px 'Arial', sans-serif";

      const contentWords = cleanedContent.slice(0, 500).split(" ");
      let contentLine = "";
      let contentY_text = contentStartY + contentBoxPadding + 12;
      const contentLineHeight = 16;
      const maxContentWidth = contentBoxWidth - (contentBoxPadding * 2);
      const maxContentLines = Math.floor((contentBoxHeight - (contentBoxPadding * 2)) / contentLineHeight);
      let contentLines = 0;

      for (
        let n = 0;
        n < contentWords.length && contentLines < maxContentLines;
        n++
      ) {
        const testLine = contentLine + contentWords[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxContentWidth && n > 0) {
          ctx.fillText(contentLine, contentBoxX + contentBoxPadding, contentY_text);
          contentLine = contentWords[n] + " ";
          contentY_text += contentLineHeight;
          contentLines++;
        } else {
          contentLine = testLine;
        }
      }

      if (contentLines < maxContentLines && contentLine.trim()) {
        ctx.fillText(contentLine, contentBoxX + contentBoxPadding, contentY_text);
      }

      // Glowing footer with skatehive branding
      const footerY = canvas.height - 30; // Moved up slightly for better spacing
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 12px 'Arial', sans-serif";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 15;
      ctx.textAlign = "center";
      ctx.fillText("SKATEHIVE CREW", canvas.width / 2, footerY);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";

      // Restore the canvas context to remove clipping
      ctx.restore();
    } catch (error) {
      console.error("Failed during text and content drawing:", error);
      throw new Error("Canvas drawing failed during content rendering");
    }

    // Create blob with error handling
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              try {
                const file = new File([blob], "coin-card.png", {
                  type: "image/png",
                });
                resolve(file);
              } catch (fileError) {
                console.error("Failed to create File from blob:", fileError);
                reject(
                  new Error("Failed to create File object from canvas blob")
                );
              }
            } else {
              console.error("Canvas toBlob returned null");
              reject(
                new Error(
                  "Failed to create blob from canvas - toBlob returned null"
                )
              );
            }
          },
          "image/png",
          0.95
        );
      } catch (blobError) {
        console.error("Failed to call canvas.toBlob:", blobError);
        reject(new Error("Canvas toBlob operation failed"));
      }
    });
  } catch (error) {
    console.error("Critical error in generateMarkdownCoinCard:", error);
    // Return a rejected promise with a clear error message
    return Promise.reject(
      new Error(
        `Failed to generate coin card: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    );
  }
}

export interface ContentAnalysis {
  isLongform: boolean;
  wordCount: number;
  readingTime: number;
  hasMarkdown: boolean;
  reason: string;
}

/**
 * Analyze content to determine if it's suitable for markdown coin creation
 */
export function analyzeContent(content: string): ContentAnalysis {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  // Check for markdown syntax
  const markdownPatterns = [
    /^#{1,6}\s+/m, // Headers
    /\*{1,2}[^*]+\*{1,2}/, // Bold/italic
    /`[^`]+`/, // Inline code
    /```[\s\S]*?```/, // Code blocks
    /^\s*[-*+]\s+/m, // Lists
    /^\s*\d+\.\s+/m, // Numbered lists
    /^\s*>\s+/m, // Blockquotes
    /\[.*?\]\(.*?\)/, // Links
    /!\[.*?\]\(.*?\)/, // Images
  ];
  
  const hasMarkdown = markdownPatterns.some(pattern => pattern.test(content));
  
  // Determine if it's longform - removed minimum word count restriction
  let isLongform = true; // Allow any post to be converted to a coin
  let reason = '';
  
  if (wordCount < 100) {
    reason = 'Very short post suitable for coin creation';
  } else if (wordCount >= 100 && wordCount < 300) {
    reason = 'Short post suitable for coin creation';
  } else if (wordCount >= 300 && wordCount < 1000) {
    reason = 'Medium-length post suitable for coin creation';
  } else if (wordCount >= 1000) {
    reason = 'Long-form content ideal for coin creation';
  }
  
  return {
    isLongform,
    wordCount,
    readingTime,
    hasMarkdown,
    reason,
  };
}

/**
 * Check if a post already has a Zora coin
 */
export function hasExistingCoin(jsonMetadata: string): boolean {
  try {
    const metadata = JSON.parse(jsonMetadata);
    return !!(metadata.zora_coin_address || metadata.zora_coin_url);
  } catch {
    return false;
  }
}

/**
 * Extract Zora coin information from post metadata
 */
export function extractCoinInfo(jsonMetadata: string): { address?: string; url?: string } | null {
  try {
    const metadata = JSON.parse(jsonMetadata);
    return {
      address: metadata.zora_coin_address,
      url: metadata.zora_coin_url,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is eligible to create a coin from this post
 */
export function canCreateCoin(post: any, currentUser: string | null): {
  canCreate: boolean;
  reason: string;
} {
  debug('🔍 canCreateCoin debug:', {
    currentUser,
    postAuthor: post.author,
    postBody: sanitizeForLogging(post.body, 100),
    jsonMetadata: process.env.NODE_ENV === "development" ? post.json_metadata : '[metadata hidden]'
  });

  if (!currentUser) {
    console.log('❌ No current user');
    return {
      canCreate: false,
      reason: 'Please connect your wallet and Hive account',
    };
  }

  const body: string = typeof post?.body === 'string' ? post.body : '';
  const analysis = analyzeContent(body);
  if (!body.trim()) {
    return {
      canCreate: false,
      reason: 'Post body is empty',
    };
  }
  debug('📊 Content analysis:', analysis);
  if (!analysis.isLongform) {
    debug('❌ Not longform:', analysis.reason);
    return {
      canCreate: false,
      reason: analysis.reason,
    };
  }

  const hasExisting = hasExistingCoin(post.json_metadata || '{}');
  debug('🪙 Has existing coin:', hasExisting);
  
  if (hasExisting) {
    return {
      canCreate: false,
      reason: 'This post already has a Zora coin',
    };
  }

  // Check if user is the author (for now, only authors can create coins)
  // Safely normalize usernames to handle undefined values
  const currentUserNormalized = (currentUser || '').toLowerCase();
  const authorNormalized = (post.author || '').toLowerCase();
  
  const isAuthor = currentUserNormalized === authorNormalized;
  debug('✍️ Author check:', {
    currentUser: currentUserNormalized,
    postAuthor: authorNormalized,
    isAuthor
  });
  
  if (!isAuthor) {
    return {
      canCreate: false,
      reason: 'Only the post author can create a coin from this content',
    };
  }

  debug('✅ Can create coin!');
  return {
    canCreate: true,
    reason: `Ready to create coin for ${analysis.wordCount} word post`,
  };
}
