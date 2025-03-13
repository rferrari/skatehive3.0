import { useEffect, useState } from 'react';
import { fetchNewNotifications } from '@/lib/hive/client-functions';
import { Box, Text, Stack, Spinner, Button, HStack, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useAioha } from '@aioha/react-ui';
import { KeyTypes } from '@aioha/aioha';
import { Notifications } from '@hiveio/dhive';
import NotificationItem from './NotificationItem';

interface NotificationCompProps {
  username: string
}

export default function NotificationsComp({ username }: NotificationCompProps) {
  const { user, aioha } = useAioha();
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add isLoading state

  useEffect(() => {
    const loadNotifications = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const newNotifications = await fetchNewNotifications(username);
          setNotifications(newNotifications);
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
    const result = await aioha.signAndBroadcastTx([
      ['custom_json', {
        required_auths: [],
        required_posting_auths: [user],
        id: 'notify',
        json: json,
      }]
    ], KeyTypes.Posting)
    console.log("Mark as Read clicked", result);
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = [];
    }
    acc[notification.type].push(notification);
    return acc;
  }, {} as Record<string, Notifications[]>);

  console.log("notifications", notifications)
  return (
    <Box p={4} w="full" maxH={"100vh"} overflowY="auto" sx={{
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      scrollbarWidth: 'none',
    }}>
      <HStack mb={4} spacing={4} align="center" justify="space-between">
        <Text fontSize="2xl" fontWeight="bold">
          Notifications
        </Text>
        {(user == username) && (
          <Button onClick={handleMarkAsRead} size="sm">
            Mark as Read
          </Button>
        )}
      </HStack>
      {isLoading ? (
        <Spinner size="lg" />
      ) : notifications.length > 0 ? (
        <Tabs>
          <TabList>
            {Object.keys(groupedNotifications).map(type => (
              <Tab key={type}>{type}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {Object.keys(groupedNotifications).map(type => (
              <TabPanel key={type}>
                <Stack spacing={4} w="full">
                  {groupedNotifications[type].map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </Stack>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      ) : (
        <Text>No notifications</Text>
      )}
    </Box>
  );
}
