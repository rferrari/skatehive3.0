# Search Overlay Airdrop Integration

The SearchOverlay component now supports airdrop commands that can trigger the airdrop modal functionality directly without needing to navigate to other pages.

## Features

### Command Search
Users can now search for "airdrop" directly in the search modal to access airdrop functionality.

### Quick Access
The airdrop command is included in the popular pages section for quick access.

### Multiple Search Methods
- Type "airdrop" to find the airdrop command
- Type "/airdrop" to search within pages and commands
- Airdrop appears in the default "Quick Access" section

### Direct Modal Opening
The airdrop modal opens directly where the user is currently located, without requiring navigation to the leaderboard page.

## Implementation

### Current Implementation (RootLayoutClient)
The SearchOverlay is now integrated with the AirdropModal at the root level, allowing users to access airdrop functionality from anywhere in the app:

```tsx
import SearchOverlay from "@/components/shared/SearchOverlay";
import AirdropModal from "@/components/airdrop/AirdropModal";
import { useDisclosure } from "@chakra-ui/react";

function RootLayoutClient({ children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isOpen: isAirdropOpen, onOpen: onAirdropOpen, onClose: onAirdropClose } = useDisclosure();
  const [leaderboardData, setLeaderboardData] = useState<SkaterData[]>([]);

  // Fetch leaderboard data for airdrop modal
  useEffect(() => {
    async function fetchLeaderboardData() {
      try {
        const res = await fetch("https://api.skatehive.app/api/skatehive");
        if (res.ok) {
          const data = await res.json();
          setLeaderboardData(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    }
    fetchLeaderboardData();
  }, []);

  const handleOpenAirdrop = () => {
    setIsSearchOpen(false);
    onAirdropOpen();
  };

  return (
    <div>
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenAirdrop={handleOpenAirdrop}
      />
      
      <AirdropModal
        isOpen={isAirdropOpen}
        onClose={onAirdropClose}
        leaderboardData={leaderboardData}
      />
      
      {children}
    </div>
  );
}
```

### Advanced Usage (Custom Components)
For components that want to implement their own airdrop modal handling:

```tsx
import SearchOverlay from "@/components/shared/SearchOverlay";
import AirdropModal from "@/components/airdrop/AirdropModal";
import { useDisclosure } from "@chakra-ui/react";

function MyComponent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isOpen: isAirdropOpen, onOpen: onAirdropOpen, onClose: onAirdropClose } = useDisclosure();
  const [leaderboardData, setLeaderboardData] = useState([]);

  const handleOpenAirdrop = () => {
    setIsSearchOpen(false);
    onAirdropOpen();
  };

  // Fetch leaderboard data for airdrop modal
  useEffect(() => {
    async function fetchData() {
      const res = await fetch("https://api.skatehive.app/api/skatehive");
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenAirdrop={handleOpenAirdrop}
      />
      
      <AirdropModal
        isOpen={isAirdropOpen}
        onClose={onAirdropClose}
        leaderboardData={leaderboardData}
      />
    </>
  );
}
```

## Command System

The search overlay now supports a command system that can be extended for other features:

### Adding New Commands

1. Add the command to `COMMAND_PAGES` in `constants.ts`:
```tsx
export const COMMAND_PAGES: PageResult[] = [
  {
    title: "Airdrop",
    path: "command:airdrop",
    description: "Open airdrop modal to distribute tokens",
    icon: FaGift,
  },
  // Add new commands here
  {
    title: "New Feature",
    path: "command:newfeature",
    description: "Description of new feature",
    icon: FaIcon,
  },
];
```

2. Handle the command in the `handleSelect` function:
```tsx
const handleSelect = useCallback(
  (item: PageResultType | SkaterData) => {
    if ("hive_author" in item) {
      router.push(`/user/${item.hive_author}`);
    } else if (item.path.startsWith("command:")) {
      const command = item.path.replace("command:", "");
      switch (command) {
        case "airdrop":
          if (onOpenAirdrop) {
            onOpenAirdrop();
          }
          break;
        case "newfeature":
          if (onOpenNewFeature) {
            onOpenNewFeature();
          }
          break;
        default:
          console.warn(`Unknown command: ${command}`);
      }
    } else {
      router.push(item.path);
    }
    onClose();
    setQuery("");
  },
  [router, onClose, onOpenAirdrop, onOpenNewFeature]
);
```

3. Add the new prop to the component interface:
```tsx
export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAirdrop?: () => void;
  onOpenNewFeature?: () => void;
}
```

## User Experience

- Users can quickly access airdrop functionality by typing "airdrop" in search from anywhere in the app
- The airdrop modal opens directly in the current location without navigation
- The airdrop command appears with a gift icon for clear identification
- Commands are integrated seamlessly with the existing search functionality
- The search modal properly categorizes results (Users, Commands, Pages)
- Leaderboard data is fetched automatically to ensure the airdrop modal has the required data

## Technical Details

- Commands use the `command:` prefix in their path to distinguish them from regular routes
- The search logic filters commands based on title and description
- Commands can be mixed with user and page results in search
- The section header dynamically updates based on result types
- Commands are included in the popular pages for quick access
