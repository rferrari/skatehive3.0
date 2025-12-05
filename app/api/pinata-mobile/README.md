# Pinata Mobile API

> ⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Mobile-optimized endpoint for uploading files to IPFS via Pinata. Includes longer timeouts and mobile-specific metadata for app uploads.

## Endpoint

### `POST /api/pinata-mobile`

Upload file to IPFS via Pinata (mobile-optimized).

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

const response = await fetch('/api/pinata-mobile', {
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
  "Timestamp": "2025-12-05T12:34:56.789Z",
  "platform": "mobile"
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

**413 - File Too Large:**
```json
{
  "error": "File too large for mobile upload. Size: 150.5MB, Maximum: 135MB"
}
```

**408 - Timeout:**
```json
{
  "error": "Mobile upload timeout"
}
```

**500 - Upload Failed:**
```json
{
  "error": "Mobile upload failed: 500 - Internal Server Error",
  "status": 500
}
```

---

## File Size Limits

**Maximum:** 135MB enforced

Files exceeding this limit will be rejected before upload attempt.

**File Size Calculation:**
```javascript
fileSizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100
```

---

## Timeouts

**Upload Timeout:** 10 minutes (600 seconds)

Longer than desktop endpoint to accommodate:
- Slower mobile connections (4G, 3G)
- Larger file uploads on limited bandwidth
- Network switching (WiFi → Cellular)

---

## Pinata Metadata

Files are uploaded with mobile-specific metadata:

```json
{
  "name": "mobile_filename.mp4",
  "keyvalues": {
    "creator": "skater123",
    "fileType": "video/mp4",
    "uploadDate": "2025-12-05T12:34:56.789Z",
    "platform": "mobile",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS...",
    "fileSize": "6653670",
    "thumbnailUrl": "https://..."
  }
}
```

**Key Differences from Desktop:**
- Filename prefixed with `mobile_`
- Platform explicitly set to `"mobile"`
- File size included in metadata

**CID Version:** 1 (base32)

---

## Mobile Detection

Automatically detects mobile devices based on User-Agent:

**Patterns:**
- Android
- webOS
- iPhone/iPad/iPod
- BlackBerry
- IEMobile
- Opera Mini

**Logging:**
```javascript
console.log('📱 Mobile Pinata API request:', {
  userAgent: userAgent.substring(0, 50),
  isMobile,
  timestamp: new Date().toISOString(),
  contentLength: request.headers.get('content-length')
});
```

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

## Comparison with Desktop Endpoint

| Feature | Desktop (`/api/pinata`) | Mobile (`/api/pinata-mobile`) |
|---------|------------------------|------------------------------|
| Max File Size | Unlimited (Vercel limits apply) | 135MB enforced |
| Timeout | Default (~30s) | 10 minutes |
| Metadata Prefix | Original filename | `mobile_` prefix |
| Platform Tag | Auto-detected | Forced `"mobile"` |
| File Size in Metadata | ❌ | ✅ |
| Optimized For | Desktop browsers | Mobile apps |

---

## Performance Considerations

### Why Separate Mobile Endpoint?

1. **Longer Timeouts:** Mobile networks are slower and less reliable
2. **File Size Enforcement:** Prevents mobile users from attempting huge uploads
3. **Enhanced Logging:** Better debugging for mobile-specific issues
4. **Metadata Distinction:** Easy filtering of mobile vs desktop uploads

### Network Handling

Mobile endpoint is designed for:
- ✅ 4G/5G networks
- ✅ WiFi connections
- ⚠️ 3G networks (slow but supported)
- ❌ 2G networks (too slow, will timeout)

---

## Security Considerations

- ✅ API credentials stored in environment variables
- ✅ File size limit enforced (135MB)
- ⚠️ No file type validation
- ⚠️ No virus scanning
- ⚠️ No rate limiting
- ⚠️ No authentication required

**Recommendations:**
- Add file type whitelist (video/mp4, image/jpeg, etc.)
- Implement rate limiting (5 uploads/hour per device)
- Add virus scanning integration
- Require user authentication
- Implement upload quota per user

---

## Error Handling

Comprehensive error logging:

```javascript
console.error('📱 Mobile upload error:', {
  error: error instanceof Error ? error.message : error,
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString()
});
```

**Timeout Handling:**
```javascript
if (error.name === 'AbortError') {
  return { error: 'Mobile upload timeout' };
}
```

---

## Usage Examples

### React Native
```typescript
const uploadToIPFS = async (uri: string, creator: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'video/mp4',
    name: 'video.mp4'
  });
  formData.append('creator', creator);

  const response = await fetch('https://skatehive.app/api/pinata-mobile', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return await response.json();
};
```

### Expo
```typescript
import * as DocumentPicker from 'expo-document-picker';

const pickAndUpload = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'video/*',
  });

  if (result.type === 'success') {
    const formData = new FormData();
    formData.append('file', {
      uri: result.uri,
      name: result.name,
      type: result.mimeType || 'video/mp4',
    } as any);

    const response = await fetch('/api/pinata-mobile', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('IPFS Hash:', data.IpfsHash);
  }
};
```

---

## Optimization Recommendations

### Current Implementation Issues

1. **Duplicate Code:** Almost identical to `/api/pinata`
   - **Recommendation:** Merge into single endpoint with platform detection

2. **Fixed Size Limit:** 135MB is arbitrary
   - **Recommendation:** Make configurable via environment variable

3. **No Progress Tracking:** Large uploads have no feedback
   - **Recommendation:** Implement streaming with progress events

### Suggested Merged Endpoint

```typescript
// Single endpoint with dynamic configuration
const isMobile = /Mobile/.test(userAgent);
const maxSize = isMobile ? 135 * 1024 * 1024 : 512 * 1024 * 1024;
const timeout = isMobile ? 600000 : 120000;
const prefix = isMobile ? 'mobile_' : '';
```

---

## Related Endpoints

- Desktop Upload: `/api/pinata`
- Chunked Upload: `/api/pinata-chunked` (for very large files)
- Metadata Retrieval: `/api/pinata/metadata/[hash]`

---

## Troubleshooting

### Upload Fails on Mobile Data
- **Cause:** Cellular network timeout or interruption
- **Solution:** Prompt user to use WiFi for uploads > 50MB

### File Too Large Error
- **Cause:** File exceeds 135MB limit
- **Solution:** Compress video client-side before upload

### Timeout After 10 Minutes
- **Cause:** Very slow network or Pinata service degradation
- **Solution:** Retry with exponential backoff

---

**Status:** ✅ Active  
**Dependencies:** Pinata Cloud API  
**Last Validated:** December 5, 2025  
**Optimization Priority:** 🔥 High (merge with desktop endpoint)
