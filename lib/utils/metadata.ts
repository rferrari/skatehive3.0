import { Metadata } from "next";
import { formatEther } from "viem";
import { APP_CONFIG } from "@/config/app.config";

interface AuctionMetadataProps {
  tokenName: string;
  tokenImage: string;
  currentBid: string;
  isActive: boolean;
  tokenId?: number;
}

export const DEFAULT_AUCTION_METADATA: Metadata = {
  title: "SkateHive Auction",
  description:
    "Participate in SkateHive auctions to acquire unique skateboarding art and voting rights.",
};

export const NO_AUCTION_METADATA: Metadata = {
  title: "SkateHive Auction - No Active Auction",
  description: "No active auction available at SkateHive",
};

export function generateAuctionMetadata({
  tokenName,
  tokenImage,
  currentBid,
  isActive,
  tokenId,
}: AuctionMetadataProps): Metadata {
  const status = isActive ? "Active" : "Ended";
  const bidText = isActive ? "Current bid" : "Final bid";
  
  const title = `${tokenName} - SkateHive Auction`;
  const description = tokenId 
    ? `${status} auction for ${tokenName}. ${bidText}: ${currentBid} ETH. View this unique skateboarding art NFT on SkateHive.`
    : `${status} auction for ${tokenName}. ${bidText}: ${currentBid} ETH. Participate in SkateHive auctions to acquire unique skateboarding art and voting rights.`;

  const baseUrl = APP_CONFIG.ORIGIN;
  const auctionUrl = tokenId 
    ? `${baseUrl}/auction/${tokenId}` 
    : `${baseUrl}/auction/`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: tokenImage,
          width: 600,
          height: 600,
          alt: tokenName,
        },
      ],
      type: "website",
      siteName: "SkateHive",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [tokenImage],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: tokenImage,
        button: {
          title: tokenId && isActive ? "Place Bid" : "View Auction",
          action: {
            type: "launch_frame",
            name: "Skatehive",
            url: auctionUrl,
          },
        },
        postUrl: auctionUrl,
      }),
      "fc:frame:image": tokenImage,
      "fc:frame:post_url": auctionUrl,
    },
  };
}

export function formatBidAmount(amount: bigint): string {
  return Number(formatEther(amount)).toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}
