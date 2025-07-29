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
import { updatePostWithCoinInfo } from "@/lib/hive/server-actions";

export interface CoinCreationData {
  name: string;
  symbol: string;
  description: string;
  image?: File;
  mediaUrl?: string;
  postAuthor?: string;
  postPermlink?: string;
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
      const metadataBuilder = createMetadataBuilder()
        .withName(coinData.name)
        .withSymbol(coinData.symbol)
        .withDescription(coinData.description);

      // Add image if provided (File object takes priority over URL)
      if (coinData.image) {
        metadataBuilder.withImage(coinData.image);
      } else if (coinData.mediaUrl) {
        // For mediaUrl (string), we need to fetch and convert to File
        try {
          const response = await fetch(coinData.mediaUrl);
          const blob = await response.blob();
          const file = new File([blob], 'coin-image.jpg', { type: blob.type });
          metadataBuilder.withImage(file);
        } catch (error) {
          console.warn('Failed to fetch media URL for coin image:', error);
          // Continue without image
        }
      }

      const { createMetadataParameters } = await metadataBuilder
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

      // Check if the coin creator is the same as the post author OR if this was posted server-side
      const isPostAuthor = user && coinData.postAuthor && user.toLowerCase() === coinData.postAuthor.toLowerCase();
      const isServerSidePost = !user && coinData.postAuthor === (process.env.NEXT_PUBLIC_HIVE_USER || 'skatedev');
      
      if ((isPostAuthor || isServerSidePost) && result.address) {
        try {
          // Generate Zora URL for the coin
          const zoraUrl = `https://zora.co/collect/base:${result.address}`;
          
          if (isPostAuthor && aioha) {
            // User created the post and coin - update via Aioha
            const updatedBody = `${coinData.postBody}\n\n---\n  Collect it here \n ${zoraUrl}`;
            
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
                author: coinData.postAuthor!,
                permlink: coinData.postPermlink!,
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
              throw new Error('Failed to broadcast post update via Aioha');
            }
          } else if (isServerSidePost) {
            // Post was created server-side - update via server action
            const updateResult = await updatePostWithCoinInfo({
              author: coinData.postAuthor!,
              permlink: coinData.postPermlink!,
              coinAddress: result.address,
              coinUrl: zoraUrl,
            });
            
            if (updateResult.success) {
              console.log('✅ Post updated with coin link via server action');
              toast({
                title: 'Post updated with Zora coin!',
                description: 'Your post has been updated to include the coin collection link.',
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
            } else {
              throw new Error(updateResult.error || 'Failed to update post via server action');
            }
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

      const successMessage = isPostAuthor || isServerSidePost 
        ? `Your coin "${coinData.name}" has been deployed and the post has been updated!`
        : `Your coin "${coinData.name}" has been deployed!`;

      toast({
        title: 'Coin created successfully!',
        description: successMessage,
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
    createCoin: createCoinFromPost, // Alias for backward compatibility
    isCreating,
  };
}
