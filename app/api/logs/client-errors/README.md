# Client Errors Logging API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Centralized client-side error logging endpoint that writes errors to server-side log files. Captures JavaScript errors, warnings, and info messages from the frontend with contextual metadata. Supports querying logs with filtering options.

**Status**: ⚠️ Active (Consider migrating to Sentry)  
**Methods**: `POST`, `GET`  
**Path**: `/api/logs/client-errors`

## Endpoints

### POST /api/logs/client-errors

Logs a client-side error, warning, or info message.

**Request Body:**
```json
{
  "level": "error",
  "type": "upload_failure",
  "message": "Failed to upload file: timeout",
  "details": {
    "fileName": "video.mp4",
    "fileSize": 50000000,
    "errorCode": "TIMEOUT",
    "stack": "Error: timeout\n  at upload.js:45...",
    "url": "https://skatehive.app/upload",
    "userId": "alice"
  }
}
```

**Required Fields:**
- `type` (string): Error category/identifier
- `message` (string): Human-readable error description

**Optional Fields:**
- `level` (string): `"error"` (default), `"warning"`, or `"info"`
- `details` (object): Additional context (fileName, fileSize, stack trace, etc.)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Error logged successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: type and message"
}
```

**Response (500 Error):**
```json
{
  "error": "Failed to log error"
}
```

### GET /api/logs/client-errors

Retrieves logged errors with optional filtering.

**Query Parameters:**
- `limit` (number, optional): Max number of logs to return (default: 100)
- `level` (string, optional): Filter by level (`error`, `warning`, `info`)
- `type` (string, optional): Filter by error type

**Example URLs:**
```
/api/logs/client-errors?limit=50
/api/logs/client-errors?level=error
/api/logs/client-errors?type=upload_failure&limit=25
```

**Response (200 OK):**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-15T10:30:00.000Z",
      "level": "error",
      "type": "upload_failure",
      "message": "Failed to upload file: timeout",
      "details": {
        "fileName": "video.mp4",
        "fileSize": 50000000,
        "errorCode": "TIMEOUT",
        "clientIp": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "url": "https://skatehive.app/upload"
      }
    }
  ],
  "total": 1,
  "filtered": true
}
```

**Response (404):**
```json
{
  "logs": [],
  "message": "No logs found"
}
```

## Log Storage

Logs are written to:
```
/logs/client-errors.log
```

Format: NDJSON (newline-delimited JSON)
```
{"timestamp":"2025-01-15T10:30:00.000Z","level":"error",...}
{"timestamp":"2025-01-15T10:31:00.000Z","level":"warning",...}
```

## Automatic Metadata

The endpoint automatically captures:
- `timestamp`: ISO 8601 timestamp
- `clientIp`: Client IP from headers (`x-forwarded-for`, `x-real-ip`)
- `userAgent`: Browser/client user agent
- `url`: Request URL from details or referer

## Error Types

Common error types to use:

| Type | When to Use |
|------|-------------|
| `upload_failure` | File upload errors |
| `api_error` | API request failures |
| `render_error` | React component errors |
| `auth_error` | Authentication failures |
| `network_error` | Network connectivity issues |
| `validation_error` | Form validation failures |
| `timeout` | Request timeouts |
| `parse_error` | JSON/data parsing errors |

## Usage Examples

### JavaScript Error Handler
```javascript
// Global error handler
window.addEventListener('error', (event) => {
  fetch('/api/logs/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: 'error',
      type: 'uncaught_error',
      message: event.message,
      details: {
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href
      }
    })
  });
});
```

### React Error Boundary
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    fetch('/api/logs/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        type: 'render_error',
        message: error.toString(),
        details: {
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href
        }
      })
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### Upload Error Logging
```javascript
async function uploadFile(file) {
  try {
    const response = await fetch('/api/pinata', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Upload failed');
  } catch (error) {
    // Log error
    await fetch('/api/logs/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        type: 'upload_failure',
        message: error.message,
        details: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          errorCode: error.code,
          stack: error.stack
        }
      })
    });
    
    throw error;
  }
}
```

### Query Logs
```javascript
// Get recent errors
const response = await fetch('/api/logs/client-errors?level=error&limit=50');
const { logs } = await response.json();

console.log('Recent errors:', logs);

// Filter by type
const uploadErrors = await fetch('/api/logs/client-errors?type=upload_failure')
  .then(r => r.json());
```

## Security Considerations

📊 **Medium Priority Issues:**

1. **No Authentication**: Anyone can write logs
   - Add: API key or JWT validation
   - Risk: Log spam, disk space exhaustion

2. **No Rate Limiting**: Can be abused for DoS
   - Add: Max 10 errors per minute per IP
   - Add: Max 100 errors per hour per IP

3. **PII in Logs**: User data might be logged
   - Add: PII redaction (emails, names, IPs)
   - Add: GDPR compliance (log retention, deletion)

4. **Log File Growth**: No rotation mechanism
   - Add: Daily log rotation
   - Add: Automatic cleanup of old logs
   - Add: Max log file size limit

5. **Stack Traces**: May contain sensitive paths
   - Add: Path sanitization
   - Remove: Environment variables from stack traces

## Best Practices

**DO:**
- ✅ Include stack traces for errors
- ✅ Add contextual information (userId, filename, etc.)
- ✅ Use consistent error types
- ✅ Log user actions leading to error
- ✅ Include browser/device info

**DON'T:**
- ❌ Log passwords or API keys
- ❌ Log full user objects
- ❌ Log PII without consent
- ❌ Send logs on every render
- ❌ Include sensitive URLs

## Log Retention

Current implementation:
- ✅ Logs persist indefinitely
- ❌ No automatic cleanup
- ❌ No compression
- ❌ No archival

**Recommended:**
```javascript
// Daily log rotation
const logFile = `logs/client-errors-${date}.log`;

// Compress old logs
gzip logs/client-errors-2025-01-14.log

// Delete logs older than 90 days
find logs/ -name "*.log.gz" -mtime +90 -delete
```

## Migration to Sentry

🔥 **High Priority**: Consider migrating to Sentry for better error tracking

**Benefits:**
- Automatic grouping and deduplication
- Source map support
- Release tracking
- User context and breadcrumbs
- Performance monitoring
- Better search and filtering
- Alerts and notifications

**Migration:**
```javascript
// Replace custom logging
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Errors automatically captured
Sentry.captureException(error);
```

## Performance Impact

- **POST**: ~5-10ms to write log entry
- **GET**: ~50-200ms to read and parse logs (depends on file size)
- **Disk Space**: ~1KB per log entry
- **File I/O**: Can slow down under high load

**Optimization:**
1. Use log streaming service (Logtail, Datadog)
2. Batch log writes
3. Use database instead of files
4. Implement async queue

## Testing

Test error logging:
```bash
# Log an error
curl -X POST https://skatehive.app/api/logs/client-errors \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "type": "test_error",
    "message": "This is a test error",
    "details": {
      "testId": "123"
    }
  }'

# Retrieve logs
curl https://skatehive.app/api/logs/client-errors?limit=10
```

## Related Endpoints

- `/api/test-notification` - Testing notification system
- `/api/debug-hive-notifications` - Debug Hive notifications

## Dependencies

- Node.js `fs/promises` for file operations
- No external logging libraries
- Writes to local filesystem

## Notes

- Console logs also output for immediate visibility
- Log format is NDJSON for easy parsing
- GET endpoint may be incomplete (truncated at line 100 in source)
- Consider implementing log streaming for real-time monitoring
