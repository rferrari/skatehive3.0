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
import { useProfile, useSignIn } from "@farcaster/auth-kit";
import { FaEthereum } from "react-icons/fa";
import {
  Name,
  Avatar,
  IdentityResolver,
} from "@paperclip-labs/whisk-sdk/identity";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { WalletDistributionChart } from "./WalletDistributionChart";
import FarcasterSignIn from "../farcaster/FarcasterSignIn";
import { IoLogOutSharp } from "react-icons/io5";
import { memo, useCallback, useMemo } from "react";

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
  isPriceLoading,
  onConnectEthereum,
  onConnectHive,
}: WalletSummaryProps) {
  const { isConnected: isEthConnected, address } = useAccount();
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile } =
    useProfile();
  const { signOut: farcasterSignOut } = useSignIn({});
  const {
    aggregatedPortfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
    portfolio,
  } = usePortfolioContext();
  const { disconnect } = useDisconnect();
  const toast = useToast();

  // Farcaster success handler
  const handleFarcasterSuccess = useCallback(
    (profile: {
      fid: number;
      username: string;
      displayName?: string;
      pfpUrl?: string;
      bio?: string;
      custody?: `0x${string}`;
      verifications?: string[];
    }) => {
      const walletInfo = profile.custody
        ? ` (Wallet: ${profile.custody.slice(0, 6)}...${profile.custody.slice(
            -4
          )})`
        : "";
      toast({
        status: "success",
        title: "Connected to Farcaster!",
        description: `Welcome @${profile.username}! FID: ${profile.fid}${walletInfo}`,
      });
    },
    [toast]
  );

  // Memoize constants
  const resolverOrder = useMemo(
    () => [
      IdentityResolver.Nns,
      IdentityResolver.Farcaster,
      IdentityResolver.Ens,
      IdentityResolver.Base,
      IdentityResolver.Lens,
      IdentityResolver.Uni,
      IdentityResolver.World,
    ],
    []
  );

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
    farcasterSignOut();
    toast({
      status: "info",
      title: "Disconnected from Farcaster",
      description: "Your Farcaster account has been disconnected.",
    });
  }, [farcasterSignOut, toast]);

  const digitalAssetsValue = calculations.digitalAssetsValue;
  const totalValue = calculations.totalValue;

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
          <Button
            leftIcon={<FaEthereum size={16} />}
            onClick={onConnectEthereum}
            w="full"
            colorScheme="blue"
            variant="outline"
          >
            Connect Ethereum
          </Button>
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
      border="2px solid"
      borderColor="primary"
      overflow="visible"
      position="relative"
    >
      <VStack spacing={4} align="stretch" overflow="visible">
        {/* Portfolio Distribution Chart */}
        <Box overflow="visible">
          <WalletDistributionChart
            ethPortfolio={portfolio?.totalNetWorth || 0}
            farcasterVerifiedPortfolios={farcasterVerifiedPortfolios}
            hiveValue={totalHiveValue}
            farcasterProfile={farcasterProfile}
            connectedEthAddress={address}
          />
        </Box>

        {/* Quick Actions Section */}
        {isEthConnected && address && (
          <Box pt={3} borderTop="1px solid" borderColor="gray.600">
            <HStack justify="space-between" align="center">
              <HStack spacing={2}>
                <Avatar
                  address={address}
                  size={16}
                  resolverOrder={resolverOrder}
                />
                <VStack align="start" spacing={0}>
                  <Name
                    address={address}
                    resolverOrder={resolverOrder}
                    style={{ fontSize: "12px", color: "gray" }}
                  />
                  {isFarcasterConnected &&
                    farcasterProfile?.custody?.toLowerCase() ===
                      address?.toLowerCase() && (
                      <Text fontSize="xs" color="purple.300">
                        @{farcasterProfile.username}
                      </Text>
                    )}
                </VStack>
              </HStack>
              <IconButton
                icon={<IoLogOutSharp />}
                color={"red.500"}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleDisconnect}
                aria-label="Disconnect Ethereum"
              />
            </HStack>
          </Box>
        )}

        {/* Farcaster Section */}
        {!isFarcasterConnected ? (
          <Box pt={3} borderTop="1px solid" borderColor="gray.600">
            <Text fontSize="sm" color="purple.300" mb={3} textAlign="center">
              Connect Farcaster for Multi-Wallet Portfolio
            </Text>
            <Center>
              <FarcasterSignIn
                onSuccess={handleFarcasterSuccess}
                variant="button"
              />
            </Center>
          </Box>
        ) : (
          <Box pt={3} borderTop="1px solid" borderColor="gray.600">
            <HStack justify="space-between" align="center">
              <HStack spacing={2}>
                {farcasterProfile?.custody && (
                  <Avatar
                    address={farcasterProfile.custody}
                    size={16}
                    resolverOrder={resolverOrder}
                  />
                )}
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" color="purple.300">
                    @{farcasterProfile?.username}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    FID: {farcasterProfile?.fid}
                  </Text>
                </VStack>
              </HStack>
              <IconButton
                icon={<IoLogOutSharp />}
                color={"red.500"}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleFarcasterDisconnect}
                aria-label="Disconnect Farcaster"
              />
            </HStack>
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
