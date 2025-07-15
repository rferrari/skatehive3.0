'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export const useFarcasterContext = () => {
  const [isInFrame, setIsInFrame] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkFrameContext = async () => {
      try {
        // Try to initialize the SDK
        await sdk.actions.ready();
        
        // Check if we're in a frame context
        // The SDK should throw an error if not in a proper frame context
        const inIframe = window.self !== window.top;
        const hasFarcasterContext = typeof window !== 'undefined' && 
          ((window as any).farcaster !== undefined || 
           (window as any).parent !== window);
        
        // If SDK ready() succeeded and we're in iframe, likely in Farcaster frame
        setIsInFrame(inIframe && hasFarcasterContext);
        setIsReady(true);
      } catch (error) {
        // SDK ready() failed, probably not in Farcaster frame
        console.log('Not in Farcaster frame context:', error);
        setIsInFrame(false);
        setIsReady(true);
      }
    };

    if (typeof window !== 'undefined') {
      checkFrameContext();
    }
  }, []);

  const composeCast = async (text: string, embeds?: string[]) => {
    if (!isInFrame) {
      throw new Error('Not in Farcaster frame context');
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
        close: false // Keep the app open after composing
      });
      
      return result;
    } catch (error) {
      console.error('Failed to compose cast:', error);
      throw error;
    }
  };

  return {
    isInFrame,
    isReady,
    composeCast
  };
};
