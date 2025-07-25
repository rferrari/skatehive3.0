"use client";
import React, { useState } from "react";
import {
  Button,
  Box,
  VStack,
  HStack,
  Text,
  useColorMode,
  Icon,
  useToast,
  Avatar as ChakraAvatar,
} from "@chakra-ui/react";
import { AiohaModal, useAioha } from "@aioha/react-ui";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { KeyTypes } from "@aioha/aioha";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";
import { SignInButton, useSignIn } from "@farcaster/auth-kit";
import { useOrderedIdentity } from "@/hooks/useIdentity";
import "@aioha/react-ui/dist/build.css";
import { FaEthereum, FaHive } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";
import { Name, Avatar, Address } from "@coinbase/onchainkit/identity";
// OnchainKit component class names
const ONCHAIN_AVATAR_CLASS = "custom-onchain-avatar";
const ONCHAIN_NAME_CLASS = "custom-onchain-name";
const ONCHAIN_AVATAR_CONTAINER_CLASS = "onchainkit-avatar-container";
const ONCHAIN_NAME_CONTAINER_CLASS = "onchainkit-name-container";

// Add custom CSS to override Farcaster button styles and OnchainKit styles
const farcasterButtonStyles = `
  .fc-authkit-signin-button button {
    font-size: 12px !important;
    padding: 4px 8px !important;
    min-width: fit-content !important;
    height: 24px !important;
    border-radius: 4px !important;
    font-weight: normal !important;
    border: none !important;
    color: white !important;
    font-family: inherit !important;
    transition: all 0.2s !important;
  }
  .fc-authkit-signin-button button:hover {
    transform: none !important;
    box-shadow: none !important;
  }
  .fc-authkit-signin-button button:focus {
    outline: none !important;
  }
  .fc-authkit-signin-button button:active {
  }
`;

const onchainKitStyles = `
  /* OnchainKit Avatar root container: force size, roundness, and clipping */
  [data-testid="ockAvatar"] {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
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
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    object-fit: cover !important;
    display: block !important;
  }
  
  /* Balanced name/text styling */
  .${ONCHAIN_NAME_CLASS} {
    font-size: 12px;
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  
  /* OnchainKit name component - more gentle styling */
  [data-testid="ockName"] {
    font-size: 12px;
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  
  /* Container styles for proper alignment */
  .${ONCHAIN_AVATAR_CONTAINER_CLASS} {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    overflow: hidden;
  }
  
  .${ONCHAIN_NAME_CONTAINER_CLASS} {
    display: flex;
    align-items: center;
    overflow: hidden;
    flex: 1;
  }
`;

interface ConnectionStatus {
  name: string;
  connected: boolean;
  icon: any;
  color: string;
}

export default function AuthButton() {
  const { user, aioha } = useAioha();
  const { colorMode } = useColorMode();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const [showConnectionOptions, setShowConnectionOptions] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const toast = useToast();

  // Ensure client-side only rendering to prevent hydration mismatch
  React.useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Toggle this to switch between custom button (true) and styled SignInButton (false)
  const USE_CUSTOM_FARCASTER_BUTTON = true;

  // Inject custom styles for Farcaster button and OnchainKit components
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      // Inject OnchainKit styles
      const onchainKitStyleId = "onchainkit-button-override";
      let existingOnchainKitStyle = document.getElementById(onchainKitStyleId);

      if (!existingOnchainKitStyle) {
        const style = document.createElement("style");
        style.id = onchainKitStyleId;
        style.textContent = onchainKitStyles;
        document.head.appendChild(style);
      }

      // Inject Farcaster styles if using styled SignInButton
      if (!USE_CUSTOM_FARCASTER_BUTTON) {
        const styleId = "farcaster-button-override";
        let existingStyle = document.getElementById(styleId);

        if (!existingStyle) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = farcasterButtonStyles;
          document.head.appendChild(style);
        }
      }
    }
  }, [USE_CUSTOM_FARCASTER_BUTTON]);

  // Get connection states
  const { isConnected: isEthereumConnected, address: ethereumAddress } =
    useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    isAuthenticated: isFarcasterConnected,
    profile: farcasterProfile,
    clearSession,
  } = useFarcasterSession();
  const { signIn, signOut } = useSignIn({});
  const { address: orderedAddress } = useOrderedIdentity();

  // Check if any connection exists or if user wants to see connection options
  const hasAnyConnection = user || isEthereumConnected || isFarcasterConnected;
  const shouldShowConnectionPanel = hasAnyConnection || showConnectionOptions;

  // Connection status data
  const baseConnections: ConnectionStatus[] = [
    {
      name: "Hive",
      connected: !!user,
      icon: FaHive,
      color: "red",
    },
    {
      name: "Ethereum",
      connected: isEthereumConnected,
      icon: FaEthereum,
      color: "blue.200",
    },
    {
      name: "Farcaster",
      connected: isFarcasterConnected,
      icon: SiFarcaster,
      color: "purple.400",
    },
  ];

  // Only sort on client side to prevent hydration mismatch
  const connections = isClientMounted
    ? baseConnections.sort((a, b) => {
        // Sort connected protocols first (true comes before false)
        return Number(b.connected) - Number(a.connected);
      })
    : baseConnections;

  // Helper functions to get user display information
  const getUserDisplayInfo = (connection: ConnectionStatus) => {
    switch (connection.name) {
      case "Hive":
        if (user) {
          return {
            displayName: user,
            avatar: `https://images.hive.blog/u/${user}/avatar`,
            address: user,
          };
        }
        break;
      case "Ethereum":
        if (ethereumAddress) {
          return {
            displayName: ethereumAddress, // Will be resolved by OnchainKit Name component
            avatar: ethereumAddress, // Will be resolved by OnchainKit Avatar component
            address: ethereumAddress,
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
            address: farcasterProfile.username || `fid:${farcasterProfile.fid}`,
          };
        }
        break;
    }
    return null;
  };

  const getConnectionButtonText = (connection: ConnectionStatus) => {
    if (connection.connected) {
      return getUserDisplayInfo(connection)?.displayName || "Connected";
    } else {
      switch (connection.name) {
        case "Hive":
          return "Login";
        case "Ethereum":
        case "Farcaster":
          return "Connect";
        default:
          return "Connect";
      }
    }
  };

  const handleShowConnectionOptions = () => {
    setShowConnectionOptions(true);
  };

  const handleHiveLogin = async () => {
    await aioha.logout();
    setModalDisplayed(true);
  };

  const handleHiveLogout = async () => {
    await aioha.logout();
    toast({
      status: "success",
      title: "Logged out from Hive",
      description: "You have been disconnected from Hive",
    });
  };

  const handleEthereumConnect = async () => {
    try {
      const connector = connectors[0]; // Use first available connector
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      toast({
        status: "error",
        title: "Connection failed",
        description: "Failed to connect to Ethereum wallet",
      });
    }
  };

  const handleEthereumDisconnect = () => {
    disconnect();
    toast({
      status: "success",
      title: "Disconnected from Ethereum",
      description: "Your Ethereum wallet has been disconnected",
    });
  };

  // Alternative approach: Custom Farcaster button with hidden SignInButton
  const hiddenSignInRef = React.useRef<HTMLDivElement>(null);
  const [isFarcasterAuthInProgress, setIsFarcasterAuthInProgress] =
    useState(false);

  const handleCustomFarcasterSignIn = () => {
    // Prevent multiple authentication attempts
    if (isFarcasterAuthInProgress || isFarcasterConnected) {
      console.log("🚫 Farcaster auth already in progress or connected");
      return;
    }

    console.log("🚀 Custom Farcaster Sign In triggered");
    setIsFarcasterAuthInProgress(true);

    // Find and click the hidden SignInButton
    const hiddenButton = hiddenSignInRef.current?.querySelector("button");
    if (hiddenButton) {
      hiddenButton.click();
    }
  };

  const handleFarcasterDisconnect = () => {
    signOut();
    clearSession();
    toast({
      status: "success",
      title: "Disconnected from Farcaster",
      description: "You have been signed out from Farcaster",
    });
  };

  const getConnectionAction = (connection: ConnectionStatus) => {
    if (connection.connected) {
      switch (connection.name) {
        case "Hive":
          return handleHiveLogout;
        case "Ethereum":
          return handleEthereumDisconnect;
        case "Farcaster":
          return handleFarcasterDisconnect;
        default:
          return () => {};
      }
    } else {
      switch (connection.name) {
        case "Hive":
          return handleHiveLogin;
        case "Ethereum":
          return handleEthereumConnect;
        case "Farcaster":
          return handleCustomFarcasterSignIn;
        default:
          return () => {};
      }
    }
  };

  if (!shouldShowConnectionPanel) {
    return (
      <>
        <Button
          onClick={handleShowConnectionOptions}
          color="background"
          w="full"
          mt="auto"
          mb={8}
        >
          Login
        </Button>

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
      </>
    );
  }

  return (
    <>
      <VStack spacing={0} align="stretch" p={0} m={0} mt="auto" mb={4}>
        <Box>
          <HStack spacing={2}>
            {!hasAnyConnection && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setShowConnectionOptions(false)}
                color="muted"
                _hover={{ color: "text" }}
              >
                ✕
              </Button>
            )}
          </HStack>

          <VStack spacing={0} align="stretch">
            {connections.map((connection) => (
              <Box
                key={connection.name}
                p={2}
                borderRadius="md"
                transition="all 0.2s"
              >
                {/* Special handling for Farcaster - try SignInButton first, fallback to custom */}
                {connection.name === "Farcaster" && !connection.connected ? (
                  // Option 1: Try styled SignInButton
                  !USE_CUSTOM_FARCASTER_BUTTON ? (
                    <Box
                      className="fc-authkit-signin-button"
                      fontSize="xs"
                      sx={{
                        "& > div": {
                          display: "flex !important",
                          width: "auto !important",
                        },
                      }}
                    >
                      <SignInButton
                        onSuccess={({ fid, username }) => {
                          console.log("🎉 Farcaster Sign In Success:", {
                            fid,
                            username,
                          });
                          toast({
                            status: "success",
                            title: "Connected to Farcaster!",
                            description: `Welcome, @${username}!`,
                            duration: 3000,
                          });
                        }}
                        onError={(error) => {
                          console.error("❌ Farcaster Sign In Error:", error);
                          toast({
                            status: "error",
                            title: "Authentication failed",
                            description:
                              error?.message ||
                              "Failed to authenticate with Farcaster",
                            duration: 5000,
                          });
                        }}
                      />
                    </Box>
                  ) : (
                    // Option 2: Custom button that matches the design perfectly
                    <Button
                      size="xs"
                      variant="ghost"
                      bg="transparent"
                      color="text"
                      onClick={handleCustomFarcasterSignIn}
                      w="full"
                      fontSize="xs"
                      leftIcon={<Icon as={connection.icon} boxSize={3} />}
                      isLoading={isFarcasterAuthInProgress}
                      loadingText="Connecting..."
                      isDisabled={isFarcasterAuthInProgress}
                      justifyContent="flex-start"
                      pl={3}
                    >
                      <Text fontSize="xs" noOfLines={1}>
                        Connect
                      </Text>
                    </Button>
                  )
                ) : (
                  <Button
                    size="xs"
                    variant="ghost"
                    bg="transparent"
                    color="text"
                    onClick={getConnectionAction(connection)}
                    w="full"
                    fontSize="xs"
                    leftIcon={
                      connection.connected && getUserDisplayInfo(connection) ? (
                        <Box
                          position="relative"
                          display="inline-block"
                          minWidth="24px"
                          minHeight="24px"
                        >
                          {connection.name === "Ethereum" ? (
                            <Box
                              width="20px"
                              height="20px"
                              borderRadius="50%"
                              overflow="hidden"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Avatar
                                address={ethereumAddress as `0x${string}`}
                                className={ONCHAIN_AVATAR_CLASS}
                                style={{ width: 20, height: 20 }}
                              />
                            </Box>
                          ) : (
                            <ChakraAvatar
                              size="xs"
                              src={getUserDisplayInfo(connection)?.avatar}
                              name={getUserDisplayInfo(connection)?.displayName}
                              className={ONCHAIN_AVATAR_CLASS}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                          <Box
                            position="absolute"
                            bottom={-2}
                            right={-2}
                            bg="transparent"
                            borderRadius="full"
                            p={0}
                          >
                            <Icon
                              as={connection.icon}
                              boxSize={3}
                              color={connection.color}
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Icon as={connection.icon} boxSize={3} />
                      )
                    }
                    justifyContent="flex-start"
                    pl={3}
                  >
                    {connection.name === "Ethereum" && connection.connected ? (
                      <Box className={ONCHAIN_NAME_CONTAINER_CLASS}>
                        <Name
                          address={ethereumAddress as `0x${string}`}
                          className={ONCHAIN_NAME_CLASS}
                        />
                      </Box>
                    ) : (
                      <Box className={ONCHAIN_NAME_CONTAINER_CLASS}>
                        <Text
                          fontSize="xs"
                          noOfLines={1}
                          className={ONCHAIN_NAME_CLASS}
                        >
                          {getConnectionButtonText(connection)}
                        </Text>
                      </Box>
                    )}
                  </Button>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>

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

      {/* Hidden Farcaster SignInButton for programmatic triggering */}
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
