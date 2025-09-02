"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getProfileBalances } from "@zoralabs/coins-sdk";
import { Address, formatUnits } from "viem";
import { convertIpfsUrl } from "@/lib/utils/ipfsMetadata";

export interface ProfileCoin {
  address: Address;
  symbol: string;
  name: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  image?: string;
  valueUsd?: string;
}

// Helper function to format balance
function formatBalance(balance: string, decimals: number): string {
  try {
    return formatUnits(BigInt(balance), decimals);
  } catch {
    return "0";
  }
}

// Helper function to format IPFS URLs
function formatImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return convertIpfsUrl(url);
}

export function useProfileCoins(enabled: boolean = true) {
  const [profileCoins, setProfileCoins] = useState<ProfileCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchProfileCoins = async () => {
      
      if (!address || !isConnected || !enabled) {
        setProfileCoins([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        
        const response = await getProfileBalances({
          identifier: address,
          count: 50, // Get up to 50 coin balances
        });


        
        const profile = response.data?.profile;
        
        if (profile?.coinBalances?.edges) {
          
          // Transform the balance data to our ProfileCoin interface
          const formattedCoins: ProfileCoin[] = profile.coinBalances.edges
            .map((edge: any, index: number) => {
              const balance = edge.node;
              const coin = balance.coin;
              
              if (!coin || !balance.balance) {
                return null;
              }
              
              const imageUrl = coin.mediaContent?.previewImage?.url || 
                             coin.mediaContent?.originalUri || 
                             coin.media?.previewImage?.url || 
                             coin.media?.medium?.url ||
                             coin.media?.previewImage ||
                             coin.media?.medium;

              const formattedCoin = {
                address: coin.address as Address,
                symbol: coin.symbol || "UNKNOWN",
                name: coin.name || "Unknown Coin",
                balance: balance.balance || "0",
                formattedBalance: balance.formattedBalance || formatBalance(balance.balance || "0", coin.decimals || 18),
                decimals: coin.decimals || 18,
                image: formatImageUrl(imageUrl),
                valueUsd: balance.valueUsd,
              };
              

              return formattedCoin;
            })
            .filter(Boolean) as ProfileCoin[];

          // Deduplicate coins by address and combine balances
          const duplicateAddresses = formattedCoins
            .map(coin => coin.address)
            .filter((address, index, arr) => arr.indexOf(address) !== index);
          

          
          const deduplicatedCoins = formattedCoins.reduce((acc, coin) => {
            const existingCoin = acc.find(c => c.address === coin.address);
            if (existingCoin) {
              // Combine balances if duplicate found
              const existingBalance = BigInt(existingCoin.balance);
              const newBalance = BigInt(coin.balance);
              const combinedBalance = existingBalance + newBalance;
              
              existingCoin.balance = combinedBalance.toString();
              existingCoin.formattedBalance = formatBalance(combinedBalance.toString(), coin.decimals);
            } else {
              acc.push(coin);
            }
            return acc;
          }, [] as ProfileCoin[]);

          setProfileCoins(deduplicatedCoins);
        } else {
          setProfileCoins([]);
        }
      } catch (err) {
        console.error("💥 useProfileCoins: Error fetching profile coins:", err);
        console.error("💥 useProfileCoins: Error details:", {
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
          err
        });
        setError(err instanceof Error ? err.message : "Failed to fetch profile coins");
        setProfileCoins([]);
      } finally {
        setLoading(false);
        console.log("🏁 useProfileCoins: Fetch completed");
      }
    };

    fetchProfileCoins();
  }, [address, isConnected, enabled]);

  return {
    profileCoins,
    loading,
    error,
    refetch: () => {
      if (address && isConnected && enabled) {
        setProfileCoins([]);
        setError(null);
        // The useEffect will handle the refetch
      }
    },
  };
}
