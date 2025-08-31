"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// API Response Interfaces
interface PreviewImage {
  small?: string;
  medium?: string;
  blurhash?: string;
}

interface MediaContent {
  mimeType?: string;
  originalUri?: string;
  previewImage?: PreviewImage;
}

interface CoinNode {
  id: string;
  name: string;
  symbol: string;
  description: string;
  address: string;
  chainId: number;
  totalSupply: string;
  marketCap: string;
  marketCapDelta24h?: string;
  volume24h: string;
  uniqueHolders: number;
  createdAt?: string;
  creatorAddress?: string;
  mediaContent?: MediaContent;
}

interface BalanceNode {
  id: string;
  balance: string;
  coin?: CoinNode;
}

interface Edge<T> {
  node: T;
}

interface CreatedCoinsCollection {
  edges?: Edge<CoinNode>[];
  count?: number;
}

interface CoinBalancesCollection {
  edges: Edge<BalanceNode>[];
  count?: number;
}

interface ProfileData {
  createdCoins?: CreatedCoinsCollection;
  coinBalances?: CoinBalancesCollection;
}

interface ProfileCoinsResponse {
  data?: {
    profile?: ProfileData;
  };
}

interface ProfileBalancesResponse {
  data?: {
    profile?: ProfileData;
  };
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
      const response = await getProfileCoins({
        identifier: address,
        count: 20,
      }) as ProfileCoinsResponse;

      const profile = response?.data?.profile;
      if (profile?.createdCoins?.edges) {
        const coins: ZoraCoin[] = profile.createdCoins.edges.map((edge: Edge<CoinNode>) => ({
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
          createdAt: edge.node.createdAt || "",
          creatorAddress: edge.node.creatorAddress || "",
          mediaContent: edge.node.mediaContent ? {
            mimeType: edge.node.mediaContent.mimeType,
            originalUri: edge.node.mediaContent.originalUri,
            previewImage: edge.node.mediaContent.previewImage ? {
              small: edge.node.mediaContent.previewImage.small,
              medium: edge.node.mediaContent.previewImage.medium,
              blurhash: edge.node.mediaContent.previewImage.blurhash,
            } : undefined,
          } : undefined,
        }));

        setCreatedCoins(coins);
        setTotalCreatedCoins(profile.createdCoins.count || 0);
        
        return coins;
      } else {
        setCreatedCoins([]);
        setTotalCreatedCoins(0);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch created coins";
      throw new Error(errorMessage);
    }
  }, []);

  const fetchHeldTokens = useCallback(async (address: string) => {
    try {
      const response = await getProfileBalances({
        identifier: address,
        count: 20,
      }) as ProfileBalancesResponse;

      const profile = response?.data?.profile;
      const coinBalances = profile?.coinBalances;
      
      if (coinBalances?.edges && Array.isArray(coinBalances.edges)) {
        const tokens: ZoraBalance[] = coinBalances.edges.map((edge: Edge<BalanceNode>) => ({
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
          valueUsd: undefined,
          timestamp: "",
        }));

        setHeldTokens(tokens);
        setTotalHeldTokens(coinBalances.count || tokens.length);
        
        return tokens;
      } else {
        setHeldTokens([]);
        setTotalHeldTokens(0);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch token holdings";
      throw new Error(errorMessage);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!shouldFetch) return;

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchCreatedCoins(ethereumAddress!),
        fetchHeldTokens(ethereumAddress!)
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch Zora token data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch, ethereumAddress, fetchCreatedCoins, fetchHeldTokens]);

  const fetchedAddressRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (shouldFetch && ethereumAddress !== fetchedAddressRef.current) {
      fetchedAddressRef.current = ethereumAddress;
      fetchAllData();
    }
  }, [shouldFetch, ethereumAddress, fetchAllData]);

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
