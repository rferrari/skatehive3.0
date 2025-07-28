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

export const getPopularPages = () => 
  STATIC_PAGES.filter((page) =>
    ["Home", "Blog", "Bounties", "Leaderboard", "Create Post"].includes(
      page.title
    )
  );
