import {
  FaHome,
  FaBlog,
  FaCalendar,
  FaWallet,
  FaBullseye,
  FaMapMarkerAlt,
  FaBell,
  FaCog,
  FaEnvelope,
  FaTrophy,
  FaPen,
  FaShareAlt,
  FaGavel,
  FaUser,
  FaGift,
} from "react-icons/fa";
import { PageResult } from "./types";

export const STATIC_PAGES: PageResult[] = [
  {
    title: "Home",
    path: "/",
    description: "Skatehive homepage with latest content",
    icon: FaHome,
  },
  {
    title: "Blog",
    path: "/blog",
    description: "Read latest skateboarding articles and stories",
    icon: FaBlog,
  },
  {
    title: "Magazine",
    path: "/magazine",
    description: "Skatehive digital magazine",
    icon: FaCalendar,
  },
  {
    title: "Wallet",
    path: "/wallet",
    description: "Manage your crypto wallet and tokens",
    icon: FaWallet,
  },
  {
    title: "Bounties",
    path: "/bounties",
    description: "Explore skateboarding bounties and challenges",
    icon: FaBullseye,
  },
  {
    title: "Auction",
    path: "/auction",
    description: "Bid on exclusive skateboarding NFTs and collectibles",
    icon: FaGavel,
  },
  {
    title: "Skate Spots",
    path: "/skatespots",
    description: "Discover skateboarding spots around the world",
    icon: FaMapMarkerAlt,
  },
  {
    title: "Leaderboard",
    path: "/leaderboard",
    description: "Top performers in the Skatehive community",
    icon: FaTrophy,
  },
  {
    title: "Notifications",
    path: "/notifications",
    description: "View your notifications and updates",
    icon: FaBell,
  },
  {
    title: "Settings",
    path: "/settings",
    description: "Configure your account settings",
    icon: FaCog,
  },
  {
    title: "Invite Friends",
    path: "/invite",
    description: "Invite friends to join Skatehive",
    icon: FaEnvelope,
  },
  {
    title: "Join Community",
    path: "/join",
    description: "Join the Skatehive community",
    icon: FaUser,
  },
  {
    title: "Create Post",
    path: "/compose",
    description: "Write a new post or article",
    icon: FaPen,
  },
  {
    title: "Share Content",
    path: "/share",
    description: "Share content with the community",
    icon: FaShareAlt,
  },
];

// Special commands that trigger modal actions
export const COMMAND_PAGES: PageResult[] = [
  {
    title: "Airdrop",
    path: "command:airdrop",
    description: "Open airdrop modal to distribute tokens",
    icon: FaGift,
  },
];

export const getPopularPages = () => {
  const popularStaticPages = STATIC_PAGES.filter((page) =>
    ["Home", "Blog", "Bounties", "Leaderboard", "Create Post"].includes(
      page.title
    )
  );
  
  // Add airdrop command to popular pages
  const popularCommands = COMMAND_PAGES.filter((page) =>
    ["Airdrop"].includes(page.title)
  );
  
  return [...popularStaticPages, ...popularCommands];
};
