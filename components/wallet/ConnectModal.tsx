import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  Button,
  Text,
  Divider,
  Box,
  useToast,
} from "@chakra-ui/react";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import {
  Avatar,
  Name,
  IdentityCard,
  Badge,
  Address,
  Socials,
  Identity,
} from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import FarcasterSignIn from "@/components/farcaster/FarcasterSignIn";

export default function ConnectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const { address, isConnected } = useAccount();

  const handleFarcasterSuccess = (profile: {
    fid: number;
    username: string;
    displayName?: string;
    pfpUrl?: string;
    bio?: string;
    custody?: `0x${string}`;
    verifications?: string[];
  }) => {
    const walletInfo = profile.custody
      ? ` (Wallet: ${profile.custody.slice(0, 6)}...${profile.custody.slice(
          -4
        )})`
      : "";
    toast({
      status: "success",
      title: "Connected to Farcaster!",
      description: `Welcome @${profile.username}! Your Farcaster account is now connected.${walletInfo}`,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
      <ModalContent
        bg="gray.900"
        color="white"
        borderRadius="20px"
        border="1px solid"
        borderColor="gray.700"
        shadow="2xl"
        mx={4}
      >
        <ModalHeader
          textAlign="center"
          fontSize="2xl"
          fontWeight="bold"
          color="green.300"
          pb={2}
        >
          🛹 Connect Wallet & Social
        </ModalHeader>
        <ModalCloseButton
          color="gray.400"
          _hover={{ color: "white", bg: "gray.700" }}
          borderRadius="full"
        />
        <ModalBody px={8} pb={8}>
          <VStack spacing={6} align="stretch">
            {/* Unified Wallet Section */}
            <Box
              p={5}
              bg="gray.800"
              borderRadius="16px"
              border="1px solid"
              borderColor="gray.600"
              _hover={{ borderColor: "green.400" }}
              transition="all 0.3s ease"
            >
              <Text
                fontSize="lg"
                color="green.300"
                mb={4}
                fontWeight="bold"
                display="flex"
                alignItems="center"
                gap={2}
              >
                💰 Wallet Connection
              </Text>
              <Wallet>
                <ConnectWallet
                  disconnectedLabel="Connect Wallet"
                  onConnect={onClose}
                >
                  <Avatar className="h-8 w-8" />
                  <Name />
                </ConnectWallet>
              </Wallet>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Farcaster Section */}
            <Box
              p={5}
              bg="gray.800"
              borderRadius="16px"
              border="1px solid"
              borderColor="gray.600"
              _hover={{ borderColor: "purple.400" }}
              transition="all 0.3s ease"
            >
              <Text
                fontSize="lg"
                color="purple.300"
                mb={4}
                fontWeight="bold"
                display="flex"
                alignItems="center"
                gap={2}
              >
                🛹 Social Connection
              </Text>
              <FarcasterSignIn
                onSuccess={handleFarcasterSuccess}
                variant="button"
                size="lg"
              />
            </Box>

            {/* Identity Card Section - Only show when wallet is connected */}
            {isConnected && address && (
              <Box
                p={5}
                bg="gray.800"
                borderRadius="16px"
                border="1px solid"
                borderColor="gray.600"
                _hover={{ borderColor: "blue.400" }}
                transition="all 0.3s ease"
              >
                <Text
                  fontSize="lg"
                  color="blue.300"
                  mb={4}
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  🔗 Identity
                </Text>
                <Identity address={address}>
                  <IdentityCard />
                  <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                    <Badge />
                    <Address />
                  </Box>
                  <Box mt={3}>
                    <Socials />
                  </Box>
                </Identity>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
