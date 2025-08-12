'use client';

import { useState, useCallback } from 'react';
import { updateCoinURI, updateCoinURICall } from '@zoralabs/coins-sdk';
import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain } from 'wagmi';
import { Address } from 'viem';
import { useToast } from '@chakra-ui/react';
import { base } from 'wagmi/chains';

export interface UpdateCoinMetadataConfig {
  coin: Address;
  newURI: string;
}

export function useCoinMetadataUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: base.id });
  const publicClient = usePublicClient({ chainId: base.id });
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const toast = useToast();
  const updateCoinMetadata = useCallback(async (config: UpdateCoinMetadataConfig) => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to update coin metadata',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!walletClient || !publicClient) {
      toast({
        title: 'Client not ready',
        description: 'Please wait for the wallet to be ready',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Ensure we're on Base chain
    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id });
      } catch (error) {
        toast({
          title: 'Chain switch failed',
          description: 'Please switch to Base network',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    // Validate URI format
    if (!config.newURI.startsWith('ipfs://') && !config.newURI.startsWith('https://')) {
      toast({
        title: 'Invalid URI',
        description: 'URI must start with ipfs:// or https://',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      const result = await updateCoinURI(
        {
          coin: config.coin,
          newURI: config.newURI,
        },
        walletClient,
        publicClient
      );

      setUpdateResult(result);

      toast({
        title: 'Metadata Updated',
        description: `Coin metadata has been successfully updated. Transaction: ${result.hash}`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      });

      return result;
    } catch (error: any) {
      console.error('Error updating coin metadata:', error);
      
      let errorMessage = 'Failed to update coin metadata';
      
      if (error.message?.includes('OnlyOwner')) {
        errorMessage = 'Only the coin owner can update metadata';
      } else if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees';
      }

      toast({
        title: 'Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 10000,
        isClosable: true,
      });

      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [isConnected, walletClient, publicClient, chainId, switchChain, toast]);

  const resetUpdate = useCallback(() => {
    setUpdateResult(null);
    setIsUpdating(false);
  }, []);

  return {
    updateCoinMetadata,
    isUpdating,
    updateResult,
    resetUpdate,
    isConnected,
  };
}
