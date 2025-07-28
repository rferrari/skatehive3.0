"use client";
import React, { useState, useRef, useEffect } from "react";
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
import useHiveAccount from "@/hooks/useHiveAccount";
import { migrateLegacyMetadata } from "@/lib/utils/metadataMigration";
import MergeAccountModal from "../profile/MergeAccountModal";
import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import { Operation } from "@hiveio/dhive";
import fetchAccount from "@/lib/hive/fetchAccount";

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

  // Get connection states
  const { isConnected: isEthereumConnected, address: ethereumAddress } =
    useAccount();
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile } =
    useFarcasterSession();
  const { hiveAccount } = useHiveAccount(user || "");
  const [showMergeModal, setShowMergeModal] = useState(false);
  const prevEthRef = useRef(isEthereumConnected);
  const prevFcRef = useRef(isFarcasterConnected);

  const handleMergeAccounts = async () => {
    if (!user) {
      setShowMergeModal(false);
      return;
    }

    try {
      const { jsonMetadata: currentMetadata, postingMetadata } =
        await fetchAccount(user);

      const migrated = migrateLegacyMetadata(currentMetadata);
      migrated.extensions = migrated.extensions || {};

      if (isEthereumConnected && ethereumAddress) {
        migrated.extensions.wallets = migrated.extensions.wallets || {};
        migrated.extensions.wallets.primary_wallet = ethereumAddress;
      }

      if (isFarcasterConnected && farcasterProfile) {
        migrated.extensions.farcaster = migrated.extensions.farcaster || {};
        migrated.extensions.farcaster.username = farcasterProfile.username;
        migrated.extensions.farcaster.fid = farcasterProfile.fid;
        if (farcasterProfile.pfpUrl) {
          migrated.extensions.farcaster.pfp_url = farcasterProfile.pfpUrl;
          postingMetadata.profile = postingMetadata.profile || {};
          postingMetadata.profile.profile_image = farcasterProfile.pfpUrl;
        }
        if (farcasterProfile.bio) {
          migrated.extensions.farcaster.bio = farcasterProfile.bio;
          postingMetadata.profile = postingMetadata.profile || {};
          postingMetadata.profile.about = farcasterProfile.bio;
        }

        migrated.extensions.wallets = migrated.extensions.wallets || {};
        if (farcasterProfile.custody) {
          migrated.extensions.wallets.custody_address = farcasterProfile.custody;
        }
        if (
          Array.isArray(farcasterProfile.verifications) &&
          farcasterProfile.verifications.length > 0
        ) {
          migrated.extensions.wallets.farcaster_verified_wallets =
            farcasterProfile.verifications;
        }
      }

      const operation: Operation = [
        "account_update2",
        {
          account: user,
          json_metadata: JSON.stringify(migrated),
          posting_json_metadata: JSON.stringify(postingMetadata),
          extensions: [],
        },
      ];

      const keychain = new KeychainSDK(window);
      const formParams = {
        data: {
          username: user,
          operations: [operation],
          method: KeychainKeyTypes.active,
        },
      };

      const result = await keychain.broadcast(formParams.data as any);

      if (!result) {
        throw new Error("Merge failed");
      }

      toast({
        title: "Profile Updated",
        status: "success",
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Failed to merge accounts", err);
      toast({
        title: "Merge Failed",
        description: err?.message || "Unable to update account",
        status: "error",
        duration: 3000,
      });
    } finally {
      setShowMergeModal(false);
    }
  };

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

  useEffect(() => {
    if (!user || !hiveAccount) {
      prevEthRef.current = isEthereumConnected;
      prevFcRef.current = isFarcasterConnected;
      return;
    }

    try {
      const raw = hiveAccount.json_metadata
        ? JSON.parse(hiveAccount.json_metadata)
        : {};
      const parsed = migrateLegacyMetadata(raw);
      const hasWallet = !!parsed.extensions?.wallets?.primary_wallet;
      const hasFarcaster = !!parsed.extensions?.farcaster?.username;

      if (
        isEthereumConnected &&
        !prevEthRef.current &&
        !hasWallet
      ) {
        setShowMergeModal(true);
      }

      if (
        isFarcasterConnected &&
        !prevFcRef.current &&
        !hasFarcaster
      ) {
        setShowMergeModal(true);
      }
    } catch (err) {
      // ignore parse errors
    }

    prevEthRef.current = isEthereumConnected;
    prevFcRef.current = isFarcasterConnected;
  }, [isEthereumConnected, isFarcasterConnected, hiveAccount, user]);

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
                    className={"rounded-full"}
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
            <Name
              address={ethereumAddress as `0x${string}`}
              className="text-sm text-white"
            />
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
      <MergeAccountModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        onMerge={handleMergeAccounts}
      />
    </>
  );
}
