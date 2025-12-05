# OpenGraph Data Fetcher API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Fetches OpenGraph metadata from external URLs for link previews. Extracts title, description, image, and site name by parsing HTML content. Includes timeout handling and fallback data generation.

**Status**: ⚠️ Active (Security Risk - SSRF)  
**Method**: `GET`  
**Path**: `/api/opengraph`

## Endpoint

### GET /api/opengraph

Fetches OpenGraph metadata from a provided URL.

**Query Parameters:**
- `url` (string, required): The URL to fetch OpenGraph data from

**Example URL:**
```
/api/opengraph?url=https://skatehive.app/post/some-article
```

**Response (200 OK):**
```json
{
  "title": "Article Title",
  "description": "Article description...",
  "image": "https://example.com/image.jpg",
  "url": "https://example.com/article",
  "siteName": "example.com"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "URL parameter is required"
}
```

or

```json
{
  "error": "Invalid URL"
}
```

## Data Extraction

The endpoint extracts the following OpenGraph properties:

1. **Title**: Looks for `og:title` meta tag, falls back to `<title>` tag
2. **Description**: Looks for `og:description`, falls back to `description` meta tag
3. **Image**: Extracts `og:image`, handles relative URLs
4. **Site Name**: Extracts `og:site_name`, falls back to hostname

### Image URL Handling

The endpoint automatically resolves relative image URLs:
- `/image.jpg` → `https://example.com/image.jpg`
- `//cdn.example.com/image.jpg` → `https://cdn.example.com/image.jpg`
- Absolute URLs are used as-is

## Timeout Configuration

- **Fetch Timeout**: 10 seconds
- Uses `AbortController` to cancel long-running requests
- Returns fallback data if timeout is exceeded

## Fallback Behavior

If fetching fails, the endpoint returns basic information:
```json
{
  "title": "example.com",
  "description": "https://example.com/article",
  "url": "https://example.com/article",
  "siteName": "example.com"
}
```

## Security Features

### Implemented
1. **Protocol Validation**: Only `http:` and `https:` protocols allowed
2. **Timeout Protection**: 10-second timeout prevents hanging requests
3. **User Agent**: Identifies as SkateHive bot

### ⚠️ Security Concerns

🚨 **CRITICAL - SSRF Vulnerability**: This endpoint can be exploited to scan internal networks or access unauthorized resources.

**Attack Vectors:**
- `?url=http://localhost:8080/admin` - Access internal services
- `?url=http://169.254.169.254/latest/meta-data/` - AWS metadata endpoint
- `?url=http://192.168.1.1/` - Internal network scanning

**Required Mitigations:**
1. **Whitelist Domains**: Only allow fetching from approved domains
2. **Block Private IPs**: Reject RFC1918 addresses (10.x, 172.16.x, 192.168.x)
3. **Block Metadata Endpoints**: Reject 169.254.169.254, 127.0.0.1
4. **Add Rate Limiting**: Max 10 requests per minute per IP
5. **Validate Response Content**: Ensure HTML content (not JSON, XML)
6. **Add Authentication**: Require API key for access

## Usage Examples

### JavaScript/Fetch
```javascript
const url = encodeURIComponent('https://skatehive.app/article');
const response = await fetch(`/api/opengraph?url=${url}`);
const metadata = await response.json();

console.log('Title:', metadata.title);
console.log('Image:', metadata.image);
```

### React Component
```jsx
function LinkPreview({ url }) {
  const [metadata, setMetadata] = useState(null);
  
  useEffect(() => {
    fetch(`/api/opengraph?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(setMetadata);
  }, [url]);
  
  if (!metadata) return <div>Loading...</div>;
  
  return (
    <div className="preview">
      {metadata.image && <img src={metadata.image} alt={metadata.title} />}
      <h3>{metadata.title}</h3>
      <p>{metadata.description}</p>
      <span>{metadata.siteName}</span>
    </div>
  );
}
```

### cURL
```bash
curl "https://skatehive.app/api/opengraph?url=https://example.com/article"
```

## Caching Recommendations

⚠️ **No Caching Implemented**: Each request fetches fresh data from the external URL.

**Recommended Implementation:**
1. Add Redis cache with 1-hour TTL
2. Use URL as cache key
3. Implement cache headers (Cache-Control, ETag)
4. Consider CDN caching for popular URLs

Example cache structure:
```javascript
const cacheKey = `og:${url}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Fetch fresh data
const data = await fetchOpenGraphData(url);
await redis.setex(cacheKey, 3600, JSON.stringify(data));
```

## Error Handling

1. **Invalid URL**: Returns 400 with error message
2. **Fetch Failure**: Returns fallback data with basic URL info
3. **Timeout**: Returns fallback data after 10 seconds
4. **Parse Error**: Returns fallback data with hostname as title

## Performance Considerations

- Each request makes an external HTTP call (slow)
- No caching means repeated URLs are fetched multiple times
- 10-second timeout can block the API response
- Consider implementing background fetching + cache

## Related Endpoints

- `/api/og` - Potential duplicate/alternative endpoint (needs verification)

## Dependencies

- No external libraries
- Uses native `fetch` API
- Uses `AbortController` for timeout management

## Migration Notes

Consider migrating to a dedicated service like:
- [Open Graph Preview](https://www.opengraph.xyz/)
- [LinkPreview.net](https://linkpreview.net/)
- [Microlink](https://microlink.io/)

These services provide:
- Better security (no SSRF risk)
- Built-in caching
- Rate limiting
- Screenshot generation
- Better parsing reliability
