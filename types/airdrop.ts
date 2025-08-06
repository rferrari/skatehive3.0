export type SortOption =
  | "points"
  | "hp_balance" 
  | "hive_balance"
  | "hbd_savings_balance"
  | "posts_score"
  | "has_voted_in_witness"
  | "gnars_balance"
  | "skatehive_nft_balance"
  | "gnars_votes"
  | "giveth_donations_usd"
  | "airdrop_the_poor";

export type TransactionState = 
  | 'idle' 
  | 'preparing'
  | 'approval-pending'
  | 'approval-confirming'
  | 'transfer-pending'
  | 'transfer-confirming'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TransactionStatus {
  state: TransactionState;
  message: string;
  hash?: string;
  error?: string;
  progress?: number; // 0-100
  gasEstimate?: string;
  totalCost?: string;
  blockNumber?: number;
  confirmations?: number;
}

export interface AirdropUser {
  hive_author: string;
  eth_address: string;
  points: number;
  amount?: string; // Individual amount for this user
}

export interface AirdropSummary {
  totalAmount: number;
  perUserAmount: number;
  recipientCount: number;
  tokenSymbol: string;
  estimatedGas?: string;
  estimatedCost?: string;
}

export interface AirdropConfig {
  sortOption: SortOption;
  limit: number;
  selectedToken: string;
  totalAmount: string;
  customMessage: string;
  enablePreviews: boolean;
  confirmationRequired: boolean;
  includeSkateHive?: boolean;
  isWeightedAirdrop?: boolean;
}

export interface ERC20AirdropParams {
  token: string;
  recipients: string[];
  amounts: string[];
  totalAmount: number;
  updateStatus: (status: Partial<TransactionStatus>) => void;
  writeContract: any;
  account: any;
  onProgress?: (step: string, progress: number) => void;
}

export interface HiveAirdropParams {
  token: string;
  recipients: AirdropUser[];
  totalAmount: number;
  customMessage?: string;
  user: any;
  updateStatus: (status: Partial<TransactionStatus>) => void;
  onProgress?: (step: string, progress: number) => void;
  aiohaUser?: any;
  aiohaInstance?: any;
}
