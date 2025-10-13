/**
 * Unit tests for LRUCache
 * Run with: node --loader ts-node/esm lib/utils/__tests__/LRUCache.test.ts
 * Or with tsx: npx tsx lib/utils/__tests__/LRUCache.test.ts
 */

import { LRUCache } from '../LRUCache';

// Simple test runner
function describe(name: string, fn: () => void) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${error}`);
    process.exit(1);
  }
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

  it('should handle TTL expiration', (done?: () => void) => {
    const cache = new LRUCache<string, number>(3, 100); // 100ms TTL
    cache.set('a', 1);
    
    assertEqual(cache.get('a'), 1, 'Item should exist immediately');

    setTimeout(() => {
      assertUndefined(cache.get('a'), 'Item should have expired after TTL');
      console.log('  ✅ should handle TTL expiration');
      done?.();
    }, 150);
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
});

console.log('\n✨ All LRU cache tests completed!\n');
