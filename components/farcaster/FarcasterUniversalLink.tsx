"use client";
import React from "react";
import { useFarcasterMiniapp } from "@/hooks/useFarcasterMiniapp";
import FarcasterAccountLink from "./FarcasterAccountLink";
import FarcasterMiniappLink from "./FarcasterMiniappLink";

interface FarcasterUniversalLinkProps {
    hiveUsername: string;
    postingKey?: string;
}

export default function FarcasterUniversalLink({ hiveUsername, postingKey }: FarcasterUniversalLinkProps) {
    const { isInMiniapp, isReady } = useFarcasterMiniapp();

    // Show loading state while determining context
    if (!isReady) {
        return (
            <div style={{ 
                padding: '24px', 
                border: '1px solid var(--chakra-colors-gray-200)', 
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <div style={{ 
                    height: '32px', 
                    backgroundColor: 'var(--chakra-colors-gray-100)', 
                    marginBottom: '16px',
                    borderRadius: '4px'
                }} />
                <div style={{ 
                    height: '64px', 
                    backgroundColor: 'var(--chakra-colors-gray-100)',
                    borderRadius: '4px'
                }} />
                <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--chakra-colors-gray-600)', 
                    marginTop: '8px' 
                }}>
                    Detecting Farcaster context...
                </p>
            </div>
        );
    }

    // Render appropriate component based on context
    if (isInMiniapp) {
        return <FarcasterMiniappLink hiveUsername={hiveUsername} postingKey={postingKey} />;
    } else {
        return <FarcasterAccountLink hiveUsername={hiveUsername} postingKey={postingKey} />;
    }
}
