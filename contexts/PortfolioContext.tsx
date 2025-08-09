"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { PortfolioData } from "../types/portfolio";

interface PortfolioContextType {
  portfolio: PortfolioData | null;
  farcasterPortfolio: PortfolioData | null;
  farcasterVerifiedPortfolios: Record<string, PortfolioData>;
  aggregatedPortfolio: PortfolioData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);

interface PortfolioProviderProps {
  children: ReactNode;
  address: string | undefined;
  farcasterAddress?: string | undefined;
  farcasterVerifiedAddresses?: string[];
}

export function PortfolioProvider({
  children,
  address,
  farcasterAddress,
  farcasterVerifiedAddresses,
}: PortfolioProviderProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [farcasterPortfolio, setFarcasterPortfolio] =
    useState<PortfolioData | null>(null);
  const [farcasterVerifiedPortfolios, setFarcasterVerifiedPortfolios] =
    useState<Record<string, PortfolioData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache to prevent duplicate API calls
  const portfolioCache = useRef<Map<string, { data: PortfolioData | null; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const fetchPortfolio = useCallback(
    async (walletAddress: string, signal?: AbortSignal): Promise<PortfolioData | null> => {
      // Check cache first
      const cached = portfolioCache.current.get(walletAddress);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }

      try {
        const response = await fetch(`/api/portfolio/${walletAddress}`, { signal });
        if (!response.ok) {
          let errorMessage = "Failed to fetch portfolio";
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorMessage;
          } catch {
            // Non-JSON error response, keep default message
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        
        // Cache the result
        portfolioCache.current.set(walletAddress, { data, timestamp: now });
        return data;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Don't log abort errors
          return null;
        }
        console.error(`Error fetching portfolio for ${walletAddress}:`, err);
        return null;
      }
    },
    []
  );

  const fetchAllPortfolios = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate fetches and add debouncing
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < 1000) {
      return; // Debounce: prevent calls within 1 second
    }

    if (
      !address &&
      !farcasterAddress &&
      (!farcasterVerifiedAddresses || farcasterVerifiedAddresses.length === 0)
    ) {
      setPortfolio(null);
      setFarcasterPortfolio(null);
      setFarcasterVerifiedPortfolios({});
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);
    setLastFetchTime(now);

    // Clear cache if force refresh
    if (forceRefresh) {
      portfolioCache.current.clear();
    }

    try {
      // Filter out Solana addresses (they don't start with 0x) and deduplicate
      const ethVerifiedAddresses =
        farcasterVerifiedAddresses?.filter(
          (addr) =>
            addr.startsWith("0x") &&
            addr.toLowerCase() !== address?.toLowerCase() &&
            addr.toLowerCase() !== farcasterAddress?.toLowerCase()
        ) || [];

      const [ethPortfolio, fcPortfolio, ...verifiedPortfolios] =
        await Promise.all([
          address ? fetchPortfolio(address, abortController.signal) : null,
          farcasterAddress ? fetchPortfolio(farcasterAddress, abortController.signal) : null,
          ...ethVerifiedAddresses.map((addr) => fetchPortfolio(addr, abortController.signal)),
        ]);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

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
      if (err instanceof Error && err.name === 'AbortError') {
        // Don't set error for aborted requests
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      // Clear the abort controller reference
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [address, farcasterAddress, farcasterVerifiedAddresses, fetchPortfolio, lastFetchTime]);

  // Aggregate portfolios
  const aggregatedPortfolio = useMemo((): PortfolioData | null => {
    if (
      !portfolio &&
      !farcasterPortfolio &&
      Object.keys(farcasterVerifiedPortfolios).length === 0
    )
      return null;

    const combinedTokens = [
      // Tag ethereum portfolio tokens
      ...(portfolio?.tokens?.map((token) => ({
        ...token,
        source: "ethereum" as const,
        sourceAddress: address,
      })) || []),
      // Tag farcaster portfolio tokens
      ...(farcasterPortfolio?.tokens?.map((token) => ({
        ...token,
        source: "farcaster" as const,
        sourceAddress: farcasterAddress,
      })) || []),
      // Tag verified portfolio tokens
      ...Object.entries(farcasterVerifiedPortfolios).flatMap(([addr, p]) =>
        (p.tokens || []).map((token) => ({
          ...token,
          source: "verified" as const,
          sourceAddress: addr,
        }))
      ),
    ];

    const combinedNfts = [
      ...(portfolio?.nfts || []),
      ...(farcasterPortfolio?.nfts || []),
      ...Object.values(farcasterVerifiedPortfolios).flatMap(
        (p) => p.nfts || []
      ),
    ];

    const totalNetWorth =
      (portfolio?.totalNetWorth || 0) +
      (farcasterPortfolio?.totalNetWorth || 0) +
      Object.values(farcasterVerifiedPortfolios).reduce(
        (sum, p) => sum + (p.totalNetWorth || 0),
        0
      );

    const totalBalanceUsdTokens =
      (portfolio?.totalBalanceUsdTokens || 0) +
      (farcasterPortfolio?.totalBalanceUsdTokens || 0) +
      Object.values(farcasterVerifiedPortfolios).reduce(
        (sum, p) => sum + (p.totalBalanceUsdTokens || 0),
        0
      );

    const totalBalanceUSDApp =
      (portfolio?.totalBalanceUSDApp || 0) +
      (farcasterPortfolio?.totalBalanceUSDApp || 0) +
      Object.values(farcasterVerifiedPortfolios).reduce(
        (sum, p) => sum + (p.totalBalanceUSDApp || 0),
        0
      );

    // Combine NFT USD net worth objects
    const combinedNftUsdNetWorth = {
      ...(portfolio?.nftUsdNetWorth || {}),
      ...(farcasterPortfolio?.nftUsdNetWorth || {}),
      ...Object.values(farcasterVerifiedPortfolios).reduce(
        (acc, p) => ({ ...acc, ...(p.nftUsdNetWorth || {}) }),
        {}
      ),
    };

    return {
      totalNetWorth,
      totalBalanceUsdTokens,
      totalBalanceUSDApp,
      nftUsdNetWorth: combinedNftUsdNetWorth,
      tokens: combinedTokens,
      nfts: combinedNfts,
    };
  }, [
    portfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
    address,
    farcasterAddress,
  ]);

  useEffect(() => {
    fetchAllPortfolios();

    // Cleanup function to abort pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllPortfolios]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      portfolio,
      farcasterPortfolio,
      farcasterVerifiedPortfolios,
      aggregatedPortfolio,
      isLoading,
      error,
      refetch: () => fetchAllPortfolios(true), // Force refresh when called manually
    }),
    [
      portfolio,
      farcasterPortfolio,
      farcasterVerifiedPortfolios,
      aggregatedPortfolio,
      isLoading,
      error,
      fetchAllPortfolios,
    ]
  );

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error(
      "usePortfolioContext must be used within a PortfolioProvider"
    );
  }
  return context;
}
