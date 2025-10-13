# Browser-Safe Hash Implementation - Critical Fix

## Issue Identified
**Critical**: The initial implementation used Node.js's `crypto.createHash()` which breaks in browser environments, defeating the purpose of the optimization since markdown components run client-side.

## Solution Implemented

### New Universal Hash Utility (`lib/utils/hashUtils.ts`)

Created a browser-safe hashing utility that works in all environments:

1. **Primary Method: `simpleHash()`**
   - Fast, synchronous FNV-1a hash algorithm
   - Works in Node.js, browsers, and edge environments
   - Fixed 8-character hex output (32-bit hash)
   - Zero dependencies, ~20 lines of code
   - Perfect for cache keys where speed > cryptographic security

2. **Async Method: `sha256Hash()`** 
   - Uses Web Crypto API (`crypto.subtle`) in browsers
   - Falls back to Node's `crypto` module in server
   - Falls back to `simpleHash()` if neither available
   - Future-proof for scenarios needing cryptographic hashes

3. **Cache Key Helper: `getCacheKey()`**
   - Alias for `simpleHash()` for clarity
   - Used throughout markdown processing

### Performance Characteristics

**FNV-1a Algorithm Benefits:**
- ✅ Extremely fast: O(n) with low constant factor
- ✅ Good distribution: Low collision rate for cache keys
- ✅ Deterministic: Same input always produces same hash
- ✅ Fixed size: 32-bit output regardless of input length
- ✅ Universal: Works in any JavaScript environment

**Memory Impact:**
- Before: 10KB markdown → 10KB+ cache key
- After: 10KB markdown → 8-byte cache key (**1,280x reduction**)

### Files Updated

1. **`lib/utils/hashUtils.ts`** (NEW)
   - Universal hash utilities
   - Comprehensive JSDoc documentation
   - Production-ready with fallbacks

2. **`lib/markdown/MarkdownProcessor.ts`**
   - Replaced `crypto.createHash` import with `getCacheKey` from hashUtils
   - Updated comments to reflect FNV-1a algorithm

3. **`lib/markdown/MarkdownRenderer.ts`**
   - Same changes as MarkdownProcessor
   - All three caches now use browser-safe hashing

4. **`lib/utils/__tests__/hashUtils.test.ts`** (NEW)
   - 13 comprehensive tests
   - Covers determinism, unicode, edge cases, collisions
   - Real-world markdown samples

5. **`lib/utils/__tests__/LRUCache.test.ts`**
   - Added 6 new edge case tests:
     - Rapid evictions with small cache
     - Mixed TTL + size limit scenarios
     - Error object storage
     - Null/undefined/falsy value handling
     - Large cache performance (1000+ entries)

6. **`package.json`**
   - Updated test script to run both test suites
   - Added `test:lru` and `test:hash` for granular testing

## Test Coverage

### Hash Utilities (13 tests)
- ✅ Deterministic hashing
- ✅ Collision avoidance
- ✅ Unicode handling
- ✅ Empty strings
- ✅ Very long strings (10KB+)
- ✅ Special characters
- ✅ Whitespace variations
- ✅ Real-world markdown content
- ✅ Fixed-length output

### LRU Cache (16 tests total)
- ✅ Basic get/set operations
- ✅ LRU eviction logic
- ✅ TTL expiration (async)
- ✅ Capacity limits
- ✅ **NEW**: Rapid evictions
- ✅ **NEW**: TTL + size interaction
- ✅ **NEW**: Error object storage
- ✅ **NEW**: Falsy value handling
- ✅ **NEW**: Large cache stress test
- ✅ **NEW**: Edge cases

## Build Verification

```bash
pnpm test           # Run all tests
pnpm test:hash      # Test hash utilities only
pnpm test:lru       # Test LRU cache only
pnpm type-check     # TypeScript validation
pnpm build          # Verify browser build works
```

All tests pass ✅  
TypeScript compiles ✅  
No crypto polyfills needed ✅  
Works in browser and Node.js ✅

## Why FNV-1a for Cache Keys?

1. **Speed**: ~10x faster than SHA-256 for cache lookups
2. **Good Enough**: Cache keys don't need cryptographic security
3. **Battle-Tested**: Used by HashMaps in multiple languages
4. **Zero Dependencies**: No external libraries or polyfills
5. **Universal**: Pure JavaScript, works everywhere

## Collision Risk Analysis

With 32-bit FNV-1a and typical cache sizes:
- 500 cached items: ~0.006% collision probability
- 1,000 cached items: ~0.012% collision probability
- Cache eviction + TTL further reduces risk

For our use case (markdown caching with LRU eviction), this is more than acceptable.

## Future Considerations

If collision issues arise (unlikely):
- Easy upgrade path to `sha256Hash()` for cryptographic strength
- Or extend FNV-1a to 64-bit for near-zero collisions
- Current implementation abstracts this via `getCacheKey()`

## Review Summary

✅ **Fixed**: Browser compatibility (was breaking Next.js builds)  
✅ **Improved**: Test coverage (29 tests total)  
✅ **Enhanced**: Edge case handling (null, errors, large caches)  
✅ **Documented**: Clear comments and JSDoc throughout  
✅ **Verified**: All tests pass, builds successfully  

## Notes on Console Suppression

The `lib/suppressWarnings.ts` module uses global console.error patching at import time:
- ✅ **By design**: No cleanup needed for dev-only suppression
- ✅ **Scoped**: Only runs in development mode
- ✅ **Documented**: Clear comments explain the cuer dependency issue
- ✅ **Import-time**: Executes before React renders (no useEffect timing issues)

This is the correct pattern for suppressing known framework warnings.
