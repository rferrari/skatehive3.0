"use client";
import { useVoteWeightContext } from "@/contexts/VoteWeightContext";

export default function useVoteWeight(username: string) {
  const { voteWeight, isLoading, error } = useVoteWeightContext();
  
  // Return the vote weight from the global context
  // The username parameter is kept for backward compatibility but not used
  return voteWeight;
} 