import React from "react";
import { ModalFooter, VStack, HStack, Button } from "@chakra-ui/react";
import { FaArrowRight } from "react-icons/fa";

interface VideoTrimModalFooterProps {
  isValidSelection: boolean;
  maxDuration: number;
  canBypass: boolean;
  isProcessing: boolean;
  hasActiveTrim: boolean; // New prop to detect if user has actively trimmed

  onBypass: () => void;
  onTrim: () => void;
}

const VideoTrimModalFooter: React.FC<VideoTrimModalFooterProps> = ({
  isValidSelection,
  maxDuration,
  canBypass,
  isProcessing,
  hasActiveTrim,

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
        {/* Action Buttons */}
        <VStack
          spacing={{ base: 2, md: 3 }}
          width="100%"
          direction={{ base: "column", md: "row" }}
          as={HStack}
        >
          {/* Single Next Button - Always enabled for bypass users, conditional for non-bypass */}
          <Button
            leftIcon={isProcessing ? undefined : <FaArrowRight />}
            onClick={hasActiveTrim ? onTrim : onBypass}
            isLoading={isProcessing}
            loadingText="Processing..."
            isDisabled={!canBypass && !isValidSelection}
            size={{ base: "md", md: "lg" }}
            width={{ base: "100%", md: "auto" }}
            minW={{ base: "auto", md: "160px" }}
            bg={canBypass || isValidSelection ? "blue.600" : "gray.600"}
            color="white"
            _hover={{
              bg: canBypass || isValidSelection ? "blue.500" : "gray.600",
              transform: {
                base: "none",
                md: canBypass || isValidSelection ? "translateY(-1px)" : "none",
              },
            }}
            _active={{
              bg: canBypass || isValidSelection ? "blue.700" : "gray.600",
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
            {isProcessing ? "Processing" : "Next"}
          </Button>
        </VStack>
      </VStack>
    </ModalFooter>
  );
};

export default VideoTrimModalFooter;
