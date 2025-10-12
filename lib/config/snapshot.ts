/**
 * Snapshot configuration and constants for production
 */

export const SNAPSHOT_CONFIG = {
  // Main Snapshot hub endpoint
  HUB_URL: 'https://hub.snapshot.org',
  
  // GraphQL endpoint
  GRAPHQL_URL: 'https://hub.snapshot.org/graphql',
  
  // App identifier for votes cast through Skatehive (using standard Snapshot format)
  APP_NAME: 'snapshot-v2',
  
  // Default vote privacy setting
  DEFAULT_PRIVACY: 'none',
  
  // Vote refresh delay (how long to wait before refreshing proposal data after voting)
  VOTE_REFRESH_DELAY: 2000, // 2 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Cache settings
  PROPOSAL_CACHE_TTL: 30000, // 30 seconds
} as const;

export const VOTE_ERRORS = {
  NO_WALLET: 'No wallet connected',
  USER_REJECTED: 'Vote cancelled by user',
  INSUFFICIENT_POWER: 'Insufficient voting power',
  ALREADY_VOTED: 'You have already voted on this proposal',
  VOTING_ENDED: 'Voting period has ended',
  VOTING_NOT_STARTED: 'Voting has not started yet',
  INVALID_PROPOSAL: 'Invalid proposal',
  NETWORK_ERROR: 'Network error, please try again',
  UNKNOWN_ERROR: 'Failed to cast vote',
} as const;

/**
 * Parse error messages from Snapshot API responses
 */
export function parseSnapshotError(error: any): string {
  const errorMessage = error?.message || error?.toString() || '';
  
  if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
    return VOTE_ERRORS.USER_REJECTED;
  } else if (errorMessage.includes('insufficient')) {
    return VOTE_ERRORS.INSUFFICIENT_POWER;
  } else if (errorMessage.includes('already voted')) {
    return VOTE_ERRORS.ALREADY_VOTED;
  } else if (errorMessage.includes('ended')) {
    return VOTE_ERRORS.VOTING_ENDED;
  } else if (errorMessage.includes('not started')) {
    return VOTE_ERRORS.VOTING_NOT_STARTED;
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return VOTE_ERRORS.NETWORK_ERROR;
  } else if (errorMessage) {
    return errorMessage;
  }
  
  return VOTE_ERRORS.UNKNOWN_ERROR;
}

/**
 * Validate if a proposal supports basic voting (For/Against/Abstain)
 */
export function isBasicVotingProposal(choices: string[]): boolean {
  if (choices.length < 2 || choices.length > 4) return false;
  
  const lowerChoices = choices.map(c => c.toLowerCase());
  
  // Check for common voting patterns
  const patterns = [
    // For/Against pattern
    { for: ['for', 'yes', 'approve'], against: ['against', 'no', 'reject'] },
    // Accept/Reject pattern  
    { for: ['accept', 'approve'], against: ['reject', 'deny'] },
  ];
  
  for (const pattern of patterns) {
    const hasFor = lowerChoices.some(choice => 
      pattern.for.some(keyword => choice.includes(keyword))
    );
    const hasAgainst = lowerChoices.some(choice => 
      pattern.against.some(keyword => choice.includes(keyword))
    );
    
    if (hasFor && hasAgainst) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get vote button configuration for a choice
 */
export function getVoteButtonConfig(choice: string, index: number) {
  const lowerChoice = choice.toLowerCase();
  
  if (lowerChoice.includes('for') || lowerChoice.includes('yes') || lowerChoice.includes('approve')) {
    return {
      colorScheme: 'green',
      icon: '✓',
      label: 'For',
      priority: 1
    };
  } else if (lowerChoice.includes('against') || lowerChoice.includes('no') || lowerChoice.includes('reject')) {
    return {
      colorScheme: 'red', 
      icon: '✗',
      label: 'Against',
      priority: 2
    };
  } else if (lowerChoice.includes('abstain') || lowerChoice.includes('skip')) {
    return {
      colorScheme: 'gray',
      icon: '−',
      label: 'Abstain',
      priority: 3
    };
  } else {
    // Default for other choices
    return {
      colorScheme: 'blue',
      icon: `${index + 1}`,
      label: choice.length > 10 ? `${choice.slice(0, 10)}...` : choice,
      priority: index + 4
    };
  }
}