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

export function useProfileCoins() {
  const [profileCoins, setProfileCoins] = useState<ProfileCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchProfileCoins = async () => {
      console.log("🔍 useProfileCoins: Starting fetch", { address, isConnected });
      
      if (!address || !isConnected) {
        console.log("❌ useProfileCoins: No address or not connected");
        setProfileCoins([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("📡 useProfileCoins: Calling getProfileBalances");
        
        const response = await getProfileBalances({
          identifier: address,
          count: 50, // Get up to 50 coin balances
        });

        console.log("📦 useProfileCoins: Response received", { 
          hasData: !!response.data,
          profileExists: !!response.data?.profile 
        });
        
        const profile = response.data?.profile;
        
        if (profile?.coinBalances?.edges) {
          console.log("💰 useProfileCoins: Found", profile.coinBalances.edges.length, "coin balances");
          
          // Transform the balance data to our ProfileCoin interface
          const formattedCoins: ProfileCoin[] = profile.coinBalances.edges
            .map((edge: any, index: number) => {
              const balance = edge.node;
              const coin = balance.coin;
              
              if (!coin || !balance.balance) {
                console.log(`❌ useProfileCoins: Skipping coin ${index} - missing coin or balance`);
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
              
              if (index < 2) { // Only log first 2 coins to reduce noise
                console.log(`✅ useProfileCoins: Coin ${index} (${coin.symbol}):`, {
                  symbol: coin.symbol,
                  name: coin.name,
                  rawImageUrl: imageUrl,
                  finalImage: formattedCoin.image,
                  formattedBalance: formattedCoin.formattedBalance
                });
              }
              return formattedCoin;
            })
            .filter(Boolean) as ProfileCoin[];

          // Deduplicate coins by address and combine balances
          const duplicateAddresses = formattedCoins
            .map(coin => coin.address)
            .filter((address, index, arr) => arr.indexOf(address) !== index);
          
          if (duplicateAddresses.length > 0) {
            console.log("⚠️ useProfileCoins: Found duplicate addresses:", [...new Set(duplicateAddresses)]);
          }
          
          const deduplicatedCoins = formattedCoins.reduce((acc, coin) => {
            const existingCoin = acc.find(c => c.address === coin.address);
            if (existingCoin) {
              console.log(`🔄 useProfileCoins: Combining duplicate ${coin.symbol} balances`);
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

          console.log("🎯 useProfileCoins: Coins before dedup:", formattedCoins.length, "after:", deduplicatedCoins.length);
          setProfileCoins(deduplicatedCoins);
        } else {
          console.log("❌ useProfileCoins: No coinBalances.edges found");
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
  }, [address, isConnected]);

  return {
    profileCoins,
    loading,
    error,
    refetch: () => {
      if (address && isConnected) {
        setProfileCoins([]);
        setError(null);
        // The useEffect will handle the refetch
      }
    },
  };
}
