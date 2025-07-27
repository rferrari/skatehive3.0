import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  IconButton,
  useToast,
  Center,
} from "@chakra-ui/react";
import { useAccount, useDisconnect } from "wagmi";
import { useFarcasterSession } from "../../hooks/useFarcasterSession";
import { useSignIn } from "@farcaster/auth-kit";
import {
  Identity,
  Avatar,
  Name,
  Address,
  Badge,
} from "@coinbase/onchainkit/identity";
import { memo, useCallback, useMemo } from "react";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { WalletDistributionChart } from "./WalletDistributionChart";
import FarcasterUniversalWallet from "../farcaster/FarcasterUniversalWallet";
import { IoLogOutSharp } from "react-icons/io5";
import { FaEthereum } from "react-icons/fa";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
interface WalletSummaryProps {
  hiveUsername?: string;
  totalHiveValue: number;
  isPriceLoading: boolean;
  onConnectEthereum: () => void;
  onConnectHive: () => void;
}

const WalletSummary = memo(function WalletSummary({
  hiveUsername,
  totalHiveValue,
  onConnectEthereum,
  onConnectHive,
}: WalletSummaryProps) {
  const { isConnected: isEthConnected, address } = useAccount();
  const {
    isAuthenticated: isFarcasterConnected,
    profile: farcasterProfile,
    clearSession,
  } = useFarcasterSession();
  const { signOut } = useSignIn({});
  const {
    aggregatedPortfolio,
    farcasterVerifiedPortfolios,
    portfolio,
    farcasterPortfolio,
  } = usePortfolioContext();
  const { disconnect } = useDisconnect();
  const toast = useToast();

  // Memoize connection status
  const connectionStatus = useMemo(
    () => ({
      hasWallets: isEthConnected || !!hiveUsername || isFarcasterConnected,
      needsEthereum: !isEthConnected,
      needsHive: !hiveUsername,
      needsFarcaster: !isFarcasterConnected,
      hasDigitalAssets: isEthConnected || isFarcasterConnected,
    }),
    [isEthConnected, hiveUsername, isFarcasterConnected]
  );

  // Memoized event handlers
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleFarcasterDisconnect = useCallback(() => {
    try {
      // Sign out from Auth Kit if authenticated
      if (isFarcasterConnected) {
        signOut();
      }

      // Clear our persisted session
      clearSession();

      toast({
        status: "success",
        title: "Signed out from Farcaster",
        description: "You have been disconnected from Farcaster",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error signing out from Farcaster:", error);
      toast({
        status: "error",
        title: "Sign out failed",
        description: "There was an error signing out from Farcaster",
        duration: 5000,
      });
    }
  }, [isFarcasterConnected, signOut, clearSession, toast]);

  // Case 1: No wallets connected
  if (!connectionStatus.hasWallets) {
    return <></>;
  }

  // Case 2: At least one wallet connected - show summary
  return (
    <Box
      p={6}
      bg="background"
      borderRadius="xl"
      border="1px solid"
      borderColor="border"
      position="relative"
      overflow="hidden"
    >
      <VStack spacing={6} align="stretch" position="relative" zIndex={1}>
        {/* Portfolio Distribution Chart */}
        <WalletDistributionChart
          ethPortfolio={portfolio?.totalNetWorth || 0}
          farcasterPortfolio={farcasterPortfolio?.totalNetWorth || 0}
          farcasterVerifiedPortfolios={farcasterVerifiedPortfolios}
          hiveValue={totalHiveValue}
          farcasterProfile={farcasterProfile}
          connectedEthAddress={address}
        />
      </VStack>
    </Box>
  );
});

export default WalletSummary;
