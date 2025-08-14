"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { CSSReset } from "@chakra-ui/react";
import { Aioha } from "@aioha/aioha";
import { AiohaProvider } from "@aioha/react-ui";
import { ThemeProvider } from "./themeProvider";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/contexts/UserContext";
import { VoteWeightProvider } from "@/contexts/VoteWeightContext";
import { AuthKitProvider } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";
import { dynamicRainbowTheme } from "@/lib/themes/rainbowkitTheme";
import { useState, useEffect } from "react";

// Suppress RainbowKit errorCorrection prop warning in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args[0];
    if (
      typeof errorMessage === 'string' && 
      errorMessage.includes('React does not recognize the `errorCorrection` prop on a DOM element')
    ) {
      return; // Suppress this specific RainbowKit warning
    }
    originalConsoleError.apply(console, args);
  };
}

const aioha = new Aioha();

if (typeof window !== "undefined") {
  aioha.registerKeychain();
  aioha.registerLedger();
  aioha.registerPeakVault();
  aioha.registerHiveAuth({
    name: process.env.NEXT_PUBLIC_COMMUNITY_NAME || "skatehive",
    description: "",
  });
  aioha.loadAuth();
}

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_COMMUNITY_NAME || "skatehive",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "6465a9e6cbe7a3cb53461864e01d3e8d",
  chains: [base, mainnet],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true, // Enable server-side rendering for Next.js
});

const farcasterAuthConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: process.env.NEXT_PUBLIC_DOMAIN || "skatehive.app",
  // siweUri is optional - Auth Kit handles SIWE verification internally
  // Only needed if you want custom server-side session management
  relay: "https://relay.farcaster.xyz", // Ensure relay is specified
};

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside the component to avoid SSR issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors except 429 (rate limit)
          if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <UserProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider
              coolMode
              initialChain={base}
              theme={dynamicRainbowTheme}
            >
              <OnchainKitProvider
                chain={base}
                apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                projectId={process.env.NEXT_PUBLIC_CDP_PROJECT_ID}
              >
                <AuthKitProvider config={farcasterAuthConfig}>
                  <AiohaProvider aioha={aioha}>
                    <VoteWeightProvider>
                      <CSSReset />
                      {children}
                    </VoteWeightProvider>
                  </AiohaProvider>
                </AuthKitProvider>
              </OnchainKitProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
