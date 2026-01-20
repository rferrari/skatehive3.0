"use client";

import { Box, Text, Link } from "@chakra-ui/react";
import { extractVotePercentage, sanitizeNotificationBody } from "../utils";

interface VoteNotificationProps {
  message: string;
  notificationUrl: string;
  postContent: string;
  formattedDate: string;
  isNew: boolean;
  author: string;
}

export default function VoteNotification({
  message,
  notificationUrl,
  postContent,
  formattedDate,
  isNew,
  author,
}: VoteNotificationProps) {
  const votePercentage = extractVotePercentage(message);
  const sanitizedContent = sanitizeNotificationBody(postContent);

  return (
    <Box>
      <Text
        color={isNew ? "accent" : "primary"}
        fontSize={{ base: "xs", md: "sm" }}
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
          upvoted your
        </Text>
        <Link
          href={`/${notificationUrl}`}
          color={isNew ? "accent" : "primary"}
          fontWeight="bold"
          _hover={{ textDecoration: "underline" }}
          ml={{ base: 0.5, md: 1 }}
        >
          post
        </Link>
        {":"}
        <Text
          as="span"
          color="success"
          fontWeight="bold"
          ml={{ base: 0.5, md: 1 }}
        >
          {votePercentage}
        </Text>
        {postContent && (
          <Text
            as="span"
            color="success"
            fontWeight="normal"
            ml={{ base: 0.5, md: 1 }}
            fontSize={{ base: "2xs", md: "xs" }}
          >
            &quot;
            {sanitizedContent.replace(/\n/g, " ").slice(0, 100)}
            {sanitizedContent.length > 100 ? "…" : ""}
            &quot;
          </Text>
        )}
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
