'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { PortfolioData } from '../types/portfolio';

interface PortfolioContextType {
    portfolio: PortfolioData | null;
    farcasterPortfolio: PortfolioData | null;
    farcasterVerifiedPortfolios: Record<string, PortfolioData>;
    aggregatedPortfolio: PortfolioData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

interface PortfolioProviderProps {
    children: ReactNode;
    address: string | undefined;
    farcasterAddress?: string | undefined;
    farcasterVerifiedAddresses?: string[];
}

export function PortfolioProvider({ children, address, farcasterAddress, farcasterVerifiedAddresses }: PortfolioProviderProps) {
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [farcasterPortfolio, setFarcasterPortfolio] = useState<PortfolioData | null>(null);
    const [farcasterVerifiedPortfolios, setFarcasterVerifiedPortfolios] = useState<Record<string, PortfolioData>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPortfolio = useCallback(async (walletAddress: string): Promise<PortfolioData | null> => {
        try {
            const response = await fetch(`/api/portfolio/${walletAddress}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch portfolio');
            }

            return data;
        } catch (err) {
            console.error(`Error fetching portfolio for ${walletAddress}:`, err);
            return null;
        }
    }, []);

    const fetchAllPortfolios = useCallback(async () => {
        // Debug logging for portfolio addresses
        console.log('📊 Portfolio Context Debug:', {
            ethereumAddress: address,
            farcasterAddress: farcasterAddress,
            farcasterVerifiedAddresses: farcasterVerifiedAddresses,
            bothEmpty: !address && !farcasterAddress
        });

        if (!address && !farcasterAddress && (!farcasterVerifiedAddresses || farcasterVerifiedAddresses.length === 0)) {
            setPortfolio(null);
            setFarcasterPortfolio(null);
            setFarcasterVerifiedPortfolios({});
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Filter out Solana addresses (they don't start with 0x) and deduplicate
            const ethVerifiedAddresses = farcasterVerifiedAddresses?.filter(addr =>
                addr.startsWith('0x') &&
                addr.toLowerCase() !== address?.toLowerCase() &&
                addr.toLowerCase() !== farcasterAddress?.toLowerCase()
            ) || [];

            console.log('🔗 Fetching portfolios for addresses:', {
                ethereum: address,
                farcaster: farcasterAddress,
                verified: ethVerifiedAddresses,
                filteredOut: farcasterVerifiedAddresses?.filter(addr =>
                    !addr.startsWith('0x') ||
                    addr.toLowerCase() === address?.toLowerCase() ||
                    addr.toLowerCase() === farcasterAddress?.toLowerCase()
                )
            });

            const [ethPortfolio, fcPortfolio, ...verifiedPortfolios] = await Promise.all([
                address ? fetchPortfolio(address) : null,
                farcasterAddress ? fetchPortfolio(farcasterAddress) : null,
                ...ethVerifiedAddresses.map(addr => fetchPortfolio(addr))
            ]);

            setPortfolio(ethPortfolio);
            setFarcasterPortfolio(fcPortfolio);

            // Create a record of verified portfolios (only include non-zero balances)
            const verifiedPortfoliosRecord: Record<string, PortfolioData> = {};
            ethVerifiedAddresses.forEach((addr, index) => {
                const portfolio = verifiedPortfolios[index];
                if (portfolio && portfolio.totalNetWorth > 0) {
                    verifiedPortfoliosRecord[addr] = portfolio;
                }
            });
            setFarcasterVerifiedPortfolios(verifiedPortfoliosRecord);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [address, farcasterAddress, farcasterVerifiedAddresses, fetchPortfolio]);

    // Aggregate portfolios
    const aggregatedPortfolio = useMemo((): PortfolioData | null => {
        if (!portfolio && !farcasterPortfolio && Object.keys(farcasterVerifiedPortfolios).length === 0) return null;

        const combinedTokens = [
            // Tag ethereum portfolio tokens
            ...(portfolio?.tokens?.map(token => ({
                ...token,
                source: 'ethereum' as const,
                sourceAddress: address
            })) || []),
            // Tag farcaster portfolio tokens 
            ...(farcasterPortfolio?.tokens?.map(token => ({
                ...token,
                source: 'farcaster' as const,
                sourceAddress: farcasterAddress
            })) || []),
            // Tag verified portfolio tokens
            ...Object.entries(farcasterVerifiedPortfolios).flatMap(([addr, p]) =>
                (p.tokens || []).map(token => ({
                    ...token,
                    source: 'verified' as const,
                    sourceAddress: addr
                }))
            )
        ];

        const combinedNfts = [
            ...(portfolio?.nfts || []),
            ...(farcasterPortfolio?.nfts || []),
            ...Object.values(farcasterVerifiedPortfolios).flatMap(p => p.nfts || [])
        ];

        const totalNetWorth = (portfolio?.totalNetWorth || 0) +
            (farcasterPortfolio?.totalNetWorth || 0) +
            Object.values(farcasterVerifiedPortfolios).reduce((sum, p) => sum + (p.totalNetWorth || 0), 0);

        const totalBalanceUsdTokens = (portfolio?.totalBalanceUsdTokens || 0) +
            (farcasterPortfolio?.totalBalanceUsdTokens || 0) +
            Object.values(farcasterVerifiedPortfolios).reduce((sum, p) => sum + (p.totalBalanceUsdTokens || 0), 0);

        const totalBalanceUSDApp = (portfolio?.totalBalanceUSDApp || 0) +
            (farcasterPortfolio?.totalBalanceUSDApp || 0) +
            Object.values(farcasterVerifiedPortfolios).reduce((sum, p) => sum + (p.totalBalanceUSDApp || 0), 0);

        // Combine NFT USD net worth objects
        const combinedNftUsdNetWorth = {
            ...(portfolio?.nftUsdNetWorth || {}),
            ...(farcasterPortfolio?.nftUsdNetWorth || {}),
            ...Object.values(farcasterVerifiedPortfolios).reduce((acc, p) => ({ ...acc, ...(p.nftUsdNetWorth || {}) }), {})
        };

        return {
            totalNetWorth,
            totalBalanceUsdTokens,
            totalBalanceUSDApp,
            nftUsdNetWorth: combinedNftUsdNetWorth,
            tokens: combinedTokens,
            nfts: combinedNfts
        };
    }, [portfolio, farcasterPortfolio, farcasterVerifiedPortfolios, address, farcasterAddress]);

    useEffect(() => {
        fetchAllPortfolios();
    }, [fetchAllPortfolios]);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        portfolio,
        farcasterPortfolio,
        farcasterVerifiedPortfolios,
        aggregatedPortfolio,
        isLoading,
        error,
        refetch: fetchAllPortfolios
    }), [portfolio, farcasterPortfolio, farcasterVerifiedPortfolios, aggregatedPortfolio, isLoading, error, fetchAllPortfolios]);

    return (
        <PortfolioContext.Provider value={contextValue}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolioContext() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolioContext must be used within a PortfolioProvider');
    }
    return context;
}
