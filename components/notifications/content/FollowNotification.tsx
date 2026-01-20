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
        fontSize={{ base: "sm", md: "sm" }}
      >
        {message.replace(/^@/, "")}
      </Text>
      {isFollowingBack ? (
        <Text fontSize={{ base: "sm", md: "sm" }} color="primary">
          Following
        </Text>
      ) : (
        <Button size={{ base: "sm", md: "sm" }} onClick={onFollowBack}>
          Follow Back
        </Button>
      )}
    </HStack>
  );
}
