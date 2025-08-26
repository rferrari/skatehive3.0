"use client";
import React, { memo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardBody,
  Image,
  Text,
  Badge,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { ZoraCoin } from "@/hooks/useZoraProfileTokens";
import { formatNumber, formatTokenName } from "@/lib/zora-utils";

interface ZoraCoinCardProps {
  coin: ZoraCoin;
}

const ZoraCoinCard = memo(function ZoraCoinCard({ coin }: ZoraCoinCardProps) {
  const router = useRouter();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textPrimary = useColorModeValue("gray.900", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.400");

  const handleCardClick = () => {
    router.push(`/coin/${coin.address}`);
  };

  const formatPercentage = (value: string | undefined) => {
    if (!value) return null;
    const num = parseFloat(value);
    const isPositive = num >= 0;
    return (
      <Text
        fontSize="xs"
        color={isPositive ? "green.400" : "red.400"}
        fontWeight="semibold"
      >
        {isPositive ? "+" : ""}
        {num.toFixed(1)}%
      </Text>
    );
  };

  // Get image source with fallback
  const imageSource =
    coin.mediaContent?.previewImage?.medium ||
    coin.mediaContent?.previewImage?.small ||
    coin.mediaContent?.originalUri ||
    "/logos/zora.svg";

  return (
    <Card
      bg={"background"}
      border="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      _hover={{
        transform: "translateY(-4px)",
        shadow: "xl",
        borderColor: "primary.400",
      }}
      transition="all 0.3s ease"
      cursor="pointer"
      h="100%"
      minH="340px"
      onClick={handleCardClick}
    >
      {/* Full-width image */}
      <Box position="relative" w="100%" h="180px">
        <Image
          src={imageSource}
          alt={coin.name}
          w="100%"
          h="100%"
          objectFit="cover"
          fallbackSrc="/logos/zora.svg"
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)"
        />
      </Box>

      <CardBody p={4}>
        <VStack align="stretch" spacing={3}>
          {/* Token Info */}
          <VStack align="center" spacing={2}>
            <Text
              fontWeight="bold"
              fontSize="lg"
              textAlign="center"
              color={textPrimary}
              noOfLines={2}
            >
              {formatTokenName(coin.name)}
            </Text>
            <Badge colorScheme="primary" size="md" variant="subtle">
              {coin.symbol}
            </Badge>
          </VStack>

          {/* Stats */}
          <HStack justify="space-between" spacing={4}>
            <VStack align="center" spacing={1} flex={1}>
              <Text fontSize="xs" color={textSecondary} fontWeight="medium">
                Market Cap
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="primary.500">
                ${formatNumber(coin.marketCap)}
              </Text>
              {formatPercentage(coin.marketCapDelta24h)}
            </VStack>
            <VStack align="center" spacing={1} flex={1}>
              <Text fontSize="xs" color={textSecondary} fontWeight="medium">
                Holders
              </Text>
              <Text fontSize="sm" fontWeight="bold" color={textPrimary}>
                {formatNumber(coin.uniqueHolders.toString())}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
});

export default ZoraCoinCard;
