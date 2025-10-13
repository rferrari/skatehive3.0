/**
 * Universal hashing utility that works in both Node.js and browser environments
 * 
 * Browser: Uses Web Crypto API (crypto.subtle)
 * Node.js: Uses native crypto module
 * 
 * For cache keys, we need a fast, deterministic hash function.
 * SHA-256 via crypto.subtle is well-supported in modern browsers.
 */

/**
 * Generate a SHA-256 hash of the input string
 * Works in both browser and Node.js environments
 * 
 * @param input - The string to hash
 * @returns A promise that resolves to a hex-encoded hash string
 */
export async function sha256Hash(input: string): Promise<string> {
  // Browser environment - use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  // Node.js environment - use native crypto
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    } catch (e) {
      // Fall back to simple hash if crypto is not available
      console.warn('Native crypto not available, falling back to simple hash');
      return simpleHash(input);
    }
  }
  
  // Fallback for edge cases
  return simpleHash(input);
}

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
