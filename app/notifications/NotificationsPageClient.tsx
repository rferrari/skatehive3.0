"use client";
import NotificationsComp from "@/components/notifications/NotificationsComp";
import { useAioha } from "@aioha/react-ui";
import { Box, Text, Center, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslations } from '@/lib/i18n/hooks';

export default function NotificationsPageClient() {
  const t = useTranslations('notificationsPage');
  const { user, aioha } = useAioha();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only set loading to false once authentication state is determined
    // Check if aioha has completed initialization
    if (aioha) {
      setIsLoading(false);
    }
  }, [user, aioha]);

  // Show loading until authentication state is confirmed
  if (isLoading) {
    return (
      <Center height="200px">
        <Spinner size="lg" />
        <Text ml={3}>{t('loading')}</Text>
      </Center>
    );
  }

  if (!user) {
    return (
      <Center height="200px">
        <Box textAlign="center">
          <Text fontSize="lg" mb={4}>
            {t('loginRequired')}
          </Text>
          <Text color="gray.500">
            {t('authRequired')}
          </Text>
        </Box>
      </Center>
    );
  }

  return <NotificationsComp username={user} />;
}
