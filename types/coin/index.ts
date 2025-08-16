export interface CoinData {
  address: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  videoUrl?: string;
  hasVideo?: boolean;
  marketCap?: string;
  totalSupply?: string;
  uniqueHolders?: number;
  createdAt?: string;
  creatorAddress?: string;
  volume24h?: string;
  blurDataURL?: string;
  creatorProfile?: {
    handle?: string;
    avatar?: {
      previewImage?: {
        small?: string;
        medium?: string;
      };
    };
  };
}

export interface UserBalance {
  raw: bigint;
  formatted: string;
  symbol: string;
  decimals: number;
}

export interface CoinHolder {
  ownerAddress: string;
  balance: string;
  ownerProfile?: {
    handle?: string;
    avatar?: {
      previewImage?: {
        small?: string;
        medium?: string;
      };
    };
  };
}

export interface CoinHoldersData {
  holders: CoinHolder[];
  hasNextPage: boolean;
  endCursor?: string;
  totalCount?: number;
}

export interface CoinComment {
  commentId: string;
  nonce: string;
  userAddress: string;
  txHash: string;
  comment: string;
  timestamp: number;
  userProfile?: {
    id: string;
    handle: string;
    avatar?: {
      previewImage: {
        blurhash?: string;
        small: string;
        medium: string;
      };
    };
  };
  replies?: {
    count: number;
    edges: Array<{
      node: CoinComment;
    }>;
  };
}

export interface CoinCommentsData {
  comments: CoinComment[];
  hasNextPage: boolean;
  endCursor?: string;
  totalCount: number;
}

export interface ZoraCoinPageClientProps {
  address: string;
  initialCoinData: CoinData | null;
  error: string | null;
}
