"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Button,
  Icon,
  Image,
  Flex,
  useColorMode,
  useToken,
} from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { AiohaModal, useAioha } from "@aioha/react-ui";
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
import { KeyTypes } from "@aioha/aioha";
import "@aioha/react-ui/dist/build.css";
import { useTheme } from "@/app/themeProvider";
import { useNotifications } from "@/contexts/NotificationContext";
import SidebarLogo from "../graphics/SidebarLogo";

export default function Sidebar() {
  const { user, aioha } = useAioha();
  const router = useRouter();
  const pathname = usePathname();
  const { colorMode } = useColorMode();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const { themeName } = useTheme();

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
  else if (themeName === "hiveBR") hoverTextColor = "accent";

  useEffect(() => {
    setBellAnimating(newNotificationCount > 0);
  }, [newNotificationCount]);

  const handleNavigation = (path: string) => {
    try {
      if (path === "/" && pathname === "/") {
        window.location.reload();
        return;
      }
      router.push(path);
    } catch (error) {
      // Navigation error
    }
  };

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
          <VStack spacing={0} align="start" ml={4} mt={2}>
            <Button
              onClick={() => handleNavigation("/")}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              pl={0}
              pr={4}
              py={3}
              mb={1}
              role="group"
              _hover={{}}
              _active={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                px={1}
                py={0.5}
                borderRadius="md"
                transition="background 0.2s"
                _groupHover={{ bg: primaryBg, color: hoverTextColor }}
              >
                <Icon as={FiHome} boxSize={4} mr={2} />
                Home
              </Box>
            </Button>
            <Button
              onClick={() => handleNavigation("/blog")}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              pl={0}
              pr={4}
              py={3}
              mb={1}
              role="group"
              _hover={{}}
              _active={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                px={1}
                py={0.5}
                borderRadius="md"
                transition="background 0.2s"
                _groupHover={{ bg: primaryBg, color: hoverTextColor }}
              >
                <Icon as={FiBook} boxSize={4} mr={2} />
                Magazine
              </Box>
            </Button>
            <Button
              onClick={() => handleNavigation("/leaderboard")}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              pl={0}
              pr={4}
              py={3}
              mb={1}
              role="group"
              _hover={{}}
              _active={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                px={1}
                py={0.5}
                borderRadius="md"
                transition="background 0.2s"
                _groupHover={{ bg: primaryBg, color: hoverTextColor }}
              >
                <Icon as={FiAward} boxSize={4} mr={2} />
                Leaderboard
              </Box>
            </Button>
            <Button
              onClick={() => handleNavigation("/skatespots")}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              pl={0}
              pr={4}
              py={3}
              mb={1}
              role="group"
              _hover={{}}
              _active={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                px={1}
                py={0.5}
                borderRadius="md"
                transition="background 0.2s"
                _groupHover={{ bg: primaryBg, color: hoverTextColor }}
              >
                <Icon as={FiMap} boxSize={4} mr={2} />
                Skatespots
              </Box>
            </Button>
            <Button
              onClick={() => handleNavigation("/bounties")}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              pl={0}
              pr={4}
              py={3}
              mb={1}
              role="group"
              _hover={{}}
              _active={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                px={1}
                py={0.5}
                borderRadius="md"
                transition="background 0.2s"
                _groupHover={{ bg: primaryBg, color: hoverTextColor }}
              >
                <Icon as={FiTarget} boxSize={4} mr={2} />
                Bounties
              </Box>
            </Button>
            {user && (
              <>
                <Button
                  onClick={() => handleNavigation("/notifications")}
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  pl={0}
                  pr={4}
                  py={3}
                  mb={1}
                  role="group"
                  _hover={{}}
                  _active={{ bg: "transparent" }}
                  _focus={{ bg: "transparent" }}
                >
                  <Box
                    as="span"
                    display="flex"
                    alignItems="center"
                    px={1}
                    py={0.5}
                    borderRadius="md"
                    transition="background 0.2s"
                    _groupHover={{ bg: primaryBg, color: hoverTextColor }}
                  >
                    {bellAnimating ? (
                      <Box
                        as={motion.div}
                        animate={{ rotate: [0, 45, 0, -45, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity } as any}
                        display="inline-block"
                        mr={2}
                      >
                        <Icon as={FiBell} boxSize={4} />
                      </Box>
                    ) : (
                      <Icon as={FiBell} boxSize={4} mr={2} />
                    )}
                    Notifications
                  </Box>
                </Button>
                <Button
                  onClick={() => handleNavigation("/@" + user)}
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  pl={0}
                  pr={4}
                  py={3}
                  mb={1}
                  role="group"
                  _hover={{}}
                  _active={{ bg: "transparent" }}
                  _focus={{ bg: "transparent" }}
                >
                  <Box
                    as="span"
                    display="flex"
                    alignItems="center"
                    px={1}
                    py={0.5}
                    borderRadius="md"
                    transition="background 0.2s"
                    _groupHover={{ bg: primaryBg, color: hoverTextColor }}
                  >
                    {user ? (
                      <Image
                        src={`https://images.hive.blog/u/${user}/avatar`}
                        alt="Profile Image"
                        boxSize={4}
                        borderRadius="full"
                        mr={2}
                      />
                    ) : (
                      <Icon as={FiUser} boxSize={4} mr={2} />
                    )}
                    Profile
                  </Box>
                </Button>
                <Button
                  onClick={() => handleNavigation("/wallet")}
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  pl={0}
                  pr={4}
                  py={3}
                  mb={1}
                  role="group"
                  _hover={{}}
                  _active={{ bg: "transparent" }}
                  _focus={{ bg: "transparent" }}
                >
                  <Box
                    as="span"
                    display="flex"
                    alignItems="center"
                    px={1}
                    py={0.5}
                    borderRadius="md"
                    transition="background 0.2s"
                    _groupHover={{ bg: primaryBg, color: hoverTextColor }}
                  >
                    <Icon as={FiCreditCard} boxSize={4} mr={2} />
                    Wallet
                  </Box>
                </Button>
              </>
            )}
            <Button
              onClick={() => handleNavigation("/settings")}
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              pl={0}
              pr={4}
              py={3}
              mb={1}
              role="group"
              _hover={{}}
              _active={{ bg: "transparent" }}
              _focus={{ bg: "transparent" }}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                px={1}
                py={0.5}
                borderRadius="md"
                transition="background 0.2s"
                _groupHover={{ bg: primaryBg, color: hoverTextColor }}
              >
                <Icon as={FiSettings} boxSize={4} mr={2} />
                Settings
              </Box>
            </Button>
            {user && (
              <Button
                onClick={() => handleNavigation("/invite")}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                pl={0}
                pr={4}
                py={3}
                mb={1}
                role="group"
                _hover={{}}
                _active={{ bg: "transparent" }}
                _focus={{ bg: "transparent" }}
              >
                <Box
                  as="span"
                  display="flex"
                  alignItems="center"
                  px={1}
                  py={0.5}
                  borderRadius="md"
                  transition="background 0.2s"
                  _groupHover={{ bg: primaryBg, color: hoverTextColor }}
                >
                  <Icon as={FiMail} boxSize={4} mr={2} />
                  Invite
                </Box>
              </Button>
            )}
            {/* {!user && (
              <Button
                onClick={() => handleNavigation("/join")}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                pl={0}
                pr={4}
                py={3}
                mb={1}
                role="group"
                _hover={{}}
                _active={{ bg: "transparent" }}
                _focus={{ bg: "transparent" }}
              >
                <Box
                  as="span"
                  display="flex"
                  alignItems="center"
                  px={1}
                  py={0.5}
                  borderRadius="md"
                  transition="background 0.2s"
                  _groupHover={{ bg: primaryBg, color: hoverTextColor }}
                >
                  <Icon as={FiUser} boxSize={4} mr={2} />
                  Join
                </Box>
              </Button>
            )} */}
          </VStack>
        </Box>
        <VStack spacing={2} align="stretch" p={4} m={0}>
          <Button
            onClick={async () => {
              if (user) {
                await aioha.logout();
              } else {
                await aioha.logout();
                setModalDisplayed(true);
              }
            }}
            bg="primary"
            color="background"
            _hover={{ bg: "accent", color: "text" }}
            w="full"
            mt="auto"
            mb={8}
          >
            {user ? "Logout" : "Login"}
          </Button>
        </VStack>
      </Flex>
      <div className={colorMode}>
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
      </div>
    </Box>
  );
}
