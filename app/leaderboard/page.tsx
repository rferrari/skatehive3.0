import { Metadata } from "next";
import LeaderboardClient from "./leaderboardClient";

interface SkaterData {
  id: number;
  hive_author: string;
  hive_balance: number;
  hp_balance: number;
  hbd_balance: number;
  hbd_savings_balance: number;
  has_voted_in_witness: boolean;
  eth_address: string;
  gnars_balance: number;
  gnars_votes: number;
  skatehive_nft_balance: number;
  max_voting_power_usd: number;
  last_updated: string;
  last_post: string;
  post_count: number;
  posts_score: number;
  snaps_count: number;
  delegated_curator: number;
  points: number;
  giveth_donations_usd: number;
  giveth_donations_amount: number;
}

interface LeaderboardDataResult {
  data: SkaterData[];
  top3: SkaterData[];
  top3Names: string;
  podiumImageUrl: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://skatehive.app";
const API_ENDPOINT = "https://api.skatehive.app/api/skatehive";

// Unified data fetching with optimized caching strategy
async function fetchLeaderboardData(
  revalidateSeconds: number = 60
): Promise<SkaterData[]> {
  try {
    const res = await fetch(API_ENDPOINT, {
      next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch leaderboard data: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

// Generate podium image URL with top 3 skaters
function generatePodiumImageUrl(top3: SkaterData[]): string {
  if (top3.length === 0) {
    return `${BASE_URL}/api/generate-podium?default=true`;
  }

  const avatarUrls = top3
    .map(
      (skater) =>
        `https://images.hive.blog/u/${skater.hive_author}/avatar/small`
    )
    .join(",");

  const names = top3.map((skater) => skater.hive_author).join(",");

  return `${BASE_URL}/api/generate-podium?avatars=${encodeURIComponent(
    avatarUrls
  )}&names=${encodeURIComponent(names)}`;
}

// Process leaderboard data and generate metadata assets
async function processLeaderboardData(
  revalidateSeconds?: number
): Promise<LeaderboardDataResult> {
  const data = await fetchLeaderboardData(revalidateSeconds);

  // Get top 3 by points, with fallback for empty data
  const top3 =
    data.length > 0
      ? [...data].sort((a, b) => b.points - a.points).slice(0, 3)
      : [];

  const top3Names = top3.map((skater) => skater.hive_author).join(", ");
  const podiumImageUrl = generatePodiumImageUrl(top3);

  return {
    data,
    top3,
    top3Names,
    podiumImageUrl,
  };
}
export async function generateMetadata(): Promise<Metadata> {
  const { top3, top3Names, podiumImageUrl } = await processLeaderboardData(300); // 5 minutes cache for metadata

  const dynamicDescription =
    top3.length > 0
      ? `Current top skaters: ${top3Names}. Discover the top performers in the Skatehive community based on points, HIVE power, posts, NFTs, and community contributions.`
      : "Discover the top performers in the Skatehive community. View rankings based on HIVE power, posts, NFTs, and community contributions.";

  const pageTitle = `Skatehive Leaderboard | Top Skaters - ${
    top3[0]?.hive_author || "Champions"
  } Leading`;
  const ogTitle = `🏆 Skatehive Leaderboard - ${
    top3[0]?.hive_author || "Champions"
  } on Top!`;

  // Create optimized frame object with complete metadata
  const frameObject = {
    version: "next",
    imageUrl: podiumImageUrl,
    button: {
      title: "Open Leaderboard",
      action: {
        type: "launch_frame",
        name: "Skatehive",
        url: `${BASE_URL}/leaderboard`,
      },
    },
    postUrl: BASE_URL,
  };

  return {
    title: pageTitle,
    description: dynamicDescription,
    keywords: [
      "skatehive",
      "leaderboard",
      "hive",
      "skateboarding",
      "blockchain",
      "nft",
      "web3",
      "community",
      ...top3.map((skater) => skater.hive_author),
    ],
    openGraph: {
      title: ogTitle,
      description: dynamicDescription,
      type: "website",
      url: `${BASE_URL}/leaderboard`,
      images: [
        {
          url: podiumImageUrl,
          width: 1200,
          height: 630,
          alt: `Skatehive Leaderboard Podium - Top 3: ${
            top3Names || "Champions"
          }`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: dynamicDescription,
      images: [podiumImageUrl],
    },
    other: {
      "fc:frame": JSON.stringify(frameObject),
      "fc:frame:image": podiumImageUrl,
      "fc:frame:post_url": BASE_URL,
      "fc:frame:button:1": "Open Leaderboard",
      "fc:frame:button:1:action": "launch_frame",
    },
  };
}

export default async function LeaderboardPage() {
  const { data: skatersData } = await processLeaderboardData(60); // 1 minute cache for page data

  return <LeaderboardClient skatersData={skatersData} />;
}
