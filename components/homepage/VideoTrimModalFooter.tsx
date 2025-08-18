import React from "react";
import { ModalFooter, VStack, HStack, Button, Box, Text } from "@chakra-ui/react";
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
            leftIcon={
              isProcessing ? (
                <Box
                  width="12px"
                  height="12px"
                  borderRadius="50%"
                  bg="red.500"
                  animation="pulse 1.5s infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                      '50%': {
                        transform: 'scale(1.2)',
                        opacity: 0.7,
                      },
                      '100%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                    },
                  }}
                />
              ) : (
                <FaArrowRight />
              )
            }
            onClick={hasActiveTrim ? onTrim : onBypass}
            isLoading={false}
            isDisabled={!canBypass && !isValidSelection}
            variant={"outline"}
            size={{ base: "md", md: "lg" }}
            width={{ base: "100%", md: "auto" }}
            minW={{ base: "auto", md: "160px" }}
            bg={canBypass || isValidSelection ? "background" : "gray.600"}
            color="primary"
            _disabled={{
              bg: "muted",
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
            {isProcessing ? "Trimming Video" : "Next"}
          </Button>
        </VStack>
      </VStack>
    </ModalFooter>
  );
};

export default VideoTrimModalFooter;
