"use client";

import FarcasterSignIn from '@/components/farcaster/FarcasterSignIn';
import { useToast } from "@chakra-ui/react";

interface FarcasterWalletSectionProps {
    hiveUsername?: string;
}

export default function FarcasterWalletSection({ hiveUsername }: FarcasterWalletSectionProps) {
    const toast = useToast();

    const handleFarcasterSuccess = (profile: {
        fid: number;
        username: string;
        displayName?: string;
        pfpUrl?: string;
        bio?: string;
        custody?: `0x${string}`;
        verifications?: string[];
    }) => {
        // If we have a Hive username, we could potentially link the accounts here
        if (hiveUsername) {
            // This would be a call to link the accounts, similar to FarcasterAccountLink
            // For now, just show success with wallet info
            const walletInfo = profile.custody ? ` (Wallet: ${profile.custody.slice(0, 6)}...${profile.custody.slice(-4)})` : '';
            toast({
                status: "success",
                title: "Connected to Farcaster!",
                description: `Welcome @${profile.username}! Your Farcaster account is connected.${walletInfo}`,
            });
        } else {
            toast({
                status: "success",
                title: "Connected to Farcaster!",
                description: `Welcome @${profile.username}!`,
            });
        }
    };

    return (
        <FarcasterSignIn
            onSuccess={handleFarcasterSuccess}
            variant="card"
        />
    );
}
