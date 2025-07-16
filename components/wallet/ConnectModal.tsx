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
  Image,
  HStack,
  Text,
  Spinner,
  Divider,
  Box,
  useToast,
} from "@chakra-ui/react";
import { useConnect, useAccount } from "wagmi";
import { useEffect } from "react";
import FarcasterSignIn from '@/components/farcaster/FarcasterSignIn';

export default function ConnectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { connect, connectors, status } = useConnect();
  const { isConnected } = useAccount();
  const toast = useToast();

  useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  const handleFarcasterSuccess = (profile: {
    fid: number;
    username: string;
    displayName?: string;
    pfpUrl?: string;
    bio?: string;
    custody?: `0x${string}`;
    verifications?: string[];
  }) => {
    const walletInfo = profile.custody ? ` (Wallet: ${profile.custody.slice(0, 6)}...${profile.custody.slice(-4)})` : '';
    toast({
      status: "success",
      title: "Connected to Farcaster!",
      description: `Welcome @${profile.username}! Your Farcaster account is now connected.${walletInfo}`,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={"background"} color="text">
        <ModalHeader>Connect Wallet & Social</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Ethereum Wallets Section */}
            <Box>
              <Text fontSize="sm" color="primary" mb={3} fontWeight="bold">
                💰 Ethereum Wallets
              </Text>
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
            </Box>

            <Divider />

            {/* Farcaster Section */}
            <Box>
              <Text fontSize="sm" color="primary" mb={3} fontWeight="bold">
                🛹 Social Connection
              </Text>
              <FarcasterSignIn
                onSuccess={handleFarcasterSuccess}
                variant="button"
                size="md"
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
