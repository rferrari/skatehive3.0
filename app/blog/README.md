# Blog System Documentation

## Overview

The blog system is a comprehensive content management interface that displays posts from the Hive blockchain. It provides multiple viewing modes, filtering options, and sophisticated post fetching mechanisms including a special "GOAT" (Greatest Of All Time) mode that analyzes posts based on payout values.

## Main Components

### Core Page

- **`page.tsx`** - Main blog page that orchestrates the entire blog experience

### Layout Structure

```
/app/blog/
├── page.tsx           # Main blog page
└── README.md          # This documentation

/components/blog/
├── TopBar.tsx         # Navigation and filtering controls
├── PostGrid.tsx       # Grid layout for displaying posts
├── PostCard.tsx       # Individual post card component
├── PostInfiniteScroll.tsx  # Infinite scroll wrapper
├── PostDetails.tsx    # Detailed post view
├── PostPage.tsx       # Full post page component
├── JoinSkatehiveBanner.tsx # Community banner
└── VoteListModal.tsx  # Modal for vote interactions
```

## Key Features

### 1. Multiple View Modes

- **Grid View**: 3-column grid layout (default)
- **List View**: Linear post display
- **Magazine View**: Opens magazine modal with trending content

### 2. Query Types

- **created**: Newest posts first
- **trending**: Posts ordered by trending score
- **hot**: Hot posts based on engagement
- **highest_paid**: Posts sorted by payout value
- **goat**: Special mode that scans multiple batches to find highest-paying posts

### 3. Responsive Design

- Mobile devices automatically switch to grid view
- Responsive column layouts based on screen size

## Core Components Deep Dive

### BlogContent Component (`page.tsx`)

Main state management and logic:

```typescript
const [viewMode, setViewMode] = useState<ViewMode>("grid");
const [query, setQuery] = useState<QueryType>("created");
const [allPosts, setAllPosts] = useState<Discussion[]>([]);
const [isGoatLoading, setIsGoatLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Key Functions:**

- `fetchPosts()`: Standard post fetching with pagination
- `fetchGoatPosts()`: Advanced batch fetching for highest-paying posts
- Automatic duplicate removal using `author/permlink` combinations
- URL state synchronization with search parameters

### TopBar Component

Navigation and filtering interface providing:

- View mode switchers (Grid/List/Magazine)
- Query type dropdowns
- Compose post button (authenticated users only)
- Responsive mobile handling

### PostGrid Component

Displays posts in a responsive grid layout:

- Configurable column count (1-4 columns)
- Support for list view mode
- Optional author info hiding
- Optimized for different contexts (blog, profile, sidebar)

### PostCard Component

Individual post display with features:

- Image carousel support (Swiper.js integration)
- YouTube video embedding
- Instagram embed support
- Vote/upvote functionality
- Metadata parsing and display
- Responsive image handling
- Matrix overlay effects

### PostInfiniteScroll Component

Infinite scrolling wrapper that:

- Manages pagination state
- Provides loading skeletons
- Handles end-of-data scenarios
- Supports multiple view modes

## Utility Functions

### Core Hive Functions (`/lib/hive/client-functions.ts`)

**`findPosts(query: string, params: any[])`**

- Primary function for fetching posts from Hive blockchain
- Constructs Hive API calls using pattern: `get_discussions_by_${query}`
- Supports all standard Hive discussion queries

**`getPayoutValue(post: any): string`**

- Calculates post payout based on post age
- Posts < 7 days: returns `pending_payout_value`
- Posts ≥ 7 days: returns sum of `total_payout_value` + `curator_payout_value`
- Returns formatted string with 3 decimal places

**`getPost(user: string, postId: string)`**

- Fetches individual post content by author and permlink
- Returns typed `Discussion` object from Hive

### Image and Media Utils (`/lib/utils/extractImageUrls.ts`)

**`extractImageUrls(markdown: string): string[]`**

- Extracts image URLs from markdown content
- Validates image URLs and extensions
- Supports IPFS URLs and standard web images

**`extractYoutubeLinks(markdown: string)`**

- Extracts YouTube video links from post content
- Handles various YouTube URL formats

### Metadata Utils

**`parseJsonMetadata(metadata: string)`**

- Safely parses JSON metadata from Hive posts
- Handles malformed JSON gracefully
- Extracts tags, images, and app information

## Configuration (`/constants/blogConfig.ts`)

```typescript
export const BLOG_CONFIG = {
  POSTS_PER_PAGE: 12, // Standard pagination size
  GOAT_BATCH_SIZE: 100, // Batch size for GOAT mode
  MAX_GOAT_BATCHES: 10, // Maximum batches to scan
  BATCH_DELAY_MS: 300, // Delay between batches to avoid rate limits
  MAX_GOAT_POSTS: 1000, // Maximum posts to analyze in GOAT mode
};

export const VALID_QUERIES = [
  "created",
  "trending",
  "hot",
  "highest_paid",
  "goat",
];
export const VALID_VIEW_MODES = ["grid", "list", "magazine"];
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_HIVE_SEARCH_TAG`: Tag used for filtering community posts
- `NEXT_PUBLIC_HIVE_COMMUNITY_TAG`: Community tag for magazine view

## State Management

### URL State Synchronization

The blog maintains URL state for:

- Current view mode (`?view=grid|list|magazine`)
- Active query type (`?query=created|trending|hot|highest_paid|goat`)

### Deduplication Strategy

Posts are deduplicated using the pattern `${post.author}/${post.permlink}` which ensures:

- Global uniqueness across the Hive blockchain
- Consistent React keys for optimal rendering
- Prevention of duplicate content during pagination

### Mobile Optimization

- Automatic view mode switching to grid on mobile devices
- Responsive breakpoints for optimal content display
- Touch-friendly interface elements

## Integration Points

### Used By

- Homepage feed integration
- User profile post displays
- Search results
- Magazine modal component

### Dependencies

- **Hive Client**: Direct blockchain interaction
- **Aioha SDK**: User authentication and wallet integration
- **Chakra UI**: Component library for consistent styling
- **Swiper.js**: Image carousel functionality
- **React Infinite Scroll**: Pagination handling

## Error Handling

### Graceful Degradation

- Network failure fallbacks
- Invalid post data handling
- Missing metadata graceful parsing
- Rate limit management with delays

### User Feedback

- Loading states for all async operations
- Error alerts with actionable messages
- Optimistic UI updates where appropriate

## Performance Optimizations

### Pagination

- Efficient infinite scroll implementation
- Configurable batch sizes
- Memory-conscious post management

### Image Loading

- Lazy loading for post images
- Thumbnail generation for better performance
- Progressive image enhancement

### Caching Strategy

- Component-level state caching
- Duplicate prevention reduces API calls
- Optimized re-rendering with stable keys

## Future Enhancement Areas

1. **Advanced Filtering**: Additional metadata-based filters
2. **Search Integration**: Full-text search capabilities
3. **Offline Support**: PWA features for content caching
4. **Real-time Updates**: WebSocket integration for live updates
5. **Analytics**: User engagement tracking and insights

## AI Agent Context Notes

When working with this blog system:

1. **Post Identification**: Always use `${author}/${permlink}` for unique post identification
2. **API Rate Limits**: Be mindful of Hive blockchain rate limits; use delays between batch operations
3. **Mobile First**: Consider mobile experience in any UI changes
4. **Error Boundaries**: Wrap new components in error boundaries for resilience
5. **State Management**: Use URL parameters for shareable state when possible
6. **Metadata Parsing**: Always handle malformed JSON metadata gracefully
7. **Performance**: Consider pagination and infinite scroll implications for new features

The blog system is designed to be modular, performant, and user-friendly while providing a rich content discovery experience powered by the Hive blockchain.
