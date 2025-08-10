/**
 * Safely parse JSON metadata that can be either a string or an object
 * This handles differences between Bridge API (returns objects) and Condenser API (returns strings)
 */
export function parseJsonMetadata(metadata: any): any {
  try {
    // If it's already an object, return it as-is
    if (typeof metadata === 'object' && metadata !== null) {
      return metadata;
    }
    
    // If it's a string, try to parse it
    if (typeof metadata === 'string') {
      // Handle empty or whitespace-only strings
      if (metadata.trim() === '') {
        return {};
      }
      return JSON.parse(metadata);
    }
    
    // For any other type, return empty object
    return {};
  } catch (error) {
    console.error("Error parsing JSON metadata:", error);
    return {};
  }
}

/**
 * Safely get a value from parsed metadata with fallback
 */
export function getMetadataValue(metadata: any, key: string, fallback: any = null): any {
  const parsed = parseJsonMetadata(metadata);
  return parsed[key] ?? fallback;
}

/**
 * Check if metadata contains images
 */
export function hasImages(metadata: any): boolean {
  const parsed = parseJsonMetadata(metadata);
  return !!(parsed.image && (Array.isArray(parsed.image) ? parsed.image.length > 0 : parsed.image));
}

/**
 * Get image URLs from metadata
 */
export function getImageUrls(metadata: any): string[] {
  const parsed = parseJsonMetadata(metadata);
  if (!parsed.image) return [];
  
  if (Array.isArray(parsed.image)) {
    return parsed.image.filter((img: any) => typeof img === 'string');
  }
  
  if (typeof parsed.image === 'string') {
    return [parsed.image];
  }
  
  return [];
}
