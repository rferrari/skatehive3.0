"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getProfileCoins, getProfileBalances } from "@zoralabs/coins-sdk";

export interface ZoraCoin {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  address: string;
  chainId: number;
  totalSupply: string;
  marketCap: string;
  marketCapDelta24h?: string;
  volume24h?: string;
  uniqueHolders: number;
  createdAt: string;
  creatorAddress: string;
  mediaContent?: {
    mimeType?: string;
    originalUri?: string;
    previewImage?: {
      small?: string;
      medium?: string;
      blurhash?: string;
    };
  };
}

export interface ZoraBalance {
  id: string;
  token: ZoraCoin;
  amount: {
    amountRaw: string;
    amountDecimal: number;
  };
  valueUsd?: string;
  timestamp: string;
}

export interface ZoraProfileTokensData {
  createdCoins: ZoraCoin[];
  heldTokens: ZoraBalance[];
  totalCreatedCoins: number;
  totalHeldTokens: number;
  isLoading: boolean;
  error: string | null;
}

interface UseZoraProfileTokensProps {
  ethereumAddress?: string;
  enabled?: boolean;
}

const useZoraProfileTokens = ({ 
  ethereumAddress, 
  enabled = true 
}: UseZoraProfileTokensProps): ZoraProfileTokensData => {
  const [createdCoins, setCreatedCoins] = useState<ZoraCoin[]>([]);
  const [heldTokens, setHeldTokens] = useState<ZoraBalance[]>([]);
  const [totalCreatedCoins, setTotalCreatedCoins] = useState(0);
  const [totalHeldTokens, setTotalHeldTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldFetch = useMemo(() => {
    return enabled && ethereumAddress && ethereumAddress.length > 0;
  }, [enabled, ethereumAddress]);

  const fetchCreatedCoins = useCallback(async (address: string) => {
    try {
      console.log("🪙 Fetching created coins for address:", address);
      
      const response = await getProfileCoins({
        identifier: address,
        count: 20, // Reduced from 50 to 20
      });

      const profile = response?.data?.profile;
      if (profile?.createdCoins) {
        const coins: ZoraCoin[] = profile.createdCoins.edges?.map((edge: any) => ({
          id: edge.node.id,
          name: edge.node.name,
          symbol: edge.node.symbol,
          description: edge.node.description,
          address: edge.node.address,
          chainId: edge.node.chainId,
          totalSupply: edge.node.totalSupply,
          marketCap: edge.node.marketCap,
          marketCapDelta24h: edge.node.marketCapDelta24h,
          volume24h: edge.node.volume24h,
          uniqueHolders: edge.node.uniqueHolders,
          createdAt: edge.node.createdAt,
          creatorAddress: edge.node.creatorAddress,
          mediaContent: edge.node.mediaContent ? {
            mimeType: edge.node.mediaContent.mimeType,
            originalUri: edge.node.mediaContent.originalUri,
            previewImage: edge.node.mediaContent.previewImage ? {
              small: edge.node.mediaContent.previewImage.small,
              medium: edge.node.mediaContent.previewImage.medium,
              blurhash: edge.node.mediaContent.previewImage.blurhash,
            } : undefined,
          } : undefined,
        })) || [];

        setCreatedCoins(coins);
        setTotalCreatedCoins(profile.createdCoins.count || 0);
        
        console.log(`✅ Found ${coins.length} created coins`);
        return coins;
      } else {
        setCreatedCoins([]);
        setTotalCreatedCoins(0);
        return [];
      }
    } catch (err) {
      console.error("❌ Error fetching created coins:", err);
      throw err;
    }
  }, []);

  const fetchHeldTokens = useCallback(async (address: string) => {
    try {
      console.log("💰 Fetching held tokens for address:", address);
      
      const response = await getProfileBalances({
        identifier: address,
        count: 20, // Reduced from 50 to 20
      });

      const profile = response?.data?.profile;
      const coinBalances = profile?.coinBalances;
      
      if (coinBalances?.edges && Array.isArray(coinBalances.edges)) {
        const tokens: ZoraBalance[] = coinBalances.edges.map((edge: any) => ({
          id: edge.node.id,
          token: {
            id: edge.node.coin?.id || "",
            name: edge.node.coin?.name || "",
            symbol: edge.node.coin?.symbol || "",
            description: edge.node.coin?.description || "",
            address: edge.node.coin?.address || "",
            chainId: edge.node.coin?.chainId || 0,
            totalSupply: edge.node.coin?.totalSupply || "0",
            marketCap: edge.node.coin?.marketCap || "0",
            volume24h: edge.node.coin?.volume24h || "0",
            uniqueHolders: edge.node.coin?.uniqueHolders || 0,
            createdAt: edge.node.coin?.createdAt || "",
            creatorAddress: edge.node.coin?.creatorAddress || "",
            mediaContent: edge.node.coin?.mediaContent ? {
              mimeType: edge.node.coin.mediaContent.mimeType,
              originalUri: edge.node.coin.mediaContent.originalUri,
              previewImage: edge.node.coin.mediaContent.previewImage ? {
                small: edge.node.coin.mediaContent.previewImage.small,
                medium: edge.node.coin.mediaContent.previewImage.medium,
                blurhash: edge.node.coin.mediaContent.previewImage.blurhash,
              } : undefined,
            } : undefined,
          },
          amount: {
            amountRaw: edge.node.balance || "0",
            amountDecimal: parseFloat(edge.node.balance || "0"),
          },
          valueUsd: undefined, // Not available in this response structure
          timestamp: "", // Not available in this response structure
        }));

        setHeldTokens(tokens);
        setTotalHeldTokens(coinBalances.count || tokens.length);
        
        console.log(`✅ Found ${tokens.length} held tokens`);
        return tokens;
      } else {
        setHeldTokens([]);
        setTotalHeldTokens(0);
        return [];
      }
    } catch (err) {
      console.error("❌ Error fetching held tokens:", err);
      throw err;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!shouldFetch) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch both created coins and held tokens in parallel
      await Promise.all([
        fetchCreatedCoins(ethereumAddress!),
        fetchHeldTokens(ethereumAddress!)
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch Zora token data";
      setError(errorMessage);
      console.error("❌ Error in fetchAllData:", err);
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch, ethereumAddress, fetchCreatedCoins, fetchHeldTokens]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Reset state when address changes or is cleared
  useEffect(() => {
    if (!ethereumAddress) {
      setCreatedCoins([]);
      setHeldTokens([]);
      setTotalCreatedCoins(0);
      setTotalHeldTokens(0);
      setError(null);
    }
  }, [ethereumAddress]);

  return {
    createdCoins,
    heldTokens,
    totalCreatedCoins,
    totalHeldTokens,
    isLoading,
    error,
  };
};

export default useZoraProfileTokens;
