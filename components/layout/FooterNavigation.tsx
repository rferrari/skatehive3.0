import { Box, HStack, Button, Icon, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { FiHome, FiBook, FiAward, FiMap, FiTarget, FiBell, FiUser, FiSettings, FiX } from "react-icons/fi";
import { FaPiggyBank } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";

export default function FooterNavigation() {
  const router = useRouter();
  const { user } = useAioha();

  // Placeholder logout function
  const handleLogout = () => {
    // TODO: Replace with actual logout logic
    alert("Logged out!");
  };

  return (
    <Box
      as="nav"
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="black"
      p={2}
      borderTop="1px solid"
      borderColor="primary"
      display={{ base: "flex", md: "none" }}
      justifyContent="center"
      zIndex="999"
      height="60px"
    >
      <HStack justify="center" spacing={0}>
        <Button variant="ghost" p={0} onClick={() => router.push("/")}><Icon as={FiHome} boxSize={6} /></Button>
        <Button variant="ghost" p={0} onClick={() => router.push("/blog") }><Icon as={FiBook} boxSize={6} /></Button>
        <Button variant="ghost" p={0} onClick={() => router.push("/leaderboard") }><Icon as={FiAward} boxSize={6} /></Button>
        <Button variant="ghost" p={0} onClick={() => router.push("/skatespots") }><Icon as={FiMap} boxSize={6} /></Button>
        <Button variant="ghost" p={0} onClick={() => router.push("/bounties") }><Icon as={FiTarget} boxSize={6} /></Button>
        <Button variant="ghost" p={0} onClick={() => router.push("/notifications") }><Icon as={FiBell} boxSize={6} /></Button>
        <Button variant="ghost" p={0} onClick={() => router.push("/wallet") }><Icon as={FaPiggyBank} boxSize={6} /></Button>
        <Menu>
          <MenuButton as={Button} variant="ghost" p={0}>
            <Icon as={FiUser} boxSize={6} />
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiUser />} onClick={() => router.push(`/user/${user}?view=grid`)}>
              Go to Profile
            </MenuItem>
            <MenuItem icon={<FiSettings />} onClick={() => router.push("/settings")}>Settings</MenuItem>
            <MenuItem icon={<FiX />} onClick={handleLogout}>Log out</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
}
