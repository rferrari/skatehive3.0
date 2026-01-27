"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  Button,
  HStack,
  Spinner,
  Image,
  useToast,
} from "@chakra-ui/react";
import { useSignIn, useProfile } from "@farcaster/auth-kit";
import { useEffect, useState } from "react";
import { SiFarcaster } from "react-icons/si";
import { FiExternalLink } from "react-icons/fi";

interface FarcasterLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FarcasterLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: FarcasterLoginModalProps) {
  const toast = useToast();
  const {
    signIn,
    url,
    data,
    isError,
    error,
    isSuccess,
  } = useSignIn();
  
  const { isAuthenticated } = useProfile();
  const [hasStarted, setHasStarted] = useState(false);

  // Start sign-in when modal opens
  useEffect(() => {
    if (isOpen && !hasStarted && !isAuthenticated) {
      signIn();
      setHasStarted(true);
    }
  }, [isOpen, hasStarted, isAuthenticated, signIn]);

  // Handle successful auth
  useEffect(() => {
    if (isSuccess && data) {
      toast({
        status: "success",
        title: "Connected to Farcaster!",
        description: `Welcome, @${data.username}!`,
        duration: 3000,
      });
      onSuccess?.();
      handleClose();
    }
  }, [isSuccess, data]);

  // Handle errors
  useEffect(() => {
    if (isError && error) {
      console.error("Farcaster Sign In Error:", error);
      toast({
        status: "error",
        title: "Authentication failed",
        description: error.message || "Failed to authenticate with Farcaster",
        duration: 5000,
      });
    }
  }, [isError, error]);

  const handleClose = () => {
    setHasStarted(false);
    onClose();
  };

  const openInApp = () => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="background"
        border="2px solid"
        borderColor="primary"
        borderRadius={0}
        boxShadow="0 0 20px rgba(0, 255, 0, 0.2)"
        fontFamily="mono"
        position="relative"
        overflow="hidden"
      >
        {/* Noise overlay */}
        <Box
          position="absolute"
          inset={0}
          opacity={0.03}
          pointerEvents="none"
          bgImage="url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')"
        />

        <ModalHeader
          borderBottom="1px solid"
          borderColor="primary"
          py={3}
          px={4}
          fontSize="sm"
          textTransform="lowercase"
          letterSpacing="wide"
          color="primary"
        >
          <HStack spacing={2}>
            <SiFarcaster />
            <Text>farcaster connect</Text>
          </HStack>
        </ModalHeader>
        
        <ModalCloseButton
          color="primary"
          _hover={{ bg: "whiteAlpha.100" }}
          borderRadius={0}
        />

        <ModalBody p={6} position="relative">
          <VStack spacing={6} align="center">
            {url ? (
              <>
                {/* QR Code */}
                <Box
                  p={3}
                  bg="white"
                  borderRadius="sm"
                  border="2px solid"
                  borderColor="primary"
                >
                  <Image
                    src={url}
                    alt="Farcaster QR Code"
                    width="200px"
                    height="200px"
                  />
                </Box>

                {/* Instructions */}
                <VStack spacing={2} align="center">
                  <Text
                    fontFamily="mono"
                    fontSize="sm"
                    color="text"
                    textAlign="center"
                  >
                    scan with warpcast app
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color="dim"
                    textAlign="center"
                  >
                    waiting for confirmation...
                  </Text>
                </VStack>

                {/* Open in App Button */}
                <Button
                  onClick={openInApp}
                  size="sm"
                  variant="outline"
                  borderColor="primary"
                  color="primary"
                  borderRadius={0}
                  fontFamily="mono"
                  fontSize="xs"
                  textTransform="lowercase"
                  rightIcon={<FiExternalLink />}
                  _hover={{
                    bg: "whiteAlpha.100",
                    transform: "translateY(-1px)",
                  }}
                  transition="all 0.2s"
                >
                  open in warpcast
                </Button>
              </>
            ) : (
              <VStack spacing={3}>
                <Spinner color="primary" size="lg" thickness="2px" />
                <Text fontFamily="mono" fontSize="sm" color="dim">
                  generating qr code...
                </Text>
              </VStack>
            )}

            {/* Help Link */}
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="dim"
              textAlign="center"
              mt={2}
            >
              need help?{" "}
              <Box
                as="a"
                href="https://www.farcaster.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
                textDecoration="underline"
                _hover={{ color: "secondary" }}
              >
                learn about farcaster
              </Box>
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
