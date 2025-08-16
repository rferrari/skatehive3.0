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
import { FaCut, FaVideo, FaArrowRight } from "react-icons/fa";

interface VideoTrimModalFooterProps {
  isValidSelection: boolean;
  maxDuration: number;
  canBypass: boolean;
  isProcessing: boolean;
  hasActiveTrim: boolean; // New prop to detect if user has actively trimmed
  onClose: () => void;
  onBypass: () => void;
  onTrim: () => void;
}

const VideoTrimModalFooter: React.FC<VideoTrimModalFooterProps> = ({
  isValidSelection,
  maxDuration,
  canBypass,
  isProcessing,
  hasActiveTrim,
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
          {/* Smart Primary Button - Changes based on user action */}
          {canBypass ? (
            hasActiveTrim ? (
              <>
                {/* Secondary: Use Original Button when user has trimmed */}
                <Button
                  leftIcon={<FaVideo />}
                  onClick={onBypass}
                  size={{ base: "md", md: "lg" }}
                  width={{ base: "100%", md: "auto" }}
                  minW={{ base: "auto", md: "140px" }}
                  variant="outline"
                  borderColor="blue.500"
                  color="blue.500"
                  _hover={{
                    bg: "blue.50",
                    borderColor: "blue.600",
                    color: "blue.600",
                  }}
                  _active={{
                    bg: "blue.100",
                  }}
                  transition="all 0.2s ease"
                  fontWeight="medium"
                >
                  Use Original
                </Button>

                {/* Primary: Trim & Use button */}
                <Button
                  leftIcon={isProcessing ? undefined : <FaCut />}
                  onClick={onTrim}
                  isLoading={isProcessing}
                  loadingText="Processing..."
                  size={{ base: "md", md: "lg" }}
                  width={{ base: "100%", md: "auto" }}
                  minW={{ base: "auto", md: "160px" }}
                  bg="green.600"
                  color="white"
                  _hover={{
                    bg: "green.500",
                    transform: { base: "none", md: "translateY(-1px)" },
                  }}
                  _active={{
                    bg: "green.700",
                    transform: "translateY(0)",
                  }}
                  transition="all 0.2s ease"
                  boxShadow="md"
                  fontWeight="semibold"
                >
                  {isProcessing ? "Processing" : "Trim & Use"}
                </Button>
              </>
            ) : (
              // User hasn't trimmed - show Next button (use original)
              <Button
                leftIcon={<FaArrowRight />}
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
                fontWeight="semibold"
              >
                Next
              </Button>
            )
          ) : (
            // User must trim - show Trim & Use button
            <Button
              leftIcon={isProcessing ? undefined : <FaCut />}
              onClick={onTrim}
              isLoading={isProcessing}
              loadingText="Processing..."
              isDisabled={!isValidSelection}
              size={{ base: "md", md: "lg" }}
              width={{ base: "100%", md: "auto" }}
              minW={{ base: "auto", md: "160px" }}
              bg={isValidSelection ? "green.600" : "gray.600"}
              color="white"
              _hover={{
                bg: isValidSelection ? "green.500" : "gray.600",
                transform: {
                  base: "none",
                  md: isValidSelection ? "translateY(-1px)" : "none",
                },
              }}
              _active={{
                bg: isValidSelection ? "green.700" : "gray.600",
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
              boxShadow={isValidSelection ? "md" : "none"}
              fontWeight="semibold"
            >
              {isProcessing ? "Processing" : "Trim & Use"}
            </Button>
          )}
        </VStack>
      </VStack>
    </ModalFooter>
  );
};

export default VideoTrimModalFooter;
