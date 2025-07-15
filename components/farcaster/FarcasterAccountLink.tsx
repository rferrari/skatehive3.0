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
} from "@chakra-ui/react";
import { SignInButton, useProfile } from '@farcaster/auth-kit';
import { FarcasterPreferences } from "@/lib/farcaster/skatehive-integration";

interface FarcasterAccountLinkProps {
    hiveUsername: string;
    postingKey?: string;
}

export default function FarcasterAccountLink({ hiveUsername, postingKey }: FarcasterAccountLinkProps) {
    const [preferences, setPreferences] = useState<FarcasterPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const { isAuthenticated, profile } = useProfile();

    const loadUserData = useCallback(async () => {
        setLoading(true);
        try {
            const userPrefs = await fetch(`/api/farcaster/user-preferences?hiveUsername=${hiveUsername}`).then((r) => r.json());
            if (userPrefs.success) setPreferences(userPrefs.data);
        } catch (error) {
            // silent fail
        } finally {
            setLoading(false);
        }
    }, [hiveUsername]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const linkFarcasterAccount = async (fid: string, farcasterUsername: string) => {
        setSaving(true);
        try {
            const response = await fetch("/api/farcaster/link-skatehive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hiveUsername, fid, farcasterUsername, updateHiveProfile: !!postingKey, postingKey }),
            });
            const result = await response.json();
            if (result.success) {
                toast({ status: "success", title: result.message });
                await loadUserData();
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
        if (!window.confirm("Are you sure you want to unlink your Farcaster account?")) return;
        setSaving(true);
        try {
            const response = await fetch("/api/farcaster/unlink", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hiveUsername, updateHiveProfile: !!postingKey, postingKey }),
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

    if (loading) {
        return (
            <Box bg="background" border="1px solid" borderColor="muted" p={6} shadow="sm">
                <Box h={8} bg="muted" mb={6} />
                <Box h={32} bg="muted" />
            </Box>
        );
    }

    return (
        <Box bg="background" border="1px solid" borderColor="muted" p={6} shadow="sm">
            <VStack spacing={4} align="stretch">
                <Box>
                    <Heading size="md" color="primary" mb={1}>
                        🛹 Farcaster Notifications
                    </Heading>
                    <Text color="primary" fontSize="sm">
                        Connect your Farcaster account to receive notifications
                    </Text>
                </Box>

                {!preferences ? (
                    <VStack spacing={4}>
                        {!isAuthenticated ? (
                            <Box textAlign="center">
                                <Text fontSize="sm" mb={4} color="primary">
                                    Connect your Farcaster account to enable notifications
                                </Text>
                                <SignInButton
                                    onSuccess={({ fid, username }) => {
                                        if (fid && username) {
                                            linkFarcasterAccount(fid.toString(), username);
                                        } else {
                                            toast({ 
                                                status: "error", 
                                                title: "Authentication incomplete",
                                                description: "Missing FID or username from Farcaster"
                                            });
                                        }
                                    }}
                                    onError={(error) => {
                                        toast({ 
                                            status: "error", 
                                            title: "Authentication failed",
                                            description: error?.message || "Failed to authenticate with Farcaster"
                                        });
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box textAlign="center" p={4} bg="background" border="1px solid" borderColor="muted">
                                <Text fontSize="lg" color="primary" fontWeight="bold" mb={2}>
                                    Welcome, @{profile?.username}!
                                </Text>
                                <Text fontSize="sm" color="primary" mb={4}>
                                    FID: {profile?.fid}
                                </Text>
                                <Button
                                    bg="accent"
                                    color="background"
                                    onClick={() => profile?.fid && profile?.username && linkFarcasterAccount(profile.fid.toString(), profile.username)}
                                    isLoading={saving}
                                    size="lg"
                                    fontWeight="bold"
                                    _hover={{
                                        bg: 'accent',
                                        opacity: 0.8,
                                        transform: 'translateY(-1px)'
                                    }}
                                    _active={{ transform: 'translateY(0)' }}
                                >
                                    Link to SkateHive
                                </Button>
                            </Box>
                        )}
                    </VStack>
                ) : (
                    <VStack spacing={4} align="stretch">
                        <Flex align="center" justify="space-between" p={4} bg="background" border="1px solid" borderColor="muted">
                            <Box>
                                <Text fontSize="lg" color="primary" fontWeight="bold">@{preferences.farcasterUsername}</Text>
                                <Text color="primary" fontSize="sm">FID: {preferences.fid}</Text>
                                <Text fontSize="xs" color="primary">
                                    Connected: {preferences.linkedAt ? new Date(preferences.linkedAt).toLocaleDateString() : "N/A"}
                                </Text>
                            </Box>
                            <Button
                                bg="red.500"
                                color="white"
                                onClick={unlinkAccount}
                                isLoading={saving}
                                size="sm"
                                _hover={{
                                    bg: 'red.600',
                                    transform: 'translateY(-1px)'
                                }}
                                _active={{ transform: 'translateY(0)' }}
                            >
                                Unlink
                            </Button>
                        </Flex>

                        <Box p={4} bg="background" border="1px solid" borderColor="muted">
                            <Flex justify="space-between" align="center">
                                <Box>
                                    <Text fontWeight="bold" color="primary" mb={1}>Enable Notifications</Text>
                                    <Text fontSize="sm" color="primary">Receive updates about your SkateHive activity</Text>
                                </Box>
                                <Switch
                                    isChecked={preferences.notificationsEnabled}
                                    onChange={e => updatePreferences({ notificationsEnabled: e.target.checked })}
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
