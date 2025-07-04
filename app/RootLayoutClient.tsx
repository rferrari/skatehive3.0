"use client";
import { useState, useEffect } from "react";
import { Box, Container, Flex, useBreakpointValue } from "@chakra-ui/react";
import Sidebar from "@/components/layout/Sidebar";
import FooterNavButtons from "@/components/layout/FooterNavButtons";
import SplashScreen from "@/components/layout/SplashScreen";
import { Providers } from "./providers";
import {
  fetchNewNotifications,
  getLastReadNotificationDate,
} from "@/lib/hive/client-functions";
import { useAioha } from "@aioha/react-ui";
import { Notifications } from "@hiveio/dhive";
import { Analytics } from "@vercel/analytics/next";
import InitFrameSDK from "@/hooks/init-frame-sdk";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Set theme from localStorage before showing app
    const theme = localStorage.getItem('theme') || 'skate';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.add('show-splash');

    // Hide splash and show app after hydration
    const splash = document.getElementById("splash-root");
    const app = document.getElementById("app-root");
    if (splash && app) {
      splash.style.display = "none";
      app.style.display = "";
      document.body.classList.remove("show-splash");
    }
  }, []);

  // Only show splash screen after hydration to avoid SSR/client mismatch
  if (!isHydrated) {
    return (
      <>
        <Analytics />
        <Providers>
          <InnerLayout>{children}</InnerLayout>
        </Providers>
      </>
    );
  }

  if (loading) return <SplashScreen onFinish={() => setLoading(false)} />;

  return (
    <>
      <InitFrameSDK />
      <Analytics />
      <Providers>
        <InnerLayout>{children}</InnerLayout>
      </Providers>
    </>
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
    (n) =>
      new Date(n.date.endsWith("Z") ? n.date : n.date + "Z") >
      new Date(lastReadDate)
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
      {isMobile && (
        <FooterNavButtons newNotificationCount={newNotificationCount} />
      )}
    </Container>
  );
}
