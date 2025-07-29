import { useState, useCallback } from 'react';
import { tradeCoin, TradeParameters, createTradeCall } from '@zoralabs/coins-sdk';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Address } from 'viem';
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
      console.error('Failed to get trade quote:', error);
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

      console.log('Executing trade with parameters:', tradeParameters);

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
      console.error('Trade execution failed:', error);
      
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

  return {
    executeTrade,
    getTradeQuote,
    isTrading,
    tradeResult,
    resetTrade,
    isConnected,
  };
}
