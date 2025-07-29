import { Box, HStack, Image, Link, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface ZoraCoinPreviewProps {
  address: string;
}

interface TokenData {
  name?: string;
  symbol?: string;
  image?: string;
  price?: number;
}

export default function ZoraCoinPreview({ address }: ZoraCoinPreviewProps) {
  const [token, setToken] = useState<TokenData | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const res = await fetch(
          `https://api.zora.co/api/v0/token/metadata?contractAddress=${address}`,
          {
            headers: {
              "Accept": "application/json",
              "X-API-KEY": process.env.NEXT_PUBLIC_ZORA_API_KEY || "",
            },
          }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!ignore) {
          setToken({
            name: json?.token?.name,
            symbol: json?.token?.symbol,
            image: json?.token?.image,
            price: json?.token?.lastPriceEth,
          });
        }
      } catch {
        // ignore errors in preview
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [address]);

  if (!token) return null;

  return (
    <Box
      border="1px"
      borderColor="gray.600"
      borderRadius="md"
      p={3}
      my={4}
    >
      <HStack spacing={3} align="center">
        {token.image && (
          <Image src={token.image} alt={token.name} boxSize="40px" borderRadius="full" />
        )}
        <Box>
          <Link href={`https://zora.co/coin/${address}`} isExternal fontWeight="bold">
            {token.name || address}
          </Link>
          {token.symbol && (
            <Text fontSize="sm" color="gray.400">
              {token.symbol} {token.price ? `- ${token.price} ETH` : ""}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
}

