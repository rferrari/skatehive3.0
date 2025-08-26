"use client";

import { useState, useEffect } from "react";
import { getProfile } from "@zoralabs/coins-sdk";
import { Address } from "viem";
import { convertIpfsUrl } from "@/lib/utils/ipfsMetadata";

export interface ZoraProfileCoinData {
  address: Address;
  symbol: string;
  name: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  price?: string;
  image?: string;
  totalSupply?: string;
  holderCount?: number;
  isCreatedByUser?: boolean;
  handle?: string;
}

export interface ZoraProfileData {
  handle?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  coinData?: ZoraProfileCoinData;
}

// Helper function to format IPFS URLs
function formatImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return convertIpfsUrl(url);
}

export function useZoraProfileCoin(walletAddress: string | undefined) {
  const [profileCoin, setProfileCoin] = useState<ZoraProfileCoinData | null>(null);
  const [profileData, setProfileData] = useState<ZoraProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileCoin = async () => {
      
      if (!walletAddress) {
        console.log("❌ useZoraProfileCoin: No wallet address provided");
        setProfileCoin(null);
        setProfileData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("📡 useZoraProfileCoin: Calling getProfile for address:", walletAddress);
        
        const response = await getProfile({
          identifier: walletAddress as Address,
        });

        
        const profile = response.data?.profile;
        
        // Always set profile data if profile exists
        if (profile) {
          const zoraProfileData: ZoraProfileData = {
            handle: profile.handle || undefined,
            displayName: profile.displayName || undefined,
            avatar: profile.avatar?.medium || profile.avatar?.small || undefined,
            bio: profile.bio || undefined,
          };
          
          setProfileData(zoraProfileData);
        } else {
          setProfileData(null);
        }
        
        if (profile?.creatorCoin) {
          
          const creatorCoin = profile.creatorCoin;
          
      

          // Use profile handle as symbol and displayName as coin name
          const profileCoinData: ZoraProfileCoinData = {
            address: creatorCoin.address as Address,
            symbol: profile.handle || "PROFILE", // Use handle as symbol
            name: profile.displayName || profile.handle || "Profile Coin", // Use displayName or fallback to handle
            marketCap: creatorCoin.marketCap || undefined,
            marketCapDelta24h: creatorCoin.marketCapDelta24h || undefined,
            price: undefined, // Not available in this API response
            image: profile.avatar?.medium || profile.avatar?.small || undefined, // Use profile avatar
            totalSupply: undefined, // Not available in getProfile response
            holderCount: undefined, // Not available in getProfile response
            isCreatedByUser: true,
            handle: profile.handle || undefined,
          };
          
          setProfileCoin(profileCoinData);
          
          // Update profile data with coin information
          setProfileData(prev => ({
            ...(prev || {}),
            coinData: profileCoinData
          }));
        } else {
          console.log("❌ useZoraProfileCoin: No creator coin found for this profile");
          setProfileCoin(null);
        }
      } catch (err) {
        console.error("💥 useZoraProfileCoin: Error fetching profile coin:", err);
        console.error("💥 useZoraProfileCoin: Error details:", {
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
          err
        });
        setError(err instanceof Error ? err.message : "Failed to fetch profile coin");
        setProfileCoin(null);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileCoin();
  }, [walletAddress]);

  return {
    profileCoin,
    profileData,
    loading,
    error,
    refetch: () => {
      if (walletAddress) {
        setProfileCoin(null);
        setProfileData(null);
        setError(null);
        // The useEffect will handle the refetch
      }
    },
  };
}
