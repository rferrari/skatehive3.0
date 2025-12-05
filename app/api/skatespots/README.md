# Skatespots API

> ⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Proxy endpoint for fetching skatespot posts from the external SkateHive API. Filters and transforms Hive blockchain posts tagged with `skatespot` and `hive-173115`.

## Endpoint

### `GET /api/skatespots`

Fetch paginated skatespot posts.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Results per page (default: 10)

**Example:**
```
GET /api/skatespots?page=2&limit=20
```

---

## Response

### Success (200)
```json
{
  "success": true,
  "data": [
    {
      "body": "Check out this amazing skatespot...",
      "author": "skater123",
      "permlink": "amazing-skatespot-downtown",
      "created": "2025-12-05T12:34:56",
      "pending_payout_value": "1.234 HBD",
      "author_reputation": 45.67,
      "active_votes": [
        {
          "voter": "voter1",
          "rshares": 12345,
          "weight": 100,
          "time": "2025-12-05T13:00:00"
        }
      ],
      "json_metadata": "{...}",
      "category": "hive-173115",
      "author_rewards": 0,
      "total_payout_value": "0.000 HBD",
      "curator_payout_value": "0.000 HBD",
      ...
    }
  ],
  "pagination": {
    "total": 150,
    "totalPages": 15,
    "currentPage": 1,
    "limit": 10
  }
}
```

### Error Response (500)
```json
{
  "error": "Failed to fetch skatespots",
  "details": "API request failed: 500 Internal Server Error"
}
```

---

## Data Transformation

### Source API

**External Endpoint:**
```
https://api.skatehive.app/api/v2/skatespots?limit={limit}&page={page}
```

**User-Agent:** `Skatehive-App/3.0`

### Filtering

Posts are filtered to only include those with both tags:
```typescript
tags.includes('skatespot') && tags.includes('hive-173115')
```

**Hive Community:** `hive-173115` (SkateHive community)

### Field Mapping

Transforms external API format to internal Discussion format:

| External Field | Internal Field | Notes |
|---------------|----------------|-------|
| `body` | `body` | Post content (Markdown) |
| `author` | `author` | Hive username |
| `permlink` | `permlink` | URL slug |
| `created` | `created` | Timestamp |
| `post_json_metadata` | `json_metadata` | Stringified JSON |
| `reputation` | `author_reputation` | Float reputation score |
| `votes` | `active_votes` | Vote details array |

**Additional Fields Added:**
- `title`: '' (empty, skatespots are comments)
- `children`: 0
- `reblogged_by`: []
- `replies`: []
- `allow_replies`: true
- `net_votes`: 0
- `depth`: 0

---

## Pagination

Pagination is passed through from external API:

**Request:**
```
GET /api/skatespots?page=2&limit=20
```

**External API Call:**
```
GET https://api.skatehive.app/api/v2/skatespots?limit=20&page=2
```

**Response Pagination:**
```json
{
  "pagination": {
    "total": 150,
    "totalPages": 8,
    "currentPage": 2,
    "limit": 20
  }
}
```

---

## Use Cases

1. **Skatespot Discovery:** Browse community-submitted skatespots
2. **Map Integration:** Fetch locations for map markers
3. **Feed Display:** Show recent skatespot posts
4. **Search:** Filter and paginate results

---

## Example Usage

### React/Next.js
```typescript
const fetchSkatespots = async (page = 1, limit = 10) => {
  const response = await fetch(
    `/api/skatespots?page=${page}&limit=${limit}`
  );
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Skatespots:', data.data);
    console.log('Total pages:', data.pagination.totalPages);
  } else {
    console.error('Error:', data.error);
  }
};
```

### Infinite Scroll
```typescript
const [skatespots, setSkatespots] = useState([]);
const [page, setPage] = useState(1);

const loadMore = async () => {
  const response = await fetch(`/api/skatespots?page=${page}&limit=10`);
  const data = await response.json();
  
  if (data.success) {
    setSkatespots(prev => [...prev, ...data.data]);
    setPage(prev => prev + 1);
  }
};
```

---

## Data Structure

### Post JSON Metadata

The `json_metadata` field contains stringified JSON with:

```json
{
  "tags": ["skatespot", "hive-173115", "skateboarding"],
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "name": "Downtown Skatepark"
  },
  "images": [
    "https://ipfs.io/ipfs/Qm..."
  ],
  "app": "skatehive/3.0"
}
```

**Common Fields:**
- `tags`: Array of post tags
- `location`: Geolocation data
- `images`: Array of image URLs
- `app`: Publishing application
- `video`: Video metadata (if applicable)

---

## Hive Blockchain Integration

### Community

**SkateHive Community:** `hive-173115`

Posts in this community are automatically included if tagged `skatespot`.

### Voting & Rewards

**Payout Fields:**
- `pending_payout_value`: Pending rewards before payout
- `author_rewards`: Author's earned rewards
- `total_payout_value`: Total paid out
- `curator_payout_value`: Curator rewards

**Vote Structure:**
```typescript
{
  voter: string;      // Username
  rshares: number;    // Reward shares
  weight: number;     // Vote weight (0-10000)
  time: string;       // Vote timestamp
}
```

---

## Performance Considerations

### Caching

**Current:** No caching implemented

**Recommendation:** Add cache layer
```typescript
const CACHE_TTL = 5 * 60; // 5 minutes

// Using Vercel KV or Redis
const cached = await kv.get(`skatespots:${page}:${limit}`);
if (cached) return NextResponse.json(cached);

// Fetch and cache
const data = await fetchFromAPI();
await kv.setex(`skatespots:${page}:${limit}`, CACHE_TTL, data);
```

### Rate Limiting

External API may have rate limits. Consider:
- Caching responses (5-10 minutes)
- Implementing request queuing
- Adding retry logic with exponential backoff

---

## Error Handling

**Network Errors:**
```typescript
if (!response.ok) {
  throw new Error(`API request failed: ${response.status} ${response.statusText}`);
}
```

**Response Validation:**
```typescript
const skatespots = data.data.filter((post: any) => {
  const tags = post.tags || [];
  return tags.includes('skatespot') && tags.includes('hive-173115');
});
```

---

## Related Endpoints

- Hive Posts: `/api/posts`
- User Feed: `/api/feed`
- Community Posts: `/api/community/[name]`

---

## External Dependencies

**SkateHive API:**
```
https://api.skatehive.app/api/v2/skatespots
```

**Status:** Must be online for this endpoint to function

**Alternatives:** Consider direct Hive blockchain queries as fallback

---

**Status:** ✅ Active  
**Dependencies:** SkateHive API (external)  
**Last Validated:** December 5, 2025  
**Optimization Priority:** 📊 Medium (add caching)
