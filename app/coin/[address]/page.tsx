import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Address, isAddress } from "viem";
import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { createPublicClient, http } from "viem";
import ZoraCoinPageClient from "./ZoraCoinPageClient";
import { APP_CONFIG } from "@/config/app.config";

interface PageProps {
  params: {
    address: string;
  };
}

// Contract ABI for contractURI function
const ERC20_ABI = [
  {
    name: "contractURI",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

// Helper function to fetch and parse contract metadata
async function fetchContractMetadata(address: string) {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Read contract URI
    const contractURI = await client.readContract({
      address: address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "contractURI",
    });

    if (!contractURI) {
      return null;
    }

    // Handle IPFS URLs
    let metadataUrl = contractURI;
    if (contractURI.startsWith("ipfs://")) {
      metadataUrl = `https://ipfs.io/ipfs/${contractURI.slice(7)}`;
    }

    // Fetch metadata
    const response = await fetch(metadataUrl, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }

    // Check content length to prevent large responses
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      // 5MB limit
      console.error("Metadata response too large:", contentLength);
      return null;
    }
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error("Error fetching contract metadata:", error);
    return null;
  }
}

// Helper function to determine coin type based on metadata
function determineCoinType(metadata: any): "media" | "markdown" | "carousel" {
  if (!metadata) {
    return "media"; // Default to media coin
  }

  // Check if it's a markdown coin
  if (
    metadata.properties?.content_type === "longform-post" &&
    metadata.properties?.skatehive_post === "true" &&
    metadata.properties?.markdown_ipfs
  ) {
    return "markdown";
  }

  // Check if it's a carousel coin (but not markdown)
  if (
    metadata.content?.type === "CAROUSEL" &&
    metadata.content?.carousel?.media &&
    !metadata.properties?.markdown_ipfs
  ) {
    return "carousel";
  }

  // Default to media coin
  return "media";
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
              url: `${APP_CONFIG.BASE_URL}/coin/${address}`,
            },
          },
          postUrl: `${APP_CONFIG.BASE_URL}/coin/${address}`,
        }),
        "fc:frame:image": imageUrl,
        "fc:frame:post_url": `${APP_CONFIG.BASE_URL}/coin/${address}`,
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
      address: address as Address,
      chain: base.id,
    });

    const coin = response.data?.zora20Token;

    if (!coin) {
      notFound();
    }

    // Try to fetch token metadata from tokenUri first, fallback to contract if needed
    let contractMetadata = null;
    if (coin.tokenUri) {
      try {
        let metadataUrl = coin.tokenUri;
        if (coin.tokenUri.startsWith("ipfs://")) {
            metadataUrl = coin.tokenUri.replace(
              "ipfs://",
              `https://${APP_CONFIG.IPFS_GATEWAY}/ipfs/`
            );

        }

        const response = await fetch(metadataUrl);
        if (response.ok) {
          contractMetadata = await response.json();
        }
      } catch (error) {
        console.log("Failed to fetch from tokenUri, trying contract call...");
        // Fallback to contract call
        contractMetadata = await fetchContractMetadata(address);
      }
    }

    const coinType = determineCoinType(contractMetadata);

    console.log("Coin:", coin);
    console.log("Contract metadata:", contractMetadata);
    console.log("Determined coin type:", coinType);

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
      videoUrl:
        // First check for animation_url in contract metadata
        contractMetadata?.animation_url
            ? contractMetadata.animation_url.startsWith("ipfs://")
              ? contractMetadata.animation_url.replace(
                  "ipfs://",
                  `https://${APP_CONFIG.IPFS_GATEWAY}/ipfs/`
                )
              : contractMetadata.animation_url

          : // Then check mediaContent for videos
          coin.mediaContent?.mimeType?.startsWith("video/")
          ? coin.mediaContent.originalUri
          : undefined,
      hasVideo:
        // Has video if animation_url exists or if mediaContent is video
        Boolean(contractMetadata?.animation_url) ||
        Boolean(coin.mediaContent?.mimeType?.startsWith("video/")),
      marketCap: coin.marketCap,
      totalSupply: coin.totalSupply,
      uniqueHolders: coin.uniqueHolders,
      createdAt: coin.createdAt,
      creatorAddress: coin.creatorAddress,
      volume24h: coin.volume24h,
      blurDataURL: coin.mediaContent?.previewImage?.small, // Use small image as blur placeholder
      creatorProfile: coin.creatorProfile
        ? {
            handle: coin.creatorProfile.handle,
            avatar: coin.creatorProfile.avatar
              ? {
                  previewImage: {
                    small: coin.creatorProfile.avatar.previewImage?.small,
                    medium: coin.creatorProfile.avatar.previewImage?.medium,
                  },
                }
              : undefined,
          }
        : undefined,
      // Add new fields for different coin types
      coinType,
      contractMetadata,
      markdownIpfs: contractMetadata?.properties?.markdown_ipfs,
      carouselMedia: contractMetadata?.content?.carousel?.media,
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
