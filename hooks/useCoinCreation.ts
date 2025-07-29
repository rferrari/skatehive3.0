'use client';

import { useState, useCallback } from 'react';
import { createCoin, DeployCurrency, createMetadataBuilder, createZoraUploaderForCreator, setApiKey } from '@zoralabs/coins-sdk';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { useToast } from '@chakra-ui/react';
import { SKATEHIVE_PLATFORM_REFERRER } from '@/components/shared/search/constants';

export interface CoinCreationData {
  name: string;
  symbol: string;
  description: string;
  image: File;
  postAuthor: string;
  postPermlink: string;
}

export function useCoinCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const createCoinFromPost = useCallback(async (coinData: CoinCreationData) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    const apiKey = process.env.NEXT_PUBLIC_ZORA_API_KEY;
    if (!apiKey) {
      throw new Error('Zora API key not configured');
    }

    // Set the API key globally for the Zora SDK
    setApiKey(apiKey);

    setIsCreating(true);
    try {
      // Create metadata using Zora's metadata builder
      const { createMetadataParameters } = await createMetadataBuilder()
        .withName(coinData.name)
        .withSymbol(coinData.symbol)
        .withDescription(coinData.description)
        .withImage(coinData.image)
        .upload(createZoraUploaderForCreator(address));

      // Create the coin
      const coinParams = {
        ...createMetadataParameters,
        payoutRecipient: address,
        platformReferrer: SKATEHIVE_PLATFORM_REFERRER as Address,
        currency: DeployCurrency.ZORA, // Use ZORA as the trading currency
      };

      const result = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120, // Add 20% buffer to gas
      });

      toast({
        title: 'Coin created successfully!',
        description: `Your coin "${coinData.name}" has been deployed!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return {
        hash: result.hash,
        address: result.address,
        deployment: result.deployment,
      };

    } catch (error: any) {
      console.error('Failed to create coin:', error);
      
      toast({
        title: 'Failed to create coin',
        description: error.message || 'An error occurred while creating the coin',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [address, walletClient, publicClient, toast]);

  return {
    createCoinFromPost,
    isCreating,
  };
}
