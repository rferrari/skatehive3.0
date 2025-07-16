'use client';
import React, { useMemo } from 'react';
import { Box, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatValue } from '../../lib/utils/portfolioUtils';

interface WalletData {
    name: string;
    value: number;
    address?: string;
    color: string;
    percentage: number;
}

interface WalletDistributionChartProps {
    ethPortfolio?: number;
    farcasterVerifiedPortfolios: Record<string, any>;
    hiveValue?: number;
    farcasterProfile?: any;
    connectedEthAddress?: string;
}

const COLORS = [
    '#3182ce', // Ethereum blue
    '#e53e3e', // Hive red
    '#805ad5', // Farcaster purple 1 (main)
    '#9f7aea', // Farcaster purple 2 (lighter)
    '#b794f6', // Farcaster purple 3 (even lighter)
    '#d6bcfa', // Farcaster purple 4 (lightest)
    '#6b46c1', // Farcaster purple 5 (darker)
    '#553c9a'  // Farcaster purple 6 (darkest)
];

export function WalletDistributionChart({
    ethPortfolio = 0,
    farcasterVerifiedPortfolios = {},
    hiveValue = 0,
    farcasterProfile,
    connectedEthAddress
}: WalletDistributionChartProps) {

    const chartData = useMemo(() => {
        const data: WalletData[] = [];

        // Calculate total value first to determine if we should show anything
        const verifiedWalletValues = Object.values(farcasterVerifiedPortfolios).map(p => p?.totalNetWorth || 0);
        const totalValue = ethPortfolio + hiveValue + verifiedWalletValues.reduce((sum, val) => sum + val, 0);

        if (totalValue === 0) return [];

        // Add Ethereum wallet (only if balance > 0)
        if (ethPortfolio > 0) {
            const percentage = (ethPortfolio / totalValue) * 100;
            data.push({
                name: connectedEthAddress && farcasterProfile?.custody?.toLowerCase() === connectedEthAddress?.toLowerCase()
                    ? 'Ethereum (Farcaster Connected)'
                    : 'Ethereum Wallet',
                value: ethPortfolio,
                address: connectedEthAddress,
                color: COLORS[0], // Blue for Ethereum
                percentage
            });
        }

        // Add Hive wallet (only if balance > 0)
        if (hiveValue > 0) {
            const percentage = (hiveValue / totalValue) * 100;
            data.push({
                name: 'Hive Blockchain',
                value: hiveValue,
                color: COLORS[1], // Red for Hive
                percentage
            });
        }

        // Add verified Farcaster wallets (only if balance > 0)
        let farcasterColorIndex = 2; // Start from purple colors
        Object.entries(farcasterVerifiedPortfolios).forEach(([address, portfolio], index) => {
            const value = portfolio?.totalNetWorth || 0;
            if (value > 0) { // Only add wallets with positive balance
                const percentage = (value / totalValue) * 100;
                data.push({
                    name: `Verified Wallet ${index + 1}`,
                    value,
                    address,
                    color: COLORS[farcasterColorIndex] || COLORS[2], // Default to main purple if we run out
                    percentage
                });
                farcasterColorIndex++;
            }
        });

        return data.sort((a, b) => b.value - a.value); // Sort by value descending
    }, [ethPortfolio, farcasterVerifiedPortfolios, hiveValue, farcasterProfile, connectedEthAddress]);

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Box
                    bg="gray.800"
                    p={3}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.600"
                    boxShadow="2xl"
                    zIndex={1000}
                    position="relative"
                    minW="200px"
                >
                    <VStack spacing={1} align="stretch">
                        <Text fontSize="sm" fontWeight="bold" color="white">
                            {data.name}
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="primary">
                            {formatValue(data.value)}
                        </Text>
                        <Text fontSize="xs" color="gray.300">
                            {data.percentage.toFixed(1)}% of portfolio
                        </Text>
                        {data.address && (
                            <Text fontSize="xs" color="gray.400" fontFamily="mono">
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
                            <Box
                                w="12px"
                                h="12px"
                                borderRadius="sm"
                                bg={entry.color}
                            />
                            <Text fontSize="sm" color="text" noOfLines={1}>
                                {entry.value}
                            </Text>
                        </HStack>
                        <Badge colorScheme="blue" fontSize="xs">
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
                <Text color="gray.400">No wallet data available</Text>
            </Box>
        );
    }

    return (
        <Box overflow="visible" position="relative">
            <Text fontSize="lg" fontWeight="bold" color="primary" textAlign="center" mb={4}>
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
                                outline: 'none',
                                pointerEvents: 'none'
                            }}
                            allowEscapeViewBox={{ x: true, y: true }}
                            offset={10}
                            cursor={{ fill: 'transparent' }}
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
                    <Text fontSize="xs" color="gray.400" mb={1}>
                        Total Value
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="primary">
                        {formatValue(totalValue)}
                    </Text>
                </Box>
            </Box>

            <CustomLegend payload={chartData.map(item => ({
                value: item.name,
                color: item.color,
                payload: item
            }))} />
        </Box>
    );
}
