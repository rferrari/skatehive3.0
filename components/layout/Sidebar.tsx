"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Button,
  Icon,
  Image,
  Flex,
  useToken,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAioha } from "@aioha/react-ui";
import { useAccount } from "wagmi";
import { useFarcasterSession } from "@/hooks/useFarcasterSession";
import {
  FiHome,
  FiBell,
  FiUser,
  FiBook,
  FiMap,
  FiCreditCard,
  FiSettings,
  FiMail,
  FiAward,
  FiTarget,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useTheme } from "@/app/themeProvider";
import { useNotifications } from "@/contexts/NotificationContext";
import SidebarLogo from "../graphics/SidebarLogo";
import AuthButton from "./AuthButton";

export default function Sidebar() {
  const { user } = useAioha();
  const { isConnected: isEthereumConnected } = useAccount();
  const { isAuthenticated: isFarcasterConnected } = useFarcasterSession();
  const router = useRouter();
  const pathname = usePathname();
  const [bellAnimating, setBellAnimating] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const { themeName } = useTheme();

  // Ensure client-side only rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Safely get notification count with fallback
  let newNotificationCount = 0;
  try {
    const notificationContext = useNotifications();
    newNotificationCount = notificationContext.newNotificationCount;
  } catch (error) {
    // Context not available yet, use default value
    newNotificationCount = 0;
  }

  const [primaryBg] = useToken("colors", ["primary"]);
  let hoverTextColor = "black";
  if (themeName === "windows95") hoverTextColor = "background";
  else if (themeName === "nounish") hoverTextColor = "secondary";
  else if (themeName === "hiveBR") hoverTextColor = "acxcent";
  else if (themeName === "mac") hoverTextColor = "accent";

  // Check if user is connected to any of the 3 protocols
  const isAnyProtocolConnected =
    user || isEthereumConnected || isFarcasterConnected;

  useEffect(() => {
    setBellAnimating(newNotificationCount > 0);
  }, [newNotificationCount]);

  const NavItem = ({
    href,
    icon,
    children,
  }: {
    href: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <Link href={href} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box
        display="flex"
        alignItems="center"
        px={1}
        py={0.5}
        borderRadius="md"
        transition="background 0.2s"
        cursor="pointer"
        role="group"
        width="100%"
       
        pl={4}
        textDecoration="none"
        color="inherit"
        _hover={{
          textDecoration: "none",
          "& > div": {
            bg: primaryBg,
            color: hoverTextColor,
          }
        }}
        _focus={{
          textDecoration: "none",
          outline: "none"
        }}
        _active={{
          textDecoration: "none"
        }}
        _visited={{
          textDecoration: "none",
          color: "inherit"
        }}
        sx={{
          "&:hover": {
            textDecoration: "none !important",
          },
          "&:focus": {
            textDecoration: "none !important",
            outline: "none !important",
          },
          "&:active": {
            textDecoration: "none !important",
          },
          "&:visited": {
            textDecoration: "none !important",
            color: "inherit !important",
          }
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          px={0.25}
          py={0}
          my={0.5}
        >
          <Icon as={icon} boxSize={4} mr={2} />
          {children}
        </Box>
      </Box>
    </Link>
  );

  if (!isClientMounted) {
    return null;
  }

  return (
    <Box
      as="nav"
      bg="background"
      p={0}
      pt={0}
      w={{ base: "full", md: "17%" }}
      h={"100vh"}
      display={{ base: "none", md: "block" }}
      sx={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
      }}
    >
      <Flex direction="column" justify="space-between" height="100%">
        <Box>
          <Box ml={4} mt={2} mb={4} width="164px" height="164px">
            <SidebarLogo />
          </Box>
          <VStack spacing={0} align="stretch" mt={2}>
            <NavItem
              href="/"
              icon={FiHome}
            >
              Home
            </NavItem>
            <NavItem href="/blog" icon={FiBook}>
              Magazine
            </NavItem>
            <NavItem href="/leaderboard" icon={FiAward}>
              Leaderboard
            </NavItem>
            <NavItem href="/map" icon={FiMap}>
              Skatespots
            </NavItem>
            <NavItem href="/bounties" icon={FiTarget}>
              Bounties
            </NavItem>
            {user && (
              <NavItem href="/notifications" icon={FiBell}>
                Notifications
              </NavItem>
            )}
            {isAnyProtocolConnected && (
              <NavItem href="/wallet" icon={FiCreditCard}>
                Wallet
              </NavItem>
            )}
            <NavItem href="/settings" icon={FiSettings}>
              Settings
            </NavItem>
            {user && (
              <NavItem href="/invite" icon={FiMail}>
                Invite
              </NavItem>
            )}
          </VStack>
        </Box>
        <AuthButton />
      </Flex>
    </Box>
  );
}
