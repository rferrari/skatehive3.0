"use client";

import React, { memo } from "react";
import {
  Box,
  Text,
  Flex,
  Avatar,
  Spinner,
  VStack,
  HStack,
  Link,
  Tooltip,
} from "@chakra-ui/react";
import { ZoraProfileData } from "@/hooks/useZoraProfileCoin";

interface ZoraProfileLayoutProps {
  walletAddress: string | undefined;
  username: string;
  profileData?: ZoraProfileData | null;
  loading?: boolean;
  error?: string | null;
}

const ZoraProfileLayout = memo(function ZoraProfileLayout({
  walletAddress,
  username,
  profileData,
  loading = false,
  error = null,
}: ZoraProfileLayoutProps) {
  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100px">
        <Spinner size="lg" color="primary" />
      </Flex>
    );
  }

  // Error state or no profile data found
  if (error || !profileData) {
    return (
      <Flex justify="center" align="center" minH="100px">
        <Text color="gray.400" fontSize="sm">
          No Zora profile found for this wallet
        </Text>
      </Flex>
    );
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
    <Flex
      direction="row"
      align="center"
      justify="space-between"
      w="100%"
      gap={6}
      minH="100px"
    >
      {/* Left Section: Avatar + Basic Info */}
      <Flex
        direction="row"
        align="flex-start"
        gap={4}
        flexBasis="60%"
        maxW="60%"
      >
        <Avatar
          src={profileData.avatar}
          name={profileData.displayName || profileData.handle || username}
          borderRadius="lg"
          boxSize="100px"
          border="2px solid"
          borderColor="primary"
        />

        <VStack align="flex-start" spacing={1} flex="1">
          {/* Display Name / Handle */}
          <VStack align="flex-start" spacing={0}>
            {profileData.displayName && (
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="white"
                lineHeight={1}
              >
                {profileData.displayName}
              </Text>
            )}

            <Text
              fontSize="sm"
              color="gray.400"
              fontWeight="medium"
              isTruncated
              w="100%"
            >
              {profileData.bio ? (
                <Tooltip
                  label={profileData.bio}
                  placement="top"
                  bg="gray.800"
                  color="white"
                  fontSize="sm"
                  borderRadius="md"
                  px={3}
                  py={2}
                  maxW="300px"
                  textAlign="center"
                >
                  <Text as="span" cursor="help" _hover={{ color: "primary" }}>
                    @{profileData.handle || username}
                  </Text>
                </Tooltip>
              ) : (
                <>@{profileData.handle || username}</>
              )}
            </Text>
          </VStack>

          {/* Zora Profile Link */}
          {getZoraProfileUrl(profileData.handle) && (
            <Link
              href={getZoraProfileUrl(profileData.handle)}
              isExternal
              _hover={{ textDecoration: "underline", opacity: 0.8 }}
              fontSize="sm"
              color="primary"
            >
              View on Zora
            </Link>
          )}
        </VStack>
      </Flex>

      {/* Right Section: Market Cap */}
      <VStack align="flex-end" spacing={3} maxW="40%">
        {profileData.coinData && (
          <Box>
            {getZoraProfileUrl(profileData.handle) ? (
              <Link
                href={getZoraProfileUrl(profileData.handle)}
                isExternal
                _hover={{ textDecoration: "underline", opacity: 0.8 }}
              >
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color="white"
                  lineHeight={1}
                >
                  Market Cap: {formatMarketCap(profileData.coinData.marketCap)}
                </Text>
              </Link>
            ) : (
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color="white"
                lineHeight={1}
              >
                Market Cap: {formatMarketCap(profileData.coinData.marketCap)}
              </Text>
            )}
          </Box>
        )}
      </VStack>
    </Flex>
  );
});

export default ZoraProfileLayout;
