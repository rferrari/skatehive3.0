
"use client";
import React, { useState, useEffect } from "react";
import { useAioha } from "@aioha/react-ui";
import { FarcasterPreferences } from "@/lib/farcaster/skatehive-integration";
import {
    Box,
    Button,
    Container,
    Heading,
    Text,
    Input,
    Select,
    Switch,
    Stack,
    Flex,
    Divider,
    useToast,
    SimpleGrid,
    Badge,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Code,
} from "@chakra-ui/react";

export default function FarcasterSettingsPageWrapper() {
    const { user } = useAioha();
    if (!user)
        return (
            <Container minH="100vh" centerContent bg="gray.900" color="white" py={8}>
                <Box maxW="lg" w="full" bg="yellow.900" borderWidth={1} borderColor="yellow.700" rounded="lg" p={6}>
                    <Heading size="md" mb={2}>🔐 Login Required</Heading>
                    <Text mb={4}>Please log in to your SkateHive account to manage Farcaster notifications.</Text>
                    <Text fontSize="sm" color="gray.300">For testing, set user data in localStorage:</Text>
                    <Code mt={2} p={2} bg="gray.800" rounded="md" fontSize="xs">{`localStorage.setItem('hiveUser', JSON.stringify({name: 'xvlad', posting_key: ''}));`}</Code>
                    <Button mt={2} colorScheme="blue" size="sm" onClick={() => { localStorage.setItem('hiveUser', JSON.stringify({ name: 'xvlad', posting_key: '' })); window.location.reload(); }}>Set Test User (xvlad)</Button>
                </Box>
            </Container>
        );
    return <FarcasterSettingsPage hiveUsername={user} postingKey={undefined} />;
}


interface FarcasterSettingsProps {
    hiveUsername: string;
    postingKey?: string;
}

function FarcasterSettingsPage({ hiveUsername, postingKey }: FarcasterSettingsProps) {
    const [preferences, setPreferences] = useState<FarcasterPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fid, setFid] = useState("");
    const [farcasterUsername, setFarcasterUsername] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [notificationsQueue, setNotificationsQueue] = useState<any[]>([]);
    const [eventLogs, setEventLogs] = useState<string[]>([]);
    const toast = useToast();

    // Load user data function (move to top for scope)
    const loadUserData = async () => {
        setLoading(true);
        try {
            const userPrefs = await fetch(`/api/farcaster/user-preferences?hiveUsername=${hiveUsername}`).then((r) => r.json());
            if (userPrefs.success) setPreferences(userPrefs.data);
            // Fetch notifications in queue (unread)
            const queueRes = await fetch(`/api/farcaster/notifications-queue?hiveUsername=${hiveUsername}`);
            const queueData = await queueRes.json();
            if (queueData.success && Array.isArray(queueData.notifications)) {
                setNotificationsQueue(queueData.notifications);
            } else {
                setNotificationsQueue([]);
            }
        } catch (error) {
            // silent fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Button handlers for notifications
    const handleTestNotification = async () => {
        setSaving(true);
        setEventLogs(logs => [...logs, `Test notification requested at ${new Date().toLocaleTimeString()}`]);
        try {
            const response = await fetch("/api/farcaster/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "test",
                    title: "Test Notification",
                    body: "This is a test notification from SkateHive.",
                    sourceUrl: "https://skatehive.app"
                }),
            });
            const result = await response.json();
            if (result.success) {
                toast({ status: "success", title: `Test notification sent! (${result.results?.length || 0})` });
                setEventLogs(logs => [...logs, `Test notification sent: ${result.results?.length || 0}`]);
            } else {
                toast({ status: "error", title: result.message });
                setEventLogs(logs => [...logs, `Test notification failed: ${result.message}`]);
            }
        } catch {
            toast({ status: "error", title: "Failed to send test notification" });
            setEventLogs(logs => [...logs, `Test notification error`]);
        } finally {
            setSaving(false);
        }
    };

    const handleSendUnreadNotifications = async () => {
        setSaving(true);
        setEventLogs(logs => [...logs, `Send unread notifications requested at ${new Date().toLocaleTimeString()}`]);
        try {
            const response = await fetch(`/api/farcaster/send-unread-notifications?hiveUsername=${hiveUsername}`);
            const result = await response.json();
            if (result.success) {
                toast({ status: "success", title: `Sent unread notifications! (${result.notificationsSent})` });
                setEventLogs(logs => [...logs, `Unread notifications sent: ${result.notificationsSent}`]);
                await loadUserData();
            } else {
                toast({ status: "error", title: result.message });
                setEventLogs(logs => [...logs, `Send unread notifications failed: ${result.message}`]);
            }
        } catch {
            toast({ status: "error", title: "Failed to send unread notifications" });
            setEventLogs(logs => [...logs, `Send unread notifications error`]);
        } finally {
            setSaving(false);
        }
    };


    const linkFarcasterAccount = async () => {
        if (!fid || !farcasterUsername) {
            toast({ status: "error", title: "Please enter both FID and Farcaster username" });
            return;
        }
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
                setFid("");
                setFarcasterUsername("");
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

    const updateScheduledPreferences = async (newPrefs: any) => {
        setSaving(true);
        try {
            const response = await fetch("/api/farcaster/scheduled-notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hiveUsername, preferences: newPrefs }),
            });
            const result = await response.json();
            if (result.success) {
                toast({ status: "success", title: "Scheduled preferences updated" });
                await loadUserData();
            } else {
                toast({ status: "error", title: result.message });
            }
        } catch {
            toast({ status: "error", title: "Failed to update scheduled preferences" });
        } finally {
            setSaving(false);
        }
    };

    const testScheduledNotifications = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/farcaster/scheduled-notifications?action=trigger&hiveUsername=${hiveUsername}`);
            const result = await response.json();
            if (result.success) {
                toast({ status: "success", title: `Test successful! Sent ${result.notificationsSent} notifications` });
            } else {
                toast({ status: "error", title: result.message });
            }
        } catch {
            toast({ status: "error", title: "Failed to test notifications" });
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

    if (loading)
        return (
            <Container minH="100vh" centerContent bg="gray.900" color="white" py={8}>
                <Box maxW="lg" w="full" bg="gray.800" rounded="lg" p={6}>
                    <Box h={8} bg="gray.700" rounded="md" mb={6} />
                    <Box h={32} bg="gray.700" rounded="md" />
                </Box>
            </Container>
        );

    return (
        <Container minH="100vh" maxW="lg" bg="gray.900" color="white" py={8}>
            <Heading size="lg" mb={2}>🛹 Farcaster Notifications</Heading>
            <Text color="gray.400" mb={8}>Manage your Farcaster notification preferences for SkateHive</Text>

            {message && (
                <Box p={4} rounded="lg" mb={6} bg={message.type === "success" ? "green.900" : "red.900"} borderWidth={1} borderColor={message.type === "success" ? "green.700" : "red.700"}>
                    {message.text}
                </Box>
            )}

            {!preferences ? (
                <Box bg="gray.800" p={6} rounded="lg" mb={6}>
                    <Heading size="md" mb={4}>🔗 Connect Your Farcaster Account</Heading>
                    <Text color="gray.400" mb={6}>Link your Farcaster account to receive notifications from SkateHive.</Text>
                    <Stack spacing={4}>
                        <Box>
                            <Text fontSize="sm" mb={2}>Your Farcaster FID</Text>
                            <Input value={fid} onChange={(e) => setFid(e.target.value)} placeholder="e.g., 20721" bg="gray.700" color="white" />
                        </Box>
                        <Box>
                            <Text fontSize="sm" mb={2}>Your Farcaster Username</Text>
                            <Input value={farcasterUsername} onChange={(e) => setFarcasterUsername(e.target.value)} placeholder="e.g., yourname" bg="gray.700" color="white" />
                        </Box>
                        <Button colorScheme="blue" onClick={linkFarcasterAccount} isLoading={saving}>Link Account</Button>
                    </Stack>
                </Box>
            ) : (
                <Box bg="gray.800" p={6} rounded="lg">
                    <Heading size="md" mb={4}>✅ Connected Account</Heading>
                    <Flex align="center" justify="space-between">
                        <Box>
                            <Text fontSize="lg">@{preferences.farcasterUsername}</Text>
                            <Text color="gray.400">FID: {preferences.fid}</Text>
                            <Text fontSize="sm" color="gray.500">Connected: {preferences.linkedAt ? new Date(preferences.linkedAt).toLocaleDateString() : "N/A"}</Text>
                        </Box>
                        <Button colorScheme="red" onClick={unlinkAccount} isLoading={saving}>Unlink</Button>
                    </Flex>
                    <Box mt={6}>
                        <Text fontWeight="medium" mb={2}>Enable Notifications</Text>
                        <Switch isChecked={preferences.notificationsEnabled} onChange={e => updatePreferences({ notificationsEnabled: e.target.checked })} colorScheme="blue" />
                    </Box>
                    <Stack direction="row" spacing={4} mt={6}>
                        <Button colorScheme="blue" onClick={handleTestNotification} isLoading={saving}>Send Test Notification</Button>
                        <Button colorScheme="purple" onClick={handleSendUnreadNotifications} isLoading={saving}>Send Unread Notifications</Button>
                    </Stack>
                    <Box mt={8}>
                        <Heading size="sm" mb={2}>Notifications in Queue</Heading>
                        {notificationsQueue.length === 0 ? (
                            <Text color="gray.400">No unread notifications in queue.</Text>
                        ) : (
                            <Stack spacing={2}>
                                {notificationsQueue.map((notif, idx) => (
                                    <Box key={idx} p={2} bg="gray.700" rounded="md">
                                        <Text fontSize="sm" fontWeight="bold">{notif.type}</Text>
                                        <Text fontSize="sm">{notif.message}</Text>
                                        <Text fontSize="xs" color="gray.400">{notif.timestamp ? new Date(notif.timestamp).toLocaleString() : ""}</Text>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                    <Box mt={8}>
                        <Heading size="sm" mb={2}>Event Logs</Heading>
                        <Stack spacing={1} fontSize="xs">
                            {eventLogs.length === 0 ? <Text color="gray.400">No events yet.</Text> : eventLogs.map((log, idx) => <Text key={idx}>{log}</Text>)}
                        </Stack>
                    </Box>
                </Box>
            )}
        </Container>
    );
}
