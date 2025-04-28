import { useAioha, AiohaModal } from "@aioha/react-ui";
import {
  Box,
  Button,
  HStack,
  Icon,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FiBell, FiBook, FiCreditCard, FiHome, FiUser } from "react-icons/fi";
import { useState } from "react";
import { KeyTypes } from "@aioha/aioha";

export default function FooterNavigation() {
  const { user } = useAioha();
  const router = useRouter();
  const [modalDisplayed, setModalDisplayed] = useState(false);

  const handleNavigation = (path: string) => {
    if (router) {
      router.push(path);
    }
  };

  return (
    <>
      <Box
        as="nav"
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="black" // Terminal-like background
        p={2}
        borderTop="1px solid"
        borderColor="primary" // Terminal green border
        display={{ base: "flex", md: "none" }}
        justifyContent="space-around"
        zIndex="999"
        height="60px"
      >
        {user ? (
          <HStack justify="space-around" width="100%">
            <Tooltip label="Home" aria-label="Home tooltip">
              <Button
                onClick={() => handleNavigation("/")}
                variant="ghost"
                leftIcon={<Icon as={FiHome} boxSize={4} />}
                color="primary" // Terminal green text
                _hover={{ bg: "gray.800" }} // Hover effect
              />
            </Tooltip>
            <Tooltip label="Wallet" aria-label="Wallet tooltip">
              <Button
                onClick={() => handleNavigation("/@" + user + "/wallet")}
                variant="ghost"
                leftIcon={<Icon as={FiCreditCard} boxSize={5} />}
                color="primary"
                _hover={{ bg: "gray.800" }}
              />
            </Tooltip>
            <Tooltip label="Magazine" aria-label="Blog tooltip">
              <Button
                onClick={() => handleNavigation("/blog")}
                variant="ghost"
                leftIcon={<Icon as={FiBook} boxSize={4} />}
                color="primary"
                _hover={{ bg: "gray.800" }}
              />
            </Tooltip>
            <Tooltip label="Notifications" aria-label="Notifications tooltip">
              <Button
                onClick={() => handleNavigation("/@" + user + "/notifications")}
                variant="ghost"
                leftIcon={<Icon as={FiBell} boxSize={4} />}
                color="primary"
                _hover={{ bg: "gray.800" }}
              />
            </Tooltip>
            <Tooltip label="Profile" aria-label="Profile tooltip">
              <span style={{ display: "inline-block" }}>
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    leftIcon={<Icon as={FiUser} boxSize={5} />}
                    color="primary"
                    bg="transparent"
                    _hover={{ bg: "gray.800" }}
                    _active={{ bg: "gray.700" }}
                  />
                  <MenuList
                    bg="black" // Consistent terminal-like background
                    borderColor="green.500" // Terminal green border
                    borderRadius="md"
                    boxShadow="lg"
                  >
                    <MenuItem
                      onClick={() => handleNavigation("/@" + user)}
                      icon={<Icon as={FiUser} boxSize={4} />}
                      color="primary" // Terminal green text
                      bg="black" // Consistent background
                      _hover={{ bg: "gray.800", color: "green.300" }} // Hover effect
                    >
                      Go to Profile
                    </MenuItem>
                    <MenuItem
                      onClick={() => setModalDisplayed(true)}
                      icon={<Icon as={FiUser} boxSize={4} />}
                      color="primary"
                      bg="black" // Consistent background
                      _hover={{ bg: "gray.800", color: "green.300" }} // Hover effect
                    >
                      Log out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </span>
            </Tooltip>
          </HStack>
        ) : (
          <HStack justify="space-around" width="100%">
            <Tooltip label="Home" aria-label="Home tooltip">
              <Button
                onClick={() => handleNavigation("/")}
                variant="ghost"
                leftIcon={<Icon as={FiHome} boxSize={4} />}
                color="primary"
                _hover={{ bg: "gray.800" }}
              />
            </Tooltip>
            <Button
              onClick={() => setModalDisplayed(true)}
              variant="solid"
              size="lg"
              colorScheme="green"
              bg="green.500"
              _hover={{ bg: "primary" }}
            >
              Login
            </Button>
          </HStack>
        )}
      </Box>
      <Box height="60px" /> {/* Add padding to prevent overlap */}
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
    </>
  );
}
