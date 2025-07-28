"use client";
import { useState, useEffect } from "react";
import { Box, Container, Flex, useBreakpointValue } from "@chakra-ui/react";
import Sidebar from "@/components/layout/Sidebar";
import FooterNavButtons from "@/components/layout/FooterNavButtons";
import SplashScreen from "@/components/layout/SplashScreen";
import SearchOverlay from "@/components/shared/SearchOverlay";
import { Providers } from "./providers";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Analytics } from "@vercel/analytics/next";
import InitFrameSDK from "@/hooks/init-frame-sdk";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Set theme from localStorage before showing app
    const theme = localStorage.getItem("theme") || "skate";
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.add("show-splash");

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
          <NotificationProvider>
            <InnerLayout searchProps={{ isSearchOpen, setIsSearchOpen }}>
              {children}
            </InnerLayout>
          </NotificationProvider>
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
        <NotificationProvider>
          <InnerLayout searchProps={{ isSearchOpen, setIsSearchOpen }}>
            {children}
          </InnerLayout>
        </NotificationProvider>
      </Providers>
    </>
  );
}

function InnerLayout({
  children,
  searchProps,
}: {
  children: React.ReactNode;
  searchProps?: {
    isSearchOpen: boolean;
    setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Container
      maxW={{ base: "100%", md: "container.xl" }}
      p={0}
      overflowX="hidden"
      sx={{
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {searchProps && (
        <SearchOverlay
          isOpen={searchProps.isSearchOpen}
          onClose={() => searchProps.setIsSearchOpen(false)}
        />
      )}
      <Flex direction={{ base: "column", md: "row" }} minH="100vh">
        <Sidebar />
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          height="100vh"
          sx={{
            "&::-webkit-scrollbar": {
              display: "none",
              width: "0",
              height: "0",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {children}
        </Box>
      </Flex>
      {isMobile && <FooterNavButtons />}
    </Container>
  );
}
