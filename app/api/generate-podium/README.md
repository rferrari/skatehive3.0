# Generate Podium API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Dynamically generates SVG podium images for the SkateHive leaderboard. Creates a cyberpunk/matrix-themed podium with animated background effects, circuit board traces, and 3D server-style podium blocks. Used for social media sharing and leaderboard visualizations.

**Status**: ✅ Active (Production)  
**Method**: `GET`  
**Path**: `/api/generate-podium`

## Endpoint

### GET /api/generate-podium

Generates an SVG image with podium visualization.

**Query Parameters:**
- `avatars` (string, optional): Comma-separated list of avatar URLs
- `names` (string, optional): Comma-separated list of usernames

**Example URL:**
```
/api/generate-podium?names=user1,user2,user3&avatars=url1,url2,url3
```

**Response (200 OK):**
- Content-Type: `image/svg+xml`
- Returns SVG image data (can be displayed directly in browser)

## Image Specifications

- **Dimensions**: 1200×630px (optimal for social media)
- **Format**: SVG (scalable, small file size)
- **Theme**: Cyberpunk/Matrix aesthetic
- **Colors**: Black background with neon green accents

## Visual Elements

### Background Effects

1. **Matrix Rain**: Animated binary digits (0/1) falling effect
   - Green characters with varying opacity
   - Creates depth with fade effect
   - Randomly positioned streams

2. **Circuit Board Traces**: Interconnected lines
   - Horizontal and vertical segments
   - Green glow with transparency
   - Connection nodes at intersections

### Podium Design

Each podium block features:
- **3D Server Appearance**: Isometric view with depth
- **Rank-Based Colors**:
  - 🥇 1st Place: Green (#2d825b)
  - 🥈 2nd Place: Blue (#3498db)
  - 🥉 3rd Place: Red (#c0392b)
- **Server Details**:
  - Drive slots (horizontal lines)
  - LED indicators (colored circles)
  - Connection ports at bottom
  - Panel lighting effects

### Heights

- 1st Place: 250px tall (center, highest)
- 2nd Place: 150px tall (left)
- 3rd Place: 100px tall (right)

## Usage Examples

### JavaScript/Fetch
```javascript
const names = ['alice', 'bob', 'charlie'];
const avatars = [
  'https://example.com/avatar1.jpg',
  'https://example.com/avatar2.jpg',
  'https://example.com/avatar3.jpg'
];

const url = `/api/generate-podium?names=${names.join(',')}&avatars=${avatars.join(',')}`;

// Display in img tag
document.getElementById('podium').src = url;

// Or download
fetch(url)
  .then(r => r.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skatehive-leaderboard.svg';
    a.click();
  });
```

### React Component
```jsx
function LeaderboardPodium({ topUsers }) {
  const names = topUsers.map(u => u.username).join(',');
  const avatars = topUsers.map(u => u.avatar).join(',');
  
  return (
    <img
      src={`/api/generate-podium?names=${names}&avatars=${avatars}`}
      alt="Leaderboard Podium"
      width="1200"
      height="630"
    />
  );
}
```

### HTML Embed
```html
<img src="/api/generate-podium?names=alice,bob,charlie" 
     alt="SkateHive Leaderboard" 
     width="1200" 
     height="630">
```

### Social Media Meta Tags
```html
<meta property="og:image" content="https://skatehive.app/api/generate-podium?names=alice,bob,charlie" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/svg+xml" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://skatehive.app/api/generate-podium?names=alice,bob,charlie" />
```

### cURL (Download)
```bash
curl "https://skatehive.app/api/generate-podium?names=alice,bob,charlie" \
  -o podium.svg
```

## SVG Advantages

✅ **Benefits:**
- Scalable to any size without quality loss
- Small file size (~50KB)
- Can be styled with CSS
- Searchable text content
- Accessible (screen readers can read SVG text)

❌ **Limitations:**
- Some older email clients don't support SVG
- Twitter/Facebook may need PNG fallback
- Complex animations might not work everywhere

## Customization Options

Current implementation is hardcoded. To add customization:

### Color Schemes
```javascript
// Add query parameter: ?theme=dark|light|neon
const themes = {
  dark: { bg: '#000', accent: '#0f0' },
  light: { bg: '#fff', accent: '#00a' },
  neon: { bg: '#1a1a2e', accent: '#f0f' }
};
```

### Podium Styles
```javascript
// Add query parameter: ?style=server|classic|minimal
const styles = {
  server: generateServerPodium,  // Current
  classic: generateClassicPodium, // Simple blocks
  minimal: generateMinimalPodium  // Outline only
};
```

### Size Options
```javascript
// Add query parameters: ?width=1200&height=630
const width = parseInt(searchParams.get('width') || '1200');
const height = parseInt(searchParams.get('height') || '630');
```

## Performance Considerations

- **Generation Time**: ~50-100ms per image
- **Memory Usage**: Minimal (string concatenation)
- **No Caching**: Generates fresh SVG on each request

**Optimization Recommendations:**

1. **Add Response Caching**
   ```javascript
   // Cache based on query parameters
   const cacheKey = `podium:${names}:${avatars}`;
   const cached = await redis.get(cacheKey);
   if (cached) return cached;
   
   const svg = generatePodium(...);
   await redis.setex(cacheKey, 3600, svg); // 1 hour
   return svg;
   ```

2. **Add Cache Headers**
   ```javascript
   return new Response(svg, {
     headers: {
       'Content-Type': 'image/svg+xml',
       'Cache-Control': 'public, max-age=3600',
       'ETag': `"${hash(svg)}"`
     }
   });
   ```

3. **Pregenerate Common Layouts**
   ```javascript
   // Generate during build time
   await generatePodium(['alice', 'bob', 'charlie']);
   ```

## Browser Compatibility

SVG support:
- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Android)
- ⚠️ IE11 (needs polyfills)
- ❌ Older email clients (Gmail, Outlook)

For email/social media, consider generating PNG fallback:
```javascript
// Use sharp or canvas to convert SVG → PNG
const sharp = require('sharp');
const png = await sharp(Buffer.from(svg))
  .png()
  .toBuffer();
```

## Accessibility

The SVG includes text elements that can be read by screen readers. Enhance with:
```html
<svg aria-labelledby="title desc" role="img">
  <title id="title">SkateHive Leaderboard</title>
  <desc id="desc">Podium showing alice in first place, bob in second, charlie in third</desc>
  <!-- ... rest of SVG ... -->
</svg>
```

## Related Endpoints

- `/api/portfolio/[address]` - Get user token balances
- `/api/skatespots` - Get skatespot posts

## Future Enhancements

Consider adding:
1. **Rank Numbers**: Display 1, 2, 3 on podiums
2. **Avatar Integration**: Show user avatars on podiums
3. **Score Display**: Show points/stats below names
4. **Animation**: Add CSS animations for sparkle effects
5. **QR Codes**: Link to user profiles
6. **Localization**: Multi-language titles

## Testing

Test the endpoint:
```bash
# Basic test
curl https://skatehive.app/api/generate-podium

# With names
curl "https://skatehive.app/api/generate-podium?names=alice,bob,charlie"

# Save to file
curl "https://skatehive.app/api/generate-podium?names=alice,bob,charlie" > podium.svg

# Open in browser
open podium.svg
```

## Dependencies

- No external libraries required
- Pure SVG generation using template strings
- No image processing dependencies

## Notes

- The matrix background is randomly generated on each request
- Circuit traces are procedurally generated
- Colors follow a cyberpunk/hacker aesthetic
- Designed for 1200×630 (Twitter/Facebook optimal size)
