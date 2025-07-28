import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  HStack,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { FaHive, FaEthereum, FaArrowLeft } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";

export type MergeType = "ethereum" | "farcaster";

interface MergeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  mergeType?: MergeType;
}

const MergeAccountModal: React.FC<MergeAccountModalProps> = ({
  isOpen,
  onClose,
  onMerge,
  mergeType = "ethereum",
}) => {
  const getMergeContent = () => {
    switch (mergeType) {
      case "ethereum":
        return {
          title: "Merge Ethereum Wallet",
          icons: (
            <HStack spacing={2} alignItems="center">
              <Icon as={FaHive} boxSize={6} color="red.500" />
              <Icon as={FaArrowLeft} boxSize={4} color="gray.500" />
              <Icon as={FaEthereum} boxSize={6} color="blue.500" />
            </HStack>
          ),
          text: "Connect your Ethereum wallet to your Hive account to enable cross-platform features and wallet functionality.",
        };
      case "farcaster":
        return {
          title: "Merge Farcaster Profile",
          icons: (
            <HStack spacing={2} alignItems="center">
              <Icon as={FaHive} boxSize={6} color="red.500" />
              <Icon as={FaArrowLeft} boxSize={4} color="gray.500" />
              <Icon as={SiFarcaster} boxSize={6} color="purple.500" />
            </HStack>
          ),
          text: "Merge your Farcaster profile data with your Hive account to sync your social presence across platforms.",
        };
      default:
        return {
          title: "Merge Account Data",
          icons: null,
          text: "We found existing profile data on Hive. Would you like to merge it with your connected account?",
        };
    }
  };

  const content = getMergeContent();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(8px)" />
      <ModalContent
        bg={"background"}
        border={"1px dashed"}
        borderColor="primary"
      >
        <ModalHeader>{content.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="center">
            {content.icons}
            <Text textAlign="center">{content.text}</Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="green" onClick={onMerge}>
            Merge
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MergeAccountModal;
