import { formatEther } from 'viem';

// Calculate minimum bid amount
export const calculateMinBid = (currentBid: bigint, reservePrice: bigint, incrementPercent: string): bigint => {
  if (currentBid === 0n) {
    return reservePrice;
  }
  const incrementBigInt = BigInt(incrementPercent);
  return currentBid + (currentBid * incrementBigInt) / 100n;
};

// Check if auction is active
export const isAuctionActive = (endTime: string): boolean => {
  return parseInt(endTime) * 1000 > Date.now();
};

// Format bid amount for display
export const formatBidAmount = (amount: bigint): string => {
  return Number(formatEther(amount)).toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
};

// Handle auction errors
export const handleAuctionError = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('minimum_bid_not_met') || message.includes('bid too low')) {
    return 'Bid amount is too low';
  }
  if (message.includes('auction_over') || message.includes('auction has ended')) {
    return 'Auction has ended';
  }
  if (message.includes('auction_settled') || message.includes('already settled')) {
    return 'Auction already settled';
  }
  if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
    return 'Insufficient wallet balance';
  }
  if (message.includes('user denied') || message.includes('user rejected')) {
    return 'Transaction cancelled by user';
  }
  if (message.includes('network') || message.includes('rpc')) {
    return 'Network error, please try again';
  }
  
  return 'Transaction failed';
};

// Retry transaction with exponential backoff
export const retryTransaction = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries reached');
};

// Check if bid meets minimum requirements
export const validateBid = (
  bidAmount: string, 
  currentBid: bigint, 
  reservePrice: bigint, 
  incrementPercent: string
): { isValid: boolean; error?: string } => {
  const bidValue = parseFloat(bidAmount);
  
  if (isNaN(bidValue) || bidValue <= 0) {
    return { isValid: false, error: 'Invalid bid amount' };
  }
  
  const minBid = calculateMinBid(currentBid, reservePrice, incrementPercent);
  const minBidEth = parseFloat(formatEther(minBid));
  
  if (bidValue < minBidEth) {
    return { 
      isValid: false, 
      error: `Minimum bid is ${formatEther(minBid)} ETH` 
    };
  }
  
  return { isValid: true };
};

// Format time remaining
export const formatTimeRemaining = (endTime: string): string => {
  const now = Date.now();
  const end = parseInt(endTime) * 1000;
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// Get auction status
export const getAuctionStatus = (auction: any): 'active' | 'ended' | 'settled' => {
  if (auction.settled) return 'settled';
  if (!isAuctionActive(auction.endTime)) return 'ended';
  return 'active';
};
