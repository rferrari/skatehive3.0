"use client";

import { Box, Text, Link } from "@chakra-ui/react";
import { Discussion } from "@hiveio/dhive";
import HiveMarkdown from "../../shared/HiveMarkdown";
import { sanitizeNotificationBody } from "../utils";

interface ReplyCommentNotificationProps {
  message: string;
  notificationUrl: string;
  parentPost: Discussion | null;
  reply: Discussion | null;
  postContent: string;
  isNew: boolean;
  author: string;
}

export default function ReplyCommentNotification({
  message,
  notificationUrl,
  parentPost,
  reply,
  postContent,
  isNew,
  author,
}: ReplyCommentNotificationProps) {
  const commentUrl = parentPost
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
        maxW={{ base: "95vw", md: "100%" }}
        overflowX="hidden"
      >
        <Link
          href={`/user/${author}`}
          color={isNew ? "accent" : "primary"}
          fontWeight="bold"
          _hover={{ textDecoration: "underline" }}
          maxW={{ base: "40vw", md: "100%" }}
          overflowWrap="anywhere"
        >
          {message.replace(/^@/, "").split(" ")[0]}
        </Link>
        <Text as="span" ml={{ base: 0.5, md: 1 }}>
          replied to your
        </Text>
        <Link
          href={`/${commentUrl}`}
          color={isNew ? "accent" : "primary"}
          fontWeight="bold"
          _hover={{ textDecoration: "underline" }}
          ml={{ base: 0.5, md: 1 }}
          maxW={{ base: "30vw", md: "100%" }}
          overflowWrap="anywhere"
        >
          comment
        </Link>
        {parentPost?.body && (
          <Text
            as="span"
            fontSize="xs"
            color="text"
            ml={2}
            isTruncated
            verticalAlign="middle"
            display="inline-block"
            maxW={{ base: "40vw", md: "100%" }}
            overflowWrap="anywhere"
          >
            {(() => {
              const replaced = sanitizeNotificationBody(parentPost.body)
                .replace(/!\[.*?\]\(.*?\)/g, "🖼️")
                .replace(/<img[^>]*>/gi, "🖼️")
                .replace(/\n/g, " ");
              return `"${replaced.slice(0, 60)}${
                replaced.length > 60 ? "…" : ""
              }"`;
            })()}
          </Text>
        )}
        {":"}
      </Text>
      {reply && (
        <HiveMarkdown
          markdown={sanitizeNotificationBody(postContent)}
          className="notification-reply-comment-markdown"
        />
      )}
    </Box>
  );
}
