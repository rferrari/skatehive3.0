import {
  Box,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  useDisclosure,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { useProfile } from "@farcaster/auth-kit";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { TokenDetail } from "../../types/portfolio";
import {
  preloadTokenLogos,
  subscribeToLogoUpdates,
  forceRefreshTokenData,
  consolidateTokensBySymbol,
  filterConsolidatedTokensByBalance,
  sortConsolidatedTokensByBalance,
} from "../../lib/utils/portfolioUtils";
import SendTokenModal from "./SendTokenModal";
import AssetsHeader from "./components/AssetsHeader";
import TokenControlsBar from "./components/TokenControlsBar";
import MobileTokenCard from "./components/MobileTokenCard";
import DesktopTokenTable from "./components/DesktopTokenTable";

export default function EthereumAssetsSection() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile } =
    useProfile();
  const {
    aggregatedPortfolio,
    portfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
    isLoading,
    error,
    refetch,
  } = usePortfolioContext();

  // Debug logging for Farcaster user and balance data
  useEffect(() => {
    console.log("🎯 EthereumAssetsSection Debug - Farcaster User Data:", {
      isFarcasterConnected,
      farcasterProfile: farcasterProfile
        ? {
            fid: farcasterProfile.fid,
            username: farcasterProfile.username,
            displayName: farcasterProfile.displayName,
            custody:
              "custody" in farcasterProfile
                ? farcasterProfile.custody
                : "No custody property",
            verifications:
              "verifications" in farcasterProfile
                ? farcasterProfile.verifications
                : "No verifications property",
            fullProfile: farcasterProfile,
            profileKeys: Object.keys(farcasterProfile),
            profileType: typeof farcasterProfile,
          }
        : "No profile",
      walletConnected: { isConnected, address },
    });

    console.log("💰 EthereumAssetsSection Debug - Portfolio Data:", {
      portfolio: portfolio
        ? {
            totalNetWorth: portfolio.totalNetWorth,
            tokensCount: portfolio.tokens?.length || 0,
            source: "ethereum",
          }
        : "No ethereum portfolio",
      farcasterPortfolio: farcasterPortfolio
        ? {
            totalNetWorth: farcasterPortfolio.totalNetWorth,
            tokensCount: farcasterPortfolio.tokens?.length || 0,
            source: "farcaster",
          }
        : "No farcaster portfolio",
      farcasterVerifiedPortfolios:
        Object.keys(farcasterVerifiedPortfolios).length > 0
          ? Object.entries(farcasterVerifiedPortfolios).map(([addr, p]) => ({
              address: addr,
              totalNetWorth: p.totalNetWorth,
              tokensCount: p.tokens?.length || 0,
            }))
          : "No verified portfolios",
      aggregatedPortfolio: aggregatedPortfolio
        ? {
            totalNetWorth: aggregatedPortfolio.totalNetWorth,
            tokensCount: aggregatedPortfolio.tokens?.length || 0,
            tokensSources:
              aggregatedPortfolio.tokens?.map((t) => ({
                symbol: t.token.symbol,
                source: t.source || "unknown",
                sourceAddress: t.sourceAddress || "unknown",
              })) || [],
          }
        : "No aggregated portfolio",
      isLoading,
      error,
    });
  }, [
    isConnected,
    address,
    isFarcasterConnected,
    farcasterProfile,
    portfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
    aggregatedPortfolio,
    isLoading,
    error,
  ]);
  const [hideSmallBalances, setHideSmallBalances] = useState(true);
  const minBalanceThreshold = 5;
  const [logoUpdateTrigger, setLogoUpdateTrigger] = useState(0);
  const [showTokenBalances, setShowTokenBalances] = useState(false);

  // Auto-show token balances when user has any portfolio data
  useEffect(() => {
    const hasConnection =
      (isConnected && address) ||
      (isFarcasterConnected && farcasterProfile?.custody);
    const hasAnyPortfolio = !!(
      portfolio ||
      farcasterPortfolio ||
      (farcasterVerifiedPortfolios &&
        Object.keys(farcasterVerifiedPortfolios).length > 0)
    );

    if ((hasConnection || hasAnyPortfolio) && !showTokenBalances) {
      console.log("🔄 Auto-enabling token balances for connected user:", {
        isConnected,
        address,
        isFarcasterConnected,
        farcasterCustody: farcasterProfile?.custody,
        hasEthereumPortfolio: !!portfolio,
        hasFarcasterPortfolio: !!farcasterPortfolio,
        hasVerifiedPortfolios:
          Object.keys(farcasterVerifiedPortfolios || {}).length > 0,
      });
      setShowTokenBalances(true);
    }
  }, [
    isConnected,
    address,
    isFarcasterConnected,
    farcasterProfile?.custody,
    showTokenBalances,
    portfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenDetail | null>(null);
  const [selectedTokenLogo, setSelectedTokenLogo] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const {
    isOpen: isSendModalOpen,
    onOpen: onSendModalOpen,
    onClose: onSendModalClose,
  } = useDisclosure();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toggle expanded token details
  const toggleTokenExpansion = useCallback((symbol: string) => {
    setExpandedTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  }, []);

  // Responsive breakpoint for mobile/desktop layout
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Memoize consolidated tokens to prevent unnecessary re-computation
  const memoizedConsolidatedTokens = useMemo(() => {
    const consolidated = consolidateTokensBySymbol(aggregatedPortfolio?.tokens);
    const filtered = filterConsolidatedTokensByBalance(
      consolidated,
      hideSmallBalances,
      minBalanceThreshold
    );
    return sortConsolidatedTokensByBalance(filtered);
  }, [aggregatedPortfolio?.tokens, hideSmallBalances, minBalanceThreshold]);

  // Effect to preload token logos and subscribe to updates - only run once per portfolio change
  useEffect(() => {
    if (aggregatedPortfolio?.tokens && aggregatedPortfolio.tokens.length > 0) {
      // Only preload if not already done for this portfolio
      const portfolioHash = aggregatedPortfolio.tokens
        .map((t) => `${t.network}-${t.token.address}`)
        .join(",");
      const lastHash = sessionStorage.getItem("lastPortfolioHash");

      if (portfolioHash !== lastHash) {
        preloadTokenLogos(aggregatedPortfolio.tokens);
        sessionStorage.setItem("lastPortfolioHash", portfolioHash);
      }

      // Subscribe to logo updates
      const unsubscribe = subscribeToLogoUpdates(() => {
        setLogoUpdateTrigger((prev) => prev + 1);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [aggregatedPortfolio?.tokens]);

  const handleForceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (aggregatedPortfolio?.tokens) {
        await forceRefreshTokenData(aggregatedPortfolio.tokens);
        // Clear the portfolio hash to allow fresh preloading
        sessionStorage.removeItem("lastPortfolioHash");
      }
      // Refetch portfolio data from API
      refetch();
    } catch (error) {
      console.error("Failed to refresh token data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [aggregatedPortfolio?.tokens, refetch]);

  const handleSendToken = useCallback(
    (tokenDetail: TokenDetail, logoUrl?: string) => {
      setSelectedToken(tokenDetail);
      setSelectedTokenLogo(logoUrl || "");
      onSendModalOpen();
    },
    [onSendModalOpen]
  );

  // Log the condition check for showing assets
  const shouldShowAssets = useMemo(() => {
    if (!isMounted) return false;

    // Show assets if:
    // 1. Ethereum wallet is connected
    // 2. Farcaster is connected with custody address
    // 3. We have any portfolio data (ethereum, farcaster, or verified addresses)
    const hasEthereumWallet = isConnected && address;
    const hasFarcasterWithCustody =
      isFarcasterConnected && farcasterProfile?.custody;
    const hasAnyPortfolioData = !!(
      portfolio ||
      farcasterPortfolio ||
      (farcasterVerifiedPortfolios &&
        Object.keys(farcasterVerifiedPortfolios).length > 0) ||
      aggregatedPortfolio
    );

    return hasEthereumWallet || hasFarcasterWithCustody || hasAnyPortfolioData;
  }, [
    isMounted,
    isConnected,
    address,
    isFarcasterConnected,
    farcasterProfile?.custody,
    portfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
    aggregatedPortfolio,
  ]);

  return (
    <Box mt={8} p={2} borderRadius="base" bg="muted" w="100%" textAlign="left">
      <AssetsHeader
        showTokenBalances={showTokenBalances}
        onToggleBalances={() => setShowTokenBalances(!showTokenBalances)}
      />

      {shouldShowAssets && (
        <Box overflowX="hidden">
          {/* Token Balances Section - only display if showTokenBalances is true */}
          {showTokenBalances && (
            <>
              <TokenControlsBar
                isRefreshing={isRefreshing}
                hideSmallBalances={hideSmallBalances}
                onRefresh={handleForceRefresh}
                onToggleSmallBalances={setHideSmallBalances}
              />

              {isLoading && (
                <Flex justify="center" align="center" py={4}>
                  <Spinner color="primary" />
                </Flex>
              )}

              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {aggregatedPortfolio && (
                <>
                  {isMobile ? (
                    // Mobile Card Layout
                    <VStack spacing={0} align="stretch">
                      {memoizedConsolidatedTokens.map((consolidatedToken) => (
                        <MobileTokenCard
                          key={consolidatedToken.symbol}
                          consolidatedToken={consolidatedToken}
                          isExpanded={expandedTokens.has(
                            consolidatedToken.symbol
                          )}
                          onToggleExpansion={() =>
                            toggleTokenExpansion(consolidatedToken.symbol)
                          }
                          onSendToken={handleSendToken}
                        />
                      ))}
                    </VStack>
                  ) : (
                    // Desktop Table Layout
                    <Box overflowX="hidden" w="100%">
                      <DesktopTokenTable
                        consolidatedTokens={memoizedConsolidatedTokens}
                        expandedTokens={expandedTokens}
                        onToggleExpansion={toggleTokenExpansion}
                        onSendToken={handleSendToken}
                      />
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* Send Token Modal */}
      {selectedToken && (
        <SendTokenModal
          isOpen={isSendModalOpen}
          onClose={onSendModalClose}
          token={selectedToken}
          tokenLogo={selectedTokenLogo}
        />
      )}
    </Box>
  );
}
