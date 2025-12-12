# Pinata Metadata Retrieval API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Retrieves metadata for IPFS files pinned to Pinata by their hash. Includes in-memory caching with 15-minute TTL and CORS support for cross-origin requests.

**Status**: ✅ Active (Production)  
**Method**: `GET`  
**Path**: `/api/pinata/metadata/[hash]`

## Endpoint

### GET /api/pinata/metadata/[hash]

Fetches metadata for a specific IPFS hash.

**URL Parameters:**
- `hash` (string, required): IPFS CID (Content Identifier)

**Example URL:**
```
/api/pinata/metadata/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
```

**Response (200 OK):**
```json
{
  "name": "skatehive-video.mp4",
  "keyvalues": {
    "creator": "alice",
    "fileType": "video/mp4",
    "uploadDate": "2025-01-15T10:30:00.000Z",
    "platform": "mobile",
    "thumbnailUrl": "ipfs://..."
  },
  "id": "12345678",
  "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "size": 50000000,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid hash format"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Hash not found"
}
```

**Response (500 Error):**
```json
{
  "error": "Pinata credentials not configured"
}
```

## Caching

### In-Memory Cache
- **TTL**: 15 minutes (900 seconds)
- **Storage**: JavaScript Map
- **Cache Key**: IPFS hash
- **Hit Header**: `X-Cache: HIT`
- **Miss Header**: `X-Cache: MISS`

### Cache Headers
```
Cache-Control: public, max-age=900
X-Cache: HIT (or MISS)
Access-Control-Allow-Origin: *
```

## Validation

The endpoint validates:
- ✅ Hash is provided
- ✅ Hash is a string
- ✅ Hash length > 10 characters
- ❌ Does NOT validate CID format (CIDv0/CIDv1)

## Usage Examples

### JavaScript/Fetch
```javascript
const hash = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
const response = await fetch(`/api/pinata/metadata/${hash}`);
const metadata = await response.json();

console.log('File name:', metadata.name);
console.log('Creator:', metadata.keyvalues.creator);
console.log('File size:', metadata.size);
```

### React Component
```jsx
function FileMetadata({ ipfsHash }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pinata/metadata/${ipfsHash}`)
      .then(r => r.json())
      .then(data => {
        setMetadata(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ipfsHash]);

  if (loading) return <div>Loading metadata...</div>;
  if (!metadata) return <div>Metadata not found</div>;

  return (
    <div>
      <h3>{metadata.name}</h3>
      <p>Size: {(metadata.size / 1024 / 1024).toFixed(2)} MB</p>
      <p>Creator: {metadata.keyvalues.creator}</p>
      <p>Uploaded: {new Date(metadata.createdAt).toLocaleString()}</p>
    </div>
  );
}
```

### cURL
```bash
curl https://skatehive.app/api/pinata/metadata/bafybeigdyrzt...
```

## Cache Behavior

**First Request (MISS):**
```
GET /api/pinata/metadata/bafybei...
→ Fetch from Pinata API (1-2s)
→ Store in cache
→ X-Cache: MISS
```

**Subsequent Requests (HIT):**
```
GET /api/pinata/metadata/bafybei...
→ Return from cache (~1ms)
→ X-Cache: HIT
```

**After 15 Minutes:**
```
GET /api/pinata/metadata/bafybei...
→ Cache expired
→ Fetch from Pinata API
→ Update cache
→ X-Cache: MISS
```

## Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Invalid hash format | 400 | `{"error":"Invalid hash format"}` |
| Hash not found in Pinata | 404 | `{"error":"Hash not found"}` |
| Pinata API error | Status from Pinata | `{"error":"Failed to fetch metadata"}` |
| Timeout (10s) | 500 | `{"error":"Request timeout"}` |
| Missing credentials | 500 | `{"error":"Pinata API credentials are missing"}` |

## 404 Caching

The endpoint caches 404 responses to prevent repeated lookups of non-existent hashes:
```javascript
// Store negative result in cache
metadataCache.set(hash, { 
  data: { error: 'Hash not found' }, 
  timestamp: Date.now() 
});
```

## CORS Support

Endpoint includes CORS headers for cross-origin access:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

Allows use from:
- Other domains
- Mobile apps
- Browser extensions
- Third-party services

## Pinata API

Uses Pinata's legacy `pinList` API:
```
GET https://api.pinata.cloud/data/pinList?hashContains={hash}
```

**Authentication:**
- Header: `Authorization: Bearer {PINATA_JWT}`
- Required env var: `PINATA_JWT`

## Timeout Protection

- **Timeout**: 10 seconds
- **Mechanism**: `AbortController`
- **Behavior**: Returns 500 error on timeout

## Performance Optimization

**Current:**
- ✅ In-memory cache (fast)
- ✅ 15-minute TTL (good balance)
- ✅ Cache headers for CDN
- ✅ CORS enabled

**Potential Improvements:**
1. **Redis Cache**: Persist cache across deployments
2. **Longer TTL**: Metadata rarely changes (24hr?)
3. **CDN Integration**: Add to CDN for global caching
4. **Batch API**: Fetch multiple hashes at once

Example Redis cache:
```javascript
const cacheKey = `pinata:${hash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const metadata = await fetchFromPinata(hash);
await redis.setex(cacheKey, 86400, JSON.stringify(metadata)); // 24hr
```

## Security Considerations

🟢 **Low Risk**: Read-only endpoint

**Best Practices:**
- ✅ No sensitive data exposed
- ✅ Input validation (hash length)
- ✅ Rate limiting recommended (100 req/min)
- ✅ Timeout protection

## Cache Memory Usage

With 1000 cached items:
- ~1KB per entry
- ~1MB total memory
- Minimal impact on serverless function

**Cache Cleanup:**
No automatic cleanup implemented. Consider:
```javascript
// Clear expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of metadataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      metadataCache.delete(key);
    }
  }
}, 60000); // Every minute
```

## Related Endpoints

- `/api/pinata` - Upload files to IPFS
- `/api/pinata-mobile` - Mobile file upload
- `/api/upload-metadata` - Upload JSON metadata

## Testing

Test with known hash:
```bash
# Valid hash
curl https://skatehive.app/api/pinata/metadata/bafybeigdyrzt...

# Invalid hash
curl https://skatehive.app/api/pinata/metadata/invalid

# Check cache headers
curl -I https://skatehive.app/api/pinata/metadata/bafybeigdyrzt...
```

## Dependencies

- Pinata Cloud account with API credentials
- No additional npm packages
- Native fetch API with AbortController

## Notes

- Cache is lost on deployment/restart (in-memory)
- 404 responses are also cached
- Supports both CIDv0 and CIDv1 hashes
- Metadata includes custom keyvalues from upload
- Size is in bytes
