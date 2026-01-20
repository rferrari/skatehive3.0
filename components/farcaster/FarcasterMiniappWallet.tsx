"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  Avatar,
  Spinner,
} from "@chakra-ui/react";
import { useFarcasterMiniapp } from "@/hooks/useFarcasterMiniapp";

interface FarcasterMiniappWalletProps {
  hiveUsername?: string;
}

export default function FarcasterMiniappWallet({
  hiveUsername,
}: FarcasterMiniappWalletProps) {
  const { user, isReady, getWalletAddress, connectWallet, walletProvider } =
    useFarcasterMiniapp();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWalletSupport, setHasWalletSupport] = useState(false);
  const toast = useToast();

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (isReady) {
        try {
          // Check if wallet provider is available and functional
          if (walletProvider && typeof walletProvider.request === "function") {
            setHasWalletSupport(true);
            const address = await getWalletAddress();
            setWalletAddress(address);
          } else {
            setHasWalletSupport(false);
            console.warn(
              "⚠️ Wallet provider not available or missing request method"
            );
          }
        } catch (error) {
          console.error("❌ Failed to check wallet connection:", error);
          setHasWalletSupport(false);
        } finally {
          setIsLoading(false);
        }
      } else if (isReady) {
        setIsLoading(false);
      }
    };

    checkWalletConnection();
  }, [isReady, walletProvider, getWalletAddress]);

  const handleConnectWallet = async () => {
    if (!hasWalletSupport) {
      toast({
        status: "warning",
        title: "Wallet Not Available",
        description: "Wallet functionality is not available in this context",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const address = await connectWallet();
      if (address) {
        setWalletAddress(address);
        toast({
          status: "success",
          title: "Wallet Connected!",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(
            -4
          )}`,
        });
      }
    } catch (error: any) {
      console.error("🔴 Wallet connection error:", error);
      toast({
        status: "error",
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isReady || isLoading) {
    return (
      <Box
        p={4}
        bg="background"
        borderRadius="lg"
        border="1px solid"
        borderColor="muted"
        textAlign="center"
      >
        <Spinner size="sm" />
        <Text fontSize="sm" color="muted" mt={2}>
          Loading Farcaster wallet...
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* User Profile Section */}
      {user && (
        <Box
          p={4}
          bg="background"
          borderRadius="lg"
          border="1px solid"
          borderColor="muted"
        >
          <HStack spacing={3}>
            <Avatar
              size="sm"
              name={user.displayName || user.username}
              src={user.pfpUrl}
            />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="sm" fontWeight="medium" color="text">
                {user.displayName || `@${user.username}`}
              </Text>
              <Text fontSize="xs" color="muted">
                @{user.username} • FID: {user.fid}
              </Text>
              {hiveUsername && (
                <Text fontSize="xs" color="green.400">
                  Linked to Hive: @{hiveUsername}
                </Text>
              )}
            </VStack>
            <Badge colorScheme="purple" variant="subtle">
              Miniapp
            </Badge>
          </HStack>
        </Box>
      )}

      {/* Wallet Section */}
      <Box
        p={4}
        bg="background"
        borderRadius="lg"
        border="1px solid"
        borderColor="muted"
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="md" fontWeight="bold" color="primary">
              🔗 Farcaster Wallet
            </Text>
            {walletAddress && (
              <Badge colorScheme="green" variant="subtle">
                Connected
              </Badge>
            )}
          </HStack>

          {walletAddress ? (
            <VStack spacing={2} align="start">
              <Text fontSize="sm" color="text">
                Your Warpcast wallet is connected
              </Text>
              <Text fontSize="xs" color="blue.400" fontFamily="mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Text>
              <Text fontSize="xs" color="muted">
                You can now make transactions using your Farcaster wallet
              </Text>
            </VStack>
          ) : !hasWalletSupport ? (
            <VStack spacing={2} align="start">
              <Text fontSize="sm" color="orange.400">
                Wallet functionality not available
              </Text>
              <Text fontSize="xs" color="muted">
                The wallet provider is not accessible in this context. Try
                accessing this page directly in the Farcaster app.
              </Text>
            </VStack>
          ) : (
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" color="text">
                Connect your Farcaster wallet to enable blockchain transactions
              </Text>
              <Button
                colorScheme="purple"
                onClick={handleConnectWallet}
                isLoading={isConnecting}
                loadingText="Connecting..."
                size="sm"
                isDisabled={!hasWalletSupport}
              >
                Connect Farcaster Wallet
              </Button>
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Info Section */}
      <Box
        p={3}
        bg="blue.50"
        borderRadius="none"
        border="1px solid"
        borderColor="blue.200"
      >
        <Text fontSize="xs" color="blue.700">
          💡 <strong>Native Integration:</strong> When you&apos;re in the
          Farcaster app, you can use your native Warpcast wallet for secure
          transactions without leaving the app.
        </Text>
      </Box>
    </VStack>
  );
}
