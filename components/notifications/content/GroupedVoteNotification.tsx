"use client";

import { Box, Text, Link, Tooltip } from "@chakra-ui/react";
import { sanitizeNotificationBody, VoteValue } from "../utils";

interface GroupedVoteNotificationProps {
  authors: string[];
  totalCount: number;
  notificationUrl: string;
  formattedDate: string;
  isNew: boolean;
  totalValue?: VoteValue | null;
  voteValues: Record<string, VoteValue | null>;
  postContent?: string;
}

function formatVoteValue(value: VoteValue): string {
  if (value.currency === "$") {
    return `$${value.amount.toFixed(2)}`;
  }
  return `${value.amount.toFixed(3)} ${value.currency}`;
}

export default function GroupedVoteNotification({
  authors,
  totalCount,
  notificationUrl,
  formattedDate,
  isNew,
  totalValue,
  voteValues,
  postContent,
}: GroupedVoteNotificationProps) {
  const displayAuthors = authors.slice(0, 3);
  const extraCount = Math.max(totalCount - displayAuthors.length, 0);
  const extraAuthors = authors.slice(displayAuthors.length);
  const sanitizedContent = postContent
    ? sanitizeNotificationBody(postContent)
    : "";

  const authorList = (
    <Box display="inline">
      {displayAuthors.map((author, index) => (
        <Tooltip
          key={author}
          label={
            voteValues[author]
              ? formatVoteValue(voteValues[author] as VoteValue)
              : "Vote value unavailable"
          }
          hasArrow
          placement="top"
        >
          <Link
            href={`/user/${author}`}
            color={isNew ? "accent" : "primary"}
            fontWeight="bold"
            _hover={{ textDecoration: "underline" }}
            mr={index === displayAuthors.length - 1 ? 1 : 0.5}
          >
            {author}
            {index < displayAuthors.length - 1 ? "," : ""}
          </Link>
        </Tooltip>
      ))}
    </Box>
  );

  return (
    <Box>
      <Text
        color={isNew ? "accent" : "primary"}
        fontSize={{ base: "sm", md: "sm" }}
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        wordBreak="break-word"
        noOfLines={2}
      >
        {authorList}
        {extraCount > 0 && (
          <Tooltip
            label={
              <Box>
                {extraAuthors.map((author) => (
                  <Text key={author} fontSize="xs" color="text">
                    {author}
                    {voteValues[author]
                      ? ` (${formatVoteValue(voteValues[author] as VoteValue)})`
                      : " (value unavailable)"}
                  </Text>
                ))}
              </Box>
            }
            hasArrow
            placement="top"
          >
            <Text as="span" ml={0.5}>
              + {extraCount}
            </Text>
          </Tooltip>
        )}
        <Text as="span" ml={1}>
          upvoted your
        </Text>
        <Link
          href={`/${notificationUrl}`}
          color={isNew ? "accent" : "primary"}
          fontWeight="bold"
          _hover={{ textDecoration: "underline" }}
          ml={0.5}
        >
          post
        </Link>
        {totalValue && (
          <Text as="span" color="success" fontWeight="bold" ml={1}>
            {formatVoteValue(totalValue)}
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
      {sanitizedContent && (
        <Text
          fontSize={{ base: "xs", md: "sm" }}
          color="muted"
          mt={1}
          noOfLines={2}
          wordBreak="break-word"
        >
          &quot;
          {sanitizedContent.replace(/\n/g, " ").slice(0, 120)}
          {sanitizedContent.length > 120 ? "…" : ""}
          &quot;
        </Text>
      )}
    </Box>
  );
}
