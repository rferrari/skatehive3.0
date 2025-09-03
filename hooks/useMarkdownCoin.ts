import { useState, useCallback } from 'react';
import { createCoin, DeployCurrency, createMetadataBuilder, createZoraUploaderForCreator, setApiKey } from '@zoralabs/coins-sdk';
import { useAccount, useWalletClient, usePublicClient, useSwitchChain, useChainId } from 'wagmi';
import { useToast } from '@chakra-ui/react';
import { SKATEHIVE_PLATFORM_REFERRER } from '@/components/shared/search/constants';
import { useAioha } from "@aioha/react-ui";
import { base } from 'wagmi/chains';
import { uploadToIpfs } from '@/lib/markdown/composeUtils';
import { Discussion } from "@hiveio/dhive";

export interface MarkdownCoinData {
  name: string;
  symbol: string;
  description: string;
  markdownContent: string;
  author: string;
  permlink: string;
  postUrl: string;
}

// Helper function to extract thumbnail from post
const extractThumbnailFromPost = (post: Discussion): string | null => {
  try {
    // First try to get from json_metadata
    if (post.json_metadata) {
      const metadata = JSON.parse(post.json_metadata);
      if (metadata.image && Array.isArray(metadata.image) && metadata.image[0]) {
        return metadata.image[0];
      }
      if (metadata.thumbnail && Array.isArray(metadata.thumbnail) && metadata.thumbnail[0]) {
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
    console.warn('Failed to extract thumbnail:', error);
    return null;
  }
};

// Extract all images from markdown content for carousel
const extractMarkdownImages = (content: string): string[] => {
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  const images: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  return images.filter(img => 
    img.match(/\.(jpg|jpeg|png|gif|webp)$/i) && 
    !img.includes('avatar') // Filter out avatar images
  );
};

// Convert image URL to IPFS if needed
const convertToIPFS = async (imageUrl: string): Promise<string> => {
  console.log("🔄 convertToIPFS called with:", imageUrl);
  
  // If already IPFS, return as is
  if (imageUrl.startsWith('ipfs://')) {
    return imageUrl;
  }
  
  try {
    // For HTTP images, upload to IPFS using our upload utility
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'carousel-image.jpg', { type: blob.type });
    
    const ipfsUrl = await uploadToIpfs(file, 'carousel-image.jpg');
    const cleanIpfsUrl = ipfsUrl.split('?')[0]; // Remove query parameters
    return cleanIpfsUrl;
  } catch (error) {
    console.warn('Failed to upload to IPFS, using original URL:', error);
    return imageUrl;
  }
};

// Convert HTML content to clean markdown for description
const convertToMarkdown = (content: string): string => {
  let markdown = content;
  
  // Convert iframe videos to image buttons with thumbnails
  markdown = markdown.replace(
    /<iframe[^>]*src=["']([^"']*(?:youtube\.com\/embed\/|youtu\.be\/|vimeo\.com\/))([^"']*)["'][^>]*><\/iframe>/gi,
    (match, baseUrl, videoId) => {
      // Extract video ID and create thumbnail
      let thumbnailUrl = '';
      let videoUrl = baseUrl + videoId;
      
      if (baseUrl.includes('youtube.com/embed/')) {
        const ytId = videoId.split('?')[0];
        thumbnailUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
        videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
      } else if (baseUrl.includes('youtu.be/')) {
        const ytId = videoId.split('?')[0];
        thumbnailUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
        videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
      } else if (baseUrl.includes('vimeo.com/')) {
        // For Vimeo, we'll use a generic play button since thumbnail API requires auth
        thumbnailUrl = 'https://i.vimeocdn.com/video/default_300x169.jpg';
      }
      
      return `[![🎥 Watch Video](${thumbnailUrl})](${videoUrl})`;
    }
  );
  
  // Convert other HTML elements to markdown
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  markdown = markdown.replace(/<h([1-6])>(.*?)<\/h[1-6]>/gi, (match, level, text) => {
    return '#'.repeat(parseInt(level)) + ' ' + text + '\n\n';
  });
  
  // Convert links
  markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Convert images
  markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi, '![$1]($2)');
  markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace and line breaks
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  markdown = markdown.replace(/^\s+|\s+$/gm, '');
  
  return markdown.trim();
};

// Create carousel metadata structure for Zora
const createCarouselContent = async (cardImageFile: File, markdownImages: string[]): Promise<any> => {
  try {
    // Upload the generated card to IPFS
    const cardImageIPFS = await uploadToIpfs(cardImageFile, 'nft-card.png');
    const cleanCardImageIPFS = cardImageIPFS.split('?')[0]; // Remove query parameters
    
    const carouselMedia = [
      {
        uri: cleanCardImageIPFS,
        mime: "image/png"
      }
    ];
    
    // Add markdown images to carousel
    for (const imageUrl of markdownImages) {
      try {
        const ipfsUrl = await convertToIPFS(imageUrl);
        const cleanIpfsUrl = ipfsUrl.split('?')[0]; // Remove query parameters
        carouselMedia.push({
          uri: cleanIpfsUrl,
          mime: "image/jpeg" // Default, could be detected
        });
      } catch (error) {
        console.warn('Failed to process image for carousel:', imageUrl, error);
      }
    }
    
    // Always return a carousel structure (even if only the generated card)
    return {
      mime: "image/png", // Main mime type
      uri: `ipfs://${cleanCardImageIPFS.replace('https://ipfs.skatehive.app/ipfs/', '')}`, // Main image URI with ipfs:// protocol
      type: "CAROUSEL",
      carousel: {
        version: "1.0.0",
        media: carouselMedia.map(item => ({
          uri: `ipfs://${item.uri.replace('https://ipfs.skatehive.app/ipfs/', '')}`,
          mime: item.mime
        }))
      }
    };
  } catch (error) {
    console.error('Failed to create carousel content:', error);
    // Fallback to simple content
    const cardImageIPFS = await uploadToIpfs(cardImageFile, 'nft-card-fallback.png');
    const cleanCardImageIPFS = cardImageIPFS.split('?')[0]; // Remove query parameters
    return {
      mime: "image/png",
      uri: cleanCardImageIPFS
    };
  }
};

// Generate NFT card matching the reference design exactly
const generateMarkdownNFTCard = async (
  title: string, 
  author: string, 
  content: string,
  avatarUrl: string,
  thumbnailUrl?: string
): Promise<File> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 400;
  canvas.height = 600;
  
  if (ctx) {
    // Black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer lime green border with glow
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 20;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.shadowBlur = 0;

    // Header section - dark background with lime border
    const headerHeight = 50;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(16, 16, canvas.width - 32, headerHeight);
    
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 10;
    ctx.strokeRect(16, 16, canvas.width - 32, headerHeight);
    ctx.shadowBlur = 0;

    // Load and draw circular avatar
    try {
      const avatarImg = document.createElement("img");
      avatarImg.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        avatarImg.onload = resolve;
        avatarImg.onerror = reject;
        avatarImg.src = avatarUrl;
      });

      // Avatar circle
      const avatarSize = 30;
      const avatarX = 25;
      const avatarY = 25;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Avatar border
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (error) {
      // Fallback avatar
      const avatarSize = 30;
      const avatarX = 25;
      const avatarY = 25;

      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(author[0].toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 5);
    }

    // Username in header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 3;
    ctx.fillText(`@${author}`, 65, 45);
    ctx.shadowBlur = 0;

    // Read time circle (top right)
    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
    const readTime = Math.ceil(wordCount / 200);
    
    ctx.fillStyle = "#00ff88";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(canvas.width - 35, 41, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(readTime.toString(), canvas.width - 35, 46);

    // Main image section
    const imageY = 82;
    const imageHeight = 280;
    const imageWidth = canvas.width - 32;
    const imageX = 16;

    // Image border
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 15;
    ctx.strokeRect(imageX, imageY, imageWidth, imageHeight);
    ctx.shadowBlur = 0;

    // Load and display the main image
    if (thumbnailUrl) {
      try {
        const thumbnailImg = document.createElement('img');
        thumbnailImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          thumbnailImg.onload = resolve;
          thumbnailImg.onerror = reject;
          thumbnailImg.src = thumbnailUrl;
        });

        // Fill the image area while maintaining aspect ratio
        const aspectRatio = thumbnailImg.width / thumbnailImg.height;
        let imgWidth = imageWidth;
        let imgHeight = imgWidth / aspectRatio;
        
        if (imgHeight > imageHeight) {
          imgHeight = imageHeight;
          imgWidth = imgHeight * aspectRatio;
        }
        
        const imgX = imageX + (imageWidth - imgWidth) / 2;
        const imgY = imageY + (imageHeight - imgHeight) / 2;
        
        ctx.drawImage(thumbnailImg, imgX, imgY, imgWidth, imgHeight);
        
      } catch (error) {
        // Fallback - black background with SKATEHIVE text
        ctx.fillStyle = "#000000";
        ctx.fillRect(imageX + 2, imageY + 2, imageWidth - 4, imageHeight - 4);
        
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 20;
        ctx.fillText("SKATEHIVE", canvas.width / 2, imageY + imageHeight / 2 - 10);
        ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("LONGFORM POST", canvas.width / 2, imageY + imageHeight / 2 + 20);
        ctx.shadowBlur = 0;
      }
    } else {
      // No image - show SKATEHIVE branding
      ctx.fillStyle = "#000000";
      ctx.fillRect(imageX + 2, imageY + 2, imageWidth - 4, imageHeight - 4);
      
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 20;
      ctx.fillText("SKATEHIVE", canvas.width / 2, imageY + imageHeight / 2 - 10);
      ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("LONGFORM POST", canvas.width / 2, imageY + imageHeight / 2 + 20);
      ctx.shadowBlur = 0;
    }

    // Title section - black background
    const titleY = 380;
    const titleHeight = 60;
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(16, titleY, canvas.width - 32, titleHeight);
    
    // Title text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 5;
    
    // Truncate title if needed
    let displayTitle = title;
    const maxTitleWidth = canvas.width - 60;
    if (ctx.measureText(title).width > maxTitleWidth) {
      while (ctx.measureText(displayTitle + "...").width > maxTitleWidth && displayTitle.length > 10) {
        displayTitle = displayTitle.slice(0, -1);
      }
      displayTitle += "...";
    }
    
    ctx.fillText(displayTitle, canvas.width / 2, titleY + 35);
    ctx.shadowBlur = 0;

    // Description section
    const descY = 455;
    const descHeight = 90;
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(16, descY, canvas.width - 32, descHeight);

    // Description text
    ctx.fillStyle = "#cccccc";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    
    // Clean and prepare description
    const sentences = content.replace(/[#*`_\[\]()]/g, '').split(/[.!?]+/).filter(s => s.trim());
    let description = sentences.slice(0, 2).join('. ').substring(0, 120);
    if (description.length >= 120) description += "...";
    
    // Wrap text
    const maxDescWidth = canvas.width - 50;
    const words = description.split(' ');
    let line = '';
    let y = descY + 18;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxDescWidth && n > 0) {
        ctx.fillText(line, 25, y);
        line = words[n] + ' ';
        y += 14;
        if (y > descY + descHeight - 10) break;
      } else {
        line = testLine;
      }
    }
    if (y <= descY + descHeight - 10) {
      ctx.fillText(line, 25, y);
    }

    // Bottom stats bar
    const bottomY = 560;
    const bottomHeight = 25;
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(16, bottomY, canvas.width - 32, bottomHeight);
    
    // Bottom border
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;
    ctx.strokeRect(16, bottomY, canvas.width - 32, bottomHeight);
    ctx.shadowBlur = 0;
    
    // Left side - word count
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 5;
    ctx.fillText(`${wordCount} words`, 25, bottomY + 16);
    ctx.shadowBlur = 0;
    
    // Right side - SKATEHIVE
    ctx.textAlign = "right";
    ctx.fillStyle = "#00ff88";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;
    ctx.fillText("SKATEHIVE", canvas.width - 25, bottomY + 16);
    ctx.shadowBlur = 0;
  }
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'longform-nft-card.png', { type: 'image/png' });
        resolve(file);
      }
    }, 'image/png', 0.95);
  });
};

export function useMarkdownCoin() {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { aioha, user } = useAioha();
  const toast = useToast();

  const createMarkdownCoin = useCallback(async (
    post: Discussion, 
    selectedCarouselImages?: Array<{uri: string, mime: string, type: string, isIncluded: boolean, isGenerated?: boolean}>
  ) => {
    console.log("🎯 HOOK RECEIVED:");
    console.log("- post.title:", post.title);
    console.log("- selectedCarouselImages:", selectedCarouselImages);
    console.log("- selectedCarouselImages length:", selectedCarouselImages?.length || 0);
    if (!address || !walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    const apiKey = process.env.NEXT_PUBLIC_ZORA_API_KEY;
    if (!apiKey) {
      throw new Error("Zora API key not configured");
    }

    setApiKey(apiKey);
    setIsCreating(true);

    try {
      // Ensure we're on Base network
      if (chainId !== base.id) {
        try {
          await switchChain({ chainId: base.id });
        } catch (switchError: any) {
          throw new Error(`Failed to switch to Base network. Please switch manually. Error: ${switchError.message}`);
        }
      }

      // Generate symbol from title
      const generateSymbol = (title: string): string => {
        return title
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 6);
      };

      const symbol = generateSymbol(post.title);

      if (!symbol || symbol.trim().length === 0) {
        throw new Error("Failed to generate symbol for the coin");
      }

      if (!post.title || post.title.trim().length === 0) {
        throw new Error("Post title is required for coin creation");
      }
      const avatarUrl = `https://images.hive.blog/u/${post.author}/avatar/sm`;
      const thumbnailUrl = extractThumbnailFromPost(post);
      
      // Use selected carousel images or extract from markdown
      let markdownImages: string[] = [];
      if (selectedCarouselImages && selectedCarouselImages.length > 0) {
        // Use only the included images from the carousel selection (excluding generated card)
        markdownImages = selectedCarouselImages
          .filter(img => img.isIncluded && !img.isGenerated)
          .map(img => img.uri);
      } else {
        // Fallback to extracting all images from markdown
        markdownImages = extractMarkdownImages(post.body);
      }
      console.log('Using carousel images:', markdownImages);
      console.log('Selected carousel images received:', selectedCarouselImages);
      
      // Generate NFT card image
      const nftCardImage = await generateMarkdownNFTCard(
        post.title,
        post.author,
        post.body,
        avatarUrl,
        thumbnailUrl || undefined
      );

      // Extract URLs from selected carousel images (only included ones, excluding generated cards)
      const carouselImageUrls = selectedCarouselImages
        ?.filter(img => img.isIncluded && !img.isGenerated) // Exclude generated cards
        ?.map(img => img.uri) || [];
      
      console.log("🔍 CAROUSEL DEBUG:");
      console.log("- selectedCarouselImages:", selectedCarouselImages);
      console.log("- selectedCarouselImages length:", selectedCarouselImages?.length || 0);
      console.log("- filtered included images:", selectedCarouselImages?.filter(img => img.isIncluded));
      console.log("- filtered non-generated images:", selectedCarouselImages?.filter(img => img.isIncluded && !img.isGenerated));
      console.log("- carouselImageUrls:", carouselImageUrls);
      console.log("- carouselImageUrls length:", carouselImageUrls.length);

      // Validate that we have at least the generated card
      if (!nftCardImage) {
        throw new Error("Failed to generate NFT card image");
      }

      // Create carousel content (card + selected carousel images)
      const carouselContent = await createCarouselContent(nftCardImage, carouselImageUrls);
      console.log('Created carousel content:', carouselContent);
      console.log('Carousel media count:', carouselContent.carousel?.media?.length || 0);

      // Upload markdown content to IPFS
      const markdownBlob = new Blob([post.body], { type: 'text/markdown' });
      const markdownFile = new File([markdownBlob], `${post.permlink}.md`, { type: 'text/markdown' });
      const markdownIpfsUrl = await uploadToIpfs(markdownBlob, `${post.permlink}.md`);
      const cleanMarkdownIpfsUrl = markdownIpfsUrl.split('?')[0]; // Remove query parameters

      if (!markdownIpfsUrl) {
        throw new Error("Failed to upload markdown content to IPFS");
      }

      // Prepare the description with markdown content
      const convertedMarkdown = convertToMarkdown(post.body);
      let description = `${post.title}\n\nBy @${post.author}\n\nOriginal post: https://skatehive.app/post/${post.author}/${post.permlink}\n\n---\n\n${convertedMarkdown}`;

      // Truncate description if it's too long (some metadata builders have limits)
      const MAX_DESCRIPTION_LENGTH = 2000;
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        description = description.substring(0, MAX_DESCRIPTION_LENGTH - 3) + "...";
        console.log(`Description truncated from ${description.length + 3} to ${description.length} characters`);
      }

      if (!description || description.trim().length === 0) {
        throw new Error("Failed to generate description for the coin");
      }

      // LOG METADATA FORMAT FOR COMPARISON WITH ZORA CAROUSEL EXAMPLE
      console.log("=== ZORA METADATA STRUCTURE ===");
      console.log("Expected Zora format example:", {
        name: post.title,
        ticker: symbol,
        description: description,
        image: "ipfs://...", // This will be nftCardImage after upload
        content: {
          mime: carouselContent.mime || "image/jpeg",
          uri: "ipfs://...", // This will be the same as image
          type: carouselContent.type || "CAROUSEL",
          carousel: carouselContent.carousel
        }
      });
      console.log("Our carousel content structure:", JSON.stringify(carouselContent, null, 2));
      console.log("Selected carousel images:", selectedCarouselImages?.filter(img => img.isIncluded));
      console.log("Carousel image URLs being used:", carouselImageUrls);
      console.log("================================");

      // Always use carousel format (even with just the generated card)
      // Upload the carousel JSON to IPFS first
      const carouselIpfsUrl = await uploadToIpfs(
        new Blob([JSON.stringify(carouselContent, null, 2)], { type: 'application/json' }), 
        'carousel.json'
      );

      if (!carouselIpfsUrl) {
        throw new Error("Failed to upload carousel content to IPFS");
      }
      
      // Clean the carousel IPFS URL to remove query parameters
      const cleanCarouselIpfsUrl = carouselIpfsUrl.split('?')[0];

      console.log("=== METADATA BUILDER DEBUG ===");
      console.log("- nftCardImage type:", typeof nftCardImage);
      console.log("- nftCardImage instanceof File:", nftCardImage instanceof File);
      console.log("- nftCardImage instanceof Blob:", nftCardImage instanceof Blob);
      console.log("- cleanCarouselIpfsUrl:", cleanCarouselIpfsUrl);
      console.log("- post.title:", post.title);
      console.log("- symbol:", symbol);
      console.log("- description length:", description?.length);
      console.log("================================");

      // VALIDATE REQUIRED FIELDS BEFORE GENERATING METADATA
      if (!post.title || !symbol || !description || !nftCardImage || !cleanCarouselIpfsUrl) {
        const missingFields = [];
        if (!post.title) missingFields.push("post.title");
        if (!symbol) missingFields.push("symbol");
        if (!description) missingFields.push("description");
        if (!nftCardImage) missingFields.push("nftCardImage");
        if (!cleanCarouselIpfsUrl) missingFields.push("cleanCarouselIpfsUrl");

        throw new Error(`Missing required fields for metadata generation: ${missingFields.join(", ")}`);
      }

      // NUCLEAR OPTION: Create metadata manually without the problematic builder
      console.log("🚨 BYPASSING METADATA BUILDER - Creating metadata manually");
      
      let cleanMetadataUrl: string;
      let metadataObject: any;
      
      try {
        // Upload the NFT card image to get clean IPFS URL
        const cardImageIpfsUrl = await uploadToIpfs(nftCardImage, 'nft-card.png');
        const cleanCardImageUrl = cardImageIpfsUrl.split('?')[0];
        
        // Create the metadata object manually in the exact format Zora expects
        const manualMetadata = {
          name: post.title,
          description: description,
          image: `ipfs://${cleanCardImageUrl.replace('https://ipfs.skatehive.app/ipfs/', '')}`,
          content: carouselContent, // Embed the full carousel structure directly
          properties: {
            content_type: 'longform-post',
            skatehive_post: 'true',
            markdown_ipfs: cleanMarkdownIpfsUrl,
            word_count: post.body.split(/\s+/).filter(w => w.length > 0).length.toString(),
            reading_time: Math.ceil(post.body.split(/\s+/).filter(w => w.length > 0).length / 200).toString(),
            original_author: post.author,
            original_permlink: post.permlink,
            original_url: `https://skatehive.app/post/${post.author}/${post.permlink}`,
            carousel_images: (carouselContent.carousel?.media?.length || 1).toString(),
            has_carousel: carouselContent.carousel ? 'true' : 'false',
            carousel_type: carouselContent.type || 'CAROUSEL',
            carousel_version: carouselContent.carousel?.version || '1.0.0',
            carousel_ipfs: cleanCarouselIpfsUrl,
          }
        };

        console.log("🔍 DETAILED CAROUSEL CONTENT ANALYSIS:");
        console.log("- carouselContent:", JSON.stringify(carouselContent, null, 2));
        console.log("- carouselContent.type:", carouselContent.type);
        console.log("- carouselContent.mime:", carouselContent.mime);
        console.log("- carouselContent.uri:", carouselContent.uri);
        console.log("- carouselContent.carousel:", carouselContent.carousel);
        console.log("- carouselContent.carousel.media length:", carouselContent.carousel?.media?.length);
        console.log("- carouselContent.carousel.media items:");

        console.log("==========================================");
        console.log("🔍 MANUAL METADATA FINAL STRUCTURE:");
        console.log("- manualMetadata.name:", manualMetadata.name);
        console.log("- manualMetadata.image:", manualMetadata.image);
        console.log("- manualMetadata.content:", JSON.stringify(manualMetadata.content, null, 2));
        console.log("- manualMetadata.content.carousel.media length:", manualMetadata.content.carousel?.media?.length);
        console.log("==========================================");

        console.log("✅ Manual metadata created:", JSON.stringify(manualMetadata, null, 2));
        
        // Upload the metadata to IPFS
        const metadataBlob = new Blob([JSON.stringify(manualMetadata, null, 2)], { type: 'application/json' });
        const metadataIpfsUrl = await uploadToIpfs(metadataBlob, 'metadata.json');
        cleanMetadataUrl = metadataIpfsUrl.split('?')[0];
        
        console.log("✅ Metadata uploaded to IPFS:", cleanMetadataUrl);
        
        // Set the metadata object for use outside the try block
        metadataObject = manualMetadata;
        
      } catch (error) {
        console.log("❌ Manual metadata creation failed:", error);
        throw error;
      }
      console.log("====================================");

      // Use our manual metadata instead of the problematic builder
      const createMetadataParameters = {
        name: post.title,
        symbol: symbol,
        uri: `ipfs://${cleanMetadataUrl.replace('https://ipfs.skatehive.app/ipfs/', '')}` as `ipfs://${string}`
      };

      // LOG FINAL METADATA PARAMETERS SENT TO ZORA
      console.log("=== FINAL ZORA METADATA PARAMETERS ===");
      console.log("createMetadataParameters:", JSON.stringify(createMetadataParameters, null, 2));
      console.log("=====================================");

      // Create the coin
      const coinParams = {
        ...createMetadataParameters,
        payoutRecipient: address,
        platformReferrer: SKATEHIVE_PLATFORM_REFERRER as `0x${string}`,
        currency: DeployCurrency.ZORA, // Use ZORA as the trading currency
      };

      const result = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120, // Add 20% buffer to gas
      });

      if (!result?.address) {
        throw new Error("Failed to get coin address from creation result");
      }

      const coinAddress = result.address;

      toast({
        title: "Markdown Coin Created!",
        description: `Your longform post "${post.title}" has been minted as a Zora coin!`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      return {
        success: true,
        coinAddress,
        zoraUrl: `https://zora.co/coin/base:${coinAddress}`,
        markdownIpfsUrl,
        transactionHash: result.hash,
        debugInfo: {
          coinParams,
          metadataParameters: createMetadataParameters,
          carouselContent,
          description: convertedMarkdown.substring(0, 500) + "...",
          symbol,
          markdownImages: markdownImages.length,
          hasCarousel: markdownImages.length > 0,
          originalPost: {
            title: post.title,
            author: post.author,
            permlink: post.permlink,
            wordCount: post.body.split(/\s+/).filter(w => w.length > 0).length,
          }
        }
      };

    } catch (error) {
      console.error("Error creating markdown coin:", error);
      toast({
        title: "Failed to create coin",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, walletClient, publicClient, chainId, switchChain, aioha, user, toast]);

  return {
    createMarkdownCoin,
    isCreating,
  };
}
