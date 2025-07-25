import { Box, Text, VStack, Icon, Divider } from "@chakra-ui/react";
import { FiUser } from "react-icons/fi";
import { FaHive } from "react-icons/fa";
import ConnectButton from "./ConnectButton";

interface ConnectWalletsProps {
  onConnectHive: () => void;
}

export default function ConnectWallets({ onConnectHive }: ConnectWalletsProps) {
  return (
    <Box
      p={6}
      bg="background"
      borderRadius="xl"
      border="2px solid"
      borderColor="primary"
      textAlign="center"
    >
      <Icon as={FiUser} boxSize={12} color="primary" mb={4} />
      <Text fontSize="xl" fontWeight="bold" color="primary" mb={2}>
        Connect Wallets
      </Text>
      <Text fontSize="sm" color="text" mb={6} opacity={0.8}>
        Connect your wallets to access your digital assets, unlock trading
        features, and join the SkateHive ecosystem.
      </Text>
      <Divider mb={6} borderColor="primary" opacity={0.3} />

      <VStack spacing={4} w="full">
        {/* Hive Wallet Connection */}
        <Box
          as="button"
          onClick={onConnectHive}
          w="full"
          maxW="320px"
          bg="muted"
          border="2px solid"
          borderColor="primary"
          borderRadius="xl"
          p={4}
          minH="80px"
          transition="all 0.3s ease"
          _hover={{
            borderColor: "accent",
            bg: "background",
            transform: "translateY(-2px)",
          }}
          cursor="pointer"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            display="flex"
            alignItems="center"
            gap={4}
            w="full"
            justifyContent="center"
          >
            <Icon as={FaHive} boxSize={6} color="primary" />
            <Box display="flex" flexDirection="column" alignItems="start">
              <Text fontSize="sm" fontWeight="semibold" color="primary">
                Connect Hive Wallet
              </Text>
              <Text fontSize="xs" color="primary" fontWeight="medium">
                🚀 Access HIVE & HBD
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Ethereum Wallet Connection */}
        <Box w="full" maxW="320px">
          <ConnectButton />
        </Box>
      </VStack>
    </Box>
  );
}
