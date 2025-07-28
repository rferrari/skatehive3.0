import { useMemo, useCallback } from 'react';
import { SkaterData, SortOption, AirdropUser, AirdropSummary, AirdropConfig } from '@/types/airdrop';
import { tokenDictionary } from '@/lib/utils/tokenDictionary';

interface AirdropManagerProps {
  leaderboardData: SkaterData[];
  config: AirdropConfig;
}

export const useAirdropManager = ({ leaderboardData, config }: AirdropManagerProps) => {
  const { sortOption, limit, selectedToken, totalAmount } = config;

  // Enhanced user processing with better validation
  const processedData = useMemo(() => {
    let workingData = [...leaderboardData];
    
    // Step 1: Apply special filters
    if (sortOption === 'has_voted_in_witness') {
      workingData = workingData.filter(user => user.has_voted_in_witness === true);
    } else if (sortOption === 'airdrop_the_poor') {
      workingData = workingData.filter(user => {
        const totalHiveValue = (user.hive_balance || 0) + 
                              (user.hbd_savings_balance || 0) + 
                              (user.hp_balance || 0);
        const isPoor = totalHiveValue < 100;
        const hasLowNFTs = (user.skatehive_nft_balance || 0) < 5;
        const hasLowGnars = (user.gnars_balance || 0) < 1;
        return isPoor && hasLowNFTs && hasLowGnars;
      });
    }
    
    // Step 2: Sort data (except for special filters)
    if (sortOption !== 'has_voted_in_witness' && sortOption !== 'airdrop_the_poor') {
      workingData.sort((a, b) => {
        const aVal = (a as any)[sortOption] ?? 0;
        const bVal = (b as any)[sortOption] ?? 0;
        return typeof aVal === 'number' ? bVal - aVal : String(bVal).localeCompare(String(aVal));
      });
    }
    
    // Step 3: Enhanced username validation
    workingData = workingData.filter(user => {
      const username = user.hive_author;
      if (!username || typeof username !== 'string') return false;
      if (username.length < 3 || username.length > 16) return false;
      if (/(donator|donation|bot|test|temp|placeholder|null|undefined)/i.test(username)) return false;
      // Check for valid Hive username format
      if (!/^[a-z0-9\-\.]+$/.test(username)) return false;
      return true;
    });
    
    // Step 4: Enhanced ETH address validation (only for ERC-20 tokens)
    const tokenInfo = tokenDictionary[selectedToken];
    const isERC20 = tokenInfo?.network !== 'hive';
    
    if (isERC20) {
      workingData = workingData.filter(user => {
        const ethAddress = user.eth_address;
        if (!ethAddress || typeof ethAddress !== 'string') return false;
        if (ethAddress.trim() === '' || ethAddress === 'null') return false;
        if (!ethAddress.startsWith('0x') || ethAddress.length !== 42) return false;
        if (ethAddress === '0x0000000000000000000000000000000000000000') return false;
        // Additional checksum validation could be added here
        return true;
      });
    }
    
    // Step 5: Remove duplicates by address/username
    const seen = new Set();
    workingData = workingData.filter(user => {
      const key = isERC20 ? user.eth_address.toLowerCase() : user.hive_author.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Step 6: Apply limit and return
    return workingData.slice(0, limit);
  }, [leaderboardData, sortOption, limit, selectedToken]);
  
  // Enhanced airdrop users with individual amounts
  const airdropUsers: AirdropUser[] = useMemo(() => {
    const amount = parseFloat(totalAmount) || 0;
    const perUserAmount = processedData.length > 0 ? amount / processedData.length : 0;
    
    return processedData.map(user => ({
      hive_author: user.hive_author,
      eth_address: user.eth_address,
      points: user.points,
      amount: perUserAmount.toFixed(6)
    }));
  }, [processedData, totalAmount]);
  
  const userCount = {
    total: leaderboardData.length,
    limited: processedData.length,
    eligible: leaderboardData.filter(user => {
      const tokenInfo = tokenDictionary[selectedToken];
      const isERC20 = tokenInfo?.network !== 'hive';
      
      if (isERC20) {
        return user.eth_address && 
               user.eth_address !== '0x0000000000000000000000000000000000000000';
      }
      return user.hive_author && user.hive_author.length >= 3;
    }).length
  };

  // Generate airdrop summary
  const summary: AirdropSummary = useMemo(() => {
    const amount = parseFloat(totalAmount) || 0;
    const tokenInfo = tokenDictionary[selectedToken];
    
    return {
      totalAmount: amount,
      perUserAmount: processedData.length > 0 ? amount / processedData.length : 0,
      recipientCount: processedData.length,
      tokenSymbol: selectedToken,
      // Gas estimation could be added here
    };
  }, [totalAmount, selectedToken, processedData.length]);

  // Validation helpers
  const validateConfig = useCallback(() => {
    const errors: string[] = [];
    
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      errors.push('Total amount must be greater than 0');
    }
    
    if (processedData.length === 0) {
      errors.push('No recipients match the current filter criteria');
    }
    
    const tokenInfo = tokenDictionary[selectedToken];
    if (!tokenInfo) {
      errors.push('Invalid token selected');
    }
    
    if (parseFloat(totalAmount) / processedData.length < 0.000001) {
      errors.push('Amount per user is too small (minimum 0.000001)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [totalAmount, processedData.length, selectedToken]);

  // Get excluded users for transparency
  const excludedUsers = useMemo(() => {
    const tokenInfo = tokenDictionary[selectedToken];
    const isERC20 = tokenInfo?.network !== 'hive';
    
    return leaderboardData.filter(user => {
      if (isERC20) {
        return !user.eth_address || 
               user.eth_address === '0x0000000000000000000000000000000000000000';
      }
      return !user.hive_author || user.hive_author.length < 3;
    });
  }, [leaderboardData, selectedToken]);
  
  return { 
    airdropUsers, 
    userCount, 
    processedData, 
    summary,
    validation: validateConfig(),
    excludedUsers
  };
};
