'use client';

import { useState, useCallback } from 'react';
import { tradeCoin, TradeParameters, createTradeCall, getOnchainCoinDetails } from '@zoralabs/coins-sdk';
import { useAccount, useWalletClient, usePublicClient, useBalance } from 'wagmi';
import { Address, formatEther, formatUnits } from 'viem';
import { useToast } from '@chakra-ui/react';

export interface TradeConfig {
  fromToken: {
    type: 'eth' | 'erc20';
    address?: Address;
    amount: bigint;
  };
  toToken: {
    type: 'eth' | 'erc20';
    address?: Address;
  };
  slippage: number;
}

export function useZoraTrade() {
  const [isTrading, setIsTrading] = useState(false);
  const [tradeResult, setTradeResult] = useState<any>(null);
  
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  });

  const getTokenDecimals = useCallback(async (tokenAddress: Address): Promise<number> => {
    if (!publicClient) return 18; // Default fallback

    try {
      // Read decimals directly from contract
      const decimals = await publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            name: 'decimals',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: 'decimals', type: 'uint8' }],
          },
        ],
        functionName: 'decimals',
      });
      
      return Number(decimals);
    } catch (error) {
      return 18; // Default fallback
    }
  }, [publicClient]);

  const getTokenBalance = useCallback(async (tokenAddress: Address) => {
    if (!address || !publicClient) return BigInt(0);

    try {
      // Try the Zora SDK method first to get both balance and correct decimals
      try {
        const coinDetails = await getOnchainCoinDetails({
          coin: tokenAddress,
          user: address,
          publicClient,
        });
        
        if (coinDetails && coinDetails.balance !== undefined) {
          return coinDetails.balance;
        }
      } catch (error) {
        // Fallback to direct contract call
      }
      
      // Fallback: try to read balance directly from contract
      try {
        const balance = await publicClient.readContract({
          address: tokenAddress,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'owner', type: 'address' }],
              outputs: [{ name: 'balance', type: 'uint256' }],
            },
          ],
          functionName: 'balanceOf',
          args: [address],
        });
        
        return balance as bigint;
      } catch (contractError) {
        // Use fallback
      }
      
      return BigInt(0);
    } catch (error) {
      return BigInt(0);
    }
  }, [address, publicClient]);

    const getFormattedBalance = useCallback(async (
    type: 'eth' | 'erc20',
    tokenAddress?: Address,
    fallbackDecimals: number = 18
  ) => {
    if (!isConnected) return null;

    try {
      let balance: bigint;
      let symbol: string;
      let actualDecimals: number;

      if (type === 'eth') {
        balance = ethBalance?.value || BigInt(0);
        symbol = 'ETH';
        actualDecimals = 18;
      } else if (tokenAddress) {
        balance = await getTokenBalance(tokenAddress);
        symbol = 'TOKEN'; // Generic symbol for tokens
        // Get the actual decimals from the token contract
        actualDecimals = await getTokenDecimals(tokenAddress);
      } else {
        return null;
      }

      const formatted = type === 'eth' 
        ? formatEther(balance)
        : formatUnits(balance, actualDecimals);

      return {
        raw: balance,
        formatted,
        symbol,
        decimals: actualDecimals,
      };
    } catch (error) {
      // Return a default balance object instead of null to prevent UI errors
      return {
        raw: BigInt(0),
        formatted: '0',
        symbol: type === 'eth' ? 'ETH' : 'TOKEN',
        decimals: type === 'eth' ? 18 : fallbackDecimals,
      };
    }
  }, [isConnected, ethBalance, getTokenBalance, getTokenDecimals]);

  const getTradeQuote = useCallback(async (config: TradeConfig) => {
    try {
      const tradeParameters: TradeParameters = {
        sell: config.fromToken.type === 'eth' 
          ? { type: 'eth' }
          : { type: 'erc20', address: config.fromToken.address! },
        buy: config.toToken.type === 'eth'
          ? { type: 'eth' }
          : { type: 'erc20', address: config.toToken.address! },
        amountIn: config.fromToken.amount,
        slippage: config.slippage / 100,
        sender: address!,
      };

      const quote = await createTradeCall(tradeParameters);
      return quote;
    } catch (error) {
      return null;
    }
  }, [address]);

  const executeTrade = useCallback(async (config: TradeConfig) => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsTrading(true);
    setTradeResult(null);

    try {
      const tradeParameters: TradeParameters = {
        sell: config.fromToken.type === 'eth' 
          ? { type: 'eth' }
          : { type: 'erc20', address: config.fromToken.address! },
        buy: config.toToken.type === 'eth'
          ? { type: 'eth' }
          : { type: 'erc20', address: config.toToken.address! },
        amountIn: config.fromToken.amount,
        slippage: config.slippage / 100, // Convert percentage to decimal
        sender: address,
      };

      // Create account object properly for viem
      const account = walletClient.account;
      if (!account) {
        throw new Error('No account found in wallet client');
      }

      const receipt = await tradeCoin({
        tradeParameters,
        walletClient,
        account,
        publicClient,
        validateTransaction: true,
      });

      setTradeResult(receipt);
      
      toast({
        title: 'Trade successful!',
        description: `Transaction hash: ${receipt.transactionHash}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return receipt;

    } catch (error: any) {
      toast({
        title: 'Trade failed',
        description: error.message || 'An error occurred during the trade',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      throw error;
    } finally {
      setIsTrading(false);
    }
  }, [isConnected, address, walletClient, publicClient, toast]);

  const resetTrade = useCallback(() => {
    setTradeResult(null);
    setIsTrading(false);
  }, []);

  // Function to refresh balances (useful after trades)
  const refreshBalance = useCallback(async (
    type: 'eth' | 'erc20',
    tokenAddress?: Address
  ) => {
    return await getFormattedBalance(type, tokenAddress);
  }, [getFormattedBalance]);

  return {
    executeTrade,
    getTradeQuote,
    getFormattedBalance,
    getTokenBalance,
    getTokenDecimals,
    refreshBalance,
    isTrading,
    tradeResult,
    resetTrade,
    isConnected,
    ethBalance,
  };
}
