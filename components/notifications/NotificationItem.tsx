import { Box, Avatar, Text, HStack, IconButton, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Notifications } from '@hiveio/dhive';

interface NotificationItemProps {
  notification: Notifications;
  lastReadDate: string;
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
    hour12: false,
  });

  const notificationDateStr = notification.date.endsWith("Z") ? notification.date : `${notification.date}Z`;
  const notificationDate = new Date(notificationDateStr);
  const lastRead = new Date(lastReadDate);
  const isNew = notificationDate > lastRead;

  return (
    <HStack
      spacing={4}
      p={4}
      border={isNew ? 'tb2' : 'tb1'}
      borderRadius="base"
      bg="muted"
      w="full"
      align="stretch"
    >
      <Avatar src={`https://images.hive.blog/u/${author}/avatar/sm`} name='' />
      <Box flex="1">
        <Text fontWeight="semibold" color={isNew ? 'accent' : 'primary'}>{author}</Text>
        <Text color={isNew ? 'accent' : 'primary'}>{notification.msg}</Text>
        <Text fontSize="sm" color={isNew ? 'accent' : 'primary'}>
          {formattedDate}
        </Text>
      </Box>
      {notification.url && (
        <Link href={'/' + notification.url} isExternal>
          <IconButton
            aria-label="Open notification"
            icon={<ExternalLinkIcon />}
            variant="ghost"
            size="lg"
            isRound
            alignSelf="center"
            color={isNew ? 'accent' : 'primary'}
          />
        </Link>

      )}
    </HStack>
  );
}
