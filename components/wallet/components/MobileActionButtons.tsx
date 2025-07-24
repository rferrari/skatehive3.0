import {
  HStack,
  Button,
  VStack,
  Text,
  Box,
  useDisclosure,
} from "@chakra-ui/react";
import { FaPaperPlane, FaDownload, FaExchangeAlt } from "react-icons/fa";
import { useState } from "react";
import TokenSearchModal from "./TokenSearchModal";
import ReceiveModal from "./ReceiveModal";
import { TokenDetail } from "../../../types/portfolio";

interface HiveToken {
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  logo: string;
  network: "hive";
  type: "liquid" | "savings" | "power";
}

interface MobileActionButtonsProps {
  onSend: (token: TokenDetail | HiveToken) => void;
  onSwap: (token: TokenDetail | HiveToken) => void;
}

export default function MobileActionButtons({
  onSend,
  onSwap,
}: MobileActionButtonsProps) {
  const {
    isOpen: isSendModalOpen,
    onOpen: openSendModal,
    onClose: closeSendModal,
  } = useDisclosure();
  const {
    isOpen: isReceiveModalOpen,
    onOpen: openReceiveModal,
    onClose: closeReceiveModal,
  } = useDisclosure();
  const {
    isOpen: isSwapModalOpen,
    onOpen: openSwapModal,
    onClose: closeSwapModal,
  } = useDisclosure();

  const handleSendTokenSelect = (token: TokenDetail | HiveToken) => {
    onSend(token);
    closeSendModal();
  };

  const handleSwapTokenSelect = (token: TokenDetail | HiveToken) => {
    onSwap(token);
    closeSwapModal();
  };

  return (
    <>
      <HStack spacing={4} justify="center" py={4}>
        <VStack spacing={2}>
          <Box
            as="button"
            onClick={openReceiveModal}
            w="56px"
            h="56px"
            bg="rgba(255, 255, 255, 0.1)"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{
              bg: "rgba(255, 255, 255, 0.15)",
              transform: "scale(1.05)",
            }}
            transition="all 0.2s ease"
          >
            <FaDownload size="20px" color="white" />
          </Box>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500">
            Receive
          </Text>
        </VStack>

        <VStack spacing={2}>
          <Box
            as="button"
            onClick={openSendModal}
            w="56px"
            h="56px"
            bg="primary"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{
              bg: "rgba(96, 165, 250, 0.9)",
              transform: "scale(1.05)",
            }}
            transition="all 0.2s ease"
          >
            <FaPaperPlane size="20px" color="background" />
          </Box>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500">
            Send
          </Text>
        </VStack>

        <VStack spacing={2}>
          <Box
            as="button"
            onClick={openSwapModal}
            w="56px"
            h="56px"
            bg="rgba(255, 255, 255, 0.1)"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{
              bg: "rgba(255, 255, 255, 0.15)",
              transform: "scale(1.05)",
            }}
            transition="all 0.2s ease"
          >
            <FaExchangeAlt size="20px" color="white" />
          </Box>
          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500">
            Swap
          </Text>
        </VStack>
      </HStack>

      {/* Token Search Modals */}
      <TokenSearchModal
        isOpen={isSendModalOpen}
        onClose={closeSendModal}
        onTokenSelect={handleSendTokenSelect}
        title="Send Token"
      />

      <ReceiveModal isOpen={isReceiveModalOpen} onClose={closeReceiveModal} />

      <TokenSearchModal
        isOpen={isSwapModalOpen}
        onClose={closeSwapModal}
        onTokenSelect={handleSwapTokenSelect}
        title="Swap Token"
      />
    </>
  );
}
