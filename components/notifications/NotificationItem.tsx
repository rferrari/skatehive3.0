import { Box, Avatar, Text, HStack, IconButton, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Notifications } from '@hiveio/dhive';
import { FaEye } from 'react-icons/fa6';
import { useState, useEffect } from 'react';
import { getPost } from '../../lib/hive/client-functions';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';

interface NotificationItemProps {
  notification: Notifications;
  lastReadDate: string;
}

export default function NotificationItem({ notification, lastReadDate }: NotificationItemProps) {
  const author = notification.msg.trim().replace(/^@/, '').split(' ')[0];
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [postContent, setPostContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  useEffect(() => {
    if (isExpanded && notification.url) {
      setIsLoading(true);
      // Assume notification.url in format "author/permlink"
      const [rawPostAuthor, postId] = notification.url.split('/');
      const postAuthor = rawPostAuthor.replace(/^@/, '');
      console.log("NotificationItem Debug:", { postAuthor, postId });
      getPost(postAuthor, postId)
        .then((post) => {
          console.log("NotificationItem Debug:", { post });
          // Assuming post.body contains the renderable content
          setPostContent(post.body || 'No content available');
        })
        .catch(() => {
          setPostContent('Error loading content');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isExpanded, notification.url]);

  return (
    <>
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
          <>
            {notification.type === 'reply' && (
              <IconButton
                aria-label="Open notification"
                icon={<FaEye />}
                variant="ghost"
                size="lg"
                isRound
                alignSelf="center"
                color={isNew ? 'accent' : 'primary'}
                onClick={() => setIsExpanded(!isExpanded)}
              />
            )}
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
          </>
        )}
      </HStack>
      {isExpanded && (
        <Box p={4} bg="muted" w="full" border="tb1">
          {isLoading ? (
            <Text>Loading content...</Text>
          ) : (
            <Box mt={4} dangerouslySetInnerHTML={{ __html: markdownRenderer(postContent) }} />
          )}
        </Box>
      )}
    </>
  );
}
