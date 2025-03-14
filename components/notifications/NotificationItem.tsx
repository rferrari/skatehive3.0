import { Box, Avatar, Text, HStack, IconButton, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons'; // Import the external link icon
import { Notifications } from '@hiveio/dhive';

interface NotificationItemProps {
  notification: Notifications;
  lastReadDate: string; // Add lastReadDate prop
}

export default function NotificationItem({ notification, lastReadDate }: NotificationItemProps) {

  const author = notification.msg.trim().split(' ')[0].slice(1);

  const formattedDate = new Date(notification.date + 'Z').toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
  });

  const notificationDateStr = notification.date.endsWith("Z") ? notification.date : `${notification.date}Z`;
  const notificationDate = new Date(notificationDateStr);
  const lastRead = new Date(lastReadDate);
  const isNew = notificationDate > lastRead;

  // DEBUG: log detailed date comparison info
  console.log("NotificationItem Debug:", {
    notificationDateStr,
    notificationDate: notificationDate.toISOString(),
    lastReadDate: lastRead.toISOString(),
    isNew
  });

  return (
    <HStack
      spacing={4}
      p={4}
      border="tb1"
      borderRadius="base"
      bg={isNew ? "yellow" : "white"} // Unread notifications get highlighted
      w="full"
      align="stretch"
    >
      <Avatar src={`https://images.hive.blog/u/${author}/avatar/sm`} name='' />
      <Box flex="1">
        <Text fontWeight="semibold">{author}</Text>
        <Text>{notification.msg}</Text>
        <Text fontSize="sm">
          {formattedDate}
        </Text>
      </Box>
      {notification.url && (
        <Link href={'/' + notification.url}>
          <IconButton
            aria-label="Open notification"
            icon={<ExternalLinkIcon />}
            variant="ghost"
            size="lg"
            isRound
            alignSelf="center" // Center the icon vertically
          />
        </Link>
      )}
    </HStack>
  );
}
