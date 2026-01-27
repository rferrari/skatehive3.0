"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import useEffectiveHiveUser from "@/hooks/useEffectiveHiveUser";
import { DEFAULT_VOTE_WEIGHT } from "@/lib/utils/constants";
import useHiveAccount from "@/hooks/useHiveAccount";
import { migrateLegacyMetadata } from "@/lib/utils/metadataMigration";

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
  const { handle: effectiveUser } = useEffectiveHiveUser();
  const { hiveAccount, isLoading, error } = useHiveAccount(effectiveUser || "");
  const [voteWeight, setVoteWeight] = useState(DEFAULT_VOTE_WEIGHT);
  const [disableSlider, setDisableSlider] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Extract vote weight and disable slider preference from Hive account metadata
  useEffect(() => {
    if (hiveAccount?.json_metadata) {
      try {
        const rawMetadata = JSON.parse(hiveAccount.json_metadata);
        const parsedMetadata = migrateLegacyMetadata(rawMetadata);
        const weight = parsedMetadata.extensions?.settings?.voteSettings?.default_voting_weight;
        const enableSlider = parsedMetadata.extensions?.settings?.voteSettings?.enable_slider;

        if (typeof weight === 'number' && weight >= 0) {
          setVoteWeight(Math.round(weight / 100));
        } else {
          setVoteWeight(DEFAULT_VOTE_WEIGHT);
        }

        if (typeof enableSlider === 'boolean') {
          setDisableSlider(!enableSlider);
        } else {
          setDisableSlider(false);
        }
      } catch (error) {
        console.error(
          "❌ VoteWeightContext: Failed to parse vote weight preferences from metadata:",
          error
        );
        setVoteWeight(DEFAULT_VOTE_WEIGHT);
        setDisableSlider(false);
      }
    } else if (effectiveUser) {
      setVoteWeight(DEFAULT_VOTE_WEIGHT);
      setDisableSlider(false);
    }
  }, [hiveAccount, effectiveUser]);

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
