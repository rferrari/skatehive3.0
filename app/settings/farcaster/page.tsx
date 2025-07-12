
"use client";
import { useState, useEffect } from "react";
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
    const [stats, setStats] = useState<any>(null);
    const toast = useToast();

    useEffect(() => {
        loadUserData();
        // eslint-disable-next-line
    }, [hiveUsername]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const [userPrefs, notificationStats] = await Promise.all([
                fetch(`/api/farcaster/user-preferences?hiveUsername=${hiveUsername}`).then((r) => r.json()),
                fetch(`/api/farcaster/notification-stats?hiveUsername=${hiveUsername}`).then((r) => r.json()),
            ]);
            if (userPrefs.success) setPreferences(userPrefs.data);
            if (notificationStats.success) setStats(notificationStats.data);
        } catch (error) {
            // silent fail
        } finally {
            setLoading(false);
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
        <Container minH="100vh" maxW="4xl" bg="gray.900" color="white" py={8}>
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
                    <Text color="gray.400" mb={6}>Link your Farcaster account to receive notifications from SkateHive. Add SkateHive as a miniapp in your Farcaster client.</Text>
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
                    <Box mt={6} p={4} bg="blue.900" borderWidth={1} borderColor="blue.700" rounded="lg">
                        <Text fontWeight="semibold" mb={2}>How to find your FID:</Text>
                        <Stack fontSize="sm" color="gray.300" spacing={1}>
                            <Text>1. Open your Farcaster client (Warpcast, etc.)</Text>
                            <Text>2. Go to your profile</Text>
                            <Text>3. Your FID is in your profile URL or settings</Text>
                            <Text>4. Or visit farcaster.xyz/~/developers</Text>
                        </Stack>
                    </Box>
                </Box>
            ) : (
                <Stack spacing={6}>
                    {/* Account Info */}
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
                    </Box>

                    {/* Scheduled Notifications Section */}
                    <Box bg="gray.800" p={6} rounded="lg">
                        <Heading size="md" mb={4}>⏰ Scheduled Notifications</Heading>
                        <Text color="gray.400" mb={6}>Get a daily summary of your last notifications at your preferred time.</Text>
                        <Stack spacing={4}>
                            <Flex align="center" justify="space-between">
                                <Box>
                                    <Text fontWeight="medium">Enable Scheduled Notifications</Text>
                                    <Text fontSize="sm" color="gray.400">Get daily summaries instead of instant notifications</Text>
                                </Box>
                                <Switch isChecked={preferences.scheduledNotificationsEnabled} onChange={e => updateScheduledPreferences({ scheduledNotificationsEnabled: e.target.checked })} colorScheme="blue" />
                            </Flex>
                            {preferences.scheduledNotificationsEnabled && (
                                <>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <Box>
                                            <Text fontSize="sm" mb={2}>Preferred Time (Hour)</Text>
                                            <Select value={preferences.scheduledTimeHour} onChange={e => updateScheduledPreferences({ scheduledTimeHour: parseInt(e.target.value) })} bg="gray.700" color="white">
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, "0")}:00</option>
                                                ))}
                                            </Select>
                                        </Box>
                                        <Box>
                                            <Text fontSize="sm" mb={2}>Minutes</Text>
                                            <Select value={preferences.scheduledTimeMinute} onChange={e => updateScheduledPreferences({ scheduledTimeMinute: parseInt(e.target.value) })} bg="gray.700" color="white">
                                                {[0, 15, 30, 45].map(minute => (
                                                    <option key={minute} value={minute}>:{minute.toString().padStart(2, "0")}</option>
                                                ))}
                                            </Select>
                                        </Box>
                                    </SimpleGrid>
                                    <Box>
                                        <Text fontSize="sm" mb={2}>Timezone</Text>
                                        <Select value={preferences.timezone} onChange={e => updateScheduledPreferences({ timezone: e.target.value })} bg="gray.700" color="white">
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">Eastern Time (ET)</option>
                                            <option value="America/Chicago">Central Time (CT)</option>
                                            <option value="America/Denver">Mountain Time (MT)</option>
                                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                            <option value="Europe/London">London (GMT)</option>
                                            <option value="Europe/Paris">Paris (CET)</option>
                                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                                            <option value="Australia/Sydney">Sydney (AEST)</option>
                                        </Select>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" mb={2}>Max Notifications per Day ({preferences.maxNotificationsPerBatch})</Text>
                                        <Slider min={1} max={20} value={preferences.maxNotificationsPerBatch} onChange={val => updateScheduledPreferences({ maxNotificationsPerBatch: val })} colorScheme="blue">
                                            <SliderTrack><SliderFilledTrack /></SliderTrack>
                                            <SliderThumb />
                                        </Slider>
                                        <Flex justify="space-between" fontSize="xs" color="gray.400" mt={1}>
                                            <Text>1 notification</Text>
                                            <Text>20 notifications</Text>
                                        </Flex>
                                    </Box>
                                    <Box bg="blue.900" borderWidth={1} borderColor="blue.700" rounded="lg" p={4} mt={2}>
                                        <Text fontWeight="semibold" mb={2}>📋 How Scheduled Notifications Work</Text>
                                        <Stack fontSize="sm" color="gray.300" spacing={1}>
                                            <Text>• Checks your Hive notifications once per day at your preferred time</Text>
                                            <Text>• Sends you the last {preferences.maxNotificationsPerBatch} unread notifications to Farcaster</Text>
                                            <Text>• More efficient than real-time streaming, less overwhelming</Text>
                                            <Text>• You can still use instant notifications if you prefer</Text>
                                            <Text>• Time is in {preferences.timezone} timezone</Text>
                                        </Stack>
                                        <Button mt={3} colorScheme="blue" size="sm" onClick={testScheduledNotifications} isLoading={saving}>Test Now</Button>
                                    </Box>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* Instant Notification Preferences */}
                    {!preferences.scheduledNotificationsEnabled && (
                        <Box bg="gray.800" p={6} rounded="lg">
                            <Heading size="md" mb={4}>🔔 Instant Notification Preferences</Heading>
                            <Stack spacing={4}>
                                <Flex align="center" justify="space-between">
                                    <Box>
                                        <Text fontWeight="medium">Enable Notifications</Text>
                                        <Text fontSize="sm" color="gray.400">Master switch for all notifications</Text>
                                    </Box>
                                    <Switch isChecked={preferences.notificationsEnabled} onChange={e => updatePreferences({ notificationsEnabled: e.target.checked })} colorScheme="blue" />
                                </Flex>
                                {preferences.notificationsEnabled && (
                                    <>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text fontWeight="medium">🔥 Vote Notifications</Text>
                                                <Text fontSize="sm" color="gray.400">When someone votes on your posts</Text>
                                            </Box>
                                            <Switch isChecked={preferences.notifyVotes} onChange={e => updatePreferences({ notifyVotes: e.target.checked })} colorScheme="blue" />
                                        </Flex>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text fontWeight="medium">💬 Comment Notifications</Text>
                                                <Text fontSize="sm" color="gray.400">When someone comments on your posts</Text>
                                            </Box>
                                            <Switch isChecked={preferences.notifyComments} onChange={e => updatePreferences({ notifyComments: e.target.checked })} colorScheme="blue" />
                                        </Flex>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text fontWeight="medium">👤 Follow Notifications</Text>
                                                <Text fontSize="sm" color="gray.400">When someone follows you</Text>
                                            </Box>
                                            <Switch isChecked={preferences.notifyFollows} onChange={e => updatePreferences({ notifyFollows: e.target.checked })} colorScheme="blue" />
                                        </Flex>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text fontWeight="medium">🔔 Mention Notifications</Text>
                                                <Text fontSize="sm" color="gray.400">When someone mentions you</Text>
                                            </Box>
                                            <Switch isChecked={preferences.notifyMentions} onChange={e => updatePreferences({ notifyMentions: e.target.checked })} colorScheme="blue" />
                                        </Flex>
                                        <Flex align="center" justify="space-between">
                                            <Box>
                                                <Text fontWeight="medium">Notification Frequency</Text>
                                                <Text fontSize="sm" color="gray.400">How often to receive notifications</Text>
                                            </Box>
<Select value={preferences.notificationFrequency} onChange={e => updatePreferences({ notificationFrequency: e.target.value as "instant" | "hourly" | "daily" })} bg="gray.700" color="white" maxW={40}>
                                                <option value="instant">Instant</option>
                                                <option value="hourly">Hourly</option>
                                                <option value="daily">Daily</option>
                                            </Select>
                                        </Flex>
                                    </>
                                )}
                            </Stack>
                        </Box>
                    )}

                    {/* Statistics */}
                    {stats && (
                        <Box bg="gray.800" p={6} rounded="lg">
                            <Heading size="md" mb={4}>📊 Notification Statistics</Heading>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                                <Box textAlign="center">
                                    <Text fontSize="2xl" fontWeight="bold" color="blue.400">{stats.totalNotifications}</Text>
                                    <Text fontSize="sm" color="gray.400">Total Sent</Text>
                                </Box>
                                <Box textAlign="center">
                                    <Text fontSize="2xl" fontWeight="bold" color="green.400">{stats.successfulNotifications}</Text>
                                    <Text fontSize="sm" color="gray.400">Successful</Text>
                                </Box>
                                <Box textAlign="center">
                                    <Text fontSize="2xl" fontWeight="bold" color="red.400">{stats.failedNotifications}</Text>
                                    <Text fontSize="sm" color="gray.400">Failed</Text>
                                </Box>
                            </SimpleGrid>
                            {stats.notificationsByType && Object.keys(stats.notificationsByType).length > 0 && (
                                <Box>
                                    <Text fontWeight="medium" mb={2}>By Type:</Text>
                                    <Stack spacing={1}>
                                        {Object.entries(stats.notificationsByType).map(([type, count]) => (
                                            <Flex key={type} justify="space-between" fontSize="sm">
                                                <Text textTransform="capitalize">{type}</Text>
                                                <Text>{String(count)}</Text>
                                            </Flex>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    )}
                </Stack>
            )}
        </Container>
    );
}
