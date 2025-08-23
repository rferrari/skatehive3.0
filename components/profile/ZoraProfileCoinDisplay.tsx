"use client";

import React, { memo } from "react";
import { Box, Text, Flex, Avatar, Spinner, Badge } from "@chakra-ui/react";
import { useZoraProfileCoin } from "@/hooks/useZoraProfileCoin";

interface ZoraProfileCoinDisplayProps {
  walletAddress: string | undefined;
  size?: "xs" | "sm" | "md" | "lg";
}

const ZoraProfileCoinDisplay = memo(function ZoraProfileCoinDisplay({
  walletAddress,
  size = "md",
}: ZoraProfileCoinDisplayProps) {
  const { profileCoin, loading, error } = useZoraProfileCoin(walletAddress);

  // Don't render anything if no wallet address
  if (!walletAddress) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Box>
        <Spinner size="xs" color="primary" />
      </Box>
    );
  }

  // Error state or no profile coin found
  if (error || !profileCoin) {
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

  const sizeConfig = {
    xs: {
      avatarSize: "2xs",
      fontSize: "2xs",
      spacing: 1,
      badgeSize: "2xs",
    },
    sm: {
      avatarSize: "xs",
      fontSize: "xs",
      spacing: 1,
      badgeSize: "xs",
    },
    md: {
      avatarSize: "sm",
      fontSize: "sm",
      spacing: 2,
      badgeSize: "sm",
    },
    lg: {
      avatarSize: "md",
      fontSize: "md",
      spacing: 3,
      badgeSize: "md",
    },
  };

  const config = sizeConfig[size];

  return (
    <Box>
      <Flex
        align="center"
        gap={config.spacing}
        p={size === "xs" ? 0.5 : size === "sm" ? 1 : 2}
        bg={size === "xs" ? "transparent" : "whiteAlpha.100"}
        borderRadius="md"
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
            ${profileCoin.symbol}
          </Text> */}

          <Badge
            bg="transparentß"
            color="white"
            fontSize={config.badgeSize}
            px={1.5}
            py={0.5}
            borderRadius="sm"
          >
            Market Cap: {formatMarketCap(profileCoin.marketCap)}
          </Badge>
        </Flex>
      </Flex>
    </Box>
  );
});

export default ZoraProfileCoinDisplay;
