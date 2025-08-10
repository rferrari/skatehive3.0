import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  Icon,
  Box,
  useDisclosure,
} from "@chakra-ui/react";
import { FaSkating, FaSkull } from "react-icons/fa";
import { useTheme } from "@/app/themeProvider";

interface SkateErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType?: "malicious-content" | "general-error";
  errorMessage?: string;
}

export const SkateErrorModal: React.FC<SkateErrorModalProps> = ({
  isOpen,
  onClose,
  errorType = "malicious-content",
  errorMessage = "",
}) => {
  const { theme } = useTheme();

  const getErrorContent = () => {
    switch (errorType) {
      case "malicious-content":
        return {
          title: "🛹 Nice Try! 🛹",
          message:
            "This post tried to be nasty, but SkateHive devs were gnarlier and blocked it! Your safety is our priority while we keep the stoke alive.",
          emoji: "🔒",
          buttonText: "Keep Skating Safely",
        };
      default:
        return {
          title: "🛹 Something Went Sideways 🛹",
          message:
            "Looks like we hit a gnarly obstacle. Don't worry, we're working on landing this trick properly!",
          emoji: "⚠️",
          buttonText: "Try Another Line",
        };
    }
  };

  const content = getErrorContent();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent
        bg={theme.colors.background}
        border={`2px solid ${theme.colors.primary}`}
        borderRadius="16px"
        boxShadow={`0 0 20px ${theme.colors.primary}40`}
        maxW="md"
        mx={4}
      >
        <ModalHeader
          color={theme.colors.primary}
          textAlign="center"
          fontFamily="'Joystix', 'VT323', 'Fira Mono', monospace"
          fontSize="lg"
          letterSpacing="0.5px"
          pb={2}
        >
          {content.title}
        </ModalHeader>
        <ModalCloseButton color={theme.colors.text} />

        <ModalBody>
          <VStack spacing={4} align="center">
            <Icon
              as={FaSkull}
              boxSize={8}
              color={theme.colors.accent}
              animation="spin 3s linear infinite"
            />
            <Text
              color={theme.colors.text}
              textAlign="center"
              fontSize="md"
              lineHeight="1.6"
              fontFamily="'Inter', sans-serif"
            >
              {content.message}
            </Text>
            {errorMessage && (
              <Box
                bg={theme.colors.muted}
                p={3}
                borderRadius="8px"
                width="100%"
                border={`1px solid ${theme.colors.border}`}
              >
                <Text
                  fontSize="xs"
                  color={theme.colors.accent}
                  fontFamily="'Fira Mono', monospace"
                  wordBreak="break-word"
                >
                  Technical details: {errorMessage}
                </Text>
              </Box>
            )}
            <Text
              fontSize="xs"
              color={"secondary"}
              fontFamily="'Fira Mono', monospace"
              textAlign="center"
            >
              Shout out to{" "}
              <Box
                as="a"
                href="/user/louis88"
                color={"accent"}
                textDecoration="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Louis88
              </Box>{" "}
              for testing and reporting this vulnerability!
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter justifyContent="center">
          <Button
            onClick={onClose}
            bg={theme.colors.primary}
            color={theme.colors.background}
            _hover={{
              bg: theme.colors.accent,
              transform: "translateY(-2px)",
              boxShadow: `0 4px 12px ${theme.colors.primary}40`,
            }}
            _active={{
              transform: "translateY(0)",
            }}
            fontFamily="'Joystix', 'VT323', 'Fira Mono', monospace"
            letterSpacing="0.5px"
            fontSize="sm"
            borderRadius="8px"
            px={6}
            transition="all 0.2s ease"
          >
            {content.buttonText}
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Add some CSS animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Modal>
  );
};

// Hook for easy error handling
export const useSkateErrorHandler = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [errorDetails, setErrorDetails] = React.useState<{
    type: "malicious-content" | "general-error";
    message: string;
  }>({
    type: "general-error",
    message: "",
  });

  const showError = (
    type: "malicious-content" | "general-error" = "general-error",
    message: string = ""
  ) => {
    setErrorDetails({ type, message });
    onOpen();
  };

  const showMaliciousContentError = (details?: string) => {
    showError("malicious-content", details || "");
  };

  return {
    isErrorOpen: isOpen,
    closeError: onClose,
    showError,
    showMaliciousContentError,
    errorType: errorDetails.type,
    errorMessage: errorDetails.message,
  };
};

export default SkateErrorModal;
