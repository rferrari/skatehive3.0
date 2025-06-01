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
} from "@chakra-ui/react";
import { useConnect, useAccount } from "wagmi";
import { useEffect } from "react";

export default function ConnectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { connect, connectors, status } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
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
          <Button onClick={onClose} colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
