import { Metadata } from "next";
import { fetchAuctionByTokenId } from "@/services/auction";
import { formatEther } from "viem";
import { AuctionPageClient } from "@/components/auction";

interface PageProps {
  params: Promise<{
    tokenId: string;
  }>;
}

// Generate metadata for specific auction token pages
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { tokenId: tokenIdParam } = await params;
    const tokenId = Number(tokenIdParam);
    const auction = await fetchAuctionByTokenId(tokenId);

    if (!auction) {
      return {
        title: `Auction #${tokenId} - Not Found`,
        description: `Auction for token #${tokenId} was not found on SkateHive.`,
      };
    }

    const tokenName = auction.token.name;
    const tokenImage = auction.token.image;
    const currentBid = auction.highestBid
      ? Number(formatEther(BigInt(auction.highestBid.amount))).toLocaleString(
          undefined,
          {
            maximumFractionDigits: 5,
          }
        )
      : "0";

    const endTime = new Date(parseInt(auction.endTime) * 1000);
    const isActive = endTime.getTime() > Date.now();
    const status = isActive ? "Active" : "Ended";

    const title = `${tokenName} - SkateHive Auction`;
    const description = `${status} auction for ${tokenName}. ${
      isActive
        ? `Current bid: ${currentBid} ETH`
        : `Final bid: ${currentBid} ETH`
    }. View this unique skateboarding art NFT on SkateHive.`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skatehive.app";
    const auctionUrl = `${baseUrl}/auction/${tokenId}`;

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
            title: isActive ? "Place Bid" : "View Auction",
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
  } catch (error) {
    console.error(
      "Error generating metadata for token:",
      (await params).tokenId,
      error
    );
    return {
      title: `Auction #${(await params).tokenId} - SkateHive`,
      description:
        "View this unique skateboarding art NFT auction on SkateHive.",
    };
  }
}

export default async function AuctionTokenPage({ params }: PageProps) {
  const { tokenId } = await params;
  const tokenIdNumber = Number(tokenId);

  // Validate that tokenId is a valid number
  if (isNaN(tokenIdNumber) || tokenIdNumber <= 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Invalid Token ID</h1>
        <p>The token ID &quot;{tokenId}&quot; is not a valid number.</p>
      </div>
    );
  }

  return <AuctionPageClient tokenId={tokenIdNumber} showNavigation={true} />;
}
