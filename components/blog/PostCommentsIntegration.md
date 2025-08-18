# PostComments Integration Design

## How to Identify Root Posts vs Comments

Based on the codebase analysis, we can identify root posts using these criteria:

```typescript
function isRootPost(discussion: Discussion): boolean {
  // Root posts have no parent_author (empty string) and depth 0
  return !discussion.parent_author && discussion.depth === 0;
}

function isComment(discussion: Discussion): boolean {
  // Comments have a parent_author and depth > 0
  return !!discussion.parent_author && discussion.depth > 0;
}
```

## Integration Strategy

### 1. Enhanced Snap Component
Add a prop to `Snap` component to enable PostComments mode:

```typescript
interface SnapProps {
  discussion: Discussion;
  onOpen: () => void;
  setReply: (discussion: Discussion) => void;
  setConversation?: (conversation: Discussion) => void;
  onCommentAdded?: () => void;
  usePostComments?: boolean; // NEW: Enable PostComments for root posts
}
```

### 2. Conditional Comments Display
In the Snap component, conditionally render either:
- **PostComments** for root posts (when `usePostComments` is true)
- **Current inline replies** for comments/replies

```typescript
// In Snap component
const showPostComments = usePostComments && isRootPost(discussion);

return (
  <Box>
    {/* Snap content */}
    
    {/* Comments section */}
    {showPostComments ? (
      <PostComments 
        author={discussion.author}
        permlink={discussion.permlink}
        hideComposer={false}
        onNewComment={onCommentAdded}
      />
    ) : (
      /* Current inline replies logic */
    )}
  </Box>
);
```

### 3. Where to Use PostComments

**Ideal Places for PostComments Integration:**

1. **Homepage Feed** - For root posts/snaps that get significant engagement
2. **Profile Pages** - When viewing user's posts  
3. **Magazine/Blog** - For featured content
4. **Bounty Details** - For bounty posts specifically

**Configuration Examples:**

```typescript
// Homepage - only for high-engagement posts
<SnapList 
  data={snapData}
  usePostComments={(discussion) => 
    isRootPost(discussion) && discussion.children > 5
  }
/>

// Profile page - all root posts
<SnapList 
  data={userPosts}
  usePostComments={(discussion) => isRootPost(discussion)}
/>

// Magazine - all posts
<SnapList 
  data={magazinePosts}
  usePostComments={true} // All posts use PostComments
/>
```

### 4. Snap Type Detection

Different snap types that could benefit from PostComments:

```typescript
function getSnapType(discussion: Discussion): string {
  try {
    const metadata = JSON.parse(discussion.json_metadata);
    const tags = metadata.tags || [];
    
    if (tags.includes('skateboard-trick')) return 'trick';
    if (tags.includes('skatespot')) return 'spot';
    if (tags.includes('skateboard-setup')) return 'setup';
    if (discussion.body.includes('Trick/Challenge:')) return 'bounty';
    
    return 'general';
  } catch {
    return 'general';
  }
}

// Use PostComments for specific types
const snapType = getSnapType(discussion);
const usePostComments = ['trick', 'spot', 'bounty'].includes(snapType);
```

### 5. Migration Strategy

**Phase 1**: Create PostComments component ✅ (Done)

**Phase 2**: Add integration props to existing components (Don't implement yet)
- Add `usePostComments` prop to SnapList
- Add conditional rendering to Snap component
- Add helper functions for root post detection

**Phase 3**: Gradual rollout (Future)
- Start with PostDetails page (replace current SnapList)
- Add to specific content types (bounties, featured posts)
- Eventually expand to homepage for high-engagement content

**Phase 4**: Advanced features (Future)
- Threading/nested comments in PostComments
- Sort preferences (user can choose)
- Comment filtering options

## Benefits of This Approach

1. **Unified Experience**: Same comment sorting across different content types
2. **Better Engagement**: Best comments rise to the top
3. **Flexible Integration**: Can be enabled per content type or engagement level
4. **Backward Compatible**: Existing SnapList behavior preserved
5. **Gradual Migration**: Can roll out incrementally

## Technical Implementation Notes

- PostComments component is self-contained and reusable
- Uses existing useComments hook for data fetching
- Sorting logic is encapsulated and testable
- Can be easily toggled on/off per use case
- Respects existing authentication and permission systems
