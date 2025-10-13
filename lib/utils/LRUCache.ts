/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Prevents memory leaks by limiting cache size and evicting oldest entries
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;
  private readonly ttl?: number;
  private timestamps?: Map<K, number>;

  constructor(maxSize: number = 1000, ttl?: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    if (ttl) {
      this.timestamps = new Map();
    }
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Check TTL expiration if enabled
    if (this.ttl && this.timestamps) {
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() - timestamp > this.ttl) {
        // Entry expired, remove it
        this.cache.delete(key);
        this.timestamps.delete(key);
        return undefined;
      }
    }

    // Move to end (most recently used) by deleting and re-inserting
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value as K;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        if (this.timestamps) {
          this.timestamps.delete(firstKey);
        }
      }
    }

    // Add new entry (most recently used)
    this.cache.set(key, value);
    if (this.timestamps) {
      this.timestamps.set(key, Date.now());
    }
  }

  has(key: K): boolean {
    // Check if key exists and not expired
    if (!this.cache.has(key)) {
      return false;
    }

    // Check TTL expiration if enabled
    if (this.ttl && this.timestamps) {
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() - timestamp > this.ttl) {
        // Entry expired, remove it
        this.cache.delete(key);
        this.timestamps.delete(key);
        return false;
      }
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    if (this.timestamps) {
      this.timestamps.clear();
    }
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries (useful for TTL-based caches)
   */
  cleanExpired(): number {
    if (!this.ttl || !this.timestamps) {
      return 0;
    }

    let removed = 0;
    const now = Date.now();

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        removed++;
      }
    }

    return removed;
  }
}
