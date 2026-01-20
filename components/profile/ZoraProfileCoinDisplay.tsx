"use client";

import React, { memo } from "react";
import { Box, Text, Flex, Spinner, Link } from "@chakra-ui/react";
import {
  useZoraProfileCoin,
  ZoraProfileData,
} from "@/hooks/useZoraProfileCoin";

interface ZoraProfileCoinDisplayProps {
  walletAddress: string | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  // Optional cached data to avoid refetching
  cachedProfileData?: ZoraProfileData | null;
  cachedLoading?: boolean;
  cachedError?: string | null;
}

const ZoraProfileCoinDisplay = memo(function ZoraProfileCoinDisplay({
  walletAddress,
  size = "md",
  cachedProfileData,
  cachedLoading,
  cachedError,
}: ZoraProfileCoinDisplayProps) {
  // Use cached data if provided, otherwise fetch fresh data
  const shouldFetch = !cachedProfileData && !cachedLoading;
  const { profileCoin, loading, error } = useZoraProfileCoin(
    shouldFetch ? walletAddress : undefined
  );

  // Determine which data to use
  const finalProfileCoin = cachedProfileData?.coinData || profileCoin;
  const finalLoading = cachedLoading ?? loading;
  const finalError = cachedError ?? error;

  // Don't render anything if no wallet address
  if (!walletAddress) {
    return null;
  }

  // Loading state
  if (finalLoading) {
    return (
      <Box>
        <Spinner size="xs" color="primary" />
      </Box>
    );
  }

  // Error state or no profile coin found
  if (finalError || !finalProfileCoin) {
    return null;
  }

  // Helper function to format market cap
  const formatMarketCap = (marketCap: string | undefined): string => {
    if (!marketCap) return "N/A";

    const num = parseFloat(marketCap);
    if (isNaN(num)) return "N/A";

    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else if (num >= 1) {
      return `$${num.toFixed(2)}`;
    } else {
      return `$${num.toFixed(4)}`;
    }
  };

  // Helper function to generate Zora profile URL
  const getZoraProfileUrl = (
    handle: string | undefined
  ): string | undefined => {
    if (!handle) return undefined;
    return `https://zora.co/@${handle}`;
  };

  return (
    <Box>
      <Flex
        align="center"
        p={size === "xs" ? 0.5 : size === "sm" ? 1 : 2}
        bg={size === "xs" ? "transparent" : "whiteAlpha.100"}
        borderRadius="none"
        border={size === "xs" ? "none" : "1px solid"}
        borderColor={size === "xs" ? "transparent" : "whiteAlpha.200"}
      >
        {/* Coin Avatar */}
        {/* {profileCoin.image && (
          <Avatar
            src={profileCoin.image}
            name={profileCoin.symbol}
            size={config.avatarSize}
            bg="transparent"
          />
        )} */}

        {/* Coin Info */}
        <Flex direction="column" gap={0.5}>
          {/* <Text
            fontSize={config.fontSize}
            fontWeight="bold"
            color="white"
            lineHeight={1}
          >
            ${finalProfileCoin.symbol}
          </Text> */}

          {getZoraProfileUrl(finalProfileCoin.handle) ? (
            <Link
              href={getZoraProfileUrl(finalProfileCoin.handle)}
              isExternal
              _hover={{ textDecoration: "underline", opacity: 0.8 }}
            >
              <Text
                fontSize={"2xl"}
                fontWeight="bold"
                color="white"
                lineHeight={1}
              >
                Market Cap: {formatMarketCap(finalProfileCoin.marketCap)}
              </Text>
            </Link>
          ) : (
            <Text
              fontSize={"2xl"}
              fontWeight="bold"
              color="white"
              lineHeight={1}
            >
              Market Cap: {formatMarketCap(finalProfileCoin.marketCap)}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
});

export default ZoraProfileCoinDisplay;
