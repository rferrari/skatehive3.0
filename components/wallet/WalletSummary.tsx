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
  const { aggregatedPortfolio, farcasterVerifiedPortfolios, portfolio } =
    usePortfolioContext();
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

  const handleCopyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        status: "success",
        title: "Address Copied!",
        description: "Wallet address copied to clipboard",
        duration: 2000,
      });
    }
  }, [address, toast]);

  // Case 1: No wallets connected
  if (!connectionStatus.hasWallets) {
    return (
      <></>
      // <Box
      //   p={6}
      //   bg="background"
      //   borderRadius="xl"
      //   border="2px solid"
      //   borderColor="primary"
      //   position="relative"
      //   overflow="hidden"
      // >
      //   <VStack spacing={4} position="relative" zIndex={1}>
      //     <Text
      //       fontSize="lg"
      //       color="primary"
      //       fontWeight="bold"
      //       textAlign="center"
      //     >
      //       🛹 Welcome to SkateHive
      //     </Text>
      //     <Text fontSize="sm" color="text" textAlign="center" mb={2}>
      //       Connect your wallets to unlock your digital identity
      //     </Text>

      //     <Center w="full">
      //       <ConnectButton />
      //     </Center>

      //     <Button
      //       onClick={onConnectHive}
      //       w="full"
      //       variant="outline"
      //       colorScheme="green"
      //       leftIcon={<Text fontSize="lg">🐝</Text>}
      //       size="lg"
      //     >
      //       Connect Hive Blockchain
      //     </Button>
      //   </VStack>
      // </Box>
    );
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
          farcasterVerifiedPortfolios={farcasterVerifiedPortfolios}
          hiveValue={totalHiveValue}
          farcasterProfile={farcasterProfile}
          connectedEthAddress={address}
        />

        {/* Ethereum Wallet Section */}
        {isEthConnected && address && (
          <Box pt={4} borderTop="1px solid" borderColor="border">
            <Text fontSize="sm" color="primary" mb={4} fontWeight="bold">
              🔗 Ethereum Identity
            </Text>
            <Box
              p={4}
              borderRadius="xl"
              bg="muted"
              border="1px solid"
              borderColor="border"
            >
              <Wallet>
                <ConnectWallet>
                  <Avatar />
                  <Name />
                </ConnectWallet>
              </Wallet>

              {/* Farcaster connection indicator */}
              {isFarcasterConnected &&
                farcasterProfile &&
                "custody" in farcasterProfile &&
                farcasterProfile.custody?.toLowerCase() ===
                  address?.toLowerCase() && (
                  <Box pt={3} mt={3} borderTop="1px solid" borderColor="border">
                    <Text fontSize="xs" color="accent" textAlign="center">
                      🛹 Connected via @{farcasterProfile.username}
                    </Text>
                  </Box>
                )}
            </Box>
          </Box>
        )}

        {/* Farcaster Section */}
        {!isFarcasterConnected ? (
          <Box pt={4} borderTop="1px solid" borderColor="border">
            <Text
              fontSize="sm"
              color="accent"
              mb={4}
              textAlign="center"
              fontWeight="bold"
            >
              🚀 Connect Farcaster for Multi-Wallet Portfolio
            </Text>
            <Center>
              <FarcasterUniversalWallet hiveUsername={hiveUsername} />
            </Center>
          </Box>
        ) : (
          <Box pt={4} borderTop="1px solid" borderColor="border">
            <Text fontSize="sm" color="accent" mb={4} fontWeight="bold">
              🚀 Farcaster Identity
            </Text>
            <Box
              p={4}
              borderRadius="xl"
              bg="muted"
              border="1px solid"
              borderColor="border"
            >
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="text" fontWeight="medium">
                      @{farcasterProfile?.username}
                    </Text>
                    <Text fontSize="xs" color="text">
                      FID: {farcasterProfile?.fid}
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  icon={<IoLogOutSharp />}
                  size="xs"
                  variant="outline"
                  colorScheme="red"
                  onClick={handleFarcasterDisconnect}
                  aria-label="Disconnect Farcaster"
                />
              </HStack>
            </Box>
          </Box>
        )}

        {/* Show connect buttons for missing wallets */}
        {connectionStatus.hasWallets && (
          <>
            {(hiveUsername || isEthConnected || isFarcasterConnected) && (
              <Divider borderColor="border" />
            )}

            {connectionStatus.needsEthereum && (
              <Button
                leftIcon={<FaEthereum size={14} />}
                onClick={onConnectEthereum}
                w="full"
                size="lg"
                variant="outline"
                colorScheme="blue"
              >
                Connect Ethereum
              </Button>
            )}

            {connectionStatus.needsHive && (
              <Button
                onClick={onConnectHive}
                w="full"
                size="lg"
                variant="outline"
                colorScheme="green"
                leftIcon={<Text fontSize="sm">🐝</Text>}
              >
                Connect Hive Blockchain
              </Button>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
});

export default WalletSummary;
