"use client";

import { Box, Text, Link } from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";

interface MentionNotificationProps {
  message: string;
  notificationUrl: string;
  parentPost: Discussion | null;
  formattedDate: string;
  isNew: boolean;
  author: string;
}

export default function MentionNotification({
  message,
  notificationUrl,
  parentPost,
  formattedDate,
  isNew,
  author,
}: MentionNotificationProps) {
  const postUrl = parentPost
    ? `@${parentPost.author}/${parentPost.permlink}`
    : notificationUrl;

  return (
    <Box>
      <Text
        color={isNew ? "accent" : "primary"}
        fontSize={{ base: "sm", md: "sm" }}
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        noOfLines={2}
        wordBreak="break-word"
      >
        <Link
          href={`/user/${author}`}
          color={isNew ? "accent" : "primary"}
          fontWeight="bold"
          _hover={{ textDecoration: "underline" }}
        >
          {message.replace(/^@/, "").split(" ")[0]}
        </Link>
        <Text as="span" ml={{ base: 0.5, md: 1 }}>
          mentioned you in
        </Text>
        {parentPost?.title && (
          <Link
            href={`/${postUrl}`}
            color={isNew ? "accent" : "primary"}
            fontWeight="bold"
            _hover={{ textDecoration: "underline" }}
            ml={{ base: 0.5, md: 1 }}
          >
            {parentPost.title}
          </Link>
        )}
        {":"}
        <Text
          as="span"
          fontSize={{ base: "2xs", md: "xs" }}
          color="muted"
          ml={{ base: 1, md: 2 }}
        >
          {formattedDate}
        </Text>
      </Text>
    </Box>
  );
}
