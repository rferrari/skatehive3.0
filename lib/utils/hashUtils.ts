/**
 * Universal hashing utility that works in both Node.js and browser environments
 * 
 * For cache keys, we need a fast, deterministic hash function.
 */

/**
 * Synchronous hash function for cache keys
 * Uses a simpler but deterministic algorithm that works everywhere
 * 
 * This is a FNV-1a hash implementation - fast and good distribution
 * 
 * @param input - The string to hash
 * @returns A hex-encoded hash string
 */
export function simpleHash(input: string): string {
  let hash = 2166136261; // FNV offset basis
  
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime: 16777619
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  // Convert to unsigned 32-bit and then to hex
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0');
}

/**
 * Get a cache key from content
 * Synchronous version using simpleHash for immediate cache lookups
 * 
 * For LRU cache usage where we need synchronous operations
 */
export function getCacheKey(content: string): string {
  return simpleHash(content);
}
