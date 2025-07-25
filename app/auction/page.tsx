import { Metadata } from "next";
import { fetchAuction } from "@/services/auction";
import { DAO_ADDRESSES } from "@/lib/utils/constants";
import { formatEther } from "viem";
import { AuctionPageClient } from "@/components/auction";

// Generate metadata for the main auction page
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch the latest auction for metadata
    const auctions = await fetchAuction(DAO_ADDRESSES.token);
    const latestAuction = auctions[0];

    if (!latestAuction) {
      return {
        title: "SkateHive Auction - No Active Auction",
        description: "No active auction available at SkateHive",
      };
    }

    const tokenId = latestAuction.token.tokenId;
    const tokenName = latestAuction.token.name;
    const tokenImage = latestAuction.token.image;
    const currentBid = latestAuction.highestBid
      ? Number(
          formatEther(BigInt(latestAuction.highestBid.amount))
        ).toLocaleString(undefined, {
          maximumFractionDigits: 5,
        })
      : "0";

    const endTime = new Date(parseInt(latestAuction.endTime) * 1000);
    const isActive = endTime.getTime() > Date.now();
    const status = isActive ? "Active" : "Ended";

    const title = `${tokenName} - SkateHive Auction`;
    const description = `${status} auction for ${tokenName}. Current bid: ${currentBid} ETH. Participate in SkateHive auctions to acquire unique skateboarding art and voting rights.`;

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
            title: "Collect Art",
            action: {
              type: "launch_frame",
              name: "Skatehive",
              url: `${
                process.env.NEXT_PUBLIC_APP_URL || "https://skatehive.app"
              }/auction/`,
            },
          },
          postUrl: `${
            process.env.NEXT_PUBLIC_APP_URL || "https://skatehive.app"
          }/auction`,
        }),
        "fc:frame:image": tokenImage,
        "fc:frame:post_url": `${
          process.env.NEXT_PUBLIC_APP_URL || "https://skatehive.app"
        }/auction/`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "SkateHive Auction",
      description:
        "Participate in SkateHive auctions to acquire unique skateboarding art and voting rights.",
    };
  }
}

export default function MainAuctionPage() {
  return <AuctionPageClient showNavigation={true} />;
}
