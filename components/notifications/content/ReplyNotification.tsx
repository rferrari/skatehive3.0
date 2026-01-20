"use client";

import { Box, Text, Link } from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import HiveMarkdown from "../../shared/HiveMarkdown";
import { sanitizeNotificationBody } from "../utils";

interface ReplyNotificationProps {
  message: string;
  notificationUrl: string;
  parentPost: Discussion | null;
  reply: Discussion | null;
  postContent: string;
  isNew: boolean;
  author: string;
}

export default function ReplyNotification({
  message,
  notificationUrl,
  parentPost,
  reply,
  postContent,
  isNew,
  author,
}: ReplyNotificationProps) {
  const postUrl = parentPost
    ? `@${parentPost.author}/${parentPost.permlink}`
    : notificationUrl;

  return (
    <Box>
      <Text
        color={isNew ? "accent" : "primary"}
        fontSize={{ base: "xs", md: "sm" }}
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        whiteSpace="normal"
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
          replied to your
        </Text>
        <Link
          href={`/${postUrl}`}
          color={isNew ? "accent" : "primary"}
          fontWeight="bold"
          _hover={{ textDecoration: "underline" }}
          ml={{ base: 0.5, md: 1 }}
        >
          post
        </Link>
        {":"}
      </Text>
      {parentPost?.title && <HiveMarkdown markdown={parentPost.title} />}
      {reply && (
        <HiveMarkdown markdown={sanitizeNotificationBody(postContent)} />
      )}
    </Box>
  );
}
