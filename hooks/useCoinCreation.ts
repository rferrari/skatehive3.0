'use client';

import { useState, useCallback } from 'react';
import { createCoin, DeployCurrency, createMetadataBuilder, createZoraUploaderForCreator, setApiKey } from '@zoralabs/coins-sdk';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { useToast } from '@chakra-ui/react';
import { SKATEHIVE_PLATFORM_REFERRER } from '@/components/shared/search/constants';
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { Operation } from "@hiveio/dhive";

export interface CoinCreationData {
  name: string;
  symbol: string;
  description: string;
  image: File;
  postAuthor: string;
  postPermlink: string;
  postBody: string;
  postJsonMetadata: string;
  postTitle: string;
  postParentAuthor: string;
  postParentPermlink: string;
}

export function useCoinCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { aioha, user } = useAioha();
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

          // Check if the coin creator is the same as the post author
          const isPostAuthor = user && user.toLowerCase() === coinData.postAuthor.toLowerCase();
          
          if (isPostAuthor && result.address && aioha) {
            try {
              // Generate Zora URL for the coin
              const zoraUrl = `https://zora.co/collect/base:${result.address}`;
              
              // Add Zora URL to the post body
              const updatedBody = `${coinData.postBody}\n\n---\n🪙 **This post is now a Zora Coin!** \n[Collect it here: ${zoraUrl}](${zoraUrl})`;
              
              // Parse and update metadata
              let updatedMetadata: any = {};
              try {
                updatedMetadata = JSON.parse(coinData.postJsonMetadata || '{}');
              } catch (e) {
                console.warn('Failed to parse post metadata, using empty object');
              }
              
              // Add zora_coin_address to metadata
              updatedMetadata.zora_coin_address = result.address;
              updatedMetadata.zora_coin_url = zoraUrl;
              
              // Create edit operation with correct parent information
              const operation: Operation = [
                'comment',
                {
                  parent_author: coinData.postParentAuthor || '',
                  parent_permlink: coinData.postParentPermlink || '',
                  author: coinData.postAuthor,
                  permlink: coinData.postPermlink,
                  title: coinData.postTitle || '',
                  body: updatedBody,
                  json_metadata: JSON.stringify(updatedMetadata),
                },
              ];

          // Broadcast the edit using Aioha
          const editResult = await aioha.signAndBroadcastTx([operation], KeyTypes.Posting);
          
          if (editResult && !editResult.error) {
            toast({
              title: 'Post updated with Zora coin!',
              description: 'Your post has been updated to include the coin collection link.',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          } else {
            console.warn('Failed to update post with coin link:', editResult);
            toast({
              title: 'Coin created but post update failed',
              description: 'Your coin was created successfully, but we couldn\'t update the post automatically.',
              status: 'warning',
              duration: 7000,
              isClosable: true,
            });
          }
        } catch (postEditError) {
          console.error('Failed to update post with coin link:', postEditError);
          toast({
            title: 'Coin created but post update failed',
            description: 'Your coin was created successfully, but we couldn\'t update the post automatically.',
            status: 'warning',
            duration: 7000,
            isClosable: true,
          });
        }
      }

      toast({
        title: 'Coin created successfully!',
        description: `Your coin "${coinData.name}" has been deployed!${isPostAuthor ? ' The original post has been updated.' : ''}`,
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
  }, [address, walletClient, publicClient, user, aioha, toast]);

  return {
    createCoinFromPost,
    isCreating,
  };
}
