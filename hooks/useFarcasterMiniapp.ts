'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

export const useFarcasterMiniapp = () => {
  const [isInMiniapp, setIsInMiniapp] = useState(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [walletProvider, setWalletProvider] = useState<any>(null);

  useEffect(() => {
    const initMiniapp = async () => {
      try {
        setIsLoading(true);
        
        // Use the proper SDK method to detect miniapp context
        const isMiniApp = await sdk.isInMiniApp();
        
        if (isMiniApp) {
          // If we're in a miniapp, initialize the SDK and get context
          await sdk.actions.ready();
          const context = await sdk.context;
          
          // Get the Ethereum wallet provider - check if available
          try {
            // Check if wallet methods are available
            if (sdk.wallet && typeof sdk.wallet.getEthereumProvider === 'function') {
              const ethProvider = await sdk.wallet.getEthereumProvider();
              console.log('🔗 Wallet provider initialized:', {
                provider: ethProvider,
                hasRequest: ethProvider && typeof ethProvider.request === 'function',
                providerType: typeof ethProvider
              });
              setWalletProvider(ethProvider);
            } else {
              console.warn('⚠️ SDK wallet methods not available');
              setWalletProvider(null);
            }
          } catch (error) {
            console.warn('⚠️ Failed to get wallet provider:', error);
            setWalletProvider(null);
          }
          
          if (context?.user) {
            setIsInMiniapp(true);
            setUser({
              fid: context.user.fid,
              username: context.user.username || `fid:${context.user.fid}`,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          } else {
            // In miniapp but no user context available
            setIsInMiniapp(true);
            setUser(null);
          }
        } else {
          // Not in miniapp context
          setIsInMiniapp(false);
          setUser(null);
          setWalletProvider(null);
        }
        
        setIsReady(true);
      } catch (error) {
        console.warn('Failed to detect Farcaster miniapp context:', error);
        setIsInMiniapp(false);
        setUser(null);
        setIsReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initMiniapp();
    }
  }, []);

  const openUrl = async (url: string) => {
    if (!isInMiniapp) {
      // Fallback to regular window.open if not in miniapp
      window.open(url, '_blank');
      return;
    }

    try {
      await sdk.actions.openUrl(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
      // Fallback to regular window.open
      window.open(url, '_blank');
    }
  };

  const close = async () => {
    if (!isInMiniapp) return;
    
    try {
      await sdk.actions.close();
    } catch (error) {
      console.error('Failed to close miniapp:', error);
    }
  };

  const composeCast = async (text: string, embeds?: string[]) => {
    if (!isInMiniapp) {
      throw new Error('Not in Farcaster miniapp context');
    }

    try {
      // Limit embeds to max 2 as per SDK requirements
      let limitedEmbeds: [] | [string] | [string, string] | undefined;
      
      if (!embeds || embeds.length === 0) {
        limitedEmbeds = [];
      } else if (embeds.length === 1) {
        limitedEmbeds = [embeds[0]];
      } else {
        limitedEmbeds = [embeds[0], embeds[1]];
      }
      
      const result = await sdk.actions.composeCast({
        text,
        embeds: limitedEmbeds,
      });
      
      return result;
    } catch (error) {
      console.error('Failed to compose cast:', error);
      throw error;
    }
  };

  const getWalletAddress = async (): Promise<string | null> => {
    if (!isInMiniapp || !walletProvider) {
      console.warn('❌ getWalletAddress: Not in miniapp or no provider');
      return null;
    }

    try {
      console.log('🔍 Checking wallet accounts...', { walletProvider, hasRequest: typeof walletProvider.request === 'function' });
      
      if (typeof walletProvider.request !== 'function') {
        throw new Error('Wallet provider does not have request method');
      }
      
      const accounts = await walletProvider.request({ method: 'eth_accounts' });
      console.log('📋 Wallet accounts:', accounts);
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('❌ Failed to get wallet address:', error);
      return null;
    }
  };

  const connectWallet = async (): Promise<string | null> => {
    if (!isInMiniapp || !walletProvider) {
      throw new Error('Not in Farcaster miniapp context');
    }

    try {
      console.log('🔌 Connecting wallet...', { walletProvider, hasRequest: typeof walletProvider.request === 'function' });
      
      if (typeof walletProvider.request !== 'function') {
        throw new Error('Wallet provider does not have request method');
      }
      
      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      console.log('✅ Wallet connected:', accounts);
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      throw error;
    }
  };

  return {
    isInMiniapp,
    user,
    isLoading,
    isReady,
    walletProvider,
    openUrl,
    close,
    composeCast,
    getWalletAddress,
    connectWallet,
  };
};
