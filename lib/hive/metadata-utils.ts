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
export function hasImages(metadata: unknown): boolean {
  const parsed = parseJsonMetadata(metadata);
  const img = parsed.image;
  if (typeof img === 'string') {
    return img.trim().length > 0;
  }
  if (Array.isArray(img)) {
    return img.some((v) => typeof v === 'string' && v.trim().length > 0);
  }
  return false;
}

/**
 * Get image URLs from metadata
 */
export function getImageUrls(metadata: any): string[] {
  const parsed = parseJsonMetadata(metadata);
  let allImages: string[] = [];
  
  // Process parsed.image
  if (parsed.image) {
    if (Array.isArray(parsed.image)) {
      allImages = allImages.concat(
        parsed.image
          .filter((img: any) => typeof img === 'string')
          .map((img: string) => img.trim())
          .filter((img: string) => img.length > 0)
      );
    } else if (typeof parsed.image === 'string') {
      const trimmedImage = parsed.image.trim();
      if (trimmedImage.length > 0) {
        allImages.push(trimmedImage);
      }
    }
  }
  
  // Process parsed.images (if present)
  if (parsed.images && Array.isArray(parsed.images)) {
    allImages = allImages.concat(
      parsed.images
        .filter((img: any) => typeof img === 'string')
        .map((img: string) => img.trim())
        .filter((img: string) => img.length > 0)
    );
  }
  
  // Remove duplicates and return
  return Array.from(new Set(allImages));
}
