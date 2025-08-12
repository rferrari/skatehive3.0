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

export interface ZoraCoinPageClientProps {
  address: string;
  initialCoinData: CoinData | null;
  error: string | null;
}
