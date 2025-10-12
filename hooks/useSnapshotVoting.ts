import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useToast } from '@chakra-ui/react';
import { castSnapshotVote, validateVoteEligibility, VoteResult } from '@/lib/services/snapshotVoting';

export interface UseSnapshotVotingReturn {
  vote: (spaceId: string, proposalId: string, choice: number, reason?: string) => Promise<VoteResult>;
  isVoting: boolean;
  lastVoteResult: VoteResult | null;
}

export const useSnapshotVoting = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const toast = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);

  const vote = useCallback(async (
    spaceId: string, 
    proposalId: string, 
    choice: number, 
    reason?: string
  ): Promise<VoteResult> => {
    console.log('🗳️ [useSnapshotVoting] Starting vote process:', {
      spaceId,
      proposalId,
      choice,
      reason,
      userAddress: address,
      isConnected,
      hasWalletClient: !!walletClient
    });

    if (!address) {
      const result: VoteResult = {
        success: false,
        error: 'No wallet connected'
      };
      
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to vote",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });

      setLastVoteResult(result);
      return result;
    }

    setIsVoting(true);
    
    try {
      // First validate if user can vote
      console.log('🗳️ [useSnapshotVoting] Validating vote eligibility');
      const eligibility = await validateVoteEligibility(spaceId, proposalId, address);
      
      if (!eligibility.canVote) {
        throw new Error(eligibility.reason || 'Cannot vote on this proposal');
      }

      console.log('🗳️ [useSnapshotVoting] User is eligible to vote, proceeding');

      // Cast the vote using Snapshot.js client
      const result = await castSnapshotVote(
        spaceId,
        proposalId,
        choice,
        reason
      );

      console.log('🗳️ [useSnapshotVoting] Vote result:', result);

      if (result.success) {
        toast({
          title: "Vote Signed Successfully! 🗳️",
          description: "Your vote signature has been created and will be counted by Snapshot",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Voting Failed",
          description: result.error || "Failed to cast vote",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      setLastVoteResult(result);
      return result;

    } catch (error: any) {
      console.error('🗳️ [useSnapshotVoting] Error in vote process:', error);
      
      const result: VoteResult = {
        success: false,
        error: error.message || 'Failed to cast vote'
      };

      toast({
        title: "Voting Error",
        description: result.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      setLastVoteResult(result);
      return result;
    } finally {
      setIsVoting(false);
    }
  }, [address, walletClient, toast]);

  return {
    vote,
    isVoting,
    lastVoteResult
  };
}