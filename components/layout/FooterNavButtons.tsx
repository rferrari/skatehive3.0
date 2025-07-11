import React, { useState } from 'react';
import { Box, Menu, MenuButton, MenuList, MenuItem, Text, HStack, IconButton, Image } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { AiohaModal } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { useTheme } from '../../app/themeProvider';
import { HamburgerIcon } from '@chakra-ui/icons';

// Modular Rive Button for Menu Items
const MenuRiveButton = ({ src, themeValue }: { src: string, themeValue: number | undefined }) => {
  const STATE_MACHINE_NAME = "ButtonStateMachine";
  const THEME_INPUT_NAME = "theme";
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
  });
  const themeInput = useStateMachineInput(rive, STATE_MACHINE_NAME, THEME_INPUT_NAME);

  React.useEffect(() => {
    if (
      themeInput &&
      typeof themeValue === 'number' &&
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

export default function FooterNavButtons({ newNotificationCount = 0 }: { newNotificationCount?: number }) {
  const router = useRouter();
  const { user } = useAioha();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const { themeName } = useTheme();

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
    { src: "/buttons/blog.riv", onClick: () => router.push("/blog"), name: "Blog" },
    { src: "/buttons/leaderboard.riv", onClick: () => router.push("/leaderboard"), name: "Leaderboard" },
    { src: "/buttons/map.riv", onClick: () => router.push("/skatespots"), name: "Skate Spots" },
    { src: "/buttons/bounties.riv", onClick: () => router.push("/bounties"), name: "Bounties" },
    {
      src: "/buttons/notif.riv",
      onClick: () => router.push("/notifications"),
      name: "Notifications",
      badge: newNotificationCount
    },
    { src: "/buttons/wallet.riv", onClick: () => router.push("/wallet"), name: "Wallet" },
    {
      src: "/buttons/profile.riv",
      onClick: () => {
        if (user) {
          router.push(`/user/${user}?view=grid`);
        } else {
          setModalDisplayed(true);
        }
      },
      name: "Profile"
    },
  ];

  return (
    <>
      <Box
        position="fixed"
        bottom="20px"
        right="20px"
        zIndex="999"
        display={{ base: "block", md: "none" }}
      >
        <Menu placement="top-end">
          <MenuButton
            as={IconButton}
            aria-label="Navigation Menu"
            icon={<Image src="/logos/SKATE_HIVE_CIRCLE.svg" />}
            bg="primary"
            color="background"
            borderRadius="full"
            size="xl"
            boxShadow="0 0 4px 4px var(--chakra-colors-primary)" // Glow shadow
            _hover={{
              bg: "primary",
              transform: "scale(1.10)",
              boxShadow: "0 0 32px 16px var(--chakra-colors-primary)", // Stronger glow on hover
            }}
            _active={{ bg: "primary" }}
            position="relative"
            minW="64px"
            minH="64px"
            sx={{
              animation: "glowPump 2.2s infinite",
              "@keyframes glowPump": {
                "0%": { boxShadow: "0 0 2px 2px var(--chakra-colors-primary)" },
                "50%": { boxShadow: "0 0 4px 4px var(--chakra-colors-primary)" },
                "100%": { boxShadow: "0 0 2px 2px var(--chakra-colors-primary)" },
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
        onLogin={() => { }}
        onClose={() => setModalDisplayed(false)}
      />
    </>
  );
} 