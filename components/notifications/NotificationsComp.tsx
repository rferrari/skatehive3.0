import { useEffect, useState } from 'react';
import { fetchNewNotifications, getLastReadNotificationDate } from '@/lib/hive/client-functions';
import { Box, Text, Stack, Spinner, Button, HStack, Tabs, TabList, TabPanels, Tab, TabPanel, Center, Flex, Select } from '@chakra-ui/react';
import { useAioha } from '@aioha/react-ui';
import { KeyTypes } from '@aioha/aioha';
import { Notifications } from '@hiveio/dhive';
import NotificationItem from './NotificationItem';
import LoadingComponent from '../homepage/loadingComponent';

interface NotificationCompProps {
  username: string
}

export default function NotificationsComp({ username }: NotificationCompProps) {
  const { user, aioha } = useAioha();
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastReadDate, setLastReadDate] = useState<string>('1970-01-01T00:00:00Z');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const loadNotifications = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const newNotifications = await fetchNewNotifications(username);
          const lastRead = await getLastReadNotificationDate(username);

          setNotifications(newNotifications);
          setLastReadDate(lastRead);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();
  }, [user, username]);

  async function handleMarkAsRead() {
    const now = new Date().toISOString();
    const json = JSON.stringify(["setLastRead", { date: now }]);
    await aioha.signAndBroadcastTx([
      ['custom_json', {
        required_auths: [],
        required_posting_auths: [user],
        id: 'notify',
        json: json,
      }]
    ], KeyTypes.Posting)
  };

  // Sort notifications by date descending
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter notifications by type
  const filteredNotifications = filter === 'all'
    ? sortedNotifications
    : sortedNotifications.filter(n => n.type === filter);

  // Get all unique types for dropdown
  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));

  // Add type label mapping and order
  const notificationTypeLabels: Record<string, string> = {
    reply: "Reply",
    reply_comment: "Reply to Comment",
    mention: "Mentions",
    vote: "Votes",
    follow: "Follows",
  };
  const notificationTypeOrder = [
    "reply",
    "reply_comment",
    "mention",
    "vote",
    "follow",
  ];

  return (
    <Box p={0} w="full" maxH={"100vh"} overflowY="auto" sx={{
      '&::-webkit-scrollbar': { display: 'none' },
      scrollbarWidth: 'none',
    }}>
      <Flex justify="space-between" align="center" mb={4}>
        <Text ml={1} fontSize="2xl" fontWeight="bold">
          Notifications
        </Text>
        {(user == username) && (
          <Button onClick={handleMarkAsRead} size="sm">
            Mark as Read
          </Button>
        )}
      </Flex>
      <Select value={filter} onChange={e => setFilter(e.target.value)} maxW="200px" mb={4}>
        <option value="all">All</option>
        {notificationTypeOrder
          .filter(type => notifications.some(n => n.type === type))
          .map(type => (
            <option key={type} value={type}>{notificationTypeLabels[type]}</option>
          ))}
      </Select>
      {isLoading ? (
        <LoadingComponent />
      ) : filteredNotifications.length > 0 ? (
        <Stack spacing={4} w="full">
          {filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              lastReadDate={lastReadDate}
              currentUser={username}
            />
          ))}
        </Stack>
      ) : (
        <Text>No notifications</Text>
      )}
    </Box>
  );
}
