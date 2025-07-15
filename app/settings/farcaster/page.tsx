
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAioha } from "@aioha/react-ui";
import { isAdmin } from "@/lib/utils/adminCheck";
import {
    Box,
    Button,
    Container,
    Heading,
    Text,
    Input,
    Stack,
    useToast,
    Textarea,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from "@chakra-ui/react";
import FarcasterAccountLink from "@/components/farcaster/FarcasterAccountLink";

export default function FarcasterAdminPage() {
    const { user } = useAioha();
    const [saving, setSaving] = useState(false);
    const [eventLogs, setEventLogs] = useState<string[]>([]);
    const [notificationsQueue, setNotificationsQueue] = useState<any[]>([]);

    // Custom notification state
    const [customNotification, setCustomNotification] = useState({
        title: "",
        body: "",
        targetUrl: "https://skatehive.app"
    });

    const toast = useToast();

    // Check if user is admin - handle case where user is a string - memoized to prevent re-renders
    const userName = useMemo(() => {
        return typeof user === 'string' ? user : (user?.name || user?.username);
    }, [user]);

    const userIsAdmin = useMemo(() => {
        return userName ? isAdmin(userName) : false;
    }, [userName]);

    const loadNotificationsQueue = useMemo(() => async () => {
        if (!userName) return;

        try {
            const queueRes = await fetch(`/api/farcaster/notifications-queue?hiveUsername=${userName}`);
            const queueData = await queueRes.json();
            if (queueData.success && Array.isArray(queueData.notifications)) {
                setNotificationsQueue(queueData.notifications.slice(-5).reverse());
            } else {
                setNotificationsQueue([]);
            }
        } catch (error) {
            // silent fail
        }
    }, [userName]);

    useEffect(() => {
        loadNotificationsQueue();
    }, [loadNotificationsQueue]);

    // Admin-only functions
    const handleSendCustomNotification = async () => {
        console.log('🔥 [UI] handleSendCustomNotification called with:', customNotification);
        setSaving(true);
        setEventLogs(logs => [...logs, `Custom notification requested at ${new Date().toLocaleTimeString()}`]);

        try {
            console.log('🚀 [UI] Sending custom notification via notify endpoint...');
            const response = await fetch('/api/farcaster/notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: "custom",
                    title: customNotification.title,
                    body: customNotification.body,
                    sourceUrl: customNotification.targetUrl,
                    broadcast: true
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Custom notification sent",
                    description: `Sent to ${result.results?.length || 0} users`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
                setEventLogs(logs => [...logs, `Custom notification sent: ${result.results?.length || 0} users`]);

                setCustomNotification({
                    title: "",
                    body: "",
                    targetUrl: "https://skatehive.app"
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to send custom notification",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                setEventLogs(logs => [...logs, `Custom notification failed: ${result.message}`]);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send custom notification",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            setEventLogs(logs => [...logs, `Custom notification error`]);
        } finally {
            setSaving(false);
        }
    };

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

    if (!userName) {
        return (
            <Container minH="100vh" maxW="lg" bg="gray.900" color="white" py={8}>
                <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>Please log in to access Farcaster settings.</AlertDescription>
                </Alert>
            </Container>
        );
    }

    if (!userIsAdmin) {
        return (
            <Container minH="100vh" maxW="lg" bg="gray.900" color="white" py={8}>
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>You don't have permission to access this admin panel.</AlertDescription>
                </Alert>
            </Container>
        );
    }

    return (
        <Container minH="100vh" maxW="lg" bg="gray.900" color="white" py={8}>
            <Heading size="lg" mb={2}>🛹 Farcaster Admin Panel</Heading>
            <Text color="gray.400" mb={8}>Admin tools for managing Farcaster notifications</Text>

            {/* Account Management */}
            <FarcasterAccountLink
                hiveUsername={userName}
                postingKey={typeof user === 'object' ? user?.keys?.posting : undefined}
            />

            {/* Admin Tools */}
            <Box bg="gray.800" p={6} rounded="lg" mt={6}>
                <Heading size="md" mb={4}>🔧 Admin Tools</Heading>

                <Stack direction="row" spacing={4} mb={6}>
                    <Button colorScheme="blue" onClick={handleTestNotification} isLoading={saving}>
                        Send Test Notification
                    </Button>
                </Stack>

                {/* Custom Notification Section */}
                <Box mt={8}>
                    <Heading size="sm" mb={4}>📢 Send Custom Notification</Heading>
                    <Text color="gray.400" mb={4}>Send an announcement to all users</Text>

                    <Stack spacing={4}>
                        <Box>
                            <Text fontSize="sm" mb={2}>Title</Text>
                            <Input
                                value={customNotification.title}
                                onChange={(e) => setCustomNotification({
                                    ...customNotification,
                                    title: e.target.value
                                })}
                                placeholder="Notification title"
                                bg="gray.700"
                                color="white"
                                _placeholder={{ color: "gray.400" }}
                            />
                        </Box>

                        <Box>
                            <Text fontSize="sm" mb={2}>Message</Text>
                            <Textarea
                                value={customNotification.body}
                                onChange={(e) => setCustomNotification({
                                    ...customNotification,
                                    body: e.target.value
                                })}
                                placeholder="Notification message"
                                bg="gray.700"
                                color="white"
                                _placeholder={{ color: "gray.400" }}
                                rows={3}
                            />
                        </Box>

                        <Box>
                            <Text fontSize="sm" mb={2}>Target URL</Text>
                            <Input
                                value={customNotification.targetUrl}
                                onChange={(e) => setCustomNotification({
                                    ...customNotification,
                                    targetUrl: e.target.value
                                })}
                                placeholder="https://skatehive.app"
                                bg="gray.700"
                                color="white"
                                _placeholder={{ color: "gray.400" }}
                            />
                        </Box>

                        <Button
                            onClick={handleSendCustomNotification}
                            colorScheme="green"
                            isDisabled={!customNotification.title || !customNotification.body}
                            isLoading={saving}
                        >
                            Send to All Users
                        </Button>
                    </Stack>
                </Box>

                {/* Database Management Section */}
                <Box mt={8}>
                    <Heading size="sm" mb={4}>🗄️ Database Management</Heading>
                    <Text color="gray.400" mb={4}>Monitor and clean up notification logs to prevent database bloat</Text>

                    <Stack direction="row" spacing={4}>
                        <Button
                            onClick={async () => {
                                setSaving(true);
                                setEventLogs(logs => [...logs, `Database stats requested at ${new Date().toLocaleTimeString()}`]);

                                try {
                                    const response = await fetch('/api/farcaster/cleanup', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': 'Bearer cron-secret-key',
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ action: 'stats' }),
                                    });

                                    const result = await response.json();

                                    if (result.success) {
                                        setEventLogs(logs => [...logs,
                                        `Database Stats: ${result.stats.notificationLogCount} deduplication logs, ${result.stats.analyticsLogCount} analytics logs`
                                        ]);
                                        toast({
                                            title: "Database stats retrieved",
                                            description: `${result.stats.notificationLogCount} deduplication logs, ${result.stats.analyticsLogCount} analytics logs`,
                                            status: "success",
                                            duration: 5000,
                                            isClosable: true,
                                        });
                                    } else {
                                        throw new Error(result.message || 'Failed to get stats');
                                    }
                                } catch (error) {
                                    console.error('Error getting database stats:', error);
                                    setEventLogs(logs => [...logs, `Database stats error`]);
                                    toast({
                                        title: "Error getting database stats",
                                        status: "error",
                                        duration: 3000,
                                        isClosable: true,
                                    });
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            colorScheme="blue"
                            variant="outline"
                            size="sm"
                            isLoading={saving}
                        >
                            📊 Get Stats
                        </Button>

                        <Button
                            onClick={async () => {
                                if (!window.confirm("Clean up old notification logs? This will delete logs older than 30-90 days.")) return;

                                setSaving(true);
                                setEventLogs(logs => [...logs, `Database cleanup started at ${new Date().toLocaleTimeString()}`]);

                                try {
                                    const response = await fetch('/api/farcaster/cleanup', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': 'Bearer cron-secret-key',
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ action: 'cleanup' }),
                                    });

                                    const result = await response.json();

                                    if (result.success) {
                                        setEventLogs(logs => [...logs,
                                        `Cleanup: deleted ${result.results.deduplicationLogsDeleted} deduplication + ${result.results.analyticsLogsDeleted} analytics logs`
                                        ]);
                                        toast({
                                            title: "Database cleanup completed",
                                            description: `Deleted ${result.results.deduplicationLogsDeleted + result.results.analyticsLogsDeleted} old logs`,
                                            status: "success",
                                            duration: 5000,
                                            isClosable: true,
                                        });
                                    } else {
                                        throw new Error(result.message || 'Cleanup failed');
                                    }
                                } catch (error) {
                                    console.error('Error during cleanup:', error);
                                    setEventLogs(logs => [...logs, `Database cleanup error`]);
                                    toast({
                                        title: "Database cleanup failed",
                                        status: "error",
                                        duration: 3000,
                                        isClosable: true,
                                    });
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            colorScheme="orange"
                            variant="outline"
                            size="sm"
                            isLoading={saving}
                        >
                            🧹 Clean Up
                        </Button>
                    </Stack>
                </Box>

                <Box mt={8}>
                    <Heading size="sm" mb={2}>Last 5 Unread Notifications</Heading>
                    {notificationsQueue.length === 0 ? (
                        <Text color="gray.400">No unread notifications.</Text>
                    ) : (
                        <Stack spacing={2}>
                            {notificationsQueue.map((notif, idx) => (
                                <Box key={idx} p={2} bg="gray.700" rounded="md">
                                    <Text fontSize="sm" fontWeight="bold">{notif.type}</Text>
                                    <Text fontSize="sm">{notif.message || notif.body}</Text>
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
        </Container>
    );
}
