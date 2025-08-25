"use client";
import React, { memo, useState, useEffect, useMemo } from "react";
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
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { ProfileData } from "./ProfilePage";
import {
  useZoraProfileCoin,
  ZoraProfileData,
} from "@/hooks/useZoraProfileCoin";

interface ZoraProfileHeaderProps {
  profileData: ProfileData;
  username: string;
}

const ZoraProfileHeader = function ZoraProfileHeader({
  profileData,
  username,
}: ZoraProfileHeaderProps) {
  const [cachedZoraData, setCachedZoraData] = useState<ZoraProfileData | null>(
    null
  );
  const [zoraDataFetched, setZoraDataFetched] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Reset Zora cache when identity changes
  useEffect(() => {
    setCachedZoraData(null);
    setZoraDataFetched(false);
    setAvatarLoaded(false);
  }, [username, profileData.ethereum_address]);

  // Fetch Zora data when ethereum address is available
  const {
    profileData: zoraProfileData,
    loading: zoraLoading,
    error: zoraError,
  } = useZoraProfileCoin(profileData.ethereum_address);

  // Cache the Zora data once it's loaded
  useEffect(() => {
    if (zoraProfileData && !zoraLoading && !zoraError) {
      setCachedZoraData(zoraProfileData);
      setZoraDataFetched(true);
    }
  }, [zoraProfileData, zoraLoading, zoraError]);

  // Preload avatar image to prevent flickering
  useEffect(() => {
    if (cachedZoraData?.avatar && !avatarLoaded) {
      const img = new Image();
      img.onload = () => setAvatarLoaded(true);
      img.onerror = () => setAvatarLoaded(true); // Still set to true to prevent infinite loading
      img.src = cachedZoraData.avatar;
    }
  }, [cachedZoraData?.avatar, avatarLoaded]);

  if (!profileData.ethereum_address) {
    return null;
  }

  // Helper function to format market cap - memoized
  const formatMarketCap = useMemo(() => {
    return (marketCap: string | undefined): string => {
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
  }, []);

  // Helper function to generate Zora profile URL - memoized
  const getZoraProfileUrl = useMemo(() => {
    return (handle: string | undefined): string | undefined => {
      if (!handle) return undefined;
      return `https://zora.co/@${handle}`;
    };
  }, []);

  // Memoize the formatted market cap value
  const formattedMarketCap = useMemo(() => {
    if (!cachedZoraData?.coinData?.marketCap) return "N/A";

    const num = parseFloat(cachedZoraData.coinData.marketCap);
    if (isNaN(num)) return "N/A";

    // Only format if over 1 million, otherwise show full amount
    if (num >= 1000000) {
      return formatMarketCap(cachedZoraData.coinData.marketCap);
    } else {
      return `$${num.toFixed(2)}`;
    }
  }, [cachedZoraData?.coinData?.marketCap, formatMarketCap]);

  // Memoize the Zora profile URL
  const zoraProfileUrl = useMemo(() => {
    return getZoraProfileUrl(cachedZoraData?.handle);
  }, [cachedZoraData?.handle, getZoraProfileUrl]);

  // Calculate market cap percentage change - memoized
  const marketCapChange = useMemo(() => {
    if (
      !cachedZoraData?.coinData?.marketCap ||
      !cachedZoraData?.coinData?.marketCapDelta24h
    ) {
      return { percentage: 0, isPositive: false, display: "0.00%" };
    }

    const currentMarketCap = parseFloat(cachedZoraData.coinData.marketCap);
    const delta24h = parseFloat(cachedZoraData.coinData.marketCapDelta24h);

    if (isNaN(currentMarketCap) || isNaN(delta24h)) {
      return { percentage: 0, isPositive: false, display: "0.00%" };
    }

    // Calculate the previous market cap (current - delta)
    const previousMarketCap = currentMarketCap - delta24h;

    if (previousMarketCap === 0 || previousMarketCap < 0) {
      return { percentage: 0, isPositive: false, display: "0.00%" };
    }

    // Calculate percentage change: (delta / previous) * 100
    const percentageChange = (delta24h / previousMarketCap) * 100;
    const isPositive = delta24h >= 0;
    const display = `${isPositive ? "+" : ""}${percentageChange.toFixed(2)}%`;

    return { percentage: percentageChange, isPositive, display };
  }, [
    cachedZoraData?.coinData?.marketCap,
    cachedZoraData?.coinData?.marketCapDelta24h,
  ]);

  // Loading state
  if (zoraLoading) {
    return (
      <Box w="100%">
        <Flex justify="center" align="center" minH="100px">
          <Spinner size="lg" color="primary" />
        </Flex>
      </Box>
    );
  }

  // Error state or no profile data found
  if (zoraError || !cachedZoraData) {
    return (
      <Box w="100%">
        <Flex justify="center" align="center" minH="100px">
          <Text color="gray.400" fontSize="sm">
            No Zora profile found for this wallet
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Grid
        templateColumns="100px 1fr auto"
        templateRows="auto auto auto"
        gap={4}
        minH="100px"
        w="100%"
        alignItems="start"
      >
        {/* Avatar - spans all rows in first column */}
        <GridItem rowSpan={3} colStart={1}>
          <Avatar
            src={cachedZoraData.avatar}
            name={
              cachedZoraData.displayName || cachedZoraData.handle || username
            }
            borderRadius="lg"
            boxSize="100px"
            border="2px solid"
            borderColor="primary"
          />
        </GridItem>

        {/* Display Name - top row, middle column */}
        <GridItem colStart={2} rowStart={1}>
          {cachedZoraData.displayName && (
            <Text fontSize="xl" fontWeight="bold" color="white" lineHeight={1}>
              {cachedZoraData.displayName}
            </Text>
          )}
        </GridItem>

        {/* Market Cap - top row, right column */}
        <GridItem colStart={3} rowStart={1}>
          {cachedZoraData.coinData && (
            <VStack align="flex-end" spacing={1}>
              {zoraProfileUrl ? (
                <Link
                  href={zoraProfileUrl}
                  isExternal
                  _hover={{ textDecoration: "underline", opacity: 0.8 }}
                >
                  <Text
                    fontSize="32px"
                    fontWeight="bold"
                    color="primary"
                    lineHeight={1}
                    textAlign="right"
                  >
                    {formattedMarketCap}
                  </Text>
                </Link>
              ) : (
                <Text
                  fontSize="32px"
                  fontWeight="bold"
                  color="primary"
                  lineHeight={1}
                  textAlign="right"
                >
                  {formattedMarketCap}
                </Text>
              )}

              {/* 24h Percentage Change */}
              {marketCapChange.display !== "0.00%" && (
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color={marketCapChange.isPositive ? "green.400" : "red.400"}
                  textAlign="right"
                  lineHeight={1}
                >
                  {marketCapChange.display} (24h)
                </Text>
              )}
            </VStack>
          )}
        </GridItem>

        {/* Handle/Username - second row, middle column */}
        <GridItem colStart={2} rowStart={2}>
          <Text
            fontSize="sm"
            color="gray.400"
            fontWeight="medium"
            isTruncated
            w="100%"
          >
            {cachedZoraData.bio ? (
              <Tooltip
                label={cachedZoraData.bio}
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
                  @{cachedZoraData.handle || username}
                </Text>
              </Tooltip>
            ) : (
              <>@{cachedZoraData.handle || username}</>
            )}
          </Text>
        </GridItem>
      </Grid>
    </Box>
  );
};

// Add proper memo comparison function
export default memo(ZoraProfileHeader, (prevProps, nextProps) => {
  return (
    prevProps.username === nextProps.username &&
    prevProps.profileData.ethereum_address ===
      nextProps.profileData.ethereum_address
  );
});
