"use client";

import { useEffect } from "react";
import { CSSReset } from "@chakra-ui/react";
import { Aioha } from "@aioha/aioha";
import { AiohaProvider } from "@aioha/react-ui";
import { ThemeProvider } from "./themeProvider";
import { WagmiProvider } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { http, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WhiskSdkProvider } from "@paperclip-labs/whisk-sdk";
import { IdentityResolver } from "@paperclip-labs/whisk-sdk/identity";
import { UserProvider } from "@/contexts/UserContext";
import { AuthKitProvider } from "@farcaster/auth-kit";
import "@farcaster/auth-kit/styles.css";

export const WHISK_API_KEY = process.env.NEXT_PUBLIC_WHISK_API_KEY as string;

const aioha = new Aioha();
const queryClient = new QueryClient();

export const config = createConfig({
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
          <WagmiProvider config={config}>
            <AuthKitProvider config={farcasterAuthConfig}>
              <WhiskSdkProvider
                apiKey={WHISK_API_KEY}
                config={{
                  identity: {
                    resolverOrder: [
                      IdentityResolver.Nns,
                      IdentityResolver.Farcaster,
                      IdentityResolver.Ens,
                      IdentityResolver.Base,
                      IdentityResolver.Lens,
                      IdentityResolver.Uni,
                      IdentityResolver.World,
                    ],
                  },
                }}
              >
                <AiohaProvider aioha={aioha}>
                  <CSSReset />
                  {children}
                </AiohaProvider>
              </WhiskSdkProvider>
            </AuthKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
