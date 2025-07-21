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
import {
  Identity,
  Avatar,
  Name,
  Address,
  Badge,
} from "@coinbase/onchainkit/identity";
import { useEffect, useState } from "react";
import ConnectButton from "./ConnectButton";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { WalletDistributionChart } from "./WalletDistributionChart";
import FarcasterSignIn from "../farcaster/FarcasterSignIn";
import { IoLogOutSharp } from "react-icons/io5";
import { memo, useCallback, useMemo } from "react";
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
  
  // Debug state for API testing
  const [debugInfo, setDebugInfo] = useState<{
    apiKey?: string;
    projectId?: string;
    address?: string;
    chain?: string;
    timestamp?: string;
    error?: string;
  } | null>(null);

  // Test OnchainKit API connection
  useEffect(() => {
    const testAPI = async () => {
      if (!address) return;
      
      try {
        // Log environment variables
        const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
        const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
        
        setDebugInfo({
          apiKey: apiKey ? `${apiKey.slice(0, 8)}...` : 'NOT_SET',
          projectId: projectId ? `${projectId.slice(0, 8)}...` : 'NOT_SET',
          address,
          chain: 'base',
          timestamp: new Date().toISOString()
        });

        // Test direct API call
        if (apiKey) {
          const response = await fetch(`https://api.coinbase.com/api/v2/exchange-rates?currency=USD`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('OnchainKit API Test Response:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('OnchainKit API Test Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setDebugInfo(prev => ({ ...prev, error: errorMessage }));
      }
    };

    testAPI();
  }, [address]);

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
            {/* Ethereum Identity Section */}
            <Box mb={4}>
              <Text fontSize="sm" color="blue.300" mb={3} fontWeight="bold">
                🔗 Ethereum Identity
              </Text>
              <Box
                p={3}
                bg="gray.800"
                borderRadius="12px"
                border="1px solid"
                borderColor="gray.600"
              >
                {/* Main Identity Display */}
                <HStack spacing={3} align="center" justify="space-between">
                  <HStack spacing={3} align="center" flex={1}>
                    {/* Custom avatar fallback */}
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="blue.500"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontWeight="bold"
                    >
                      {address?.slice(2, 4).toUpperCase()}
                    </Box>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" color="white" fontWeight="medium">
                        Ethereum Wallet
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  {/* Action Buttons */}
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(address || '');
                        toast({
                          status: "success",
                          title: "Address Copied!",
                          description: "Wallet address copied to clipboard",
                          duration: 2000,
                        });
                      }}
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
                
                {/* Debug Section - Outside Identity wrapper for visibility */}
                <Box mt={3} p={3} bg="red.900" borderRadius="8px" border="2px solid" borderColor="red.500">
                  <Text fontSize="sm" color="red.200" mb={3} fontWeight="bold">
                    � DEBUG PANEL 🚨
                  </Text>
                  
                  {/* Environment Check */}
                  <VStack align="start" spacing={2} mb={4}>
                    <Text fontSize="sm" color="white">
                      API Key: {debugInfo?.apiKey || 'Loading...'}
                    </Text>
                    <Text fontSize="sm" color="white">
                      Project ID: {debugInfo?.projectId || 'Loading...'}
                    </Text>
                    <Text fontSize="sm" color="white">
                      Address: {address}
                    </Text>
                    <Text fontSize="sm" color="white">
                      Chain: base
                    </Text>
                    {debugInfo?.error && (
                      <Text fontSize="sm" color="red.300">
                        Error: {debugInfo.error}
                      </Text>
                    )}
                  </VStack>

                  {/* OnchainKit Components Test */}
                  <Box p={2} bg="gray.800" borderRadius="4px">
                    <Text fontSize="sm" color="yellow.300" mb={2}>OnchainKit Components:</Text>
                    <Identity address={address}>
                      <VStack align="start" spacing={3}>
                        <HStack spacing={3}>
                          <Text fontSize="sm" color="gray.300">Avatar:</Text>
                          <Avatar className="h-8 w-8" />
                        </HStack>
                        <HStack spacing={3}>
                          <Text fontSize="sm" color="gray.300">Name:</Text>
                          <Name className="text-white text-sm" />
                        </HStack>
                        <HStack spacing={3}>
                          <Text fontSize="sm" color="gray.300">Address:</Text>
                          <Address className="text-gray-400 text-sm" />
                        </HStack>
                        <HStack spacing={3}>
                          <Text fontSize="sm" color="gray.300">Badge:</Text>
                          <Badge />
                        </HStack>
                      </VStack>
                    </Identity>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Farcaster connection indicator (if connected to same wallet) */}
            {isFarcasterConnected &&
              farcasterProfile?.custody?.toLowerCase() ===
                address?.toLowerCase() && (
                <Box pt={2}>
                  <Text fontSize="xs" color="purple.300" textAlign="center">
                    🛹 Connected via @{farcasterProfile.username}
                  </Text>
                </Box>
              )}
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
