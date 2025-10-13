/**
 * Unit tests for LRUCache
 * Run with: node --loader ts-node/esm lib/utils/__tests__/LRUCache.test.ts
 * Or with tsx: npx tsx lib/utils/__tests__/LRUCache.test.ts
 */

import { LRUCache } from '../LRUCache';

// Simple test runner
const tests: Array<() => void | Promise<void>> = [];
let hasFailures = false;

function describe(name: string, fn: () => void) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name: string, fn: () => void | Promise<void>) {
  tests.push(async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
    } catch (error) {
      console.error(`  ❌ ${name}`);
      console.error(`     ${error}`);
      hasFailures = true;
    }
  });
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

function assertUndefined<T>(actual: T, message?: string) {
  if (actual !== undefined) {
    throw new Error(
      message || `Expected undefined, but got ${actual}`
    );
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

// Tests
describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    assertEqual(cache.get('a'), 1);
    assertEqual(cache.get('b'), 2);
    assertEqual(cache.get('c'), 3);
  });

  it('should evict least recently used item when capacity is exceeded', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // Should evict 'a'

    assertUndefined(cache.get('a'), 'Item "a" should have been evicted');
    assertEqual(cache.get('b'), 2);
    assertEqual(cache.get('c'), 3);
    assertEqual(cache.get('d'), 4);
  });

  it('should update LRU order on access', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Access 'a' to make it recently used
    cache.get('a');
    
    // Add 'd', should evict 'b' (least recently used)
    cache.set('d', 4);

    assertEqual(cache.get('a'), 1);
    assertUndefined(cache.get('b'), 'Item "b" should have been evicted');
    assertEqual(cache.get('c'), 3);
    assertEqual(cache.get('d'), 4);
  });

  it('should update existing keys without changing size', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Update 'a' with new value
    cache.set('a', 10);

    assertEqual(cache.get('a'), 10);
    assertEqual(cache.get('b'), 2);
    assertEqual(cache.get('c'), 3);
  });

  it('should handle TTL expiration', async () => {
    const cache = new LRUCache<string, number>(3, 100); // 100ms TTL
    cache.set('a', 1);
    
    assertEqual(cache.get('a'), 1, 'Item should exist immediately');

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    assertUndefined(cache.get('a'), 'Item should have expired after TTL');
  });

  it('should clear all items', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    cache.clear();

    assertUndefined(cache.get('a'));
    assertUndefined(cache.get('b'));
    assertUndefined(cache.get('c'));
  });

  it('should handle capacity of 1', () => {
    const cache = new LRUCache<string, number>(1);
    cache.set('a', 1);
    assertEqual(cache.get('a'), 1);
    
    cache.set('b', 2);
    assertUndefined(cache.get('a'), 'Item "a" should have been evicted');
    assertEqual(cache.get('b'), 2);
  });

  it('should handle string keys and object values', () => {
    const cache = new LRUCache<string, { value: number }>(2);
    cache.set('key1', { value: 100 });
    cache.set('key2', { value: 200 });

    const result1 = cache.get('key1');
    assertTrue(result1?.value === 100, 'Should retrieve correct object');
    
    const result2 = cache.get('key2');
    assertTrue(result2?.value === 200, 'Should retrieve correct object');
  });

  it('should maintain order after multiple operations', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Access order: c (newest), b, a (oldest)
    cache.get('a'); // a becomes newest: a, c, b (oldest)
    cache.get('b'); // b becomes newest: b, a, c (oldest)
    
    cache.set('d', 4); // Should evict 'c'

    assertUndefined(cache.get('c'), 'Item "c" should have been evicted');
    assertEqual(cache.get('a'), 1);
    assertEqual(cache.get('b'), 2);
    assertEqual(cache.get('d'), 4);
  });

  it('should handle non-existent keys gracefully', () => {
    const cache = new LRUCache<string, number>(3);
    assertUndefined(cache.get('nonexistent'));
    
    cache.set('a', 1);
    assertUndefined(cache.get('b'));
  });

  it('should handle rapid evictions when size limit triggers', () => {
    const cache = new LRUCache<string, number>(2); // Very small cache
    
    // Fill cache
    cache.set('a', 1);
    cache.set('b', 2);
    
    // Rapid additions should trigger evictions
    cache.set('c', 3); // Evicts 'a'
    cache.set('d', 4); // Evicts 'b'
    cache.set('e', 5); // Evicts 'c'
    
    assertUndefined(cache.get('a'), 'a should be evicted');
    assertUndefined(cache.get('b'), 'b should be evicted');
    assertUndefined(cache.get('c'), 'c should be evicted');
    assertEqual(cache.get('d'), 4, 'd should exist');
    assertEqual(cache.get('e'), 5, 'e should exist');
  });

  it('should handle mixed operations with TTL and size limits', async () => {
    const cache = new LRUCache<string, number>(3, 100); // Small cache with short TTL
    
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // Access 'a' to make it recently used
    assertEqual(cache.get('a'), 1);
    
    // Add 'd' to trigger size eviction (should evict 'b')
    cache.set('d', 4);
    assertUndefined(cache.get('b'), 'b should be evicted by size limit');
    
    // Wait for TTL expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // All should be expired now
    assertUndefined(cache.get('a'), 'a should be expired');
    assertUndefined(cache.get('c'), 'c should be expired');
    assertUndefined(cache.get('d'), 'd should be expired');
  });

  it('should handle error values in cache', () => {
    const cache = new LRUCache<string, Error>(3);
    const error = new Error('Test error');
    
    cache.set('error-key', error);
    const retrieved = cache.get('error-key');
    
    assertTrue(retrieved instanceof Error, 'Should store and retrieve error objects');
    assertEqual(retrieved?.message, 'Test error');
  });

  it('should handle null and undefined values correctly', () => {
    const cache = new LRUCache<string, any>(4);
    
    cache.set('null-key', null);
    cache.set('undefined-key', undefined);
    cache.set('zero-key', 0);
    cache.set('false-key', false);
    
    assertEqual(cache.get('null-key'), null, 'Should store null');
    assertEqual(cache.get('undefined-key'), undefined, 'Should store undefined');
    assertEqual(cache.get('zero-key'), 0, 'Should store 0');
    assertEqual(cache.get('false-key'), false, 'Should store false');
  });

  it('should handle large cache with many entries', () => {
    const cache = new LRUCache<string, number>(1000);
    
    // Add 1500 entries (exceeds capacity)
    for (let i = 0; i < 1500; i++) {
      cache.set(`key-${i}`, i);
    }
    
    // First 500 should be evicted
    assertUndefined(cache.get('key-0'), 'Early entries should be evicted');
    assertUndefined(cache.get('key-499'), 'Early entries should be evicted');
    
    // Last 1000 should exist
    assertEqual(cache.get('key-500'), 500, 'Recent entries should exist');
    assertEqual(cache.get('key-1499'), 1499, 'Most recent entry should exist');
  });
});

// Run all tests
(async () => {
  for (const test of tests) {
    await test();
  }
  
  if (hasFailures) {
    console.log('\n❌ Some tests failed!\n');
    process.exit(1);
  } else {
    console.log('\n✨ All LRU cache tests completed!\n');
  }
})();
