"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Button,
  Icon,
  Image,
  Spinner,
  Flex,
  Text,
  useColorMode,
  transition,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { AiohaModal, useAioha } from "@aioha/react-ui";
import {
  FiHome,
  FiBell,
  FiUser,
  FiShoppingCart,
  FiBook,
  FiMap,
} from "react-icons/fi";
import { FaPiggyBank } from "react-icons/fa";
import { Notifications } from "@hiveio/dhive";
import {
  fetchNewNotifications,
  getCommunityInfo,
  getProfile,
} from "@/lib/hive/client-functions";
import { animate, motion } from "framer-motion";
import { FaGear } from "react-icons/fa6";
import { FaMailBulk } from "react-icons/fa";
import { KeyTypes } from "@aioha/aioha";
import "@aioha/react-ui/dist/build.css";

interface ProfileInfo {
  metadata: {
    profile: {
      profile_image: string; // Profile-specific image
    };
  };
}

interface CommunityInfo {
  title: string;
  about: string;
  // No avatar_url since it's not used
}

const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG;

export default function Sidebar({ newNotificationCount = 0 }) {
  const { user } = useAioha();
  const router = useRouter();
  // const [notifications, setNotifications] = useState<Notifications[]>([]);
  // const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
  // const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null); // State to hold profile info
  // const [loading, setLoading] = useState(true); // Loading state
  const { colorMode } = useColorMode();
  const [modalDisplayed, setModalDisplayed] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);

  // useEffect(() => {
  //     const loadNotifications = async () => {
  //         if (user) {
  //             try {
  //                 const newNotifications = await fetchNewNotifications(user);
  //                 setNotifications(newNotifications);
  //             } catch (error) {
  //                 console.error("Failed to fetch notifications:", error);
  //             }
  //         }
  //     };

  //     loadNotifications();
  // }, [user]);

  // useEffect(() => {
  //     const fetchData = async () => {
  //         setLoading(true);
  //         if (communityTag) {
  //             try {
  //                 // Fetching community data
  //                 const communityData = await getCommunityInfo(communityTag);
  //                 sessionStorage.setItem('communityData', JSON.stringify(communityData));
  //                 setCommunityInfo(communityData);

  //                 // Fetching profile data
  //                 const profileData = await getProfile(communityTag);
  //                 sessionStorage.setItem('profileData', JSON.stringify(profileData));
  //                 setProfileInfo(profileData);
  //             } catch (error) {
  //                 console.error('Failed to fetch data', error);
  //             } finally {
  //                 setLoading(false);
  //             }
  //         }
  //     };

  //     fetchData();
  // }, [communityTag]);

  useEffect(() => {
    setBellAnimating(newNotificationCount > 0);
  }, [newNotificationCount]);

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
      </Flex>
    </Box>
  );
}
