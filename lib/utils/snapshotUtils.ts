import { useState, useEffect, useCallback } from 'react';

// Types for Snapshot proposal data
export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  state: 'pending' | 'active' | 'closed';
  author: string;
  created: number;
  scores: number[];
  scores_total: number;
  space: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: string;
}

export interface SnapshotVote {
  id: string;
  voter: string;
  choice: number;
  vp: number;
  created: number;
}

// Extract proposal ID from Snapshot URLs
export const extractSnapshotProposalId = (url: string): string | null => {
  try {
    // Handle different Snapshot URL formats:
    // https://snapshot.org/#/space.eth/proposal/0x123...
    // https://demo.snapshot.org/#/space.eth/proposal/0x123...
    // https://snapshot.box/#/space.eth/proposal/0x123...
    
    const urlObj = new URL(url);
    
    // Check if it's a Snapshot domain
    if (!urlObj.hostname.includes('snapshot')) {
      return null;
    }
    
    // Extract from hash fragment or path
    const fragment = urlObj.hash || urlObj.pathname;
    
    // Look for proposal ID pattern
    const proposalMatch = fragment.match(/\/proposal\/([a-zA-Z0-9]+)/);
    
    if (proposalMatch && proposalMatch[1]) {
      return proposalMatch[1];
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Check if URL is a Snapshot proposal URL
export const isSnapshotUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('snapshot') && url.includes('/proposal/');
  } catch (error) {
    return false;
  }
};

// Fetch proposal data from Snapshot GraphQL API
export const fetchSnapshotProposal = async (proposalId: string): Promise<SnapshotProposal | null> => {
  try {
    const query = `
      query Proposal($id: String!) {
        proposal(id: $id) {
          id
          title
          body
          choices
          start
          end
          state
          author
          created
          scores
          scores_total
          type
          space {
            id
            name
            avatar
          }
        }
      }
    `;
    
    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: proposalId },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }

    return data.data?.proposal || null;
  } catch (error) {
    console.error('Error fetching Snapshot proposal:', error);
    return null;
  }
};

// Check if user has voted on a proposal
export const checkUserVote = async (proposalId: string, userAddress: string): Promise<SnapshotVote | null> => {
  try {
    const query = `
      query Vote($proposal: String!, $voter: String!) {
        votes(
          where: { proposal: $proposal, voter: $voter }
          first: 1
        ) {
          id
          voter
          choice
          vp
          created
        }
      }
    `;

    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { 
          proposal: proposalId, 
          voter: userAddress.toLowerCase() 
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }

    const votes = data.data?.votes || [];
    return votes.length > 0 ? votes[0] : null;
  } catch (error) {
    console.error('Error checking user vote:', error);
    return null;
  }
};

// Get voting power for a user on a specific proposal
export const getUserVotingPower = async (
  userAddress: string, 
  spaceId: string, 
  proposalId: string
): Promise<number> => {
  try {
    const query = `
      query VotingPower($voter: String!, $space: String!, $proposal: String!) {
        vp(voter: $voter, space: $space, proposal: $proposal) {
          vp
        }
      }
    `;

    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { 
          voter: userAddress.toLowerCase(),
          space: spaceId,
          proposal: proposalId
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return 0;
    }

    return data.data?.vp?.vp || 0;
  } catch (error) {
    console.error('Error fetching voting power:', error);
    return 0;
  }
};

// Format timestamp to human readable format
export const formatSnapshotDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate proposal status and time remaining
export const getProposalStatus = (proposal: SnapshotProposal) => {
  const now = Math.floor(Date.now() / 1000);
  const startTime = proposal.start;
  const endTime = proposal.end;
  
  if (now < startTime) {
    return {
      status: 'pending' as const,
      timeText: `Starts ${formatSnapshotDate(startTime)}`,
    };
  } else if (now >= startTime && now < endTime) {
    const timeLeft = endTime - now;
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    
    return {
      status: 'active' as const,
      timeText: days > 0 ? `${days}d ${hours}h left` : `${hours}h left`,
    };
  } else {
    return {
      status: 'closed' as const,
      timeText: `Ended ${formatSnapshotDate(endTime)}`,
    };
  }
};

// Hook to fetch and manage Snapshot proposal data
export const useSnapshotProposal = (url: string) => {
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProposal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const proposalId = extractSnapshotProposalId(url);
      
      if (!proposalId) {
        setProposal(null);
        setError('Invalid Snapshot URL');
        return;
      }

      const proposalData = await fetchSnapshotProposal(proposalId);
      
      if (proposalData) {
        setProposal(proposalData);
      } else {
        setProposal(null);
        setError('Proposal not found');
      }
    } catch (err) {
      setProposal(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch proposal');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (isSnapshotUrl(url)) {
      fetchProposal();
    } else {
      setProposal(null);
      setLoading(false);
    }
  }, [url, fetchProposal, refreshKey]); // refreshKey triggers re-fetch when refresh() is called

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return { proposal, loading, error, refresh };
};