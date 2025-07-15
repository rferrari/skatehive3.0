"use client";

import FarcasterSignIn from '@/components/farcaster/FarcasterSignIn';
import { useToast } from "@chakra-ui/react";

interface FarcasterWalletSectionProps {
    hiveUsername?: string;
}

export default function FarcasterWalletSection({ hiveUsername }: FarcasterWalletSectionProps) {
    const toast = useToast();

    const handleFarcasterSuccess = (profile: { fid: number; username: string }) => {
        // If we have a Hive username, we could potentially link the accounts here
        if (hiveUsername) {
            // This would be a call to link the accounts, similar to FarcasterAccountLink
            // For now, just show success
            toast({
                status: "success",
                title: "Connected to Farcaster!",
                description: `Welcome @${profile.username}! Your Farcaster account is connected.`,
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
