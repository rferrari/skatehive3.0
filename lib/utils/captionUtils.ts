/**
 * Utility functions for handling image captions
 */

/**
 * Check if a caption is meaningful (not a default/fallback)
 * @param caption - The caption text to check
 * @returns true if the caption is meaningful, false otherwise
 */
export const isMeaningfulCaption = (caption: string): boolean => {
  if (!caption || caption.trim() === '') return false;
  
  const lowerCaption = caption.toLowerCase().trim();
  
  // Skip if it's empty or very short (but allow emojis which might be single characters)
  if (lowerCaption.length < 1) return false;
  
  // Always allow emojis - they are meaningful user input
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(caption)) {
    return true;
  }
  
  // Skip common default/fallback patterns
  const defaultPatterns = [
    'spot name',
    'skatespot',
    'skate spot',
    'location',
    'to be added',
    'edit this post',
    'add location',
    'caption',
    'image',
    'photo',
    'picture',
    'img',
    'pic',
    'gif',
    'skatehive-gif',
    'compressed-image',
    'compressed.jpg'
  ];
  
  // Check if caption matches any default patterns
  if (defaultPatterns.some(pattern => lowerCaption.includes(pattern))) {
    return false;
  }
  
  // Skip if it's just coordinates or address-like text
  if (/^[\d.,\s°'"]+$/.test(lowerCaption)) {
    return false;
  }
  
  // Skip if it's just the spot name repeated (common fallback)
  if (lowerCaption.match(/^[a-z\s]+$/)) {
    // If it's just letters and spaces, it might be a generic spot name
    // We'll be more lenient here but still filter obvious defaults
    if (defaultPatterns.some(pattern => lowerCaption.includes(pattern))) {
      return false;
    }
  }
  
  // Skip file extensions that are commonly used as fallbacks
  if (/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(lowerCaption)) {
    return false;
  }
  
  return true;
};

/**
 * Extract caption from markdown image syntax
 * @param markdownContent - The markdown content containing the image
 * @returns The extracted caption or null if not found
 */
export const extractImageCaption = (markdownContent: string): string | null => {
  const match = markdownContent.match(/!\[(.*?)\]\(.*?\)/);
  return match ? match[1] : null;
};
