'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  HStack,
  IconButton,
  Image,
  useToast,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { useAioha } from '@aioha/react-ui';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { AiohaModal } from '@aioha/react-ui';
import { KeyTypes } from '@aioha/aioha';
import { useTheme } from '@/app/themeProvider';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFarcasterSession } from '@/hooks/useFarcasterSession';
import { useFarcasterMiniapp } from '@/hooks/useFarcasterMiniapp';
import { useSignIn } from '@farcaster/auth-kit';
import ConnectionModal from './ConnectionModal';

const MenuRiveButton = ({
  src,
  themeValue,
}: {
  src: string;
  themeValue: number | undefined;
}) => {
  const STATE_MACHINE_NAME = 'ButtonStateMachine';
  const THEME_INPUT_NAME = 'theme';
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
  });
  const themeInput = useStateMachineInput(rive, STATE_MACHINE_NAME, THEME_INPUT_NAME);

  useEffect(() => {
    if (
      themeInput && 
      typeof themeValue === "number" && 
      themeValue >= 0 && 
      themeValue <= 5
    ) {
      themeInput.value = themeValue;
    }
  }, [themeInput, themeValue]);

  return (
    <Box display="inline-block">
      <RiveComponent style={{ width: 24, height: 24 }} />
    </Box>
  );
};

export default function FooterNavButtons() {
  const { user } = useAioha();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const { themeName } = useTheme();
  const toast = useToast();
  const pathname = usePathname(); // Get current pathname
  const { signIn, signOut, isSuccess, isError } = useSignIn({
    onSuccess: ({ fid, username, bio, displayName, pfpUrl }) => {
      clearAuthTimeout();
      setIsFarcasterAuthInProgress(false);
      setTimeout(() => signOut(), 100);
      safeCloseConnectionModal();
      setTimeout(() => {
        toast({
          title: 'Farcaster Connected',
          description: `Successfully connected as @${username}`,
          status: 'success',
          duration: 3000,
        });
      }, 500);
    },
    onError: (error) => {
      console.error('[FarcasterConnect] Auth error callback:', error);
      clearAuthTimeout();
      setIsFarcasterAuthInProgress(false);
      safeCloseConnectionModal();
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Farcaster. Please try again.',
        status: 'error',
        duration: 3000,
      });
    },
    onStatusResponse: (res) => {},
  });
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile, clearSession } = useFarcasterSession();
  const { isInMiniapp, user: miniappUser, isReady } = useFarcasterMiniapp();
  const [isFarcasterAuthInProgress, setIsFarcasterAuthInProgress] = useState(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAuthTimeout = useCallback(() => {
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  }, []);

  const setAuthTimeoutSafety = useCallback(() => {
    clearAuthTimeout();
    authTimeoutRef.current = setTimeout(() => {
      setIsFarcasterAuthInProgress(false);
      toast({
        title: 'Authentication Cancelled',
        description: 'Farcaster connection was cancelled or timed out',
        status: 'info',
        duration: 2000,
      });
    }, 10000);
  }, [clearAuthTimeout, toast]);

  const actualFarcasterConnection = isFarcasterConnected || (isInMiniapp && !!miniappUser);
  const actualFarcasterProfile = farcasterProfile || miniappUser;

  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const safeCloseConnectionModal = useCallback(() => {
    if (isModalTransitioning) return;
    setIsModalTransitioning(true);
    setIsConnectionModalOpen(false);
    clearAuthTimeout();
    setIsFarcasterAuthInProgress(false);
    if (isSuccess && actualFarcasterConnection && !isFarcasterAuthInProgress) {
      signOut();
    }
    setTimeout(() => setIsModalTransitioning(false), 300);
  }, [isModalTransitioning, isSuccess, actualFarcasterConnection, signOut, clearAuthTimeout, isFarcasterAuthInProgress]);

  const [previousFarcasterConnection, setPreviousFarcasterConnection] = useState(false);

  useEffect(() => {
    const currentConnection = isFarcasterConnected || (isInMiniapp && !!miniappUser);
    setPreviousFarcasterConnection(currentConnection);
  }, [isFarcasterConnected, isInMiniapp, miniappUser]);

  useEffect(() => {
    if (isConnectionModalOpen && actualFarcasterConnection && (isSuccess || isError) && !isFarcasterAuthInProgress) {
      if (isSuccess) {
        setTimeout(() => signOut(), 100);
      }
    }
  }, [isConnectionModalOpen, actualFarcasterConnection, isSuccess, isError, signOut, isFarcasterAuthInProgress]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let visibilityTimeoutId: NodeJS.Timeout;

    if (isFarcasterAuthInProgress && !isSuccess && !isError) {
      if (!isMobile) {
        timeoutId = setTimeout(() => {
          const authKitModalExists = document.querySelector(
            '[class*="fc-authkit-signin-modal"], [data-testid*="farcaster"], .farcaster-auth-modal'
          );
          if (!authKitModalExists && isFarcasterAuthInProgress) {
            clearAuthTimeout();
            setIsFarcasterAuthInProgress(false);
          }
        }, 2000);

        const handleEscapeKey = (event: KeyboardEvent) => {
          if (event.key === 'Escape' && isFarcasterAuthInProgress && !isSuccess && !isError) {
            setTimeout(() => {
              const authKitModalExists = document.querySelector(
                '[class*="fc-authkit-signin-modal"], [data-testid*="farcaster"], .farcaster-auth-modal'
              );
              if (!authKitModalExists) {
                clearAuthTimeout();
                setIsFarcasterAuthInProgress(false);
              }
            }, 100);
          }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
          if (timeoutId) clearTimeout(timeoutId);
          document.removeEventListener('keydown', handleEscapeKey);
        };
      }

      const handleVisibilityChange = () => {
        if (!document.hidden && isFarcasterAuthInProgress && !isSuccess && !isError) {
          visibilityTimeoutId = setTimeout(() => {
            if (!isMobile) {
              const authKitModalExists = document.querySelector(
                '[class*="fc-authkit-signin-modal"], [data-testid*="farcaster"], .farcaster-auth-modal'
              );
              if (!authKitModalExists && isFarcasterAuthInProgress) {
                clearAuthTimeout();
                setIsFarcasterAuthInProgress(false);
              }
            }
          }, 500);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      };
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
    };
  }, [isFarcasterAuthInProgress, isSuccess, isError, clearAuthTimeout, isMobile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isMobileBrowser = isMobileDevice && window.innerWidth <= 768;
        setIsMobile(isMobileBrowser);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const getInitialPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      return {
        x: window.innerWidth - 84,
        y: window.innerHeight - 124,
      };
    }
    return { x: 20, y: 60 };
  }, []);

  const [position, setPosition] = useState(getInitialPosition);

  let newNotificationCount = 0;
  try {
    const notificationContext = useNotifications();
    newNotificationCount = notificationContext.newNotificationCount;
  } catch (error) {
    newNotificationCount = 0;
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const buttonSize = 64;
      const padding = 20;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const clampedX = Math.max(padding, Math.min(newX, viewportWidth - buttonSize - padding));
      const clampedY = Math.max(padding, Math.min(newY, viewportHeight - buttonSize - padding));
      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      const viewportWidth = window.innerWidth;
      const buttonSize = 64;
      const padding = 20;
      const currentX = position.x;
      const snapToLeft = currentX < viewportWidth / 2;
      const newX = snapToLeft ? padding : viewportWidth - buttonSize - padding;
      setIsSnapping(true);
      setPosition((prev) => ({ ...prev, x: newX }));
      setTimeout(() => setIsSnapping(false), 400);
    }
    setIsDragging(false);
  }, [isDragging, position.x]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
      const touch = e.touches[0];
      const rect = dragRef.current?.getBoundingClientRect();
      if (rect) {
        const startPos = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
        setDragStart(startPos);
      }
      const timer = setTimeout(() => {
        setIsHolding(true);
        setIsDragging(true);
        if (navigator.vibrate) {
          navigator.vibrate([30, 10, 30]);
        }
      }, 250);
      setTouchTimer(timer);
    },
    [touchTimer]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isHolding && touchTimer) {
        const touch = e.touches[0];
        const rect = dragRef.current?.getBoundingClientRect();
        if (rect) {
          const moveDistance = Math.sqrt(
            Math.pow(touch.clientX - (rect.left + dragStart.x), 2) +
              Math.pow(touch.clientY - (rect.top + dragStart.y), 2)
          );
          if (moveDistance > 10) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
            return;
          }
        }
      }
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const buttonSize = 64;
      const padding = 20;
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      const clampedX = Math.max(padding, Math.min(newX, viewportWidth - buttonSize - padding));
      const clampedY = Math.max(padding, Math.min(newY, viewportHeight - buttonSize - padding));
      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging, dragStart, isHolding, touchTimer]
  );

  const handleTouchEnd = useCallback(() => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
    if (isDragging) {
      const viewportWidth = window.innerWidth;
      const buttonSize = 64;
      const padding = 20;
      const currentX = position.x;
      const snapToLeft = currentX < viewportWidth / 2;
      const newX = snapToLeft ? padding : viewportWidth - buttonSize - padding;
      setIsSnapping(true);
      setPosition((prev) => ({ ...prev, x: newX }));
      setTimeout(() => setIsSnapping(false), 400);
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
    setIsHolding(false);
    setIsDragging(false);
  }, [touchTimer, position.x, isDragging]);

  const handleHiveLogin = () => {
    safeCloseConnectionModal();
    setTimeout(() => setModalDisplayed(true), 400);
  };

  const handleFarcasterConnect = async () => {
    if (isFarcasterAuthInProgress || isModalTransitioning) return;
    setIsFarcasterAuthInProgress(true);
    setAuthTimeoutSafety();
    try {
      if (actualFarcasterConnection) {
        const connectedProfile = actualFarcasterProfile;
        clearAuthTimeout();
        setIsFarcasterAuthInProgress(false);
        safeCloseConnectionModal();
        toast({
          title: 'Already Connected',
          description: `Already connected as @${connectedProfile?.username || 'unknown'}`,
          status: 'info',
          duration: 3000,
        });
        return;
      }
      if (isInMiniapp && miniappUser) {
        clearAuthTimeout();
        safeCloseConnectionModal();
        toast({
          title: 'Already Connected',
          description: `Connected as @${miniappUser.username} via Farcaster miniapp`,
          status: 'success',
          duration: 3000,
        });
        return;
      }
      if (isInMiniapp && !miniappUser) {
        clearAuthTimeout();
        toast({
          title: 'Authentication Error',
          description: 'Please ensure you\'re signed into Farcaster',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      signIn();
    } catch (error) {
      console.error('Farcaster auth error:', error);
      clearAuthTimeout();
      setIsFarcasterAuthInProgress(false);
      safeCloseConnectionModal();
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Farcaster. Please try again.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    setIsClient(true);
    setPosition(getInitialPosition());
  }, [getInitialPosition]);

  useEffect(() => {
    if (!isClient) return;
    const handleResize = () => {
      if (!isDragging) {
        setPosition(getInitialPosition());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging, isClient, getInitialPosition]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
      clearAuthTimeout();
    };
  }, [touchTimer, clearAuthTimeout]);

  if (!isClient) {
    return null;
  }

  const themeToRiveValue: Record<string, number> = {
    hackerPlus: 0,
    hackerRed: 1,
    windows95: 2,
    hacker: 3,
    gay: 4,
    paper: 5,
  };

  const themeValue = themeToRiveValue[themeName];

  const navigationItems = [
    { src: '/buttons/home.riv', href: '/', name: 'Home' },
    { src: '/buttons/blog.riv', href: '/blog', name: 'Pages' },
    { src: '/buttons/leaderboard.riv', href: '/leaderboard', name: 'Leaderboard' },
    { src: '/buttons/map.riv', href: '/map', name: 'Skate Spots' },
    { src: '/buttons/bounties.riv', href: '/bounties', name: 'Bounties' },
    { src: '/buttons/bounties.riv', href: '/auction', name: 'Auction', hide: pathname?.startsWith('/auction') },
    ...(user
      ? [{ src: '/buttons/notif.riv', href: '/notifications', name: 'Notifications', badge: newNotificationCount }]
      : []),
    { src: '/buttons/wallet.riv', href: '/wallet', name: 'Wallet' },
    { src: '/buttons/profile.riv', href: '/settings', name: 'Settings' },
    {
      src: '/buttons/profile.riv',
      href: user ? `/user/${user}?view=snaps` : undefined,
      onClick: !user ? () => setIsConnectionModalOpen(true) : undefined,
      name: user ? 'Profile' : 'Login',
    },
  ];

  return (
    <>
      <Box
        ref={dragRef}
        position="fixed"
        left={`${position.x}px`}
        top={`${position.y}px`}
        zIndex="999"
        display={{ base: 'block', md: 'none' }}
        userSelect="none"
        style={{
          transform: isDragging ? 'scale(1.08) rotate(2deg)' : isHolding ? 'scale(1.04)' : 'scale(1)',
          transition: isDragging
            ? 'none'
            : isSnapping
            ? 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: isDragging ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))' : 'none',
        }}
      >
        <Box
          position="absolute"
          top="-15px"
          left="50%"
          transform="translateX(-50%)"
          width="40px"
          height="15px"
          cursor={isDragging ? 'grabbing' : 'grab'}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box display="flex" gap="2px">
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
          </Box>
        </Box>
        <Box
          position="absolute"
          bottom="-15px"
          left="50%"
          transform="translateX(-50%)"
          width="40px"
          height="15px"
          cursor={isDragging ? 'grabbing' : 'grab'}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box display="flex" gap="2px">
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
          </Box>
        </Box>
        <Box
          position="absolute"
          left="-15px"
          top="50%"
          transform="translateY(-50%)"
          width="15px"
          height="40px"
          cursor={isDragging ? 'grabbing' : 'grab'}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Box display="flex" flexDirection="column" gap="2px">
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
          </Box>
        </Box>
        <Box
          position="absolute"
          right="-15px"
          top="50%"
          transform="translateY(-50%)"
          width="15px"
          height="40px"
          cursor={isDragging ? 'grabbing' : 'grab'}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Box display="flex" flexDirection="column" gap="2px">
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
            <Box w="3px" h="3px" bg="rgba(255, 255, 255, 0.6)" borderRadius="full" />
          </Box>
        </Box>
        <Menu placement="top-end">
          <MenuButton
            as={IconButton}
            aria-label="Navigation Menu"
            icon={
              <Image
                src="/logos/SKATE_HIVE_CIRCLE.svg"
                alt="SkateHive Navigation Menu"
                transition="all 0.3s ease"
                transform={isDragging ? 'rotate(-2deg)' : 'rotate(0deg)'}
              />
            }
            bg="primary"
            color="background"
            borderRadius="full"
            size="xl"
            boxShadow={
              isDragging
                ? '0 0 8px 8px var(--chakra-colors-primary), 0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 0 4px 4px var(--chakra-colors-primary)'
            }
            _hover={{
              bg: 'primary',
              transform: isDragging ? 'scale(1)' : 'scale(1.10)',
              boxShadow: isDragging
                ? '0 0 8px 8px var(--chakra-colors-primary), 0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 0 32px 16px var(--chakra-colors-primary)',
            }}
            _active={{ bg: 'primary' }}
            position="relative"
            minW="64px"
            minH="64px"
            pointerEvents={isDragging ? 'none' : 'auto'}
            sx={{
              animation: isDragging ? 'none' : 'glowPump 2.2s infinite',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes glowPump': {
                '0%': { boxShadow: '0 0 2px 2px var(--chakra-colors-primary)' },
                '50%': { boxShadow: '0 0 4px 4px var(--chakra-colors-primary)' },
                '100%': { boxShadow: '0 0 2px 2px var(--chakra-colors-primary)' },
              },
            }}
          >
            {newNotificationCount > 0 && (
              <Box
                position="absolute"
                top="-8px"
                right="-8px"
                bg="red.500"
                color="white"
                borderRadius="full"
                fontSize="md"
                minW="28px"
                h="28px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
              >
                {newNotificationCount}
              </Box>
            )}
          </MenuButton>
          <MenuList
            bg="background"
            border="1px solid"
            borderColor="primary"
            boxShadow="xl"
            maxH="400px"
            overflowY="auto"
            w={{ base: '90vw', sm: '300px' }}
            maxW="90vw"
            p={2}
          >
            {navigationItems.map((item, index) => (
              <MenuItem
                key={index}
                as={item.href ? Link : 'button'}
                {...(item.href ? { href: item.href } : { onClick: item.onClick })}
                _hover={{ bg: 'muted', color: 'secondary' }}
                display="flex"
                alignItems="center"
                position="relative"
                color="primary"
                bg="background"
                px={4}
                py={2}
                style={item.hide ? { display: 'none' } : undefined}
              >
                <HStack spacing={3} w="full">
                  <MenuRiveButton src={item.src} themeValue={themeValue} />
                  <Text fontWeight="medium">{item.name}</Text>
                  {item.badge && item.badge > 0 && (
                    <Box
                      bg="red.500"
                      color="white"
                      borderRadius="full"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      ml="auto"
                    >
                      {item.badge}
                    </Box>
                  )}
                </HStack>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Box>
      {modalDisplayed && (
        <div style={{ zIndex: 10000 }}>
          <AiohaModal
            displayed={modalDisplayed}
            loginOptions={{
              msg: 'Login to SkateHive',
              keyType: KeyTypes.Posting,
              loginTitle: 'Connect Your SkateHive Account',
            }}
            onLogin={() => setModalDisplayed(false)}
            onClose={() => setModalDisplayed(false)}
          />
        </div>
      )}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={safeCloseConnectionModal}
        onHiveLogin={handleHiveLogin}
        onFarcasterConnect={handleFarcasterConnect}
        isFarcasterAuthInProgress={isFarcasterAuthInProgress}
        actualFarcasterConnection={actualFarcasterConnection}
        actualFarcasterProfile={actualFarcasterProfile}
      />
    </>
  );
}