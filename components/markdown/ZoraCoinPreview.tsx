import {
  Box,
  HStack,
  Image,
  Link,
  Text,
  Button,
  useDisclosure,
  Center,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import type { Address } from "viem";
import ZoraTradingModal from "./ZoraTradingModalClient";
import VideoRenderer from "../layout/VideoRenderer";
import { convertIpfsUrl } from "@/lib/utils/ipfsMetadata";
import { CgArrowsExchange } from "react-icons/cg";

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

    console.log("🎬 ZoraCoinPreview - Component mounted for address:", address);

    async function fetchCoinData() {
      try {
        setLoading(true);
        console.log("🎬 ZoraCoinPreview - Fetching coin data for:", address);

        const response = await getCoin({
          address: address as Address,
          chain: base.id, // Default to Base chain since most Zora coins are on Base
        });

        console.log("🎬 ZoraCoinPreview - Raw API response:", response);

        const coin = response.data?.zora20Token;

        if (!ignore && coin) {
          console.log("🎬 ZoraCoinPreview - Coin data received:", {
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

            console.log("🎬 ZoraCoinPreview - Media content details:", {
              mimeType,
              originalUri,
              isVideoMimeType: mimeType && mimeType.startsWith("video/"),
            });

            // Check if the MIME type indicates video content
            if (mimeType && mimeType.startsWith("video/")) {
              videoUrl = convertIpfsUrl(originalUri);
              hasVideo = true;
              console.log("✅ ZoraCoinPreview - Video detected by MIME type:", {
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
              console.log(
                "✅ ZoraCoinPreview - Video detected by file extension:",
                {
                  originalUri,
                  convertedUrl: videoUrl,
                  gateway: "ipfs.io (public gateway)",
                }
              );
            } else {
              console.log("❌ ZoraCoinPreview - No video detected:", {
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
            console.log("❌ ZoraCoinPreview - No mediaContent found");
          }

          const imageUrl = coin.mediaContent?.previewImage?.medium
            ? convertIpfsUrl(coin.mediaContent.previewImage.medium)
            : coin.mediaContent?.previewImage?.small
            ? convertIpfsUrl(coin.mediaContent.previewImage.small)
            : undefined;

          console.log("🎬 ZoraCoinPreview - Final token data:", {
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
        console.error("🎬 ZoraCoinPreview - Error fetching coin data:", {
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
            {token.hasVideo && token.videoUrl ? (
              <>
                {console.log(
                  "🎬 ZoraCoinPreview - Rendering Video with gateway fallback for:",
                  token.videoUrl
                )}
                <Box width="full" borderRadius="md" overflow="hidden">
                  <VideoRenderer src={convertIpfsUrl(token.videoUrl)} />
                </Box>
              </>
            ) : token.image ? (
              <>
                {console.log(
                  "🎬 ZoraCoinPreview - Rendering Image with:",
                  token.image
                )}
                <Image
                  src={token.image}
                  alt={token.name}
                  width="full"
                  borderRadius="md"
                />
              </>
            ) : (
              <>{console.log("🎬 ZoraCoinPreview - No media to render")}</>
            )}
            <Link
              href={`https://zora.co/coin/base:${address}`}
              isExternal
              fontWeight="bold"
              textAlign="center"
              wordBreak="break-word"
              whiteSpace="normal"
              overflow="hidden"
              maxWidth="full"
            >
              {token.name || address}
            </Link>
          </VStack>
        </Center>
        <Divider my={3} />
        <HStack spacing={3} align="center" width="full">
          <Box flex={1} overflow="hidden">
            {token.symbol && (
              <Text
                fontSize="sm"
                color="gray.400"
                wordBreak="break-word"
                whiteSpace="normal"
              >
                {token.symbol}
                {token.marketCap && ` • MCap: ${token.marketCap}`}
                {token.uniqueHolders && ` • ${token.uniqueHolders} holders`}
              </Text>
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
          >
            Trade
          </Button>
        </HStack>
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
