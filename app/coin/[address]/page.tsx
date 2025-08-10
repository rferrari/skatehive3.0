import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAddress } from "viem";
import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import ZoraCoinPageClient from "./ZoraCoinPageClient";

interface PageProps {
  params: {
    address: string;
  };
}

// Server-side metadata generation
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { address } = await params;

  // Validate Ethereum address format
  if (!isAddress(address)) {
    return {
      title: "Invalid Coin Address - SkateHive",
      description: "The provided coin address is not valid.",
    };
  }

  try {
    // Fetch coin data for metadata
    const response = await getCoin({
      address: address as `0x${string}`,
      chain: base.id,
    });

    const coin = response.data?.zora20Token;

    if (!coin) {
      return {
        title: "Coin Not Found - SkateHive",
        description: "The requested coin could not be found.",
      };
    }

    const coinName = coin.name || "Unknown Coin";
    const coinSymbol = coin.symbol || "COIN";
    const description =
      coin.description || `Trade ${coinName} (${coinSymbol}) on SkateHive`;

    // Get image URL for social sharing
    let imageUrl = "/logo.png"; // Default fallback
    if (coin.mediaContent?.previewImage?.medium) {
      // Convert IPFS URL to HTTP gateway for social sharing
      const ipfsUrl = coin.mediaContent.previewImage.medium;
      if (ipfsUrl.startsWith("ipfs://")) {
        imageUrl = `https://ipfs.io/ipfs/${ipfsUrl.slice(7)}`;
      } else {
        imageUrl = ipfsUrl;
      }
    } else if (coin.mediaContent?.previewImage?.small) {
      // Fallback to small preview
      const ipfsUrl = coin.mediaContent.previewImage.small;
      if (ipfsUrl.startsWith("ipfs://")) {
        imageUrl = `https://ipfs.io/ipfs/${ipfsUrl.slice(7)}`;
      } else {
        imageUrl = ipfsUrl;
      }
    } else if (
      coin.mediaContent?.mimeType?.startsWith("image/") &&
      coin.mediaContent.originalUri
    ) {
      // Use original image if it's an image type
      const ipfsUrl = coin.mediaContent.originalUri;
      if (ipfsUrl.startsWith("ipfs://")) {
        imageUrl = `https://ipfs.io/ipfs/${ipfsUrl.slice(7)}`;
      } else {
        imageUrl = ipfsUrl;
      }
    }

    const marketCap = coin.marketCap
      ? `$${Number(coin.marketCap).toLocaleString()}`
      : "Unknown";
    const totalSupply = coin.totalSupply
      ? Number(coin.totalSupply).toLocaleString()
      : "Unknown";

    return {
      title: `${coinName} (${coinSymbol}) - Trade on SkateHive`,
      description: `${description}. Market Cap: ${marketCap}, Total Supply: ${totalSupply}`,
      openGraph: {
        title: `${coinName} (${coinSymbol})`,
        description: description,
        images: [
          {
            url: imageUrl,
            width: 400,
            height: 400,
            alt: `${coinName} logo`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${coinName} (${coinSymbol})`,
        description: description,
        images: [imageUrl],
      },
      other: {
        "fc:frame": JSON.stringify({
          version: "next",
          imageUrl: imageUrl,
          button: {
            title: "Trade Now",
            action: {
              type: "launch_frame",
              name: "Skatehive",
              url: `https://skatehive.app/coin/${address}`,
            },
          },
          postUrl: `https://skatehive.app/coin/${address}`,
        }),
        "fc:frame:image": imageUrl,
        "fc:frame:post_url": `https://skatehive.app/coin/${address}`,
      },
    };
  } catch (error) {
    // Keep minimal error logging for debugging in production
    if (process.env.NODE_ENV === "development") {
      console.error("Error generating metadata for coin:", error);
    }
    return {
      title: "Coin Trading - SkateHive",
      description: "Trade creator coins on SkateHive",
    };
  }
}

// Server component that validates and passes data to client
export default async function CoinPage({ params }: PageProps) {
  const { address } = await params;

  // Validate Ethereum address format
  if (!isAddress(address)) {
    notFound();
  }

  let coinData = null;
  let error = null;

  try {
    // Fetch initial coin data on server side
    const response = await getCoin({
      address: address as `0x${string}`,
      chain: base.id,
    });

    const coin = response.data?.zora20Token;

    if (!coin) {
      notFound();
    }

    // Prepare data for client component
    coinData = {
      address,
      name: coin.name,
      symbol: coin.symbol,
      description: coin.description,
      image:
        coin.mediaContent?.previewImage?.medium ||
        coin.mediaContent?.previewImage?.small ||
        (coin.mediaContent?.mimeType?.startsWith("image/")
          ? coin.mediaContent.originalUri
          : undefined),
      videoUrl: coin.mediaContent?.mimeType?.startsWith("video/")
        ? coin.mediaContent.originalUri
        : undefined,
      hasVideo: coin.mediaContent?.mimeType?.startsWith("video/") || false,
      marketCap: coin.marketCap,
      totalSupply: coin.totalSupply,
      uniqueHolders: coin.uniqueHolders,
      createdAt: coin.createdAt,
      creatorAddress: coin.creatorAddress,
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching coin data:", err);
    }
    error = "Failed to load coin data";
  }

  // Pass validated address and initial data to client component
  return (
    <ZoraCoinPageClient
      address={address}
      initialCoinData={coinData}
      error={error}
    />
  );
}
