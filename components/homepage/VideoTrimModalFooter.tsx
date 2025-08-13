import React from "react";
import {
  ModalFooter,
  VStack,
  HStack,
  Button,
  Box,
  Text,
} from "@chakra-ui/react";
import { FaCut } from "react-icons/fa";

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
      pt={0}
      pb={{ base: 4, md: 6 }}
      px={{ base: 4, md: 6 }}
      bg="transparent"
      borderTop="none"
    >
      <VStack spacing={0} width="100%" minH="80px">
        {/* Action Buttons - Fixed position */}
        <HStack
          spacing={{ base: 2, md: 3 }}
          width="100%"
          flexDirection={{ base: "column", md: "row" }}
          align="stretch"
        >
          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onClose}
            size="lg"
            height="44px"
            flex={{ base: 1, md: "0 0 auto" }}
            minW={{ base: "auto", md: "100px" }}
            borderColor="gray.600"
            color="gray.300"
            bg="transparent"
            _hover={{
              borderColor: "gray.500",
              bg: "gray.700",
              color: "white",
            }}
            _active={{
              bg: "gray.600",
            }}
            fontSize="sm"
            fontWeight="medium"
          >
            CANCEL
          </Button>

          {/* Use Original Video Button (for >100 HP users) */}
          {canBypass && (
            <Button
              colorScheme="green"
              variant="solid"
              onClick={onBypass}
              size="lg"
              height="44px"
              flex={{ base: 1, md: "0 0 auto" }}
              minW={{ base: "auto", md: "160px" }}
              bg="green.600"
              _hover={{
                bg: "green.500",
              }}
              _active={{
                bg: "green.700",
              }}
              fontSize="sm"
              fontWeight="semibold"
              transition="all 0.2s ease"
            >
              📹 Use Original Video
            </Button>
          )}

          {/* Primary Trim Button */}
          <Button
            onClick={onTrim}
            isLoading={isProcessing}
            loadingText="Trimming..."
            isDisabled={!canBypass && !isValidSelection}
            leftIcon={<FaCut />}
            size="lg"
            height="2em"
            flex={{ base: 1, md: 1 }}
            bg={canBypass || isValidSelection ? "#D4ED18" : "gray.600"}
            color={canBypass || isValidSelection ? "black" : "gray.400"}
            _hover={{
              bg: canBypass || isValidSelection ? "#E5F821" : "gray.600",
            }}
            _active={{
              bg: canBypass || isValidSelection ? "#C3DC16" : "gray.600",
            }}
            _disabled={{
              bg: "gray.600",
              color: "gray.400",
              cursor: "not-allowed",
              opacity: 0.8,
              _hover: {
                bg: "gray.600",
              },
            }}
            fontSize="sm"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            transition="all 0.2s ease"
            border="none"
            _focus={{
              boxShadow:
                canBypass || isValidSelection
                  ? "0 0 0 3px rgba(212, 237, 24, 0.3)"
                  : "none",
            }}
          >
            ✂️ {canBypass ? "TRIM & USE" : "TRIM & USE VIDEO"}
          </Button>
        </HStack>
      </VStack>
    </ModalFooter>
  );
};

export default VideoTrimModalFooter;
