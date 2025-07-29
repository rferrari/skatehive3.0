import { processMediaContent } from "@/lib/markdown/MarkdownRenderer";
import { extractZoraCoinLinks } from "@/lib/utils/extractImageUrls";

export interface ProcessedMarkdown {
  originalContent: string;
  processedContent: string;
  contentWithPlaceholders: string;
  hasInstagramEmbeds: boolean;
  videoPlaceholders: VideoPlaceholder[];
}

export interface VideoPlaceholder {
  type: 'VIDEO' | 'ODYSEE' | 'YOUTUBE' | 'VIMEO' | 'ZORACOIN';
  id: string;
  placeholder: string;
}

// Cache for processed markdown
const markdownProcessingCache = new Map<string, ProcessedMarkdown>();

export class MarkdownProcessor {
  static process(content: string): ProcessedMarkdown {
    // Check cache first
    if (markdownProcessingCache.has(content)) {
      return markdownProcessingCache.get(content)!;
    }

    // Step 1: Process media content (from existing MarkdownRenderer)
    const processedContent = processMediaContent(content);

    // Step 2: Convert Zora coin links to placeholders  
    const contentWithZoraPlaceholders = this.convertZoraCoinLinksToPlaceholders(processedContent);

    // Step 3: Extract video placeholders and convert to our format
    const contentWithPlaceholders = this.convertToVideoPlaceholders(contentWithZoraPlaceholders);

    // Step 4: Detect Instagram embeds
    const hasInstagramEmbeds = processedContent.includes("<!--INSTAGRAM_EMBED_SCRIPT-->");

    // Step 5: Extract video placeholder information
    const videoPlaceholders = this.extractVideoPlaceholders(contentWithPlaceholders);

    const result: ProcessedMarkdown = {
      originalContent: content,
      processedContent,
      contentWithPlaceholders,
      hasInstagramEmbeds,
      videoPlaceholders,
    };

    // Cache the result
    markdownProcessingCache.set(content, result);
    return result;
  }

  private static convertZoraCoinLinksToPlaceholders(content: string): string {
    const zoraCoinLinks = extractZoraCoinLinks(content);
    
    let processedContent = content;
    
    zoraCoinLinks.forEach(addressWithChain => {
      // Extract just the address part (remove chain prefix if present)
      const address = addressWithChain.includes(':') ? addressWithChain.split(':')[1] : addressWithChain;
      const originalUrl = `https://zora.co/coin/${addressWithChain}`;
      const placeholder = `[[ZORACOIN:${address}]]`;
      
      processedContent = processedContent.replace(originalUrl, placeholder);
    });
    
    return processedContent;
  }

  private static convertToVideoPlaceholders(content: string): string {
    return content.replace(
      /<div class="video-embed" data-ipfs-hash="([^"]+)">[\s\S]*?<\/div>/g,
      (_, videoID) => `[[VIDEO:${videoID}]]`
    );
  }

  private static extractVideoPlaceholders(content: string): VideoPlaceholder[] {
    const placeholders: VideoPlaceholder[] = [];
    const regex = /\[\[(VIDEO|ODYSEE|YOUTUBE|VIMEO|ZORACOIN):([^\]]+)\]\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      placeholders.push({
        type: match[1] as 'VIDEO' | 'ODYSEE' | 'YOUTUBE' | 'VIMEO' | 'ZORACOIN',
        id: match[2],
        placeholder: match[0],
      });
    }

    return placeholders;
  }

  static clearCache(): void {
    markdownProcessingCache.clear();
  }
}
