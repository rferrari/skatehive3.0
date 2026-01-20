"use client";

import { HStack, Text, Button } from "@chakra-ui/react";

interface FollowNotificationProps {
  message: string;
  isNew: boolean;
  isFollowingBack: boolean;
  onFollowBack: () => void;
}

export default function FollowNotification({
  message,
  isNew,
  isFollowingBack,
  onFollowBack,
}: FollowNotificationProps) {
  return (
    <HStack spacing={2}>
      <Text
        color={isNew ? "accent" : "primary"}
        fontSize={{ base: "xs", md: "sm" }}
      >
        {message.replace(/^@/, "")}
      </Text>
      {isFollowingBack ? (
        <Text fontSize={{ base: "xs", md: "sm" }} color="primary">
          Following
        </Text>
      ) : (
        <Button size={{ base: "xs", md: "sm" }} onClick={onFollowBack}>
          Follow Back
        </Button>
      )}
    </HStack>
  );
}
