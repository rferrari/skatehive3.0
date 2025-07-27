import { VideoPart } from './VideoPart';

export interface SkatehiveExtensions {
  wallets?: {
    primary_wallet?: string;
    custody_address?: string;
    farcaster_verified_wallets?: string[];
    additional?: string[];
    btc_address?: string;
  };
  farcaster?: {
    fid?: number;
    username?: string;
  };
  video_parts?: VideoPart[];
  other?: Record<string, any>;
  settings?: {
    voteSettings?: {
      default_voting_weight: number;
      enable_slider: boolean;
    };
    appSettings?: Record<string, any>;
  };
}

export interface SkatehiveJsonMetadata {
  profile?: {
    name?: string;
    about?: string;
    location?: string;
    website?: string;
    profile_image?: string;
    cover_image?: string;
    version?: number;
  };
  extensions?: SkatehiveExtensions;
}
