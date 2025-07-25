import React, { useState, useRef, useCallback } from "react";
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
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { AiohaModal } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { useTheme } from "../../app/themeProvider";
import { useNotifications } from "@/contexts/NotificationContext";

// Modular Rive Button for Menu Items -- what is that , why do we call the hook again ?
const MenuRiveButton = ({
  src,
  themeValue,
}: {
  src: string;
  themeValue: number | undefined;
}) => {
  const STATE_MACHINE_NAME = "ButtonStateMachine";
  const THEME_INPUT_NAME = "theme";
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
  });
  const themeInput = useStateMachineInput(
    rive,
    STATE_MACHINE_NAME,
    THEME_INPUT_NAME
  );
  const { user } = useAioha();
  React.useEffect(() => {
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
  const router = useRouter();
  const { user } = useAioha();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const { themeName } = useTheme();

  // Client-side only rendering to avoid hydration issues
  const [isClient, setIsClient] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  // Calculate initial position for client-side
  const getInitialPosition = useCallback(() => {
    if (typeof window !== "undefined") {
      return {
        x: window.innerWidth - 84, // 64px button + 20px padding
        y: window.innerHeight - 124, // 64px button + 60px from bottom
      };
    }
    return { x: 20, y: 60 }; // This won't be used since we only render on client
  }, []);

  const [position, setPosition] = useState(getInitialPosition);

  // Safely get notification count with fallback - MOVED BEFORE CONDITIONAL RETURN
  let newNotificationCount = 0;
  try {
    const notificationContext = useNotifications();
    newNotificationCount = notificationContext.newNotificationCount;
  } catch (error) {
    // Context not available yet, use default value
    newNotificationCount = 0;
  }

  // Handle drag start - only for mouse (desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // For desktop, we can start dragging immediately
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

  // Handle drag move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const buttonSize = 64;
      const padding = 20; // Padding from screen edges

      // Calculate new position relative to viewport
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep button within viewport bounds with padding
      const clampedX = Math.max(
        padding,
        Math.min(newX, viewportWidth - buttonSize - padding)
      );
      const clampedY = Math.max(
        padding,
        Math.min(newY, viewportHeight - buttonSize - padding)
      );

      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging, dragStart]
  );

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Add snap-to-edge functionality for desktop too
      const viewportWidth = window.innerWidth;
      const buttonSize = 64;
      const padding = 20;
      const currentX = position.x;

      // Snap to the nearest edge (left or right)
      const snapToLeft = currentX < viewportWidth / 2;
      const newX = snapToLeft ? padding : viewportWidth - buttonSize - padding;

      setIsSnapping(true);
      setPosition((prev) => ({ ...prev, x: newX }));

      // Reset snapping state after animation
      setTimeout(() => setIsSnapping(false), 400);
    }

    setIsDragging(false);
  }, [isDragging, position.x]);

  // Touch event handlers for mobile with hold-to-drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Clear any existing timer
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

      // Start a timer for hold-to-drag (250ms delay - responsive)
      const timer = setTimeout(() => {
        setIsHolding(true);
        setIsDragging(true);
        // Enhanced haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([30, 10, 30]); // Pattern: vibrate-pause-vibrate
        }
      }, 250);

      setTouchTimer(timer);
    },
    [touchTimer]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      // If we're not holding yet, check if user moved too much and cancel the timer
      if (!isHolding && touchTimer) {
        const touch = e.touches[0];
        const rect = dragRef.current?.getBoundingClientRect();
        if (rect) {
          const moveDistance = Math.sqrt(
            Math.pow(touch.clientX - (rect.left + dragStart.x), 2) +
              Math.pow(touch.clientY - (rect.top + dragStart.y), 2)
          );

          // If user moves more than 10px before the timer, cancel hold-to-drag
          if (moveDistance > 10) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
            return;
          }
        }
      }

      // Only handle drag if we're actually dragging
      if (!isDragging) return;

      e.preventDefault();
      const touch = e.touches[0];
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const buttonSize = 64;
      const padding = 20; // Padding from screen edges

      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      const clampedX = Math.max(
        padding,
        Math.min(newX, viewportWidth - buttonSize - padding)
      );
      const clampedY = Math.max(
        padding,
        Math.min(newY, viewportHeight - buttonSize - padding)
      );

      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging, dragStart, isHolding, touchTimer]
  );

  const handleTouchEnd = useCallback(() => {
    // Clear any existing timer
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }

    // If we were dragging, add snap-to-edge functionality
    if (isDragging) {
      const viewportWidth = window.innerWidth;
      const buttonSize = 64;
      const padding = 20;
      const currentX = position.x;

      // Snap to the nearest edge (left or right)
      const snapToLeft = currentX < viewportWidth / 2;
      const newX = snapToLeft ? padding : viewportWidth - buttonSize - padding;

      setIsSnapping(true);
      setPosition((prev) => ({ ...prev, x: newX }));

      // Reset snapping state after animation
      setTimeout(() => setIsSnapping(false), 400);

      // Gentle haptic feedback for snap
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }

    setIsHolding(false);
    setIsDragging(false);
  }, [ isDragging, touchTimer, position.x]);

  // Only render on client to avoid hydration mismatch
  React.useEffect(() => {
    setIsClient(true);
    setPosition(getInitialPosition());
  }, [getInitialPosition]);

  // Update position on window resize
  React.useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      if (!isDragging) {
        setPosition(getInitialPosition());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging, isClient, getInitialPosition]);

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Add touch event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
    };
  }, [touchTimer]);

  // Don't render anything on server side - MOVED TO END AFTER ALL HOOKS
  if (!isClient) {
    return null;
  }

  // Map themeName to Rive theme value
  const themeToRiveValue: Record<string, number> = {
    hackerPlus: 0,
    hackerRed: 1,
    windows95: 2,
    hacker: 3,
    gay: 4,
    paper: 5,
  };

  const themeValue = themeToRiveValue[themeName];

  // Navigation items with their routes and names
  const navigationItems = [
    { src: "/buttons/home.riv", onClick: () => router.push("/"), name: "Home" },
    {
      src: "/buttons/blog.riv",
      onClick: () => router.push("/blog"),
      name: "Pages",
    },
    {
      src: "/buttons/leaderboard.riv",
      onClick: () => router.push("/leaderboard"),
      name: "Leaderboard",
    },
    {
      src: "/buttons/map.riv",
      onClick: () => router.push("/skatespots"),
      name: "Skate Spots",
    },
    {
      src: "/buttons/bounties.riv",
      onClick: () => router.push("/bounties"),
      name: "Bounties",
    },
    ...(user
      ? [
          {
            src: "/buttons/notif.riv",
            onClick: () => router.push("/notifications"),
            name: "Notifications",
            badge: newNotificationCount,
          },
        ]
      : []),
    {
      src: "/buttons/wallet.riv",
      onClick: () => router.push("/wallet"),
      name: "Wallet",
    },
    {
      src: "/buttons/profile.riv",
      onClick: () => router.push("/settings"),
      name: "Settings",
    },
    {
      src: "/buttons/profile.riv",
      onClick: () => {
        if (user) {
          router.push(`/user/${user}?view=snaps`);
        } else {
          setModalDisplayed(true);
        }
      },
      name: user ? "Profile" : "Login",
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
        display={{ base: "block", md: "none" }}
        userSelect="none"
        style={{
          transform: isDragging
            ? "scale(1.08) rotate(2deg)"
            : isHolding
            ? "scale(1.04)"
            : "scale(1)",
          transition: isDragging
            ? "none"
            : isSnapping
            ? "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: isDragging
            ? "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))"
            : "none",
        }}
      >
        {/* Drag handles positioned around the button, not overlapping */}
        <Box
          position="absolute"
          top="-15px"
          left="50%"
          transform="translateX(-50%)"
          width="40px"
          height="15px"
          cursor={isDragging ? "grabbing" : "grab"}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {/* Drag indicator dots */}
          <Box display="flex" gap="2px">
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
          </Box>
        </Box>

        <Box
          position="absolute"
          bottom="-15px"
          left="50%"
          transform="translateX(-50%)"
          width="40px"
          height="15px"
          cursor={isDragging ? "grabbing" : "grab"}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {/* Drag indicator dots */}
          <Box display="flex" gap="2px">
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
          </Box>
        </Box>

        <Box
          position="absolute"
          left="-15px"
          top="50%"
          transform="translateY(-50%)"
          width="15px"
          height="40px"
          cursor={isDragging ? "grabbing" : "grab"}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          {/* Drag indicator dots */}
          <Box display="flex" flexDirection="column" gap="2px">
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
          </Box>
        </Box>

        <Box
          position="absolute"
          right="-15px"
          top="50%"
          transform="translateY(-50%)"
          width="15px"
          height="40px"
          cursor={isDragging ? "grabbing" : "grab"}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => e.stopPropagation()}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.1)"
          _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          {/* Drag indicator dots */}
          <Box display="flex" flexDirection="column" gap="2px">
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
            <Box
              w="3px"
              h="3px"
              bg="rgba(255, 255, 255, 0.6)"
              borderRadius="full"
            />
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
                transform={isDragging ? "rotate(-2deg)" : "rotate(0deg)"}
              />
            }
            bg="primary"
            color="background"
            borderRadius="full"
            size="xl"
            boxShadow={
              isDragging
                ? "0 0 8px 8px var(--chakra-colors-primary), 0 8px 32px rgba(0, 0, 0, 0.4)"
                : "0 0 4px 4px var(--chakra-colors-primary)"
            }
            _hover={{
              bg: "primary",
              transform: isDragging ? "scale(1)" : "scale(1.10)",
              boxShadow: isDragging
                ? "0 0 8px 8px var(--chakra-colors-primary), 0 8px 32px rgba(0, 0, 0, 0.4)"
                : "0 0 32px 16px var(--chakra-colors-primary)",
            }}
            _active={{ bg: "primary" }}
            position="relative"
            minW="64px"
            minH="64px"
            pointerEvents={isDragging ? "none" : "auto"}
            sx={{
              animation: isDragging ? "none" : "glowPump 2.2s infinite",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "@keyframes glowPump": {
                "0%": { boxShadow: "0 0 2px 2px var(--chakra-colors-primary)" },
                "50%": {
                  boxShadow: "0 0 4px 4px var(--chakra-colors-primary)",
                },
                "100%": {
                  boxShadow: "0 0 2px 2px var(--chakra-colors-primary)",
                },
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
          >
            {navigationItems.map((item, index) => (
              <MenuItem
                key={index}
                onClick={item.onClick}
                _hover={{ bg: "muted", color: "secondary" }}
                display="flex"
                alignItems="center"
                position="relative"
                color="primary"
                bg={"background"}
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
      <AiohaModal
        displayed={modalDisplayed}
        loginOptions={{
          msg: "Login",
          keyType: KeyTypes.Posting,
          loginTitle: "Login",
        }}
        onLogin={() => {}}
        onClose={() => setModalDisplayed(false)}
      />
    </>
  );
}
