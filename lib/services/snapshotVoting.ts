import { checkUserVote, getUserVotingPower } from '../utils/snapshotUtils';
import { SNAPSHOT_CONFIG, parseSnapshotError } from '../config/snapshot';
import snapshot from '@snapshot-labs/snapshot.js';
import { Web3Provider } from '@ethersproject/providers';

export interface VotePayload {
  space: string;
  proposal: string;
  type: string;
  choice: number;
  app: string;
  reason?: string;
}

export interface VoteResult {
  success: boolean;
  error?: string;
  receipt?: any;
}

/**
 * Cast a vote on a Snapshot proposal - simplified like your working code
 */
export async function castSnapshotVote(
  spaceId: string,
  proposalId: string,
  choice: number,
  reason?: string
): Promise<VoteResult> {
  try {
    console.log('🗳️ [SnapshotService] Starting vote process:', {
      spaceId,
      proposalId,
      choice,
      reason
    });

    // Check if window.ethereum exists
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }

    // Create Web3Provider directly from window.ethereum (exactly like the docs)
    const web3 = new Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const [account] = await web3.listAccounts();

    if (!account) {
      throw new Error('No account connected');
    }

    console.log('🗳️ [SnapshotService] Connected account:', account);

    // Initialize Snapshot client
    const client = new snapshot.Client712(SNAPSHOT_CONFIG.HUB_URL);

    // Create vote message (exact same format as your working code)
    const voteMessage = {
      space: spaceId,
      proposal: proposalId,
      type: 'single-choice' as const,
      choice: choice,
      reason: reason || '',
      app: 'Skatehive App'
    };

    console.log('🗳️ [SnapshotService] Vote message:', voteMessage);

    // Use Snapshot.js client to vote (same as your working code)
    const receipt = await client.vote(web3, account, voteMessage);

    console.log('🗳️ [SnapshotService] Vote submitted successfully:', receipt);

    return {
      success: true,
      receipt
    };

  } catch (error: any) {
    console.error('🗳️ [SnapshotService] Error voting:', error);
    
    const errorMessage = parseSnapshotError(error);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Validate if user can vote on a proposal
 */
export async function validateVoteEligibility(
  spaceId: string,
  proposalId: string,
  userAddress: string
): Promise<{
  canVote: boolean;
  reason?: string;
  votingPower?: number;
}> {
  try {
    console.log('🗳️ [SnapshotService] Validating vote eligibility:', {
      spaceId,
      proposalId,
      userAddress
    });

    // Check if user has already voted
    const existingVote = await checkUserVote(proposalId, userAddress);
    if (existingVote) {
      return {
        canVote: false,
        reason: 'Already voted'
      };
    }

    // Check voting power
    const votingPower = await getUserVotingPower(userAddress, spaceId, proposalId);
    if (votingPower <= 0) {
      return {
        canVote: false,
        reason: 'No voting power',
        votingPower: 0
      };
    }

    console.log('🗳️ [SnapshotService] Vote eligibility validated:', {
      canVote: true,
      votingPower
    });

    return {
      canVote: true,
      votingPower
    };

  } catch (error) {
    console.error('🗳️ [SnapshotService] Error validating vote eligibility:', error);
    return {
      canVote: false,
      reason: 'Error checking eligibility'
    };
  }
}