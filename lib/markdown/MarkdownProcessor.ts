import { processMediaContent } from "@/lib/markdown/MarkdownRenderer";

export interface ProcessedMarkdown {
  originalContent: string;
  processedContent: string;
  contentWithPlaceholders: string;
  hasInstagramEmbeds: boolean;
  videoPlaceholders: VideoPlaceholder[];
}

export interface VideoPlaceholder {
  type: 'VIDEO' | 'ODYSEE' | 'YOUTUBE' | 'VIMEO';
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

    // Insert placeholders after Zora coin links
    const withZora = this.addZoraCoinPlaceholders(processedContent);

    // Step 2: Extract video placeholders and convert to our format
    const contentWithPlaceholders = this.convertToVideoPlaceholders(withZora);

    // Step 3: Detect Instagram embeds
    const hasInstagramEmbeds = processedContent.includes("<!--INSTAGRAM_EMBED_SCRIPT-->");

    // Step 4: Extract video placeholder information
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

  private static convertToVideoPlaceholders(content: string): string {
    return content.replace(
      /<div class="video-embed" data-ipfs-hash="([^"]+)">[\s\S]*?<\/div>/g,
      (_, videoID) => `[[VIDEO:${videoID}]]`
    );
  }

  private static extractVideoPlaceholders(content: string): VideoPlaceholder[] {
    const placeholders: VideoPlaceholder[] = [];
    const regex = /\[\[(VIDEO|ODYSEE|YOUTUBE|VIMEO):([^\]]+)\]\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      placeholders.push({
        type: match[1] as 'VIDEO' | 'ODYSEE' | 'YOUTUBE' | 'VIMEO',
        id: match[2],
        placeholder: match[0],
      });
    }

    return placeholders;
  }

  static clearCache(): void {
    markdownProcessingCache.clear();
  }

  private static addZoraCoinPlaceholders(content: string): string {
    return content.replace(
      /(https:\/\/zora\.co\/coin\/([a-zA-Z0-9:]+))/g,
      (_match, url, addr) => `${url} [[ZORACOIN:${addr}]]`
    );
  }
}
