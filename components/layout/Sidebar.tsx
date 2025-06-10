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
import { FiHome, FiBell, FiUser, FiBook, FiMap, FiCreditCard, FiSettings, FiMail, FiAward } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaGear } from "react-icons/fa6";
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
        <Box ml={4} mt={2} mb={4}>
          <svg
            className="chakra-image css-27hv66"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 648 648"
            width="80%"
            height="auto"
            style={{ marginTop: 0 }}
          >
            <defs>
              <style>{`
                .cls-1 { fill: url(#linear-gradient); }
                .cls-1, .cls-2, .cls-3, .cls-4, .cls-5, .cls-6, .cls-7, .cls-8, .cls-9 { stroke-width: 0px; }
                .cls-2 { fill: #959472; }
                .cls-3 { fill: #fcf8c9; }
                .cls-4 { fill: #d4d3a5; }
                .cls-5 { fill: var(--chakra-colors-background); }
                .cls-6 { fill: #424242; }
                .cls-7 { fill: var(--chakra-colors-primary); }
                .cls-8 { fill: #afaeae; }
                .cls-9 { fill: #fff; }
              `}</style>
              <linearGradient id="linear-gradient" x1="73.65" y1="331.36" x2="574.37" y2="331.36" gradientTransform="translate(0 648) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#1b1b1b"/>
                <stop offset=".6" stopColor="#626262"/>
                <stop offset="1" stopColor="#a4a4a4"/>
              </linearGradient>
            </defs>
            <path className="cls-8" d="M294.54,309.27v-14.72h-29.46v44.18h29.46v-14.72h14.73v-14.73h-14.73Z"/>
            <path className="cls-3" d="M353.45,265.09v-29.46h-14.72v-29.46h-29.45v-14.72h-29.46v14.72h-29.46v14.73h-14.72v29.46h-14.73v14.72h-14.72v117.81h14.72v29.47h14.73v14.72h44.18v14.72h44.18v-14.72h14.72v-29.45h14.72v-29.46h14.73v-103.09h-14.73.01ZM338.72,294.55v44.18h-14.72v29.46h-58.91v-14.73h-14.72v-73.64h14.72v-14.72h58.91v14.72h14.72v14.73h0Z"/>
            <path className="cls-4" d="M176.73,250.37v29.45h-14.72v-29.45h-29.46v14.72h-14.72v117.81h73.64v-132.53h-14.74Z"/>
            <g>
              <rect className="cls-2" x="206.18" y="220.91" width="14.72" height="14.72"/>
              <rect className="cls-2" x="191.46" y="235.63" width="14.72" height="14.73"/>
              <path className="cls-2" d="M191.46,382.9h-14.73v29.47h14.73v14.72h14.72v-29.45h-14.72v-14.74Z"/>
              <rect className="cls-2" x="162.01" y="427.09" width="14.72" height="14.72"/>
              <path className="cls-2" d="M162.01,397.64h-14.73v-14.74h-14.72v29.47h14.72v14.72h14.73v-29.45Z"/>
              <path className="cls-2" d="M147.27,235.63v14.73h14.73v-14.73h14.72v-14.72h14.73v-14.73h14.72v-14.72h-29.46v14.72h-14.72v14.73h-14.73v14.72h.01Z"/>
              <rect className="cls-2" x="132.55" y="191.45" width="14.72" height="14.72"/>
              <path className="cls-2" d="M132.55,220.91v-14.73h-14.72v14.73h-14.73v29.46h-14.72v132.53h14.72v-14.71h14.73v-132.55h14.72v-14.72h0Z"/>
              <rect className="cls-2" x="103.09" y="397.64" width="14.73" height="14.72"/>
            </g>
            <g>
              <path className="cls-6" d="M324,265.09h-58.91v14.72h-14.72v73.64h14.72v14.73h58.91v-29.46h14.72v-58.91h-14.72v-14.72h0ZM309.28,324.01h-14.73v14.72h-29.46v-44.18h29.46v14.72h14.73v14.73h0Z"/>
              <path className="cls-1" d="M368.18,191.45h206.18v-14.72H117.83v14.72h-14.73v14.72h-14.72v29.46h-14.73v162.01h14.73v29.45h14.72v14.72h14.73v14.73h456.54v-14.73h-220.92v-29.45h14.73v14.72h132.54v-14.72h-117.81v-14.72h-14.73v-14.74h103.09v14.74h103.09v-14.74h-88.37v-14.71h-103.08v-14.73h191.45v-14.72h-191.45v-29.46h73.64v14.73h117.82v-14.73h-103.09v-14.72h-88.36v-14.73h161.99v14.73h29.46v-14.73h-14.73v-14.72h-176.72v-14.72h191.45v-14.73h-206.18v-14.72h206.18v-14.73h-220.92v-14.72h14.73v-.04ZM117.83,412.37h-14.73v-14.72h14.73v14.72ZM206.18,412.37v14.72h-14.72v-14.72h-14.73v-29.47h-29.46v14.74h14.73v29.45h14.72v14.72h-14.72v-14.72h-14.73v-14.72h-14.72v-29.47h-14.72v-14.71h-14.73v14.71h-14.72v-132.53h14.72v-29.46h14.73v-14.73h14.72v-14.72h14.72v14.72h-14.72v29.46h-14.72v29.46h14.72v-14.72h14.72v-29.46h14.73v-14.73h14.72v-14.72h29.46v14.72h-14.72v14.73h-14.73v14.72h-14.72v44.18h14.72v-29.45h14.73v-14.73h14.72v-14.72h14.72v14.72h-14.72v14.73h-14.72v147.27h14.72v14.72h0ZM368.18,265.09v103.09h-14.73v29.46h-14.72v29.45h-14.72v14.72h-44.18v-14.72h-44.18v-14.72h-14.73v-29.47h-14.72v-117.81h14.72v-14.72h14.73v-29.46h14.72v-14.73h29.46v-14.72h29.46v14.72h29.45v29.46h14.72v29.46h14.73-.01Z"/>
            </g>
            <g>
              <path className="cls-7" d="M559.63,58.91h-73.64v103.08h88.37v-29.45h-58.91v-14.73h44.18v-14.72h-44.18v-14.73h58.91v-29.45h-14.73Z"/>
              <path className="cls-7" d="M544.91,471.27h-73.64v103.09h103.09v-29.46h-73.65v-14.72h44.19v-14.72h-44.19v-14.73h73.65v-29.46h-29.46.01Z"/>
              <path className="cls-7" d="M471.27,73.64v-14.72h-103.09v29.45h44.18v73.64h14.73v-73.64h44.18v-14.72h0Z"/>
              <path className="cls-7" d="M412.36,471.27v44.19h29.45v-44.19h-29.45Z"/>
              <path className="cls-7" d="M382.91,515.46v29.45h29.45v-29.45h-29.45Z"/>
              <path className="cls-7" d="M368.18,559.64v14.72h14.73v-29.46h-14.73v14.73h0Z"/>
              <path className="cls-7" d="M368.18,515.46h-29.46v29.45h29.46v-29.45Z"/>
              <path className="cls-7" d="M338.72,486v-14.73h-29.45v44.19h29.45v-29.46h0Z"/>
              <path className="cls-7" d="M324,117.82h14.72v44.18h14.72v-73.64h-14.72v14.73h-44.18v-14.73h-14.72v73.64h14.72v-44.18h29.46Z"/>
              <path className="cls-7" d="M324,88.36h14.72v-29.45h-44.18v29.45h29.46Z"/>
              <path className="cls-7" d="M250.36,471.27h-44.18v29.46h29.46v44.18h-29.46v29.46h73.64v-29.46h-14.73v-44.18h14.73v-29.46h-29.46Z"/>
              <path className="cls-7" d="M235.64,162h14.72v-29.45h-14.72v29.45Z"/>
              <path className="cls-7" d="M250.36,73.64v-14.72h-14.72v29.45h14.72v-14.72h0Z"/>
              <rect className="cls-7" x="220.91" y="117.82" width="14.73" height="14.73"/>
              <rect className="cls-7" x="220.91" y="88.36" width="14.73" height="14.73"/>
              <path className="cls-7" d="M220.91,117.82v-14.72h-29.45v-44.18h-14.73v103.08h14.73v-44.18h29.45Z"/>
              <path className="cls-7" d="M162.01,486v29.46h-58.91v-44.19h-29.46v103.09h29.46v-29.46h58.91v29.46h14.72v-103.09h-14.72v14.73Z"/>
              <rect className="cls-7" x="132.55" y="117.82" width="14.72" height="14.73"/>
              <path className="cls-7" d="M117.83,103.09h-29.46v14.72h44.18v-14.72h-14.72Z"/>
              <path className="cls-7" d="M117.83,88.36h29.45v-29.45h-58.9v29.45h29.46,0Z"/>
              <path className="cls-7" d="M103.09,162h29.46v-29.45h-58.91v29.45h29.46,0Z"/>
              <rect className="cls-7" x="73.64" y="88.36" width="14.73" height="14.73"/>
            </g>
            <path className="cls-9" d="M618.54,14.72H14.73v618.55h618.53V14.72h-14.72ZM618.54,44.18v574.36H29.46V29.46h589.09v14.72h-.01Z"/>
            <g>
              <path className="cls-5" d="M633.27,0H0v648h648V0h-14.73ZM633.27,29.46v603.82H14.73V14.72h618.53v14.73h.01Z"/>
              <path className="cls-5" d="M589.09,29.46H29.46v589.09h589.09V29.46h-29.46ZM191.46,73.64v29.46h29.45v-14.73h14.73v-29.45h14.72v29.45h-14.72v14.73h-14.73v14.72h14.73v14.73h14.72v29.45h-14.72v-29.45h-14.73v-14.73h-29.45v44.18h-14.73V58.91h14.73v14.72h0ZM574.36,73.64v14.72h-58.91v14.73h44.18v14.72h-44.18v14.73h58.91v29.45h-88.37V58.91h88.37v14.72h0ZM574.36,191.45h-220.92v14.72h220.92v14.73h-206.18v14.72h206.18v14.73h-191.45v14.72h176.72v14.72h14.73v14.73h-29.46v-14.73h-161.99v14.73h88.36v14.72h103.09v14.73h-117.82v-14.73h-73.64v29.46h191.45v14.72h-191.45v14.73h103.08v14.71h88.37v14.74h-103.09v-14.74h-103.09v14.74h14.73v14.72h117.81v14.72h-132.54v-14.72h-14.73v29.45h220.92v14.73H117.83v-14.73h-14.73v-14.72h-14.72v-29.45h-14.73v-162.01h14.73v-29.46h14.72v-14.72h14.73v-14.72h456.54v14.76ZM574.36,486v14.72h-73.65v14.73h44.19v14.72h-44.19v14.72h73.65v29.46h-103.09v-103.09h103.09v14.73h0ZM162.01,559.64v-14.73h-58.91v29.46h-29.46v-103.09h29.46v44.19h58.91v-44.19h14.72v103.09h-14.72v-14.72h0ZM206.18,559.64v-14.73h29.46v-44.18h-29.46v-29.46h73.64v29.46h-14.73v44.18h14.73v29.46h-73.64v-14.72h0ZM368.18,559.64v-14.73h-29.46v-29.45h-29.45v-44.19h29.45v44.19h29.46v29.45h14.73v-29.45h29.45v-44.19h29.45v44.19h-29.45v29.45h-29.45v29.46h-14.73v-14.72h0ZM471.27,73.64v14.72h-44.18v73.64h-14.73v-73.64h-44.18v-29.45h103.09v14.72h0ZM338.72,73.64v14.72h14.72v73.64h-14.72v-44.18h-44.18v44.18h-14.72v-73.64h14.72v-29.45h44.18v14.72h0ZM147.27,73.64v14.72h-58.9v14.73h44.18v14.72h14.72v14.73h-14.72v29.45h-58.91v-29.45h58.91v-14.73h-44.18v-14.72h-14.73v-14.73h14.73v-29.45h58.9v14.72h0Z"/>
              <polygon className="cls-5" points="309.28 88.36 294.54 88.36 294.54 103.09 309.28 103.09 324 103.09 338.72 103.09 338.72 88.36 324 88.36 309.28 88.36"/>
            </g>
          </svg>
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
            _active={{ bg: 'transparent' }}
            _focus={{ bg: 'transparent' }}
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
            _active={{ bg: 'transparent' }}
            _focus={{ bg: 'transparent' }}
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
            _active={{ bg: 'transparent' }}
            _focus={{ bg: 'transparent' }}
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
            _active={{ bg: 'transparent' }}
            _focus={{ bg: 'transparent' }}
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
          {user && (
            <>
              <Button
                onClick={() => handleNavigation("/@" + user + "/notifications")}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                pl={0}
                pr={4}
                py={3}
                mb={1}
                role="group"
                _hover={{}}
                _active={{ bg: 'transparent' }}
                _focus={{ bg: 'transparent' }}
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
                _active={{ bg: 'transparent' }}
                _focus={{ bg: 'transparent' }}
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
                onClick={() => handleNavigation("/@" + user + "/wallet")}
                variant="ghost"
                w="full"
                justifyContent="flex-start"
                pl={0}
                pr={4}
                py={3}
                mb={1}
                role="group"
                _hover={{}}
                _active={{ bg: 'transparent' }}
                _focus={{ bg: 'transparent' }}
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
            _active={{ bg: 'transparent' }}
            _focus={{ bg: 'transparent' }}
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
              _active={{ bg: 'transparent' }}
              _focus={{ bg: 'transparent' }}
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
          {!user && (
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
              _active={{ bg: 'transparent' }}
              _focus={{ bg: 'transparent' }}
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
          )}
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
