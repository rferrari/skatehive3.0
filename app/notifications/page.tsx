'use client';
import NotificationsComp from "@/components/notifications/NotificationsComp";
import { useAioha } from "@aioha/react-ui";
import { Box, Text, Center, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const { user, aioha } = useAioha();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give a moment for the user authentication to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Center height="200px">
        <Spinner size="lg" />
        <Text ml={3}>Loading...</Text>
      </Center>
    );
  }

  if (!user) {
    return (
      <Center height="200px">
        <Box textAlign="center">
          <Text fontSize="lg" mb={4}>
            Please log in to view your notifications
          </Text>
          <Text color="gray.500">
            You need to be authenticated to access this page
          </Text>
        </Box>
      </Center>
    );
  }

  return <NotificationsComp username={user} />;
}
