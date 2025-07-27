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
} from "@chakra-ui/react";

interface MergeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
}

const MergeAccountModal: React.FC<MergeAccountModalProps> = ({
  isOpen,
  onClose,
  onMerge,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Merge Account Data</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
          We found existing profile data on Hive. Would you like to merge it with
          your connected account?
        </Text>
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

export default MergeAccountModal;
