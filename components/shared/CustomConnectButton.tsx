"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { Name, Avatar } from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";

interface CustomConnectButtonProps {
  showBalance?: boolean;
  showNetworkName?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
}

export function CustomConnectButton({
  showBalance = true,
  showNetworkName = false,
  size = "md",
  variant = "primary",
}: CustomConnectButtonProps) {
  const { address } = useAccount();

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return { h: "32px", px: 3, fontSize: "sm" };
      case "lg":
        return { h: "48px", px: 6, fontSize: "lg" };
      default:
        return { h: "40px", px: 4, fontSize: "md" };
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: "md",
      fontWeight: "medium",
      transition: "all 0.2s",
      border: "1px solid",
      ...getButtonSize(),
    };

    switch (variant) {
      case "secondary":
        return {
          ...baseStyles,
          bg: "muted",
          color: "text",
          borderColor: "border",
          _hover: { bg: "background", borderColor: "primary" },
        };
      case "ghost":
        return {
          ...baseStyles,
          bg: "transparent",
          color: "text",
          borderColor: "transparent",
          _hover: { bg: "muted", borderColor: "border" },
        };
      default:
        return {
          ...baseStyles,
          bg: "background",
          color: "text",
          borderColor: "primary",
          _hover: { bg: "primary", color: "background" },
        };
    }
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <Box
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} {...getButtonStyles()}>
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    bg="error"
                    color="background"
                    borderColor="error"
                    _hover={{ bg: "error", opacity: 0.8 }}
                    {...getButtonSize()}
                    borderRadius="md"
                    fontWeight="medium"
                    border="1px solid"
                  >
                    Wrong network
                  </Button>
                );
              }

              return (
                <HStack spacing={2}>
                  {/* Chain Indicator - only show if requested */}
                  {showNetworkName && (
                    <Button
                      onClick={openChainModal}
                      variant="ghost"
                      size="sm"
                      color="text"
                      _hover={{ bg: "muted" }}
                      borderRadius="md"
                      minW="auto"
                      px={2}
                      h="32px"
                    >
                      {chain.hasIcon && (
                        <Box
                          as="img"
                          src={chain.iconUrl}
                          alt={chain.name ?? "Chain icon"}
                          boxSize="16px"
                          borderRadius="full"
                          mr={1}
                        />
                      )}
                      <Text fontSize="xs">{chain.name}</Text>
                    </Button>
                  )}

                  {/* Account Info with OnchainKit Identity */}
                  <Button
                    onClick={openAccountModal}
                    {...getButtonStyles()}
                    minW="auto"
                  >
                    <HStack spacing={3}>
                      {/* OnchainKit Avatar */}
                      <Avatar
                        address={account.address as `0x${string}`}
                        chain={base}
                        className="w-6 h-6 rounded-full"
                      />

                      <VStack spacing={0} align="start" minW="0">
                        {/* OnchainKit Name */}
                        <Box maxW="120px" overflow="hidden">
                          <Name
                            address={account.address as `0x${string}`}
                            chain={base}
                            className="text-sm font-medium truncate"
                          />
                        </Box>

                        {/* Balance - only show if requested */}
                        {showBalance && account.displayBalance && (
                          <Text
                            fontSize="xs"
                            color="accent"
                            fontFamily="mono"
                            lineHeight="1"
                          >
                            {account.displayBalance}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Button>
                </HStack>
              );
            })()}
          </Box>
        );
      }}
    </ConnectButton.Custom>
  );
}
