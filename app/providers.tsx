"use client";

import { useEffect } from "react";
import { CSSReset } from "@chakra-ui/react";
import { Aioha } from "@aioha/aioha";
import { AiohaProvider } from "@aioha/react-ui";
import { ThemeProvider } from "./themeProvider";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { WagmiProvider, http, createConfig } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/contexts/UserContext";
import { AuthKitProvider } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";

const aioha = new Aioha();
const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});

const farcasterAuthConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: process.env.NEXT_PUBLIC_DOMAIN || "skatehive.app",
  siweUri: `${
    process.env.NEXT_PUBLIC_BASE_URL || "https://skatehive.app"
  }/api/auth/farcaster`,
};

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    aioha.registerKeychain();
    aioha.registerLedger();
    aioha.registerPeakVault();
    aioha.registerHiveAuth({
      name: process.env.NEXT_PUBLIC_COMMUNITY_NAME || "skatehive",
      description: "",
    });
    aioha.loadAuth();
  }, []);

  return (
    <UserProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <OnchainKitProvider
              chain={base}
              apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
              projectId={process.env.NEXT_PUBLIC_CDP_PROJECT_ID}
            >
              <AuthKitProvider config={farcasterAuthConfig}>
                <AiohaProvider aioha={aioha}>
                  <CSSReset />
                  {children}
                </AiohaProvider>
              </AuthKitProvider>
            </OnchainKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
