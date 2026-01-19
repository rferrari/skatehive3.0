"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  Switch,
  VStack,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  Badge,
} from "@chakra-ui/react";
import { FarcasterPreferences } from "@/lib/farcaster/skatehive-integration";
import { useFarcasterMiniapp } from "@/hooks/useFarcasterMiniapp";
import { APP_CONFIG } from "@/config/app.config";

interface FarcasterMiniappLinkProps {
  hiveUsername: string;
  postingKey?: string;
}

export default function FarcasterMiniappLink({
  hiveUsername,
  postingKey,
}: FarcasterMiniappLinkProps) {
  const [preferences, setPreferences] = useState<FarcasterPreferences | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Use miniapp SDK hook
  const { isInMiniapp, user, isLoading, isReady, composeCast } =
    useFarcasterMiniapp();

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userPrefs = await fetch(
        `/api/farcaster/user-preferences?hiveUsername=${hiveUsername}`
      ).then((r) => r.json());
      if (userPrefs.success) setPreferences(userPrefs.data);
    } catch (error) {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [hiveUsername]);

  useEffect(() => {
    if (isReady) {
      loadUserData();
    }
  }, [loadUserData, isReady]);

  const linkFarcasterAccount = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch("/api/farcaster/link-skatehive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hiveUsername,
          fid: user.fid.toString(),
          farcasterUsername: user.username,
          updateHiveProfile: !!postingKey,
          postingKey,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          status: "success",
          title: "Account linked successfully!",
          description: "Your Farcaster account is now linked to SkateHive.",
        });
        await loadUserData();

        // Send welcome notification to the user
        try {
          await fetch("/api/farcaster/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "follow",
              title: "🛹 Connected to SkateHive!",
              body: `Welcome @${user.username}! Your Farcaster account is now linked to SkateHive.`,
              hiveUsername: hiveUsername,
              sourceUrl: `${APP_CONFIG.ORIGIN}/settings/farcaster`,
            }),
          });
        } catch (notificationError) {
          // Silent fail for notification - don't block the main flow
          console.warn(
            "Failed to send welcome notification:",
            notificationError
          );
        }
      } else {
        toast({ status: "error", title: result.message });
      }
    } catch {
      toast({ status: "error", title: "Failed to link account" });
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = async (newPrefs: Partial<FarcasterPreferences>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/farcaster/update-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiveUsername, preferences: newPrefs }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ status: "success", title: "Preferences updated" });
        await loadUserData();
      } else {
        toast({ status: "error", title: result.message });
      }
    } catch {
      toast({ status: "error", title: "Failed to update preferences" });
    } finally {
      setSaving(false);
    }
  };

  const unlinkAccount = async () => {
    if (
      !window.confirm("Are you sure you want to unlink your Farcaster account?")
    )
      return;
    setSaving(true);
    try {
      const response = await fetch("/api/farcaster/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hiveUsername,
          updateHiveProfile: !!postingKey,
          postingKey,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ status: "success", title: "Account unlinked" });
        setPreferences(null);
        await loadUserData();
      } else {
        toast({ status: "error", title: result.message });
      }
    } catch {
      toast({ status: "error", title: "Failed to unlink account" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Box
        bg="background"
        border="1px solid"
        borderColor="muted"
        p={6}
        shadow="sm"
      >
        <Box h={8} bg="muted" mb={6} />
        <Box h={32} bg="muted" />
        <Text fontSize="sm" color="primary" textAlign="center" mt={2}>
          {isLoading ? "Initializing Farcaster..." : "Loading..."}
        </Text>
      </Box>
    );
  }

  // If not in miniapp, show helpful message
  if (!isInMiniapp) {
    return (
      <Box
        bg="background"
        border="1px solid"
        borderColor="muted"
        p={6}
        shadow="sm"
      >
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading size="md" color="primary" mb={1}>
              🛹 Farcaster Notifications
            </Heading>
            <Text color="primary" fontSize="sm">
              Connect your Farcaster account to receive notifications
            </Text>
          </Box>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Miniapp Detection</Text>
              <Text fontSize="sm">
                This feature requires access through the Farcaster miniapp.
                Please access SkateHive through Farcaster to use this feature.
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Debug: Not in miniapp context (using sdk.isInMiniApp())
              </Text>
            </Box>
          </Alert>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="background"
      border="1px solid"
      borderColor="muted"
      p={6}
      shadow="sm"
    >
      <VStack spacing={4} align="stretch">
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <Heading size="md" color="primary">
              🛹 Farcaster Notifications
            </Heading>
            <Badge colorScheme="purple" size="sm">
              MINIAPP
            </Badge>
          </Flex>
          <Text color="primary" fontSize="sm">
            Connect your Farcaster account to receive notifications
          </Text>
        </Box>

        {!preferences ? (
          <VStack spacing={4}>
            <Box
              textAlign="center"
              p={4}
              bg="background"
              border="1px solid"
              borderColor="muted"
            >
              <Text fontSize="lg" color="primary" fontWeight="bold" mb={2}>
                Welcome, @{user?.username}!
              </Text>
              <Text fontSize="sm" color="primary" mb={2}>
                FID: {user?.fid}
              </Text>
              <Text fontSize="xs" color="green.500" mb={4}>
                ✅ Detected in Farcaster miniapp
              </Text>
              <Button
                bg="accent"
                color="background"
                onClick={linkFarcasterAccount}
                isLoading={saving}
                size="lg"
                fontWeight="bold"
                _hover={{
                  bg: "accent",
                  opacity: 0.8,
                  transform: "translateY(-1px)",
                }}
                _active={{ transform: "translateY(0)" }}
              >
                Link to SkateHive
              </Button>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <Flex
              align="center"
              justify="space-between"
              p={4}
              bg="background"
              border="1px solid"
              borderColor="muted"
            >
              <Box>
                <Text fontSize="lg" color="primary" fontWeight="bold">
                  @{preferences.farcasterUsername}
                </Text>
                <Text color="primary" fontSize="sm">
                  FID: {preferences.fid}
                </Text>
                <Text fontSize="xs" color="primary">
                  Connected:{" "}
                  {preferences.linkedAt
                    ? new Date(preferences.linkedAt).toLocaleDateString()
                    : "N/A"}
                </Text>
              </Box>
              <Button
                bg="red.500"
                color="white"
                onClick={unlinkAccount}
                isLoading={saving}
                size="sm"
                _hover={{
                  bg: "red.600",
                  transform: "translateY(-1px)",
                }}
                _active={{ transform: "translateY(0)" }}
              >
                Unlink
              </Button>
            </Flex>

            <Box p={4} bg="background" border="1px solid" borderColor="muted">
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold" color="primary" mb={1}>
                    Enable Notifications
                  </Text>
                  <Text fontSize="sm" color="primary">
                    Receive updates about your SkateHive activity
                  </Text>
                </Box>
                <Switch
                  isChecked={preferences.notificationsEnabled}
                  onChange={(e) =>
                    updatePreferences({
                      notificationsEnabled: e.target.checked,
                    })
                  }
                  colorScheme="green"
                  size="lg"
                />
              </Flex>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
