"use client";
import React, { useState } from "react";
import {
  Button,
  Box,
  HStack,
  Text,
  useColorMode,
  Icon,
  useToast,
  Avatar as ChakraAvatar,
  Badge,
} from "@chakra-ui/react";
import { AiohaModal, useAioha } from "@aioha/react-ui";
import { useAccount } from "wagmi";
import { KeyTypes } from "@aioha/aioha";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";
import { SignInButton } from "@farcaster/auth-kit";
import "@aioha/react-ui/dist/build.css";
import { FaEthereum, FaHive } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";
import { Name, Avatar } from "@coinbase/onchainkit/identity";
import ConnectionModal from "./ConnectionModal";

// OnchainKit component class names
const ONCHAIN_AVATAR_CLASS = "custom-onchain-avatar";

// Custom CSS to override OnchainKit styles
const onchainKitStyles = `
  /* OnchainKit Avatar root container: force size, roundness, and clipping */
  [data-testid="ockAvatar"] {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  /* Target all children (img, svg, canvas, div) for size and roundness */
  [data-testid="ockAvatar"] img,
  [data-testid="ockAvatar"] svg,
  [data-testid="ockAvatar"] canvas,
  [data-testid="ockAvatar"] div {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    object-fit: cover !important;
    display: block !important;
  }
  
  /* OnchainKit name component */
  [data-testid="ockName"] {
    font-size: 14px;
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
`;

interface ConnectionStatus {
  name: string;
  connected: boolean;
  icon: any;
  color: string;
  priority: number;
}

export default function AuthButton() {
  const { user, aioha } = useAioha();
  const { colorMode } = useColorMode();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const toast = useToast();

  // Ensure client-side only rendering to prevent hydration mismatch
  React.useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Inject custom styles for OnchainKit components
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const onchainKitStyleId = "onchainkit-button-override";
      let existingOnchainKitStyle = document.getElementById(onchainKitStyleId);

      if (!existingOnchainKitStyle) {
        const style = document.createElement("style");
        style.id = onchainKitStyleId;
        style.textContent = onchainKitStyles;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Get connection states
  const { isConnected: isEthereumConnected, address: ethereumAddress } =
    useAccount();
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile } =
    useFarcasterSession();

  // Hidden Farcaster sign-in state
  const hiddenSignInRef = React.useRef<HTMLDivElement>(null);
  const [isFarcasterAuthInProgress, setIsFarcasterAuthInProgress] =
    useState(false);

  // Connection status data with priority (Hive > Ethereum > Farcaster)
  const connections: ConnectionStatus[] = [
    {
      name: "Hive",
      connected: !!user,
      icon: FaHive,
      color: "red",
      priority: 1,
    },
    {
      name: "Ethereum",
      connected: isEthereumConnected,
      icon: FaEthereum,
      color: "blue",
      priority: 2,
    },
    {
      name: "Farcaster",
      connected: isFarcasterConnected,
      icon: SiFarcaster,
      color: "purple",
      priority: 3,
    },
  ];

  // Get primary connection (highest priority connected)
  const primaryConnection = connections
    .filter((conn) => conn.connected)
    .sort((a, b) => a.priority - b.priority)[0];

  // Get user display info for primary connection
  const getPrimaryUserInfo = () => {
    if (!primaryConnection) return null;

    switch (primaryConnection.name) {
      case "Hive":
        if (user) {
          return {
            displayName: user,
            avatar: `https://images.hive.blog/u/${user}/avatar`,
          };
        }
        break;
      case "Ethereum":
        if (ethereumAddress) {
          return {
            displayName: ethereumAddress,
            avatar: ethereumAddress,
          };
        }
        break;
      case "Farcaster":
        if (farcasterProfile) {
          return {
            displayName:
              farcasterProfile.displayName ||
              farcasterProfile.username ||
              `fid:${farcasterProfile.fid}`,
            avatar:
              farcasterProfile.pfpUrl ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=fid${farcasterProfile.fid}`,
          };
        }
        break;
    }
    return null;
  };

  // Connection handlers
  const handleHiveLogin = async () => {
    setIsConnectionModalOpen(false);
    await aioha.logout();
    setModalDisplayed(true);
  };

  const handleFarcasterConnect = () => {
    if (isFarcasterAuthInProgress || isFarcasterConnected) {
      return;
    }

    setIsFarcasterAuthInProgress(true);
    const hiddenButton = hiddenSignInRef.current?.querySelector("button");
    if (hiddenButton) {
      hiddenButton.click();
    }
  };

  if (!isClientMounted) {
    return null;
  }

  const primaryUserInfo = getPrimaryUserInfo();

  return (
    <>
      {/* Main Login/Profile Button */}
      <Button
        onClick={() => setIsConnectionModalOpen(true)}
        color="text"
        bg="background"
        border="1px solid"
        borderColor="border"
        w="full"
        mt="auto"
        mb={8}
        size="md"
        leftIcon={
          primaryConnection && primaryUserInfo ? (
            <Box position="relative">
              {primaryConnection.name === "Ethereum" ? (
                <Box
                  width="24px"
                  height="24px"
                  borderRadius="50%"
                  overflow="hidden"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Avatar
                    address={ethereumAddress as `0x${string}`}
                    className={ONCHAIN_AVATAR_CLASS}
                  />
                </Box>
              ) : (
                <ChakraAvatar
                  size="sm"
                  src={primaryUserInfo.avatar}
                  name={primaryUserInfo.displayName}
                />
              )}
            </Box>
          ) : undefined
        }
        rightIcon={
          primaryConnection ? (
            <HStack spacing={1}>
              {connections
                .filter((conn) => conn.connected)
                .map((conn) => (
                  <Badge
                    key={conn.name}
                    size="sm"
                    colorScheme={conn.color}
                    borderRadius="full"
                  >
                    <Icon as={conn.icon} boxSize={2} />
                  </Badge>
                ))}
            </HStack>
          ) : undefined
        }
        _hover={{
          borderColor: "primary",
        }}
      >
        {primaryConnection && primaryUserInfo ? (
          primaryConnection.name === "Ethereum" ? (
            <Name address={ethereumAddress as `0x${string}`} />
          ) : (
            <Text fontSize="sm" noOfLines={1}>
              {primaryUserInfo.displayName}
            </Text>
          )
        ) : (
          "Login"
        )}
      </Button>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onHiveLogin={handleHiveLogin}
        onFarcasterConnect={handleFarcasterConnect}
        isFarcasterAuthInProgress={isFarcasterAuthInProgress}
        primaryConnection={primaryConnection}
      />

      {/* Hive Login Modal */}
      <div className={colorMode}>
        <AiohaModal
          displayed={modalDisplayed}
          loginOptions={{
            msg: "Login",
            keyType: KeyTypes.Posting,
            loginTitle: "Login",
          }}
          onLogin={() => {}}
          onClose={() => setModalDisplayed(false)}
        />
      </div>

      {/* Hidden Farcaster SignInButton */}
      <Box
        ref={hiddenSignInRef}
        position="absolute"
        top="-9999px"
        left="-9999px"
        pointerEvents="none"
        opacity={0}
      >
        <SignInButton
          onSuccess={({ fid, username }) => {
            console.log("🎉 Farcaster Sign In Success:", {
              fid,
              username,
            });
            setIsFarcasterAuthInProgress(false);
            setIsConnectionModalOpen(false);
            toast({
              status: "success",
              title: "Connected to Farcaster!",
              description: `Welcome, @${username}!`,
              duration: 3000,
            });
          }}
          onError={(error) => {
            console.error("❌ Farcaster Sign In Error:", error);
            setIsFarcasterAuthInProgress(false);
            toast({
              status: "error",
              title: "Authentication failed",
              description:
                error?.message || "Failed to authenticate with Farcaster",
              duration: 5000,
            });
          }}
        />
      </Box>
    </>
  );
}
