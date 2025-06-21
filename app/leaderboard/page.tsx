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
  points: number;
  giveth_donations_usd: number;
  giveth_donations_amount: number;
}

async function getLeaderboardData(): Promise<SkaterData[]> {
  try {
    const res = await fetch("https://api.skatehive.app/api/skatehive", {
      next: { revalidate: 0 },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error("Failed to fetch leaderboard data");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

// Generate podium image URL with top 3 skaters
function generatePodiumImageUrl(top3: SkaterData[]): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://my.skatehive.app";
  const avatarUrls = top3
    .map(
      (skater) =>
        `https://images.hive.blog/u/${skater.hive_author}/avatar/small`
    )
    .join(",");

  // This would be your podium image generation endpoint
  return `${baseUrl}/api/generate-podium?avatars=${encodeURIComponent(
    avatarUrls
  )}&names=${top3.map((s) => s.hive_author).join(",")}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const skatersData = await getLeaderboardData();

  // Get top 3 by points
  const top3 = [...skatersData].sort((a, b) => b.points - a.points).slice(0, 3);

  const podiumImageUrl = generatePodiumImageUrl(top3);

  const top3Names = top3.map((skater) => skater.hive_author).join(", ");
  const dynamicDescription =
    top3.length > 0
      ? `Current top skaters: ${top3Names}. Discover the top performers in the Skatehive community based on points, HIVE power, posts, NFTs, and community contributions.`
      : "Discover the top performers in the Skatehive community. View rankings based on HIVE power, posts, NFTs, and community contributions.";

  return {
    title: `Skatehive Leaderboard | Top Skaters - ${
      top3[0]?.hive_author || "Champions"
    } Leading`,
    description: dynamicDescription,
    keywords: [
      "skatehive",
      "leaderboard",
      "hive",
      "skateboarding",
      "blockchain",
      "nft",
      ...top3.map((skater) => skater.hive_author),
    ],
    openGraph: {
      title: `🏆 Skatehive Leaderboard - ${
        top3[0]?.hive_author || "Champions"
      } on Top!`,
      description: dynamicDescription,
      type: "website",
      images: [
        {
          url: podiumImageUrl,
          width: 1200,
          height: 630,
          alt: `Skatehive Leaderboard Podium - Top 3: ${top3Names}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `🏆 Skatehive Leaderboard - ${
        top3[0]?.hive_author || "Champions"
      } Leading!`,
      description: dynamicDescription,
      images: [podiumImageUrl],
    },
  };
}

export default async function LeaderboardPage() {
  const skatersData = await getLeaderboardData();

  return <LeaderboardClient skatersData={skatersData} />;
}
