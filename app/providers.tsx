"use client";

import { useEffect } from "react";
import { CSSReset } from "@chakra-ui/react";
import { Aioha } from "@aioha/aioha";
import { AiohaProvider } from "@aioha/react-ui";
import { ThemeProvider } from "./themeProvider";
import { WagmiConfig } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { http, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const aioha = new Aioha();
const queryClient = new QueryClient();

export const config = createConfig({
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={config}>
          <AiohaProvider aioha={aioha}>
            <CSSReset />
            {children}
          </AiohaProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
