import {
  Box,
  HStack,
  Stack,
  Image,
  Link,
  Text,
  Button,
  useDisclosure,
  Center,
  VStack,
  Divider,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import type { Address } from "viem";
import ZoraTradingModal from "./ZoraTradingModalClient";
import VideoRenderer from "../layout/VideoRenderer";
import { convertIpfsUrl, getIpfsGatewayUrls } from "@/lib/utils/ipfsMetadata";
import { CgArrowsExchange } from "react-icons/cg";
import { FaChartLine } from "react-icons/fa";

// Debug utility that only logs in development mode
const debug = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
  }
};

const debugError = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.error(...args);
  }
};

// Component that tries multiple IPFS gateways for video loading
function IPFSVideoRenderer({ originalUrl }: { originalUrl: string }) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [gatewayUrls] = useState(() => {
    const urls = getIpfsGatewayUrls(originalUrl);
    debug("🎬 IPFSVideoRenderer - Available gateways:", urls);
    return urls;
  });

  return <VideoRenderer src={gatewayUrls[currentUrlIndex]} loop={true} />;
}

interface ZoraCoinPreviewProps {
  address: string;
}

interface TokenData {
  name?: string;
  symbol?: string;
  image?: string;
  videoUrl?: string;
  hasVideo?: boolean;
  price?: number;
  marketCap?: string;
  volume24h?: string;
  description?: string;
  totalSupply?: string;
  uniqueHolders?: number;
}

export default function ZoraCoinPreview({ address }: ZoraCoinPreviewProps) {
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    let ignore = false;

    debug("🎬 ZoraCoinPreview - Component mounted for address:", address);

    async function fetchCoinData() {
      try {
        setLoading(true);
        debug("🎬 ZoraCoinPreview - Fetching coin data for:", address);

        const response = await getCoin({
          address: address as Address,
          chain: base.id, // Default to Base chain since most Zora coins are on Base
        });

        debug("🎬 ZoraCoinPreview - Raw API response:", response);

        const coin = response.data?.zora20Token;

        if (!ignore && coin) {
          debug("🎬 ZoraCoinPreview - Coin data received:", {
            name: coin.name,
            symbol: coin.symbol,
            mediaContent: coin.mediaContent,
            address: address,
          });

          // Check for video content based on MIME type and URI
          let videoUrl: string | undefined = undefined;
          let hasVideo = false;

          if (coin.mediaContent) {
            const { mimeType, originalUri } = coin.mediaContent;

            debug("🎬 ZoraCoinPreview - Media content details:", {
              mimeType,
              originalUri,
              isVideoMimeType: mimeType && mimeType.startsWith("video/"),
            });

            // Check if the MIME type indicates video content
            if (mimeType && mimeType.startsWith("video/")) {
              videoUrl = convertIpfsUrl(originalUri);
              hasVideo = true;
              debug("✅ ZoraCoinPreview - Video detected by MIME type:", {
                originalUri,
                convertedUrl: videoUrl,
                gateway: "ipfs.io (public gateway)",
              });
            }
            // Also check URI for video file extensions as fallback
            else if (
              originalUri &&
              (originalUri.includes(".mp4") ||
                originalUri.includes(".webm") ||
                originalUri.includes(".mov") ||
                originalUri.includes(".avi"))
            ) {
              videoUrl = convertIpfsUrl(originalUri);
              hasVideo = true;
              debug("✅ ZoraCoinPreview - Video detected by file extension:", {
                originalUri,
                convertedUrl: videoUrl,
                gateway: "ipfs.io (public gateway)",
              });
            } else {
              debug("❌ ZoraCoinPreview - No video detected:", {
                mimeType,
                originalUri,
                hasVideoExtension:
                  originalUri &&
                  (originalUri.includes(".mp4") ||
                    originalUri.includes(".webm") ||
                    originalUri.includes(".mov") ||
                    originalUri.includes(".avi")),
              });
            }
          } else {
            debug("❌ ZoraCoinPreview - No mediaContent found");
          }

          const imageUrl = coin.mediaContent?.previewImage?.medium
            ? convertIpfsUrl(coin.mediaContent.previewImage.medium)
            : coin.mediaContent?.previewImage?.small
            ? convertIpfsUrl(coin.mediaContent.previewImage.small)
            : undefined;

          debug("🎬 ZoraCoinPreview - Final token data:", {
            hasVideo,
            videoUrl,
            imageUrl,
            name: coin.name,
            symbol: coin.symbol,
            usingGateway: "ipfs.io",
          });

          setToken({
            name: coin.name,
            symbol: coin.symbol,
            image: imageUrl,
            videoUrl,
            hasVideo,
            price: undefined, // Price might not be directly available in this response
            marketCap: coin.marketCap,
            volume24h: coin.volume24h,
            description: coin.description,
            totalSupply: coin.totalSupply,
            uniqueHolders: coin.uniqueHolders,
          });
        }
      } catch (error) {
        debugError("🎬 ZoraCoinPreview - Error fetching coin data:", {
          error,
          address,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        // Silently fail for preview components
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchCoinData();

    return () => {
      ignore = true;
    };
  }, [address]);

  if (loading) {
    return (
      <Box border="1px" borderColor="gray.600" borderRadius="md" p={3} my={4}>
        <Text fontSize="sm" color="gray.400">
          Loading coin data...
        </Text>
      </Box>
    );
  }

  if (!token) return null;

  // Debug log for rendering decision
  debug("🎬 ZoraCoinPreview - Rendering decision:", {
    hasVideo: token.hasVideo,
    videoUrl: token.videoUrl,
    hasImage: !!token.image,
    imageUrl: token.image,
    tokenName: token.name,
    address: address,
  });

  return (
    <>
      <Box
        border="1px"
        borderColor="gray.600"
        borderRadius="md"
        p={3}
        my={4}
        overflow="hidden"
        wordBreak="break-word"
      >
        <Center>
          <VStack spacing={2} width="full">
            <Link
              as={NextLink}
              href={`/coin/${address}`}
              fontWeight="bold"
              textAlign="center"
              wordBreak="break-word"
              whiteSpace="normal"
              overflow="hidden"
              maxWidth="full"
            >
              {token.name || address}
            </Link>
            {token.hasVideo && token.videoUrl ? (
              <Box width="full" borderRadius="md" overflow="hidden">
                <IPFSVideoRenderer originalUrl={token.videoUrl} />
              </Box>
            ) : token.image ? (
              <Image
                src={token.image}
                alt={token.name}
                width="full"
                borderRadius="md"
              />
            ) : null}
          </VStack>
        </Center>
        <Divider my={3} />
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={3}
          align={{ base: "stretch", md: "center" }}
          width="full"
        >
          <Box flex={1} overflow="hidden">
            {token.marketCap && (
              <HStack spacing={2} align="center" flexWrap="wrap">
                <Text as="span" color="primary.400">
                  MarketCap: ${token.marketCap}
                </Text>
                <FaChartLine color="primary.400" />
                <Text as="span" color="gray.400">
                  {`• ${token.uniqueHolders} holders`}
                </Text>
              </HStack>
            )}

            {token.description && (
              <Text
                fontSize="xs"
                color="gray.500"
                mt={1}
                noOfLines={3}
                wordBreak="break-word"
                whiteSpace="normal"
              >
                {token.description}
              </Text>
            )}
          </Box>
          <Button
            leftIcon={<CgArrowsExchange />}
            colorScheme="blue"
            size="sm"
            onClick={onOpen}
            variant="solid"
            borderRadius="md"
            _hover={{ transform: "scale(1.05)" }}
            transition="all 0.2s"
            width={{ base: "full", md: "auto" }}
          >
            Trade
          </Button>
        </Stack>
      </Box>

      {/* Trading Modal */}
      <ZoraTradingModal
        isOpen={isOpen}
        onClose={onClose}
        coinAddress={address}
        coinData={{
          name: token?.name,
          symbol: token?.symbol,
          image: token?.image,
          marketCap: token?.marketCap,
          uniqueHolders: token?.uniqueHolders,
        }}
      />
    </>
  );
}
