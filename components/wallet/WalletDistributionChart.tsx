"use client";
import React, { useMemo } from "react";
import { Box, Text, VStack, HStack, Badge } from "@chakra-ui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatValue } from "../../lib/utils/portfolioUtils";
import { useTheme } from "@/app/themeProvider";

interface WalletData {
  name: string;
  value: number;
  address?: string;
  color: string;
  percentage: number;
}

interface WalletDistributionChartProps {
  ethPortfolio?: number;
  farcasterPortfolio?: number;
  farcasterVerifiedPortfolios: Record<string, any>;
  hiveValue?: number;
  farcasterProfile?: any;
  connectedEthAddress?: string;
}

export function WalletDistributionChart({
  ethPortfolio = 0,
  farcasterPortfolio = 0,
  farcasterVerifiedPortfolios = {},
  hiveValue = 0,
  farcasterProfile,
  connectedEthAddress,
}: WalletDistributionChartProps) {
  const { theme } = useTheme();

  // Use theme colors for chart segments
  const THEME_COLORS = [
    theme.colors.primary,
    theme.colors.accent,
    theme.colors.success || theme.colors.secondary,
    theme.colors.warning || theme.colors.border,
    theme.colors.text,
    theme.colors.muted,
    theme.colors.background,
    theme.colors.error,
  ].filter(Boolean);

  const chartData = useMemo(() => {
    const data: WalletData[] = [];
    const verifiedWalletValues = Object.values(farcasterVerifiedPortfolios).map(
      (p) => p?.totalNetWorth || 0
    );
    const totalValue =
      ethPortfolio +
      farcasterPortfolio +
      hiveValue +
      verifiedWalletValues.reduce((sum, val) => sum + val, 0);

    if (totalValue === 0) return [];

    if (ethPortfolio > 0) {
      const percentage = (ethPortfolio / totalValue) * 100;
      data.push({
        name:
          connectedEthAddress &&
          farcasterProfile?.custody?.toLowerCase() ===
            connectedEthAddress?.toLowerCase()
            ? "Ethereum (Farcaster Connected)"
            : "Ethereum Wallet",
        value: ethPortfolio,
        address: connectedEthAddress,
        color: THEME_COLORS[0],
        percentage,
      });
    }

    if (farcasterPortfolio > 0) {
      const percentage = (farcasterPortfolio / totalValue) * 100;
      data.push({
        name: "Farcaster Custody",
        value: farcasterPortfolio,
        address: farcasterProfile?.custody,
        color: THEME_COLORS[1 % THEME_COLORS.length],
        percentage,
      });
    }
    if (hiveValue > 0) {
      const percentage = (hiveValue / totalValue) * 100;
      data.push({
        name: "Hive Blockchain",
        value: hiveValue,
        color: THEME_COLORS[2 % THEME_COLORS.length],
        percentage,
      });
    }
    let farcasterColorIndex = 3;
    Object.entries(farcasterVerifiedPortfolios).forEach(
      ([address, portfolio], index) => {
        const value = portfolio?.totalNetWorth || 0;
        if (value > 0) {
          const percentage = (value / totalValue) * 100;
          data.push({
            name: `Verified Wallet ${index + 1}`,
            value,
            address,
            color: THEME_COLORS[farcasterColorIndex % THEME_COLORS.length],
            percentage,
          });
          farcasterColorIndex++;
        }
      }
    );
    return data.sort((a, b) => b.value - a.value);
  }, [
    ethPortfolio,
    farcasterVerifiedPortfolios,
    hiveValue,
    farcasterProfile,
    connectedEthAddress,
    THEME_COLORS,
  ]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          bg={theme.colors.background}
          p={3}
          borderRadius="md"
          border="1px solid"
          borderColor={theme.colors.border}
          boxShadow="2xl"
          zIndex={1000}
          position="relative"
          minW="200px"
        >
          <VStack spacing={1} align="stretch">
            <Text fontSize="sm" fontWeight="bold" color={theme.colors.text}>
              {data.name}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={theme.colors.primary}>
              {formatValue(data.value)}
            </Text>
            <Text fontSize="xs" color={theme.colors.muted}>
              {data.percentage.toFixed(1)}% of portfolio
            </Text>
            {data.address && (
              <Text fontSize="xs" color={theme.colors.accent} fontFamily="mono">
                {data.address.slice(0, 6)}...{data.address.slice(-4)}
              </Text>
            )}
          </VStack>
        </Box>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    return (
      <VStack spacing={2} align="stretch" mt={4}>
        {payload?.map((entry: any, index: number) => (
          <HStack key={index} spacing={3} justify="space-between">
            <HStack spacing={2}>
              <Box w="12px" h="12px" borderRadius="sm" bg={entry.color} />
              <Text fontSize="sm" color={theme.colors.text} noOfLines={1}>
                {entry.value}
              </Text>
            </HStack>
            <Badge
              bg={entry.color}
              color={theme.colors.background}
              fontSize="xs"
              variant="solid"
            >
              {entry.payload.percentage.toFixed(1)}%
            </Badge>
          </HStack>
        ))}
      </VStack>
    );
  };

  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color={theme.colors.muted}>No wallet data available</Text>
      </Box>
    );
  }

  return (
    <Box overflow="visible" position="relative">
      <Text
        fontSize="lg"
        fontWeight="bold"
        color={theme.colors.primary}
        textAlign="center"
        mb={4}
      >
        Portfolio Distribution
      </Text>

      <Box h="300px" mb={4} position="relative" overflow="visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{
                zIndex: 1000,
                outline: "none",
                pointerEvents: "none",
              }}
              allowEscapeViewBox={{ x: true, y: true }}
              offset={10}
              cursor={{ fill: "transparent" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text showing total value */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          pointerEvents="none"
        >
          <Text fontSize="xs" color={theme.colors.muted} mb={1}>
            Total Value
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={theme.colors.primary}>
            {formatValue(totalValue)}
          </Text>
        </Box>
      </Box>

      <CustomLegend
        payload={chartData.map((item) => ({
          value: item.name,
          color: item.color,
          payload: item,
        }))}
      />
    </Box>
  );
}
