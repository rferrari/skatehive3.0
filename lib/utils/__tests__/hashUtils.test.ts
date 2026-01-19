/**
 * Unit tests for hash utilities
 * Run with: npx tsx lib/utils/__tests__/hashUtils.test.ts
 */

import { simpleHash, getCacheKey } from '../hashUtils';

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

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

// Tests
describe('hashUtils', () => {
  it('should produce consistent hashes for same input', () => {
    const input = 'Hello, SkateHive!';
    const hash1 = simpleHash(input);
    const hash2 = simpleHash(input);
    
    assertEqual(hash1, hash2, 'Hash should be deterministic');
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = simpleHash('content1');
    const hash2 = simpleHash('content2');
    
    assertTrue(hash1 !== hash2, 'Different inputs should produce different hashes');
  });

  it('should handle empty strings', () => {
    const hash = simpleHash('');
    assertTrue(typeof hash === 'string', 'Should return a string');
    assertTrue(hash.length > 0, 'Hash should not be empty');
  });

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000);
    const hash = simpleHash(longString);
    
    assertTrue(typeof hash === 'string', 'Should handle long strings');
    assertTrue(hash.length === 8, 'Hash should be fixed length (8 hex chars for 32-bit)');
  });

  it('should handle unicode characters', () => {
    const unicode = '🛹 Skate 日本語 العربية';
    const hash1 = simpleHash(unicode);
    const hash2 = simpleHash(unicode);
    
    assertEqual(hash1, hash2, 'Should handle unicode consistently');
  });

  it('should produce fixed-length hashes', () => {
    const inputs = [
      'short',
      'a much longer string with more content',
      'x'.repeat(1000)
    ];
    
    inputs.forEach(input => {
      const hash = simpleHash(input);
      assertEqual(hash.length, 8, `Hash should always be 8 characters, got ${hash.length} for input length ${input.length}`);
    });
  });

  it('getCacheKey should be an alias for simpleHash', () => {
    const input = 'test content';
    const hash1 = simpleHash(input);
    const hash2 = getCacheKey(input);
    
    assertEqual(hash1, hash2, 'getCacheKey should produce same result as simpleHash');
  });

  it('should handle special characters', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
    const hash1 = simpleHash(special);
    const hash2 = simpleHash(special);
    
    assertEqual(hash1, hash2, 'Should handle special characters consistently');
  });

  it('should produce different hashes for similar strings', () => {
    const hash1 = simpleHash('markdown content');
    const hash2 = simpleHash('markdown content ');
    const hash3 = simpleHash('Markdown content');
    
    assertTrue(hash1 !== hash2, 'Trailing space should change hash');
    assertTrue(hash1 !== hash3, 'Case change should change hash');
  });

  it('should handle newlines and whitespace', () => {
    const content1 = 'line1\nline2\nline3';
    const content2 = 'line1\r\nline2\r\nline3';
    const hash1 = simpleHash(content1);
    const hash2 = simpleHash(content2);
    
    assertTrue(hash1 !== hash2, 'Different line endings should produce different hashes');
  });

  it('should be suitable for cache keys (no collisions in sample data)', () => {
    const samples = [
      '# Title\n\nSome content',
      '## Different Title\n\nOther content',
      'Plain text without markdown',
      '![image](https://example.com/image.jpg)',
      '```code\nblock\n```',
      'Content with @mentions and #hashtags'
    ];
    
    const hashes = samples.map(s => simpleHash(s));
    const uniqueHashes = new Set(hashes);
    
    assertEqual(uniqueHashes.size, samples.length, 'All sample inputs should produce unique hashes');
  });

  it('should handle real-world markdown content', () => {
    const realMarkdown = `# Skateboarding Post

Check out this sick trick! 🛹

![trick](https://example.com/ipfs/QmX123...)

@gnars killed it today!

## Video

[[VIDEO:QmY456...]]

#skateboarding #gnarly
`;
    
    const hash = getCacheKey(realMarkdown);
    assertTrue(typeof hash === 'string', 'Should handle real markdown');
    assertEqual(hash.length, 8, 'Should produce fixed-length hash');
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
    console.log('\n✨ All hash utility tests completed!\n');
  }
})();
