'use client';
import React from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { WalletDistributionChart } from './WalletDistributionChart';

// Sample data for testing
const sampleData = {
    ethPortfolio: 9635.20,
    farcasterVerifiedPortfolios: {
        '0x4a03...9eb3': { totalNetWorth: 3789.46 },
        '0x2d18...1662': { totalNetWorth: 388.50 },
        '0x1ff0...be39': { totalNetWorth: 0.55 }
    },
    hiveValue: 1771.10,
    farcasterProfile: {
        custody: '0x41CB654D1F47913ACAB158a8199191D160DAbe4A',
        username: 'skater'
    },
    connectedEthAddress: '0x41CB654D1F47913ACAB158a8199191D160DAbe4A'
};

export function WalletChartDemo() {
    return (
        <VStack spacing={6} align="stretch" p={6}>
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
                Wallet Distribution Chart Demo
            </Text>

            <Box
                maxW="500px"
                mx="auto"
                p={6}
                bg="gray.900"
                borderRadius="lg"
                border="2px solid"
                borderColor="purple.500"
            >
                <WalletDistributionChart
                    ethPortfolio={sampleData.ethPortfolio}
                    farcasterVerifiedPortfolios={sampleData.farcasterVerifiedPortfolios}
                    hiveValue={sampleData.hiveValue}
                    farcasterProfile={sampleData.farcasterProfile}
                    connectedEthAddress={sampleData.connectedEthAddress}
                />
            </Box>
        </VStack>
    );
}
