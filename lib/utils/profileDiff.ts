import { SkatehiveJsonMetadata } from '@/types/ProfileMetadata';

export interface ProfileDiffItem {
  path: string;
  label: string;
  before: string | null;
  after: string | null;
  type: 'added' | 'modified' | 'unchanged';
}

export interface ProfileDiff {
  changes: ProfileDiffItem[];
  hasChanges: boolean;
}

export function generateProfileDiff(
  currentMetadata: any,
  newMetadata: SkatehiveJsonMetadata,
  ethereumAddress?: string,
  farcasterProfile?: {
    fid: number;
    username: string;
    custody?: string;
    verifications?: string[];
  }
): ProfileDiff {
  const changes: ProfileDiffItem[] = [];

  // Helper function to format values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      // Special handling for video parts
      if (value.length > 0 && value[0] && typeof value[0] === 'object' && value[0].name) {
        return `${value.length} video part${value.length !== 1 ? 's' : ''}`;
      }
      // Special handling for wallet arrays (mixed Ethereum and other addresses)
      if (value.length > 0 && typeof value[0] === 'string') {
        const ethWallets = value.filter((addr: string) => addr.startsWith('0x'));
        const otherWallets = value.filter((addr: string) => !addr.startsWith('0x'));
        
        if (ethWallets.length > 0 && otherWallets.length > 0) {
          return `${ethWallets.length} ETH wallet${ethWallets.length !== 1 ? 's' : ''}, ${otherWallets.length} other${otherWallets.length !== 1 ? 's' : ''}`;
        } else if (ethWallets.length > 0) {
          return `${ethWallets.length} ETH wallet${ethWallets.length !== 1 ? 's' : ''}`;
        } else if (otherWallets.length > 0) {
          return `${otherWallets.length} wallet${otherWallets.length !== 1 ? 's' : ''}`;
        }
      }
      return value.join(', ');
    }
    if (typeof value === 'object') {
      // Special handling for vote settings
      if (value.default_voting_weight !== undefined && value.enable_slider !== undefined) {
        return `Weight: ${value.default_voting_weight / 100}%, Slider: ${value.enable_slider ? 'enabled' : 'disabled'}`;
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Helper function to get nested value
  const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to normalize Ethereum addresses
  const normalizeAddress = (address: string | null | undefined): string | null => {
    if (!address || typeof address !== 'string') return null;
    // Only normalize if it looks like an Ethereum address
    if (address.startsWith('0x') && address.length === 42) {
      return address.toLowerCase();
    }
    return address;
  };

  // Helper function to compare wallet arrays
  const compareWalletArrays = (current: string[] | null, incoming: string[] | null): boolean => {
    if (!current && !incoming) return true;
    if (!current || !incoming) return false;
    if (current.length !== incoming.length) return false;
    
    const normalizedCurrent = current.map(addr => normalizeAddress(addr) || addr).sort();
    const normalizedIncoming = incoming.map(addr => normalizeAddress(addr) || addr).sort();
    
    return JSON.stringify(normalizedCurrent) === JSON.stringify(normalizedIncoming);
  };

  // Check Ethereum wallet changes
  if (ethereumAddress) {
    const currentWallet = getValue(currentMetadata, 'extensions.wallets.primary_wallet');
    
    // Normalize addresses for comparison
    const normalizedCurrent = normalizeAddress(currentWallet);
    const normalizedNew = normalizeAddress(ethereumAddress);
    
    // Always show the wallet status
    if (normalizedCurrent !== normalizedNew) {
      changes.push({
        path: 'extensions.wallets.primary_wallet',
        label: 'Primary Ethereum Wallet',
        before: formatValue(currentWallet),
        after: ethereumAddress,
        type: currentWallet ? 'modified' : 'added'
      });
    } else if (currentWallet) {
      // Wallet is the same, show as unchanged
      changes.push({
        path: 'extensions.wallets.primary_wallet',
        label: 'Primary Ethereum Wallet',
        before: formatValue(currentWallet),
        after: formatValue(currentWallet),
        type: 'unchanged'
      });
    }

    // Check legacy eth_address
    const currentEthAddress = getValue(currentMetadata, 'extensions.eth_address');
    const normalizedCurrentEth = normalizeAddress(currentEthAddress);
    
    if (normalizedCurrentEth !== normalizedNew) {
      changes.push({
        path: 'extensions.eth_address',
        label: 'Legacy Ethereum Address',
        before: formatValue(currentEthAddress),
        after: ethereumAddress,
        type: currentEthAddress ? 'modified' : 'added'
      });
    } else if (currentEthAddress) {
      // Legacy address is the same, show as unchanged
      changes.push({
        path: 'extensions.eth_address',
        label: 'Legacy Ethereum Address',
        before: formatValue(currentEthAddress),
        after: formatValue(currentEthAddress),
        type: 'unchanged'
      });
    }
  }

  // Check Farcaster changes
  if (farcasterProfile) {
    const currentFid = getValue(currentMetadata, 'extensions.farcaster.fid');
    if (currentFid !== farcasterProfile.fid) {
      changes.push({
        path: 'extensions.farcaster.fid',
        label: 'Farcaster ID',
        before: formatValue(currentFid),
        after: String(farcasterProfile.fid),
        type: currentFid ? 'modified' : 'added'
      });
    } else if (currentFid) {
      changes.push({
        path: 'extensions.farcaster.fid',
        label: 'Farcaster ID',
        before: formatValue(currentFid),
        after: formatValue(currentFid),
        type: 'unchanged'
      });
    }

    const currentUsername = getValue(currentMetadata, 'extensions.farcaster.username');
    if (currentUsername !== farcasterProfile.username) {
      changes.push({
        path: 'extensions.farcaster.username',
        label: 'Farcaster Username',
        before: formatValue(currentUsername),
        after: farcasterProfile.username,
        type: currentUsername ? 'modified' : 'added'
      });
    } else if (currentUsername) {
      changes.push({
        path: 'extensions.farcaster.username',
        label: 'Farcaster Username',
        before: formatValue(currentUsername),
        after: formatValue(currentUsername),
        type: 'unchanged'
      });
    }

    if (farcasterProfile.custody) {
      const currentCustody = getValue(currentMetadata, 'extensions.farcaster.custody_address');
      const normalizedCurrentCustody = normalizeAddress(currentCustody);
      const normalizedNewCustody = normalizeAddress(farcasterProfile.custody);
      
      if (normalizedCurrentCustody !== normalizedNewCustody) {
        changes.push({
          path: 'extensions.farcaster.custody_address',
          label: 'Farcaster Custody Address',
          before: formatValue(currentCustody),
          after: farcasterProfile.custody,
          type: currentCustody ? 'modified' : 'added'
        });
      } else if (currentCustody) {
        changes.push({
          path: 'extensions.farcaster.custody_address',
          label: 'Farcaster Custody Address',
          before: formatValue(currentCustody),
          after: formatValue(currentCustody),
          type: 'unchanged'
        });
      }
    }

    if (farcasterProfile.verifications && farcasterProfile.verifications.length > 0) {
      const currentVerifications = getValue(currentMetadata, 'extensions.farcaster.verified_wallets');
      
      // Use smart comparison for wallet arrays
      if (!compareWalletArrays(currentVerifications, farcasterProfile.verifications)) {
        changes.push({
          path: 'extensions.farcaster.verified_wallets',
          label: 'Farcaster Verified Wallets',
          before: formatValue(currentVerifications),
          after: formatValue(farcasterProfile.verifications),
          type: currentVerifications && currentVerifications.length > 0 ? 'modified' : 'added'
        });
      } else if (currentVerifications && currentVerifications.length > 0) {
        changes.push({
          path: 'extensions.farcaster.verified_wallets',
          label: 'Farcaster Verified Wallets',
          before: formatValue(currentVerifications),
          after: formatValue(currentVerifications),
          type: 'unchanged'
        });
      }
    }
  }

  // Check for important existing values that won't change
  const importantFields = [
    { path: 'extensions.video_parts', label: 'Video Parts' },
    { path: 'extensions.settings.voteSettings', label: 'Vote Settings' },
    { path: 'extensions.wallets.btc_address', label: 'Bitcoin Address' },
    { path: 'profile.name', label: 'Display Name' },
    { path: 'profile.about', label: 'Bio' },
    { path: 'profile.location', label: 'Location' },
  ];

  importantFields.forEach(field => {
    const currentValue = getValue(currentMetadata, field.path);
    if (currentValue !== null && currentValue !== undefined) {
      const formattedValue = formatValue(currentValue);
      if (formattedValue) {
        changes.push({
          path: field.path,
          label: field.label,
          before: formattedValue,
          after: formattedValue,
          type: 'unchanged'
        });
      }
    }
  });

  return {
    changes,
    hasChanges: changes.some(change => change.type !== 'unchanged')
  };
}
