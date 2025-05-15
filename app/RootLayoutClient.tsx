"use client";
import { useState, useEffect } from "react";
import { Box, Container, Flex, useBreakpointValue } from "@chakra-ui/react";
import Sidebar from "@/components/layout/Sidebar";
import FooterNavigation from "@/components/layout/FooterNavigation";
import SplashScreen from "@/components/layout/SplashScreen";
import { Providers } from "./providers";
import { fetchNewNotifications, getLastReadNotificationDate } from "@/lib/hive/client-functions";
import { useAioha } from "@aioha/react-ui";
import { Notifications } from "@hiveio/dhive";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading delay for splash screen
    setTimeout(() => setLoading(false), 2000); // Adjust duration if needed
  }, []);

  if (loading) return <SplashScreen onFinish={() => setLoading(false)} />;

  return (
    <Providers>
      <InnerLayout>{children}</InnerLayout>
    </Providers>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAioha();
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [lastReadDate, setLastReadDate] = useState("1970-01-01T00:00:00Z");

  useEffect(() => {
    async function load() {
      if (user) {
        const notifs = await fetchNewNotifications(user);
        const lastRead = await getLastReadNotificationDate(user);
        setNotifications(notifs);
        setLastReadDate(lastRead);
      }
    }
    load();
  }, [user]);

  const newNotificationCount = notifications.filter(
    n => new Date((n.date.endsWith("Z") ? n.date : n.date + "Z")) > new Date(lastReadDate)
  ).length;

  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Container maxW={{ base: "100%", md: "container.xl" }} p={0}>
      <Flex direction={{ base: "column", md: "row" }} minH="100vh">
        <Sidebar newNotificationCount={newNotificationCount} />
        <Box flex="1" overflowY="auto" height="100vh">
          {children}
        </Box>
      </Flex>
      {isMobile && <FooterNavigation newNotificationCount={newNotificationCount} />}
    </Container>
  );
}
