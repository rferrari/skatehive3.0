import { HStack, Button, VStack, Text, Box } from "@chakra-ui/react";
import { FaPaperPlane, FaDownload, FaExchangeAlt } from "react-icons/fa";

interface MobileActionButtonsProps {
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
}

export default function MobileActionButtons({
  onSend,
  onReceive,
  onSwap,
}: MobileActionButtonsProps) {
  return (
    <HStack spacing={4} justify="center" py={4}>
      <VStack spacing={2}>
        <Box
          as="button"
          onClick={onReceive}
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
          onClick={onSend}
          w="56px"
          h="56px"
          bg="rgba(96, 165, 250, 0.8)"
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
          <FaPaperPlane size="20px" color="white" />
        </Box>
        <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500">
          Send
        </Text>
      </VStack>

      <VStack spacing={2}>
        <Box
          as="button"
          onClick={onSwap}
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

      <VStack spacing={2}>
        <Box
          as="button"
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
          <Text fontSize="xs" color="white" fontWeight="bold">
            ⏰
          </Text>
        </Box>
        <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500">
          Activity
        </Text>
      </VStack>
    </HStack>
  );
}
