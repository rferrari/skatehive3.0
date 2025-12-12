# Pinata Chunked Upload API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Handles chunked file uploads to IPFS via Pinata for large files. Currently only supports single-chunk uploads; multi-chunk functionality returns a 501 Not Implemented error. Designed for mobile-optimized large file uploads but not fully implemented yet.

**Status**: ⚠️ Incomplete (Multi-chunk not implemented)  
**Method**: `POST`  
**Path**: `/api/pinata-chunked`

## Endpoint

### POST /api/pinata-chunked

Uploads files to IPFS in chunks (currently single-chunk only).

**Request Body:**
```json
{
  "fileName": "video.mp4",
  "fileType": "video/mp4",
  "creator": "skatehive",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "totalSize": 50000000,
  "chunk": "base64-encoded-file-data",
  "chunkIndex": 0,
  "totalChunks": 1
}
```

**Required Fields:**
- `fileName`: Name of the file being uploaded
- `fileType`: MIME type of the file
- `totalSize`: Total file size in bytes
- `chunk`: Base64-encoded chunk data
- `chunkIndex`: Index of current chunk (0-based)
- `totalChunks`: Total number of chunks

**Optional Fields:**
- `creator`: Username of uploader (default: "anonymous")
- `thumbnailUrl`: URL to thumbnail image

**Response (200 OK) - Single Chunk:**
```json
{
  "IpfsHash": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "PinSize": 50000000,
  "Timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Response (501 Not Implemented) - Multi-chunk:**
```json
{
  "error": "Multi-chunk uploads not yet implemented"
}
```

**Response (500 Error):**
```json
{
  "error": "Pinata API credentials are missing"
}
```

or

```json
{
  "error": "Chunked upload failed"
}
```

## Current Limitations

⚠️ **Incomplete Implementation:**

1. **Multi-Chunk Not Supported**: Only single-chunk uploads work
2. **No Chunk Storage**: No mechanism to store chunks temporarily
3. **No Chunk Assembly**: Cannot reassemble multiple chunks into complete file
4. **No Chunk Validation**: No verification of chunk order or completeness

## Single-Chunk Upload Flow

For `totalChunks === 1`:

1. Decode base64 chunk data to buffer
2. Create File object from buffer
3. Create FormData with file, metadata, and options
4. Upload directly to Pinata
5. Return IPFS hash and metadata

## Metadata Structure

Uploaded files include metadata:
```json
{
  "name": "video.mp4",
  "keyvalues": {
    "creator": "skatehive",
    "fileType": "video/mp4",
    "uploadDate": "2025-01-15T10:30:00.000Z",
    "platform": "mobile-chunked",
    "thumbnailUrl": "https://example.com/thumb.jpg"
  }
}
```

## Pinata Configuration

- **CID Version**: 1 (CIDv1)
- **API Endpoint**: `https://api.pinata.cloud/pinning/pinFileToIPFS`
- **Authentication**: JWT Bearer Token

Required environment variables:
- `PINATA_JWT` - Get from Pinata dashboard > API Keys

## Usage Examples

### JavaScript/Fetch - Single Chunk
```javascript
// Read file and convert to base64
const file = document.querySelector('input[type="file"]').files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64 = reader.result.split(',')[1]; // Remove data URL prefix
  
  const response = await fetch('/api/pinata-chunked', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      creator: 'username',
      totalSize: file.size,
      chunk: base64,
      chunkIndex: 0,
      totalChunks: 1
    })
  });
  
  const data = await response.json();
  console.log('IPFS Hash:', data.IpfsHash);
};

reader.readAsDataURL(file);
```

### Multi-Chunk (Planned Implementation)
```javascript
// This will work once multi-chunk is implemented
async function uploadLargeFile(file, chunkSize = 10 * 1024 * 1024) {
  const chunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const reader = new FileReader();
    const base64 = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(chunk);
    });
    
    const response = await fetch('/api/pinata-chunked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        totalSize: file.size,
        chunk: base64,
        chunkIndex: i,
        totalChunks: chunks
      })
    });
    
    if (!response.ok) throw new Error('Upload failed');
  }
}
```

## Implementation Roadmap

To complete multi-chunk support:

1. **Add Chunk Storage**
   ```javascript
   // Store chunks in Redis or temp storage
   const chunkKey = `upload:${uploadId}:chunk:${chunkIndex}`;
   await redis.set(chunkKey, chunk, 'EX', 3600); // 1 hour expiry
   ```

2. **Track Upload Progress**
   ```javascript
   const uploadMeta = {
     uploadId: uuid(),
     fileName,
     totalChunks,
     receivedChunks: [],
     startedAt: Date.now()
   };
   ```

3. **Assemble Complete File**
   ```javascript
   if (receivedChunks.length === totalChunks) {
     const completeFile = Buffer.concat(
       receivedChunks.sort((a, b) => a.index - b.index)
         .map(c => c.data)
     );
     // Upload to Pinata
   }
   ```

4. **Add Progress Endpoint**
   ```javascript
   GET /api/pinata-chunked/progress?uploadId=xxx
   // Returns: { progress: 0.75, receivedChunks: 3, totalChunks: 4 }
   ```

5. **Add Cleanup Job**
   ```javascript
   // Clean up abandoned uploads after 1 hour
   setInterval(cleanupAbandonedUploads, 60000);
   ```

## Security Considerations

📊 **Medium Priority Issues:**

1. **No Size Validation**: Could accept unlimited chunk sizes
   - Add: Max chunk size limit (10MB recommended)
   - Add: Total file size validation

2. **No Upload ID**: No way to track multi-part uploads
   - Add: UUID-based upload sessions
   - Add: Upload expiration (1 hour)

3. **No Authentication**: Anyone can upload
   - Add: JWT token validation
   - Add: User quota tracking
   - Add: Rate limiting per user

4. **Base64 Memory Usage**: Inefficient for large files
   - Consider: Direct binary upload instead of base64
   - Add: Streaming upload support

## Performance Considerations

- **Base64 Overhead**: 33% size increase in transit
- **Memory Usage**: Entire chunk loaded into memory
- **No Streaming**: Cannot process chunks as they arrive
- **No Parallelization**: Must upload chunks sequentially

**Recommendations:**
1. Use multipart/form-data instead of base64
2. Implement streaming upload
3. Allow parallel chunk uploads
4. Add progress tracking

## Error Handling

Current error handling:
- Missing credentials → 500 with error message
- Upload failure → 500 with generic error
- Multi-chunk → 501 Not Implemented

**Needed Improvements:**
- Chunk validation errors
- Assembly failure handling
- Timeout handling
- Retry logic for failed chunks

## Related Endpoints

- `/api/pinata` - Desktop upload (no size limit, no chunks)
- `/api/pinata-mobile` - Mobile upload (135MB limit, no chunks)
- `/api/pinata/metadata/[hash]` - Retrieve file metadata

## Migration Notes

**Consider:**
1. Completing multi-chunk implementation using Redis for chunk storage
2. Migrating to Pinata's dedicated chunked upload API if available
3. Implementing resumable uploads (tus protocol)
4. Adding upload progress SSE endpoint

## Testing

Test single-chunk upload:
```bash
# Create test file
echo "test data" | base64 > test.txt

curl -X POST https://skatehive.app/api/pinata-chunked \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileType": "text/plain",
    "totalSize": 13,
    "chunk": "'$(cat test.txt)'",
    "chunkIndex": 0,
    "totalChunks": 1
  }'
```

## Dependencies

- Pinata Cloud account with API credentials
- No chunk storage mechanism (needs implementation)
- No upload session management (needs implementation)
