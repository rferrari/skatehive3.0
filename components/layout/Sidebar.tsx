"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Icon,
  Flex,
  useToken,
} from '@chakra-ui/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAioha } from '@aioha/react-ui';
import { useAccount } from 'wagmi';
import { useFarcasterSession } from '@/hooks/useFarcasterSession';
import {
  FiHome,
  FiBell,
  FiBook,
  FiMap,
  FiCreditCard,
  FiSettings,
  FiMail,
  FiAward,
  FiTarget,
} from 'react-icons/fi';
import { useTheme } from '@/app/themeProvider';
import { useNotifications } from '@/contexts/NotificationContext';
import SidebarLogo from '../graphics/SidebarLogo';
import AuthButton from './AuthButton';

export default function Sidebar() {
  const { user } = useAioha();
  const { isConnected: isEthereumConnected } = useAccount();
  const { isAuthenticated: isFarcasterConnected } = useFarcasterSession();
  const router = useRouter();
  const pathname = usePathname();
  const [bellAnimating, setBellAnimating] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const { themeName } = useTheme();

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  let newNotificationCount = 0;
  try {
    const notificationContext = useNotifications();
    newNotificationCount = notificationContext.newNotificationCount;
  } catch (error) {
    newNotificationCount = 0;
  }

  const [primaryBg] = useToken('colors', ['primary']);
  let hoverTextColor = 'black';
  if (themeName === 'windows95') hoverTextColor = 'background';
  else if (themeName === 'nounish') hoverTextColor = 'secondary';
  else if (themeName === 'hiveBR') hoverTextColor = 'acxcent';
  else if (themeName === 'mac') hoverTextColor = 'accent';

  const isAnyProtocolConnected = user || isEthereumConnected || isFarcasterConnected;

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
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
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
        _hover={{
          bg: primaryBg,
          color: hoverTextColor,
        }}
        _focus={{ outline: 'none' }}
      >
        <Box display="flex" alignItems="center" px={0.25} py={0} my={0.5}>
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
      w={{ base: 'full', md: '200px', lg: '250px' }}
      maxW={{ md: '20%' }}
      h="100vh"
      display={{ base: 'none', md: 'block' }}
      boxSizing="border-box"
      sx={{
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
      }}
    >
      <Flex direction="column" justify="space-between" height="100%" overflowY="auto">
        <Box>
          <Box ml={4} mt={1} mb={2} w={{ base: '120px', md: '140px', lg: '164px' }} h="auto">
            <SidebarLogo />
          </Box>
          <VStack spacing={0} align="stretch" mt={1}>
            <NavItem href="/" icon={FiHome}>Home</NavItem>
            <NavItem href="/blog" icon={FiBook}>Magazine</NavItem>
            <NavItem href="/leaderboard" icon={FiAward}>Leaderboard</NavItem>
            <NavItem href="/map" icon={FiMap}>Skatespots</NavItem>
            <NavItem href="/bounties" icon={FiTarget}>Bounties</NavItem>
            {user && (
              <NavItem href="/notifications" icon={FiBell}>Notifications</NavItem>
            )}
            {isAnyProtocolConnected && (
              <NavItem href="/wallet" icon={FiCreditCard}>Wallet</NavItem>
            )}
            <NavItem href="/settings" icon={FiSettings}>Settings</NavItem>
            {user && (
              <NavItem href="/invite" icon={FiMail}>Invite</NavItem>
            )}
          </VStack>
        </Box>
        <AuthButton />
      </Flex>
    </Box>
  );
}
