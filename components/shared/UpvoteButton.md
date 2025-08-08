# UpvoteButton Component

A reusable upvote button component for Hive blockchain posts that can be used across all snap-type components in the Skatehive application. **The styling is identical to the upvote button used in the Snap component.**

## Features

- **Identical Styling**: Matches the Snap component's upvote button exactly
- **Multiple Variants**: Simple button, with vote count, or with slider
- **Theme Integration**: Uses semantic color tokens from the theme system
- **Hive Integration**: Built-in Hive blockchain voting via Aioha
- **Vote Estimation**: Optional vote value estimation
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Includes tooltips and proper ARIA labels
- **Animation**: Includes the subtle-pulse animation for vote buttons

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `discussion` | `Discussion` | - | The Hive post discussion object |
| `voted` | `boolean` | - | Whether the current user has voted |
| `setVoted` | `(voted: boolean) => void` | - | Function to update voted state |
| `activeVotes` | `any[]` | - | Array of active votes on the post |
| `setActiveVotes` | `(votes: any[]) => void` | - | Function to update active votes |
| `onVoteSuccess` | `(estimatedValue?: number) => void` | - | Callback when vote is successful |
| `estimateVoteValue` | `(percentage: number) => Promise<number>` | - | Function to estimate vote value |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | Size of the button |
| `variant` | `"simple" \| "withSlider" \| "withVoteCount"` | `"simple"` | Visual variant of the component |
| `showSlider` | `boolean` | `false` | Whether to show the vote slider (for withSlider variant) |
| `setShowSlider` | `(show: boolean) => void` | - | Function to control slider visibility |
| `className` | `string` | - | Additional CSS class name |

## Variants

### Simple
Just the upvote button without vote count or slider. Automatically votes at 100%.

```tsx
<UpvoteButton
  discussion={discussion}
  voted={voted}
  setVoted={setVoted}
  activeVotes={activeVotes}
  setActiveVotes={setActiveVotes}
  variant="simple"
  onVoteSuccess={handleVoteSuccess}
  estimateVoteValue={estimateVoteValue}
/>
```

### With Vote Count
Upvote button with vote count display and vote list popover.

```tsx
<UpvoteButton
  discussion={discussion}
  voted={voted}
  setVoted={setVoted}
  activeVotes={activeVotes}
  setActiveVotes={setActiveVotes}
  variant="withVoteCount"
  onVoteSuccess={handleVoteSuccess}
  estimateVoteValue={estimateVoteValue}
/>
```

### With Slider
Upvote button with vote percentage slider for precise voting control.

```tsx
<UpvoteButton
  discussion={discussion}
  voted={voted}
  setVoted={setVoted}
  activeVotes={activeVotes}
  setActiveVotes={setActiveVotes}
  variant="withSlider"
  showSlider={showSlider}
  setShowSlider={setShowSlider}
  onVoteSuccess={handleVoteSuccess}
  estimateVoteValue={estimateVoteValue}
/>
```

## Usage Examples

### Basic Usage in a Snap Component

```tsx
import { UpvoteButton } from '@/components/shared';
import useHivePower from '@/hooks/useHivePower';
import { useAioha } from '@aioha/react-ui';

const SnapComponent = ({ discussion }) => {
  const { user } = useAioha();
  const { estimateVoteValue } = useHivePower(user);
  const [voted, setVoted] = useState(false);
  const [activeVotes, setActiveVotes] = useState(discussion.active_votes || []);

  const handleVoteSuccess = (estimatedValue) => {
  };

  return (
    <UpvoteButton
      discussion={discussion}
      voted={voted}
      setVoted={setVoted}
      activeVotes={activeVotes}
      setActiveVotes={setActiveVotes}
      variant="withVoteCount"
      onVoteSuccess={handleVoteSuccess}
      estimateVoteValue={estimateVoteValue}
    />
  );
};
```

### Advanced Usage with Slider

```tsx
const SnapWithSlider = ({ discussion }) => {
  const { user } = useAioha();
  const { estimateVoteValue } = useHivePower(user);
  const [voted, setVoted] = useState(false);
  const [activeVotes, setActiveVotes] = useState(discussion.active_votes || []);
  const [showSlider, setShowSlider] = useState(false);

  const handleVoteSuccess = (estimatedValue) => {
    // Update reward amount or other UI state
    if (estimatedValue) {
      setRewardAmount(prev => prev + estimatedValue);
    }
  };

  return (
    <UpvoteButton
      discussion={discussion}
      voted={voted}
      setVoted={setVoted}
      activeVotes={activeVotes}
      setActiveVotes={setActiveVotes}
      variant="withSlider"
      showSlider={showSlider}
      setShowSlider={setShowSlider}
      onVoteSuccess={handleVoteSuccess}
      estimateVoteValue={estimateVoteValue}
      size="md"
    />
  );
};
```

## Integration with Existing Components

The UpvoteButton component is designed to replace the existing upvote implementations in:

- `components/homepage/Snap.tsx`
- `components/bounties/BountySnap.tsx`
- `components/blog/PostCard.tsx`
- `components/profile/SnapModal.tsx`
- `components/notifications/NotificationItem.tsx`

### Migration Example

**Before (using VoteSlider):**
```tsx
<VoteSlider
  discussion={discussion}
  voted={voted}
  setVoted={setVoted}
  activeVotes={activeVotes}
  setActiveVotes={setActiveVotes}
  showSlider={showSlider}
  setShowSlider={setShowSlider}
  onVoteSuccess={handleVoteSuccess}
  estimateVoteValue={estimateVoteValue}
  variant="feed"
  size="sm"
/>
```

**After (using UpvoteButton):**
```tsx
<UpvoteButton
  discussion={discussion}
  voted={voted}
  setVoted={setVoted}
  activeVotes={activeVotes}
  setActiveVotes={setActiveVotes}
  variant="withSlider"
  showSlider={showSlider}
  setShowSlider={setShowSlider}
  onVoteSuccess={handleVoteSuccess}
  estimateVoteValue={estimateVoteValue}
  size="sm"
/>
```

## Theme Integration

The component uses semantic color tokens from the theme system:

- `accent` - Default button color
- `success` - Color when voted
- `primary` - Hover state color
- `muted` - Background color for unvoted state
- `background` - Button text color
- `text` - General text color

## Accessibility

- Includes tooltips with descriptive labels
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management for the slider variant

## Error Handling

The component includes built-in error handling for:
- User not logged in
- Network errors during voting
- Invalid vote parameters
- Hive blockchain errors

All errors are displayed via toast notifications using Chakra UI's toast system. 