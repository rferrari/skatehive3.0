# Pinata API (Desktop)

> ⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Desktop-optimized endpoint for uploading files to IPFS via Pinata. Includes mobile detection for telemetry and analytics.

## Endpoint

### `POST /api/pinata`

Upload file to IPFS via Pinata.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (File, required): File to upload
- `creator` (string, optional): Creator username
- `thumbnailUrl` (string, optional): Associated thumbnail URL

**Example:**
```javascript
const formData = new FormData();
formData.append('file', videoFile);
formData.append('creator', 'skater123');
formData.append('thumbnailUrl', 'https://...');

const response = await fetch('/api/pinata', {
  method: 'POST',
  body: formData
});
```

---

## Response

### Success (200)
```json
{
  "IpfsHash": "bafybeigylndgo4sjrusdgmti235ddofns7xzjhghfr527qprjjjyyu5iim",
  "PinSize": 6653670,
  "Timestamp": "2025-12-05T12:34:56.789Z"
}
```

### Error Responses

**500 - Missing Credentials:**
```json
{
  "error": "Pinata API credentials are missing"
}
```

**400 - No File:**
```json
{
  "error": "No file provided"
}
```

**500 - Upload Failed:**
```json
{
  "error": "Pinata upload failed: 500 - Internal Server Error"
}
```

---

## Pinata Metadata

Files are uploaded with enhanced metadata:

```json
{
  "name": "filename.mp4",
  "keyvalues": {
    "creator": "skater123",
    "fileType": "video/mp4",
    "uploadDate": "2025-12-05T12:34:56.789Z",
    "isMobile": "false",
    "userAgent": "Mozilla/5.0 ...",
    "thumbnailUrl": "https://..."
  }
}
```

**CID Version:** 1 (base32, case-insensitive)

---

## Platform Detection

Automatically detects mobile devices for analytics:

**User-Agent Patterns:**
- Android
- iPhone/iPad/iPod
- BlackBerry
- IEMobile
- Opera Mini

Logs include:
- `isMobile`: Boolean flag
- `userAgent`: First 100 characters
- `contentType`: Request content type
- `contentLength`: Request size

---

## Configuration

**Environment Variables:**
```bash
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key
```

**IPFS Gateway:**
```
https://gateway.pinata.cloud/ipfs/{IpfsHash}
```

---

## Limitations

**File Size:** 
- No hard limit enforced in code
- Vercel Edge Function limit: ~4.5MB
- Vercel Serverless Function limit: ~4.5MB body parser
- Pinata limit: 512MB for paid plans

**Recommendation:** Use `/api/pinata-mobile` for files > 100MB

---

## Comparison: Desktop vs Mobile Endpoints

| Feature | `/api/pinata` | `/api/pinata-mobile` |
|---------|---------------|----------------------|
| File Size Limit | None enforced | 135MB enforced |
| Timeout | Default | 10 minutes |
| Metadata Prefix | filename | mobile_filename |
| Platform Tag | Auto-detected | "mobile" |
| Optimized For | Desktop/Web | Mobile apps |

**Recommendation:** Merge both endpoints into single endpoint with device detection.

---

## Security Considerations

- ✅ API credentials stored in environment variables
- ⚠️ No file type validation (accepts any file)
- ⚠️ No file size limit enforced
- ⚠️ No virus scanning
- ⚠️ No rate limiting
- ⚠️ No authentication required

**Recommendations:**
- Add file type whitelist
- Enforce file size limits (150MB)
- Implement rate limiting (10 uploads/hour per IP)
- Add virus scanning integration
- Require user authentication
- Implement upload quota per user

---

## Error Handling

All errors are logged with context:
```javascript
console.error('📱 Pinata upload failed:', {
  status: uploadResponse.status,
  statusText: uploadResponse.statusText,
  errorText,
  isMobile,
  fileSize: file.size
});
```

---

## Related Endpoints

- Mobile Upload: `/api/pinata-mobile`
- Chunked Upload: `/api/pinata-chunked`
- Metadata Retrieval: `/api/pinata/metadata/[hash]`

---

**Status:** ✅ Active  
**Dependencies:** Pinata Cloud API  
**Last Validated:** December 5, 2025
