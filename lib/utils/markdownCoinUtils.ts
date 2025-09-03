/**
 * Utility functions for detecting and handling longform markdown content
 */

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
  console.log('🔍 canCreateCoin debug:', {
    currentUser,
    postAuthor: post.author,
    postBody: post.body?.substring(0, 100) + '...',
    jsonMetadata: post.json_metadata
  });

  if (!currentUser) {
    console.log('❌ No current user');
    return {
      canCreate: false,
      reason: 'Please connect your wallet and Hive account',
    };
  }

  const analysis = analyzeContent(post.body);
  console.log('📊 Content analysis:', analysis);
  
  if (!analysis.isLongform) {
    console.log('❌ Not longform:', analysis.reason);
    return {
      canCreate: false,
      reason: analysis.reason,
    };
  }

  const hasExisting = hasExistingCoin(post.json_metadata || '{}');
  console.log('🪙 Has existing coin:', hasExisting);
  
  if (hasExisting) {
    return {
      canCreate: false,
      reason: 'This post already has a Zora coin',
    };
  }

  // Check if user is the author (for now, only authors can create coins)
  const isAuthor = currentUser.toLowerCase() === post.author.toLowerCase();
  console.log('✍️ Author check:', {
    currentUser: currentUser.toLowerCase(),
    postAuthor: post.author.toLowerCase(),
    isAuthor
  });
  
  if (!isAuthor) {
    return {
      canCreate: false,
      reason: 'Only the post author can create a coin from this content',
    };
  }

  console.log('✅ Can create coin!');
  return {
    canCreate: true,
    reason: `Ready to create coin for ${analysis.wordCount} word post`,
  };
}
