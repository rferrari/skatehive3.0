# Status API

> ⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

System-wide health monitoring endpoint that checks all critical Skatehive services including Instagram downloaders, video transcoding nodes, and the signup signer service.

## Endpoint

### GET /api/status

Returns comprehensive health status for all services.

**Response (200 OK - Operational/Degraded):**
```json
{
  "status": "operational" | "degraded" | "down",
  "timestamp": "2026-01-10T22:00:00.000Z",
  "summary": {
    "healthy": 4,
    "total": 7
  },
  "services": [
    {
      "id": "transcode-oracle",
      "name": "Oracle (Primary)",
      "category": "Video Transcoding",
      "description": "Oracle (Primary) video transcoding node",
      "healthUrl": "https://146-235-239-243.sslip.io/healthz",
      "priority": 1,
      "isHealthy": true,
      "responseTime": 562,
      "lastChecked": "2026-01-10T22:00:00.000Z"
    }
  ]
}
```

**Response (503 Service Unavailable - All Down):**
```json
{
  "status": "down",
  "timestamp": "2026-01-10T22:00:00.000Z",
  "summary": {
    "healthy": 0,
    "total": 7
  },
  "services": [...]
}
```

## Service Categories

### Instagram Downloader
- **Skate-Insta** (Render fallback)
- **Mac Mini IG** (Primary helper)
- **Raspberry Pi IG** (Secondary helper)

### SignUp
- **Signup Signer** - Hive account manager with auth and RC monitoring

### Video Transcoding
- **Oracle (Primary)** - Priority 1
- **Mac Mini M4 (Secondary)** - Priority 2
- **Raspberry Pi (Tertiary)** - Priority 3

## Health Check Logic

### Standard Services
- Fetches service health endpoint
- Checks for HTTP 200 status
- Validates JSON response contains `ok: true`, `healthy: true`, or `status: "ok"`
- 5 second timeout per service
- All checks run in parallel

### Signup Signer (Special Handling)
1. Checks `/healthz` endpoint with auth token
2. Validates `x-signer-token` authentication
3. Probes `/claim-account` to detect Resource Credit (RC) issues
4. Returns detailed auth and RC status

### Instagram Services (Special Handling)
Extracts cookie information from health response:
- Cookie validity
- Cookie existence
- Expiration date
- Days until expiry

## Health Status Levels

- **operational**: All services healthy
- **degraded**: Some services healthy, some down
- **down**: All services down

## Caching

- Results cached for **5 minutes** (300 seconds)
- Reduces load on health endpoints
- Prevents rate limiting

## Timeout Configuration

- **Per Service**: 5 seconds
- **Total Request**: ~30-35 seconds max (parallel checks)

## Usage Examples

### cURL
```bash
curl https://skatehive.app/api/status | jq .
```

### JavaScript/Fetch
```javascript
const response = await fetch('/api/status');
const { status, summary, services } = await response.json();

console.log(`System Status: ${status}`);
console.log(`Healthy: ${summary.healthy}/${summary.total}`);
```

### React Component
```tsx
function SystemStatus() {
  const { data } = useSWR('/api/status', fetcher, {
    refreshInterval: 30000 // Poll every 30s
  });

  return (
    <div>
      <h2>System Status: {data?.status}</h2>
      <p>{data?.summary.healthy}/{data?.summary.total} services healthy</p>
      {data?.services.map(service => (
        <div key={service.id}>
          {service.isHealthy ? '✅' : '❌'} {service.name} - {service.responseTime}ms
          {service.error && <span> ({service.error})</span>}
        </div>
      ))}
    </div>
  );
}
```

## Testing

### Test All Services
```bash
curl -s http://localhost:3000/api/status | jq .
```

### Test Specific Category
```bash
curl -s http://localhost:3000/api/status | jq '.services[] | select(.category == "Video Transcoding")'
```

### Pretty Print Summary
```bash
curl -s http://localhost:3000/api/status | jq -r '"Status: \(.status | ascii_upcase) | Healthy: \(.summary.healthy)/\(.summary.total)"'
```

## Known Issues

### Mac Mini Services
When minivlad (Mac Mini M4) is offline, the following services will timeout:
- Mac Mini IG
- Signup Signer
- Mac Mini M4 (Secondary) video transcoding

**Impact**: System continues with fallback services (Oracle + Raspberry Pi).

### Health Endpoint URLs
- **Oracle**: Uses `/healthz` (not `/health`)
- **Video services**: Use `/video/healthz` path
- **Instagram services**: Use `/instagram/healthz` path

## Related Services

- Instagram Health: `/api/instagram-health` - Instagram-specific health monitoring
- Video Processing: `/lib/utils/videoProcessing.ts` - Video transcoding health checks

---

**Status:** ✅ Active  
**Last Updated:** January 10, 2026  
**Cache TTL:** 5 minutes
