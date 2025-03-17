import { Box, Avatar, Text, HStack, IconButton, Link, Image, VStack, Divider } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Notifications } from '@hiveio/dhive';
import { FaComment, FaEye, FaReply } from 'react-icons/fa6';
import { useState, useEffect } from 'react';
import { getPost } from '../../lib/hive/client-functions';
import markdownRenderer from '@/lib/utils/MarkdownRenderer';
import TweetComposer from '../homepage/TweetComposer';

interface NotificationItemProps {
  notification: Notifications;
  lastReadDate: string;
}

export default function NotificationItem({ notification, lastReadDate }: NotificationItemProps) {
  const author = notification.msg.trim().replace(/^@/, '').split(' ')[0];
  const [displayCommentPrompt, setDisplayCommentPrompt] = useState<boolean>(false);
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
  const [rawPostAuthor, postId] = notification.url.split('/');
  const postAuthor = rawPostAuthor.replace(/^@/, '');
  const [parentPostBody, setParentPostBody] = useState<string>('');

  // Add helper to fetch comment content
  async function fetchCommentContent() {
    try {
      setIsLoading(true);
      let post = await getPost(postAuthor, postId);
      if (notification.type === 'reply' || notification.type === 'reply_comment') {
        // Set reply content preview before loading parent post
        if (post.parent_author && post.parent_permlink) {
          setParentPostBody(post.body);
          post = await getPost(post.parent_author, post.parent_permlink);
        }
      }
      setPostContent(post.body || 'No content available');
    } catch (error) {
      setPostContent('Error loading content');
    } finally {
      setIsLoading(false);
    }
  }

  // Replace the existing handleReplyClick with this version
  function handleReplyClick() {
    if (!displayCommentPrompt) {
      setDisplayCommentPrompt(true);
      fetchCommentContent();
      window.dispatchEvent(new CustomEvent("activeComposerChange", { detail: notification.url }));
    } else {
      setDisplayCommentPrompt(false);
      // Optionally dispatch a null detail if needed; others remain closed anyway.
      window.dispatchEvent(new CustomEvent("activeComposerChange", { detail: null }));
    }
  }

  // Add a global listener to collapse this composer when another is opened
  useEffect(() => {
    function handleActiveComposerChange(e: CustomEvent) {
      if (e.detail && e.detail !== notification.url) {
        setDisplayCommentPrompt(false);
      }
    }
    window.addEventListener("activeComposerChange", handleActiveComposerChange as EventListener);
    return () => {
      window.removeEventListener("activeComposerChange", handleActiveComposerChange as EventListener);
    };
  }, [notification.url]);

  return (
    <>
      <HStack
        spacing={3}
        p={3}
        border={isNew ? 'tb1' : 'gray'}
        borderRadius="base"
        bg="muted"
        w="full"
        align="stretch"
      >
        <Box flex="1">
          <HStack>
            <Avatar src={`https://images.hive.blog/u/${author}/avatar/sm`} name='' size={'xs'} />
            <Text color={isNew ? 'accent' : 'primary'} fontSize="sm">{notification.msg.replace(/^@/, '')}</Text>
          </HStack>
          {parentPostBody && (
            <>
              <Divider my={2} />
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="primary" ml={5}>
                  {parentPostBody}
                </Text>
                about {postContent}
              </VStack>
            </>
          )}
          <HStack spacing={2} mt={2}>
            <Text fontSize="xs" color={isNew ? 'accent' : 'primary'} mt={1}>
              {formattedDate}
            </Text>
            <Link href={'/' + notification.url} isExternal>
              <IconButton
                aria-label="Open notification"
                icon={<ExternalLinkIcon />}
                variant="ghost"
                size="sm"
                isRound
                alignSelf="center"
                color={isNew ? 'accent' : 'primary'}
              />
            </Link>
            {(notification.type === 'reply' || notification.type === 'reply_comment') && (
              <Text
                onClick={handleReplyClick} // call the new reply handler
                fontSize="sm"
                cursor="pointer"
              >
                Reply
              </Text>
            )}
          </HStack>
        </Box>
      </HStack>
      {displayCommentPrompt && (
        <TweetComposer pa={postAuthor} pp={postId} onNewComment={() => { }} onClose={() => null} />
      )}
    </>
  );
}
