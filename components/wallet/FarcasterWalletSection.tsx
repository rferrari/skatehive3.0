"use client";

import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import FarcasterUniversalWallet from '../farcaster/FarcasterUniversalWallet';
import FarcasterUniversalLink from '../farcaster/FarcasterUniversalLink';
import { useFarcasterSession } from '../../hooks/useFarcasterSession';

interface FarcasterWalletSectionProps {
    hiveUsername?: string;
}

export default function FarcasterWalletSection({ hiveUsername }: FarcasterWalletSectionProps) {
    const { profile: farcasterProfile } = useFarcasterSession();

    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md" color="text">
                Farcaster Connection
            </Heading>
            
            <Text fontSize="sm" color="muted">
                Connect your Farcaster account to unlock social features and wallet integration.
            </Text>

            {/* Account Linking Section - Only show if we have a hiveUsername */}
            {hiveUsername && !farcasterProfile && (
                <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                        Account Linking
                    </Text>
                    <FarcasterUniversalLink hiveUsername={hiveUsername} />
                </Box>
            )}

            {/* Wallet Integration Section */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" color="text" mb={2}>
                    Wallet Integration
                </Text>
                <FarcasterUniversalWallet hiveUsername={hiveUsername} />
            </Box>
        </VStack>
    );
}
