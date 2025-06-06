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
  useColorModeValue,
  useToken,
} from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { AiohaModal, useAioha } from "@aioha/react-ui";
import { FiHome, FiBell, FiUser, FiBook, FiMap } from "react-icons/fi";
import { FaPiggyBank } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaGear } from "react-icons/fa6";
import { FaMailBulk } from "react-icons/fa";
import { FaTrophy } from "react-icons/fa";
import { KeyTypes } from "@aioha/aioha";
import "@aioha/react-ui/dist/build.css";
import { useAccount } from "wagmi";
import { useDisclosure } from "@chakra-ui/react";

const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG;

export default function Sidebar({ newNotificationCount = 0 }) {
  const { user } = useAioha();
  const router = useRouter();
  const pathname = usePathname();
  const { colorMode } = useColorMode();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const { isConnected, connector: activeConnector } = useAccount();
  const {
    isOpen: isConnectModalOpen,
    onOpen: openConnectModal,
    onClose: closeConnectModal,
  } = useDisclosure();

  const [primaryBg] = useToken("colors", ["primary"]);
  const hoverTextColor = "black";

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
      p={1}
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
        <VStack spacing={4} align="start" ml={4}>
          <Image
            src="https://www.skatehive.app/SKATE_HIVE_VECTOR_FIN.svg"
            alt="Skatehive Logo"
            boxSize={12}
            mt={1}
            w={"80%"}
            h={"auto"}
          />
          <Button
            onClick={() => handleNavigation("/")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FiHome} boxSize={4} />}
            px={1}
            mt={4}
            _hover={{
              bg: primaryBg,
              color: hoverTextColor,
            }}
          >
            Home
          </Button>
          <Button
            onClick={() => handleNavigation("/leaderboard")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FaTrophy} boxSize={4} color="yellow.400" />}
            px={1}
            _hover={{
              bg: primaryBg,
              color: hoverTextColor,
            }}
          >
            Leaderboard
          </Button>
          <Button
            onClick={() => handleNavigation("/blog")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FiBook} boxSize={4} />}
            px={1}
            _hover={{
              bg: primaryBg,
              color: hoverTextColor,
            }}
          >
            Magazine
          </Button>
          <Button
            onClick={() => handleNavigation("/skatespots")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FiMap} boxSize={4} />}
            px={1}
            _hover={{
              bg: primaryBg,
              color: hoverTextColor,
            }}
          >
            Skatespots
          </Button>
          {user && (
            <>
              <Button
                onClick={() => handleNavigation("/@" + user + "/notifications")}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                leftIcon={
                  bellAnimating ? (
                    <Box
                      as={motion.div}
                      animate={{ rotate: [0, 45, 0, -45, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity } as any}
                      display="inline-block"
                    >
                      <Icon as={FiBell} boxSize={4} />
                    </Box>
                  ) : (
                    <Icon as={FiBell} boxSize={4} />
                  )
                }
                px={1}
                _hover={{
                  bg: primaryBg,
                  color: hoverTextColor,
                }}
              >
                Notifications
              </Button>
              <Button
                onClick={() => handleNavigation("/@" + user)}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                leftIcon={
                  user ? (
                    <Image
                      src={`https://images.hive.blog/u/${user}/avatar`}
                      alt="Profile Image"
                      boxSize={4}
                      borderRadius="full"
                    />
                  ) : (
                    <Icon as={FiUser} boxSize={4} />
                  )
                }
                px={1}
                _hover={{
                  bg: primaryBg,
                  color: hoverTextColor,
                }}
              >
                Profile
              </Button>
              <Button
                onClick={() => handleNavigation("/@" + user + "/wallet")}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                leftIcon={<Icon as={FaPiggyBank} boxSize={4} />}
                px={1}
                _hover={{
                  bg: primaryBg,
                  color: hoverTextColor,
                }}
              >
                Wallet
              </Button>
            </>
          )}
          <Button
            onClick={() => handleNavigation("/settings")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FaGear} boxSize={4} />}
            px={1}
            _hover={{
              bg: primaryBg,
              color: hoverTextColor,
            }}
          >
            Settings
          </Button>
          <Button
            onClick={() => handleNavigation("/invite")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FaMailBulk} boxSize={4} />}
            px={1}
            _hover={{
              bg: primaryBg,
              color: hoverTextColor,
            }}
          >
            Invite
          </Button>
        </VStack>
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
        <Button
          onClick={() => setModalDisplayed(true)}
          variant="solid"
          colorScheme="teal"
          w="full"
          mt="auto"
          mb={8}
        >
          {user ? "Logout" : "Login"}
        </Button>
      </Flex>
    </Box>
  );
}
