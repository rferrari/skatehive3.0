# Upload Metadata API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Uploads JSON metadata to IPFS via Pinata. Designed for token/coin metadata storage but can be used for any JSON data. Returns IPFS hash and URI for blockchain references.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/upload-metadata`

## Endpoint

### POST /api/upload-metadata

Uploads JSON metadata to IPFS.

**Request Body:**
```json
{
  "name": "SkateHive Token",
  "symbol": "SKATE",
  "description": "Official SkateHive community token",
  "image": "ipfs://...",
  "attributes": [
    {
      "trait_type": "Type",
      "value": "Community Token"
    }
  ]
}
```

**Required Fields:**
- `name`: Name of the token/asset (required for validation)

**Optional Fields:**
- Any valid JSON fields (symbol, description, image, attributes, etc.)

**Response (200 OK):**
```json
{
  "ipfsHash": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "pinSize": 1234,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uri": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid metadata provided"
}
```

or

```json
{
  "error": "Metadata must include a name field"
}
```

**Response (500 Error):**
```json
{
  "error": "Pinata credentials not configured"
}
```

or

```json
{
  "error": "Pinata metadata upload failed: 401 - Unauthorized"
}
```

## Metadata Structure

The endpoint automatically adds Pinata metadata:
```json
{
  "pinataContent": {
    // Your JSON data
  },
  "pinataMetadata": {
    "name": "coin-metadata-{sanitized-name}.json",
    "keyvalues": {
      "type": "coin-metadata",
      "coinName": "SkateHive Token",
      "uploadDate": "2025-01-15T10:30:00.000Z"
    }
  },
  "pinataOptions": {
    "cidVersion": 1
  }
}
```

## Pinata Configuration

- **CID Version**: 1 (CIDv1)
- **API Endpoint**: `https://api.pinata.cloud/pinning/pinJSONToIPFS`
- **Authentication**: JWT Bearer Token

Required environment variable:
- `PINATA_JWT` - Get from Pinata dashboard > API Keys

## Token Metadata Standards

For ERC-20/ERC-721 compatible metadata, use this structure:

```json
{
  "name": "Token Name",
  "description": "Token description",
  "image": "ipfs://...",
  "decimals": 18,
  "symbol": "TKN",
  "properties": {
    "category": "utility"
  }
}
```

For NFT metadata (OpenSea compatible):
```json
{
  "name": "NFT Name",
  "description": "NFT description",
  "image": "ipfs://...",
  "external_url": "https://skatehive.app",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    }
  ]
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
const metadata = {
  name: "SkateHive Pass",
  symbol: "SHPASS",
  description: "Community membership pass",
  image: "ipfs://bafybei...",
  attributes: [
    { trait_type: "Level", value: "Platinum" },
    { trait_type: "Year", value: "2025" }
  ]
};

const response = await fetch('/api/upload-metadata', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(metadata)
});

const result = await response.json();
console.log('Metadata URI:', result.uri);
// Use result.uri in smart contract
```

### React Component
```jsx
function MetadataUploader() {
  const [metadata, setMetadata] = useState({
    name: '',
    symbol: '',
    description: '',
    image: ''
  });
  const [ipfsUri, setIpfsUri] = useState('');

  const handleUpload = async () => {
    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    });
    
    const result = await response.json();
    setIpfsUri(result.uri);
  };

  return (
    <div>
      <input
        placeholder="Token Name"
        value={metadata.name}
        onChange={(e) => setMetadata({...metadata, name: e.target.value})}
      />
      {/* More inputs... */}
      <button onClick={handleUpload}>Upload to IPFS</button>
      {ipfsUri && <p>Metadata URI: {ipfsUri}</p>}
    </div>
  );
}
```

### cURL
```bash
curl -X POST https://skatehive.app/api/upload-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SkateHive Token",
    "symbol": "SKATE",
    "description": "Community token",
    "image": "ipfs://bafybei..."
  }'
```

### Smart Contract Integration
```solidity
// Store metadata URI in contract
contract SkateToken {
    string public metadataURI;
    
    constructor(string memory _metadataURI) {
        metadataURI = _metadataURI;
        // metadataURI = "ipfs://bafybei..."
    }
    
    function tokenURI() public view returns (string memory) {
        return metadataURI;
    }
}
```

## Validation

The endpoint validates:
1. **Content Type**: Must be valid JSON object
2. **Required Fields**: Must include `name` field
3. **Name Format**: Alphanumeric and hyphens only (for filename)

**Does NOT Validate:**
- JSON schema structure
- Field types (image URL format, etc.)
- Required fields beyond `name`
- File size limits

## Security Considerations

📊 **Medium Priority Issues:**

1. **No Authentication**: Anyone can upload metadata
   - Add: JWT token validation
   - Add: API key requirement
   - Track: Upload quotas per user

2. **No Rate Limiting**: Could be abused for spam
   - Add: Max 10 uploads per minute per IP
   - Add: Daily upload limits

3. **No Size Validation**: Could upload large JSON blobs
   - Add: Max 1MB JSON size limit
   - Add: Nested object depth limit

4. **No Content Validation**: No schema enforcement
   - Add: JSON schema validation
   - Add: Image URL validation (if present)
   - Add: Malicious content scanning

## Best Practices

**DO:**
- ✅ Validate metadata client-side before upload
- ✅ Include all required fields for your use case
- ✅ Use IPFS CIDv1 format
- ✅ Store IPFS hash in your database
- ✅ Add attributes for filtering/searching

**DON'T:**
- ❌ Upload sensitive information
- ❌ Include large base64 images (upload separately)
- ❌ Use absolute URLs (use IPFS URIs)
- ❌ Upload without client-side validation
- ❌ Forget to backup metadata locally

## IPFS URI Format

The endpoint returns URI in format:
```
ipfs://{CIDv1}
```

Access via:
- **IPFS Gateway**: `https://gateway.pinata.cloud/ipfs/{hash}`
- **Local IPFS**: `http://127.0.0.1:8080/ipfs/{hash}`
- **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/{hash}`

## Pinning Persistence

Files pinned to Pinata are:
- ✅ Permanently available (unless unpinned)
- ✅ Backed up across multiple nodes
- ✅ Available via global IPFS network
- ✅ Accessible via HTTP gateways

To unpin (admin operation):
```javascript
await fetch(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${process.env.PINATA_JWT}`
  }
});
```

## Error Handling

The endpoint provides detailed error messages:
- Missing credentials → Server configuration error
- Invalid metadata → Validation error with details
- Pinata failure → HTTP status and error text included
- Network timeout → Generic upload failure

**Recommendation**: Implement retry logic for network failures.

## Performance Considerations

- **JSON Size**: Larger JSON = longer upload time
- **Pinata Limits**: Check Pinata plan limits
- **No Caching**: Each request uploads to IPFS
- **Synchronous**: Blocks until Pinata confirms

**Optimization:**
1. Compress JSON before upload (gzip)
2. Validate client-side to avoid failed requests
3. Batch uploads if possible
4. Implement upload queue for multiple files

## Related Endpoints

- `/api/pinata` - Upload files (images, videos)
- `/api/pinata-mobile` - Mobile file upload
- `/api/pinata/metadata/[hash]` - Retrieve metadata by hash

## Dependencies

- Pinata Cloud account with API credentials
- No additional npm packages required
- Uses native `fetch` API

## Testing

Test with sample metadata:
```bash
curl -X POST http://localhost:3000/api/upload-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Token",
    "description": "Testing metadata upload",
    "image": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
  }'
```

Expected response:
```json
{
  "ipfsHash": "bafyrei...",
  "pinSize": 123,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uri": "ipfs://bafyrei..."
}
```
