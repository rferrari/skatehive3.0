# Video Upload System - API-First Implementation

## Overview

The video upload system has been redesigned with an **API-first approach** that prioritizes external video conversion APIs for better performance and reliability, while maintaining robust fallbacks to native processing.

## Architecture

```
1. Try Primary API    →  2. Try Fallback API    →  3. Native Processing
   (Your Raspberry Pi)     (Placeholder/Future)      (FFmpeg in Browser)
```

## Key Features

### 🚀 **API-First Processing**

- **Primary API**: Your Raspberry Pi conversion service (`https://raspberrypi.tail83ea3e.ts.net/transcode`)
- **Fallback API**: Placeholder for future backup service
- **Native Fallback**: Browser-based FFmpeg processing (existing system)

### ⚡ **Smart Processing Decisions**

- Automatically chooses the best processing method based on:
  - API availability
  - File size and type
  - Device capabilities (iOS, Android, Desktop)
  - User Hive Power level

### 📊 **Enhanced Progress Tracking**

- Real-time progress updates for each processing stage
- Clear status messages indicating which method is being used
- Detailed debugging information in development mode

### 🔧 **Optimized Performance**

- Reduced code duplication
- Consolidated processing logic
- Better error handling and recovery
- Device-specific optimizations

## File Structure

```
lib/
├── services/
│   └── videoConversionAPI.ts          # API service layer
└── utils/
    ├── videoProcessingOptimizer.ts    # Processing strategy logic
    ├── videoUploadUtils.ts            # Upload utilities (existing)
    └── videoProcessing.ts             # Native processing (existing)

components/homepage/
└── VideoUploader.tsx                  # Main component (updated)

hooks/
└── useFileUpload.ts                   # Upload hooks (enhanced)
```

## API Integration

### Primary API Endpoint

Your Raspberry Pi service expects:

```bash
curl -F "video=@path/to/video.mov" \
     -F "creator=username" \
     -F "thumbnailUrl=https://example.com/thumb.png" \
     https://raspberrypi.tail83ea3e.ts.net/transcode
```

**Expected Response:**

```json
{
  "url": "https://ipfs.skatehive.app/ipfs/QmHash...",
  "duration": 30.5,
  "fileSize": 1024000
}
```

### Fallback API

Currently a placeholder in `videoConversionAPI.ts`. To implement:

1. Update `FALLBACK_API_ENDPOINT` constant
2. Uncomment and modify the fallback API code
3. Ensure it follows the same request/response format

## Processing Flow

### 1. **API Availability Check**

```typescript
// Checks both APIs on component mount
const availability = await checkAPIAvailability();
```

### 2. **Processing Strategy Selection**

```typescript
const strategy = determineProcessingStrategy(
  file,
  deviceCapabilities,
  config,
  apiAvailability
);
```

### 3. **Execution with Fallbacks**

```typescript
// Try API first
const apiResult = await uploadVideoWithAPIFallback(file, options);

if (!apiResult.success) {
  // Fall back to native processing
  const nativeResult = await processNatively(file);
}
```

## Usage Locations

The VideoUploader is used in:

1. **`/app/compose/page.tsx`** - Main post composer
2. **`/components/homepage/SnapComposer.tsx`** - Comment/snap composer
3. **`/components/bounties/BountyComposer.tsx`** - Bounty creation

All locations automatically benefit from the new API-first approach without code changes.

## Configuration

### Environment Variables

```env
# Add these if needed for API authentication
NEXT_PUBLIC_VIDEO_API_KEY=your_api_key
NEXT_PUBLIC_FALLBACK_API_URL=https://backup.example.com
```

### Component Props

```typescript
<VideoUploader
  onUpload={handleVideoUpload}
  username={user} // For API metadata
  userHP={hivePower} // For file size limits
  onDurationError={handleError} // Duration validation
  skipCompression={false} // Force compression skip
  maxDurationSeconds={300} // Optional duration limit
/>
```

## API Response Handling

### Success Response

```json
{
  "success": true,
  "url": "https://ipfs.skatehive.app/ipfs/QmHash...",
  "method": "primary_api",
  "duration": 30.5,
  "fileSize": 1024000
}
```

### Error Response

```json
{
  "success": false,
  "error": "API timeout",
  "method": "primary_api"
}
```

## Development & Debugging

### Debug Information

In development mode, the component shows:

- 🚀 Processing Method (api/native)
- 🔌 Primary API availability
- 🔄 Fallback API availability
- 📱 Device capabilities
- 🛠️ FFmpeg support status

### Console Logs

```javascript
// API processing
console.log("🚀 Attempting upload to primary API...");
console.log("✅ Primary API upload successful!");

// Native fallback
console.log("⚠️ Both APIs failed, will fallback to native processing");
console.log("📱 Starting native video processing...");
```

### Analytics

```typescript
logProcessingAnalytics(
  file,
  processingDecision,
  deviceCapabilities,
  startTime,
  endTime,
  success,
  error
);
```

## Performance Improvements

### Before (Native Only)

- Single processing path
- Duplicated logic across components
- Limited error recovery
- Device-specific workarounds scattered

### After (API-First)

- Three-tier processing strategy
- Consolidated processing logic
- Robust error handling and recovery
- Centralized device optimizations
- Better progress tracking
- Comprehensive analytics

## Error Handling

### API Failures

1. Primary API timeout/error → Try fallback API
2. Fallback API failure → Use native processing
3. Native processing failure → Upload original file

### File Validation

- Size limits based on user Hive Power
- Format validation and warnings
- Duration checks and limits

### Network Issues

- Configurable timeouts
- Automatic retries
- Graceful degradation

## Future Enhancements

1. **Multiple Fallback APIs**: Add more backup services
2. **Smart API Selection**: Choose API based on file type/size
3. **Caching**: Cache API availability checks
4. **Analytics Dashboard**: Track processing method usage
5. **A/B Testing**: Compare API vs native performance

## Testing Your API

To test the new implementation:

1. **Start your Raspberry Pi service**
2. **Upload a video** through any composer
3. **Check console logs** for API processing messages
4. **Verify the video** uploads successfully via your API

The system will automatically fall back to native processing if your API is unavailable.

## Troubleshooting

### API Not Being Used

- Check if your Raspberry Pi service is running
- Verify the API endpoint URL in `videoConversionAPI.ts`
- Check browser console for CORS or network errors

### Slow Processing

- Monitor API response times in network tab
- Check if API is under heavy load
- Verify network connectivity

### Upload Failures

- Check API response format matches expected structure
- Verify IPFS URLs are being returned correctly
- Monitor for timeout issues

---

The new API-first approach provides a more robust, scalable, and performant video upload system while maintaining full backward compatibility with existing functionality.
