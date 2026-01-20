"use client";
import { useState } from "react";
import {
  Box,
  Text,
  Stack,
  Button,
  Flex,
  Select,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { useNotifications } from "@/contexts/NotificationContext";
import NotificationItem, { type NotificationItemData } from "./NotificationItem";
import {
  extractAuthorFromMessage,
  extractVoteValue,
  type VoteValue,
} from "./utils";

interface NotificationCompProps {
  username: string;
}

export default function NotificationsComp({ username }: NotificationCompProps) {
  const { user, aioha } = useAioha();
  const {
    notifications,
    isLoading,
    lastReadDate,
    refreshNotifications,
    markNotificationsAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState<string>("all");

  async function handleMarkAsRead() {
    const now = new Date().toISOString();
    const json = JSON.stringify(["setLastRead", { date: now }]);
    await aioha.signAndBroadcastTx(
      [
        [
          "custom_json",
          {
            required_auths: [],
            required_posting_auths: [user],
            id: "notify",
            json: json,
          },
        ],
      ],
      KeyTypes.Posting
    );
    // Update the context with the new read date
    markNotificationsAsRead();
    // Refresh notifications to get the latest state
    await refreshNotifications();
  }

  // Sort notifications by date descending
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const mergedNotifications = sortedNotifications.reduce<
    NotificationItemData[]
  >((acc, notification) => {
    if (notification.type !== "vote") {
      acc.push(notification);
      return acc;
    }

    const existingIndex = acc.findIndex(
      (item) => item.type === "vote" && item.url === notification.url
    );

    const author = extractAuthorFromMessage(notification.msg);
    const voteValue = extractVoteValue(notification.msg);

    if (existingIndex === -1) {
      acc.push({
        ...notification,
        mergedVotes: {
          authors: [author],
          totalCount: 1,
          totalValue: voteValue ?? undefined,
          voteValues: { [author]: voteValue ?? null },
        },
      });
      return acc;
    }

    const existing = acc[existingIndex];
    const existingAuthors = existing.mergedVotes?.authors ?? [];
    const nextAuthors = existingAuthors.includes(author)
      ? existingAuthors
      : [...existingAuthors, author];

    const existingVoteValues = existing.mergedVotes?.voteValues ?? {};
    const nextVoteValues = {
      ...existingVoteValues,
      ...(existingVoteValues[author] ? {} : { [author]: voteValue ?? null }),
    };

    const nextTotalValue = Object.values(nextVoteValues).reduce<
      VoteValue | undefined
    >((accum, value) => {
      if (!value) return accum;
      if (!accum) {
        return { currency: value.currency, amount: value.amount };
      }
      if (accum.currency !== value.currency) {
        return undefined;
      }
      return {
        currency: accum.currency,
        amount: accum.amount + value.amount,
      };
    }, undefined);

    acc[existingIndex] = {
      ...existing,
      mergedVotes: {
        authors: nextAuthors,
        totalCount: nextAuthors.length,
        totalValue: nextTotalValue,
        voteValues: nextVoteValues,
      },
    };

    return acc;
  }, []);

  // Filter notifications by type
  const filteredNotifications =
    filter === "all"
      ? mergedNotifications
      : mergedNotifications.filter((n) => n.type === filter);

  // Get all unique types for dropdown
  const notificationTypes = Array.from(
    new Set(notifications.map((n) => n.type))
  );

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
    <Box
      w="full"
      maxH="100vh"
      overflowY="auto"
      px={{ base: 4, md: 6, xl: 8 }}
      py={{ base: 5, md: 6 }}
      sx={{
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      <Box w="full" maxW="980px" mx="auto">
        <Flex justify="space-between" align="center" mb={{ base: 4, md: 6 }}>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
            Notifications
          </Text>
          {user == username && (
            <Button onClick={handleMarkAsRead} size="sm">
              Mark as Read
            </Button>
          )}
        </Flex>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          maxW={{ base: "220px", md: "240px" }}
          mb={{ base: 4, md: 6 }}
          bg="muted"
          borderColor="border"
          color="text"
          _focus={{
            borderColor: "primary",
            boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
          }}
          _hover={{ borderColor: "primary" }}
        >
          <option value="all">All</option>
          {notificationTypeOrder
            .filter((type) => notifications.some((n) => n.type === type))
            .map((type) => (
              <option key={type} value={type}>
                {notificationTypeLabels[type]}
              </option>
            ))}
        </Select>
        {isLoading ? (
          <Stack spacing={4} w="full">
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                p={3}
                borderRadius="base"
                bg="primary"
                w="full"
                minH="80px"
                display="flex"
                alignItems="center"
              >
                <SkeletonCircle
                  size="8"
                  mr={4}
                  startColor="muted"
                  endColor="primary"
                />
                <Box flex="1">
                  <Skeleton
                    height="16px"
                    width="40%"
                    mb={2}
                    startColor="muted"
                    endColor="primary"
                  />
                  <SkeletonText
                    noOfLines={2}
                    spacing={2}
                    width="80%"
                    startColor="muted"
                    endColor="primary"
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        ) : filteredNotifications.length > 0 ? (
          <Stack spacing={4} w="full">
            {filteredNotifications.map((notification) => (
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
    </Box>
  );
}
