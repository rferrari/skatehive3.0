import React from "react";
import {
  ModalFooter,
  VStack,
  HStack,
  Button,
  Box,
  Text,
  Divider,
} from "@chakra-ui/react";
import { FaCut, FaVideo, FaTimes } from "react-icons/fa";

interface VideoTrimModalFooterProps {
  isValidSelection: boolean;
  maxDuration: number;
  canBypass: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onBypass: () => void;
  onTrim: () => void;
}

const VideoTrimModalFooter: React.FC<VideoTrimModalFooterProps> = ({
  isValidSelection,
  maxDuration,
  canBypass,
  isProcessing,
  onClose,
  onBypass,
  onTrim,
}) => {
  return (
    <ModalFooter
      bg="rgba(0, 0, 0, 0.02)"
      borderTop="1px solid"
      borderTopColor="whiteAlpha.200"
      p={{ base: 3, md: 6 }}
    >
      <VStack spacing={{ base: 2, md: 4 }} width="100%">
        {/* Status Text - Only show on desktop or when there's an issue */}
        {!canBypass && !isValidSelection && (
          <Box textAlign="center" display={{ base: "none", md: "block" }}>
            <Text fontSize="sm" color="gray.400" fontWeight="medium">
              <Text as="span" color="orange.400">
                ⚠
              </Text>{" "}
              Please select up to {maxDuration} seconds
            </Text>
          </Box>
        )}

        {/* Action Buttons */}
        <VStack
          spacing={{ base: 2, md: 3 }}
          width="100%"
          direction={{ base: "column", md: "row" }}
          as={HStack}
        >
          {/* Cancel Button - Hidden on mobile when bypass is available */}
          <Button
            leftIcon={<FaTimes />}
            variant="ghost"
            onClick={onClose}
            size={{ base: "md", md: "lg" }}
            width={{ base: canBypass ? "auto" : "100%", md: "auto" }}
            minW={{ base: "auto", md: "120px" }}
            display={{ base: canBypass ? "none" : "flex", md: "flex" }}
            color="gray.400"
            _hover={{
              color: "white",
              bg: "whiteAlpha.100",
            }}
            _active={{
              bg: "whiteAlpha.200",
            }}
          >
            Cancel
          </Button>

          {/* Use Original Video Button (for >100 HP users) */}
          {canBypass && (
            <Button
              leftIcon={<FaVideo />}
              variant="solid"
              onClick={onBypass}
              size={{ base: "md", md: "lg" }}
              width={{ base: "100%", md: "auto" }}
              minW={{ base: "auto", md: "160px" }}
              bg="blue.600"
              color="white"
              _hover={{
                bg: "blue.500",
                transform: { base: "none", md: "translateY(-1px)" },
              }}
              _active={{
                bg: "blue.700",
                transform: "translateY(0)",
              }}
              transition="all 0.2s ease"
              boxShadow="md"
            >
              Use Original
            </Button>
          )}

          {/* Primary Trim Button */}
          <Button
            leftIcon={isProcessing ? undefined : <FaCut />}
            onClick={onTrim}
            isLoading={isProcessing}
            loadingText="Processing..."
            isDisabled={!canBypass && !isValidSelection}
            size={{ base: "md", md: "lg" }}
            width={{ base: "100%", md: "auto" }}
            minW={{ base: "auto", md: "160px" }}
            bg={canBypass || isValidSelection ? "green.600" : "gray.600"}
            color="white"
            _hover={{
              bg: canBypass || isValidSelection ? "green.500" : "gray.600",
              transform: {
                base: "none",
                md: canBypass || isValidSelection ? "translateY(-1px)" : "none",
              },
            }}
            _active={{
              bg: canBypass || isValidSelection ? "green.700" : "gray.600",
              transform: "translateY(0)",
            }}
            _disabled={{
              bg: "gray.600",
              color: "gray.400",
              cursor: "not-allowed",
              opacity: 0.6,
              _hover: {
                bg: "gray.600",
                transform: "none",
              },
            }}
            transition="all 0.2s ease"
            boxShadow={canBypass || isValidSelection ? "md" : "none"}
            fontWeight="semibold"
          >
            {isProcessing ? "Processing" : "Trim & Use"}
          </Button>
        </VStack>
      </VStack>
    </ModalFooter>
  );
};

export default VideoTrimModalFooter;
