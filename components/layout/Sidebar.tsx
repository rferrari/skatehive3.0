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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  HStack,
  Text,
  Spinner,
  ModalFooter,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { AiohaModal, useAioha } from "@aioha/react-ui";
import { FiHome, FiBell, FiUser, FiBook, FiMap } from "react-icons/fi";
import { FaPiggyBank } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaGear } from "react-icons/fa6";
import { FaMailBulk } from "react-icons/fa";
import { KeyTypes } from "@aioha/aioha";
import "@aioha/react-ui/dist/build.css";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG;

export default function Sidebar({ newNotificationCount = 0 }) {
  const { user } = useAioha();
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const { connect, connectors, status } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, connector: activeConnector } = useAccount();
  const {
    isOpen: isConnectModalOpen,
    onOpen: openConnectModal,
    onClose: closeConnectModal,
  } = useDisclosure();

  useEffect(() => {
    setBellAnimating(newNotificationCount > 0);
  }, [newNotificationCount]);

  // Debug: log connectors to console
  useEffect(() => {
    console.log("Wagmi connectors:", connectors);
  }, [connectors]);

  const handleNavigation = (path: string) => {
    try {
      console.log("Navigating to:", path);
      router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
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
        // boxShadow: '1px 0 3px rgba(0, 0, 0, 0.1)', // Reduced shadow
        // backdropFilter: 'blur(5px)', // Added blur
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
          >
            Home
          </Button>
          <Button
            onClick={() => handleNavigation("/blog")}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<Icon as={FiBook} boxSize={4} />}
            px={1}
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
                      <Icon as={FiBell} boxSize={4} color="primary" />
                    </Box>
                  ) : (
                    <Icon as={FiBell} boxSize={4} color="primary" />
                  )
                }
                px={1}
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
            onLogin={console.log}
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
        <div>
          {isConnected ? (
            <Button onClick={() => disconnect()} w="full" mb={4}>
              Disconnect ({activeConnector?.name})
            </Button>
          ) : (
            <>
              <Button onClick={openConnectModal} w="full" mb={4}>
                Connect Ethereum Wallet
              </Button>
              <Modal
                isOpen={isConnectModalOpen}
                onClose={closeConnectModal}
                isCentered
              >
                <ModalOverlay />
                <ModalContent bg={"background"} color="text">
                  <ModalHeader>Select Wallet</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <VStack spacing={3} align="stretch">
                      {connectors.map((connector) => (
                        <Button
                          key={connector.id}
                          onClick={() => connect({ connector })}
                          color={"primary"}
                          variant="outline"
                          leftIcon={
                            connector.icon ? (
                              <Image
                                src={connector.icon}
                                alt={connector.name}
                                boxSize={5}
                              />
                            ) : undefined
                          }
                          justifyContent="flex-start"
                        >
                          <HStack w="full" justify="space-between">
                            <Text>{connector.name}</Text>
                            {status === "pending" && <Spinner size="sm" />}
                          </HStack>
                        </Button>
                      ))}
                    </VStack>
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={closeConnectModal} colorScheme="blue">
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </>
          )}
        </div>
      </Flex>
    </Box>
  );
}
