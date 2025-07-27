"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAioha } from "@aioha/react-ui";
import { DEFAULT_VOTE_WEIGHT } from "@/lib/utils/constants";
import useHiveAccount from "@/hooks/useHiveAccount";

interface VoteWeightContextType {
  voteWeight: number;
  disableSlider: boolean;
  isLoading: boolean;
  error: string | null;
  updateVoteWeight: (newVoteWeight: number) => void;
  updateDisableSlider: (disableSlider: boolean) => void;
  refreshVoteWeight: () => void;
}

const VoteWeightContext = createContext<VoteWeightContextType | undefined>(undefined);

export const useVoteWeightContext = () => {
  const context = useContext(VoteWeightContext);
  if (context === undefined) {
    throw new Error("useVoteWeightContext must be used within a VoteWeightProvider");
  }
  return context;
};

interface VoteWeightProviderProps {
  children: React.ReactNode;
}

export const VoteWeightProvider: React.FC<VoteWeightProviderProps> = ({ children }) => {
  const { user } = useAioha();
  const { hiveAccount, isLoading, error } = useHiveAccount(user || "");
  const [voteWeight, setVoteWeight] = useState(DEFAULT_VOTE_WEIGHT);
  const [disableSlider, setDisableSlider] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Extract vote weight and disable slider preference from Hive account metadata
  useEffect(() => {
    console.log("🔄 VoteWeightContext: Processing user data:", {
      user,
      hasHiveAccount: !!hiveAccount,
      isLoading,
      hasMetadata: !!hiveAccount?.json_metadata
    });

    if (hiveAccount?.json_metadata) {
      try {
        const parsedMetadata = JSON.parse(hiveAccount.json_metadata);
        const customVoteWeight = parsedMetadata?.extensions?.vote_weight;
        const customDisableSlider = parsedMetadata?.extensions?.disable_slider;
        
        console.log("📋 VoteWeightContext: Parsed metadata:", {
          customVoteWeight,
          customDisableSlider,
          extensions: parsedMetadata?.extensions
        });
        
        if (typeof customVoteWeight === 'number' && customVoteWeight >= 0 && customVoteWeight <= 100) {
          console.log("✅ VoteWeightContext: Setting custom vote weight:", customVoteWeight);
          setVoteWeight(customVoteWeight);
        } else {
          console.log("🔄 VoteWeightContext: Using default vote weight:", DEFAULT_VOTE_WEIGHT);
          setVoteWeight(DEFAULT_VOTE_WEIGHT);
        }
        
        if (typeof customDisableSlider === 'boolean') {
          console.log("✅ VoteWeightContext: Setting custom disable slider:", customDisableSlider);
          setDisableSlider(customDisableSlider);
        } else {
          console.log("🔄 VoteWeightContext: Using default disable slider: false");
          setDisableSlider(false);
        }
      } catch (error) {
        console.error("❌ VoteWeightContext: Failed to parse vote weight preferences from metadata:", error);
        setVoteWeight(DEFAULT_VOTE_WEIGHT);
        setDisableSlider(false);
      }
    } else if (user) {
      console.log("🔄 VoteWeightContext: User logged in but no metadata, using defaults");
      // If user is logged in but no metadata, use defaults
      setVoteWeight(DEFAULT_VOTE_WEIGHT);
      setDisableSlider(false);
    } else {
      console.log("🔄 VoteWeightContext: No user or no hive account");
    }
  }, [hiveAccount, user]);

  // Update vote weight immediately when called (optimistic update)
  const updateVoteWeight = useCallback((newVoteWeight: number) => {
    setVoteWeight(newVoteWeight);
    setLastUpdated(Date.now());
  }, []);

  // Update disable slider preference immediately when called (optimistic update)
  const updateDisableSlider = useCallback((newDisableSlider: boolean) => {
    setDisableSlider(newDisableSlider);
    setLastUpdated(Date.now());
  }, []);

  // Refresh vote weight from blockchain
  const refreshVoteWeight = useCallback(() => {
    // This will trigger a re-fetch of the Hive account data
    // The useEffect above will handle updating the vote weight and disable slider preference
    setLastUpdated(Date.now());
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    voteWeight,
    disableSlider,
    isLoading,
    error,
    updateVoteWeight,
    updateDisableSlider,
    refreshVoteWeight,
  }), [voteWeight, disableSlider, isLoading, error, updateVoteWeight, updateDisableSlider, refreshVoteWeight]);

  return (
    <VoteWeightContext.Provider value={contextValue}>
      {children}
    </VoteWeightContext.Provider>
  );
}; 