"use client";

import React from "react";
import { Box, Grid, Text } from "@chakra-ui/react";
import { formatCurrency } from "@/lib/utils/coin/formatters";
import { CoinData } from "@/types/coin";

interface CoinStatsProps {
  coinData: CoinData;
}

export const CoinStats: React.FC<CoinStatsProps> = ({ coinData }) => {
  return (
    <Box
      w="100%"
      p={{ base: 3, md: 4 }}
      borderBottom="1px solid"
      borderColor="gray.700"
    >
      <Grid
        templateColumns={{
          base: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
        }}
        gap={{ base: 3, md: 2 }}
        textAlign="center"
      >
        <Box>
          <Text fontSize="xs" color="gray.400" mb={1}>
            Market Cap
          </Text>
          <Text fontSize="xs" fontWeight="bold" color="green.400">
            {formatCurrency(coinData.marketCap)}
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.400" mb={1}>
            24h Volume
          </Text>
          <Text fontSize="xs" fontWeight="bold">
            {formatCurrency(coinData.volume24h)}
          </Text>
        </Box>
        <Box gridColumn={{ base: "span 2", sm: "span 1" }}>
          <Text fontSize="xs" color="gray.400" mb={1}>
            Creator Earnings
          </Text>
          <Text fontSize="xs" fontWeight="bold">
            {(() => {
              if (!coinData.volume24h) return "$0.00";
              try {
                const volumeNum = parseFloat(coinData.volume24h.toString());
                const earnings = volumeNum * 0.05; // 5% creator fee
                return formatCurrency(earnings.toString());
              } catch {
                return "$0.00";
              }
            })()}
          </Text>
        </Box>
      </Grid>
    </Box>
  );
};
