"use client";

import { useState, useMemo } from "react";

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

interface Props {
  skatersData: SkaterData[];
}

type SortOption = "points" | "power" | "posts" | "nfts" | "gnars" | "donations";

export default function LeaderboardClient({ skatersData }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("points");

  const sortedSkaters = useMemo(() => {
    const sorted = [...skatersData].sort((a, b) => {
      switch (sortBy) {
        case "points":
          return b.points - a.points;
        case "power":
          return (
            b.hp_balance +
            b.max_voting_power_usd -
            (a.hp_balance + a.max_voting_power_usd)
          );
        case "posts":
          return b.post_count - a.post_count;
        case "nfts":
          return b.skatehive_nft_balance - a.skatehive_nft_balance;
        case "gnars":
          return b.gnars_votes - a.gnars_votes;
        case "donations":
          return b.giveth_donations_usd - a.giveth_donations_usd;
        default:
          return 0;
      }
    });
    return sorted.slice(0, 50); // Top 50
  }, [skatersData, sortBy]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🏆</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-green-400">#{rank}</span>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toFixed(2);
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays < 1) return "Today";
    if (diffInDays === 1) return "1d";
    if (diffInDays < 30) return `${diffInDays}d`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo`;
    return `${Math.floor(diffInDays / 365)}y`;
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <div className="p-8 border-b border-green-500/30">
        <div className="flex items-center gap-6 mb-6">
          <span className="text-green-400 cursor-pointer hover:text-green-300 text-3xl">
            ←
          </span>
          <h1 className="text-3xl font-bold text-green-400">
            Skatehive Leaderboard
          </h1>
        </div>

        <div className="text-center mb-8">
          <p className="text-green-400 text-xl">
            We are {skatersData.length} skaters supporting ourselves. 🛹
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex justify-center gap-8 text-base">
          <button
            onClick={() => setSortBy("points")}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              sortBy === "points"
                ? "bg-green-600 text-black font-bold"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            🏆 Points
          </button>
          <button
            onClick={() => setSortBy("power")}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              sortBy === "power"
                ? "bg-green-600 text-black font-bold"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            ⚡ Power
          </button>
          <button
            onClick={() => setSortBy("posts")}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              sortBy === "posts"
                ? "bg-green-600 text-black font-bold"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            💬 Posts
          </button>
          <button
            onClick={() => setSortBy("nfts")}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              sortBy === "nfts"
                ? "bg-green-600 text-black font-bold"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            🎨 NFTs
          </button>
          <button
            onClick={() => setSortBy("gnars")}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              sortBy === "gnars"
                ? "bg-green-600 text-black font-bold"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            🪙 Gnars
          </button>
          <button
            onClick={() => setSortBy("donations")}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              sortBy === "donations"
                ? "bg-green-600 text-black font-bold"
                : "text-gray-400 hover:text-green-400"
            }`}
          >
            ❤️ Donations
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {sortedSkaters.map((skater, index) => {
            const rank = index + 1;

            return (
              <div
                key={skater.id}
                className="flex items-center justify-between p-6 border border-green-800/50 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 hover:border-green-600/50 transition-all duration-200"
              >
                <div className="flex items-center gap-8 flex-1">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 text-xl font-bold">
                    {rank === 1
                      ? "🏆"
                      : rank === 2
                      ? "🥈"
                      : rank === 3
                      ? "🥉"
                      : `${rank}`}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://images.hive.blog/u/${skater.hive_author}/avatar/small`}
                      alt={`${skater.hive_author} avatar`}
                      className="w-12 h-12 rounded-full border-2 border-green-400/50 object-cover"
                      onError={(e) => {
                        // Fallback to initial if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-black text-lg font-bold hidden">
                      {skater.hive_author.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-green-400 font-bold text-lg">
                        {skater.hive_author}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Last post: {getTimeSince(skater.last_post)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats - Right side with much better spacing */}
                <div className="flex items-center gap-16 text-center">
                  <div className="min-w-20">
                    <div className="text-yellow-400 text-xs font-semibold mb-1">
                      🏆 POINTS
                    </div>
                    <div className="text-yellow-400 font-bold text-lg">
                      {skater.points}
                    </div>
                  </div>

                  <div className="min-w-20">
                    <div className="text-green-400 text-xs font-semibold mb-1">
                      ⚡ POWER
                    </div>
                    <div className="text-green-400 font-bold text-lg">
                      {formatNumber(
                        skater.hp_balance + skater.max_voting_power_usd
                      )}
                    </div>
                  </div>

                  <div className="min-w-20">
                    <div className="text-blue-400 text-xs font-semibold mb-1">
                      💬 POSTS
                    </div>
                    <div className="text-blue-400 font-bold text-lg">
                      {skater.post_count}
                    </div>
                  </div>

                  <div className="min-w-20">
                    <div className="text-purple-400 text-xs font-semibold mb-1">
                      🎨 NFTs
                    </div>
                    <div className="text-purple-400 font-bold text-lg">
                      {skater.skatehive_nft_balance}
                    </div>
                  </div>

                  <div className="min-w-20">
                    <div className="text-orange-400 text-xs font-semibold mb-1">
                      🪙 GNARS
                    </div>
                    <div className="text-orange-400 font-bold text-lg">
                      {skater.gnars_votes}
                    </div>
                  </div>

                  <div className="min-w-20">
                    <div className="text-red-400 text-xs font-semibold mb-1">
                      ❤️ HBD
                    </div>
                    <div className="text-red-400 font-bold text-lg">
                      {formatNumber(
                        skater.hbd_balance + skater.hbd_savings_balance
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
