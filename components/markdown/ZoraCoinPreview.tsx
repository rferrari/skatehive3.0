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
import ZoraTradingModal from "./ZoraTradingModal";
import { CgArrowsExchange } from "react-icons/cg";

interface ZoraCoinPreviewProps {
  address: string;
}

interface TokenData {
  name?: string;
  symbol?: string;
  image?: string;
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

    async function fetchCoinData() {
      try {
        setLoading(true);

        const response = await getCoin({
          address: address as Address,
          chain: base.id, // Default to Base chain since most Zora coins are on Base
        });

        const coin = response.data?.zora20Token;

        if (!ignore && coin) {
          setToken({
            name: coin.name,
            symbol: coin.symbol,
            image:
              coin.mediaContent?.previewImage?.medium ||
              coin.mediaContent?.previewImage?.small,
            price: undefined, // Price might not be directly available in this response
            marketCap: coin.marketCap,
            volume24h: coin.volume24h,
            description: coin.description,
            totalSupply: coin.totalSupply,
            uniqueHolders: coin.uniqueHolders,
          });
        }
      } catch (error) {
        console.error("Error fetching coin data:", error);
        // Silently fail for preview components
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchCoinData();

    return () => {
      console.log("🧹 ZoraCoinPreview cleanup for address:", address);
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
      <Box border="1px" borderColor="gray.600" borderRadius="md" p={3} my={4}>
        <Center>
          <VStack>
            {token.image && (
              <Image
                src={token.image}
                alt={token.name}
                width="full"
                borderRadius="none"
              />
            )}
            <Link
              href={`https://zora.co/coin/base:${address}`}
              isExternal
              fontWeight="bold"
            >
              {token.name || address}
            </Link>
          </VStack>
        </Center>
        <Divider my={3} />
        <HStack spacing={3} align="center">
          <Box flex={1}>
            {token.symbol && (
              <Text fontSize="sm" color="gray.400">
                {token.symbol}
                {token.marketCap && ` • MCap: ${token.marketCap}`}
                {token.uniqueHolders && ` • ${token.uniqueHolders} holders`}
              </Text>
            )}
            {token.description && (
              <Text fontSize="xs" color="gray.500" mt={1} noOfLines={2}>
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
