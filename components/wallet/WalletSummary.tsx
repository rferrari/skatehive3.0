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
import ConnectButton from "./ConnectButton";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { WalletDistributionChart } from "./WalletDistributionChart";
import FarcasterUniversalWallet from "../farcaster/FarcasterUniversalWallet";
import { IoLogOutSharp } from "react-icons/io5";
import { FaEthereum } from "react-icons/fa";

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

  // Memoize calculations
  const calculations = useMemo(() => {
    const digitalAssetsValue = aggregatedPortfolio?.totalNetWorth || 0;
    const totalValue = totalHiveValue + digitalAssetsValue;
    return { digitalAssetsValue, totalValue };
  }, [aggregatedPortfolio?.totalNetWorth, totalHiveValue]);

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
      <Box
        p={4}
        bg="background"
        borderRadius="md"
        border="2px solid"
        borderColor="primary"
      >
        <Text fontSize="sm" color="primary" mb={3} textAlign="center">
          Connect your wallets to get started
        </Text>
        <VStack spacing={2}>
          <ConnectButton />
          <Button
            onClick={onConnectHive}
            w="full"
            colorScheme="green"
            variant="outline"
          >
            Connect Hive
          </Button>
        </VStack>
      </Box>
    );
  }

  // Case 2: At least one wallet connected - show summary
  return (
    <Box
      p={4}
      bg="background"
      borderRadius="md"
      // Removed border and borderColor
    >
      <VStack spacing={4} align="stretch">
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
          <Box pt={3} borderTop="1px solid" borderColor="whiteAlpha.200">
            <Text fontSize="sm" color="primary" mb={3} fontWeight="bold">
              🔗 Ethereum Identity
            </Text>
            <Box
              p={3}
              borderRadius="12px"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <HStack spacing={3} align="center" justify="space-between">
                <HStack spacing={3} align="center" flex={1}>
                  <Identity address={address}>
                    <Avatar />
                    <Name />
                    <Address />
                    <Badge />
                  </Identity>
                </HStack>

                {/* Action Buttons */}
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="green"
                    onClick={handleCopyAddress}
                  >
                    Copy
                  </Button>
                  <IconButton
                    icon={<IoLogOutSharp />}
                    color="red.500"
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={handleDisconnect}
                    aria-label="Disconnect Ethereum"
                  />
                </HStack>
              </HStack>

              {/* Farcaster connection indicator */}
              {isFarcasterConnected &&
                farcasterProfile &&
                "custody" in farcasterProfile &&
                farcasterProfile.custody?.toLowerCase() ===
                  address?.toLowerCase() && (
                  <Box
                    pt={2}
                    mt={2}
                    borderTop="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Text fontSize="xs" color="primary" textAlign="center">
                      🛹 Connected via @{farcasterProfile.username}
                    </Text>
                  </Box>
                )}
            </Box>
          </Box>
        )}

        {/* Farcaster Section */}
        {!isFarcasterConnected ? (
          <Box pt={3} borderTop="1px solid" borderColor="whiteAlpha.200">
            <Text
              fontSize="sm"
              color="primary"
              mb={3}
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
          <Box pt={3} borderTop="1px solid" borderColor="whiteAlpha.200">
            <Text fontSize="sm" color="primary" mb={3} fontWeight="bold">
              🚀 Farcaster Identity
            </Text>
            <Box
              p={3}
              borderRadius="12px"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="white" fontWeight="medium">
                      @{farcasterProfile?.username}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.600">
                      FID: {farcasterProfile?.fid}
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  icon={<IoLogOutSharp />}
                  color="red.500"
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
              <Divider />
            )}

            {connectionStatus.needsEthereum && (
              <Button
                leftIcon={<FaEthereum size={14} />}
                onClick={onConnectEthereum}
                size="sm"
                colorScheme="blue"
                variant="outline"
              >
                Connect Ethereum
              </Button>
            )}

            {connectionStatus.needsHive && (
              <Button
                onClick={onConnectHive}
                size="sm"
                colorScheme="green"
                variant="outline"
              >
                Connect Hive
              </Button>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
});

export default WalletSummary;
