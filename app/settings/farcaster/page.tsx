"use client";
import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

/**
 * @deprecated Farcaster notification features have been removed
 * Farcaster login/auth is still available through the main connection modal
 */
export default function FarcasterAdminPage() {
  return (
    <Container minH="100vh" maxW="lg" bg="gray.900" color="white" py={8}>
      <Heading size="lg" mb={2}>
        🛹 Farcaster Settings
      </Heading>
      <Text color="primary" mb={8}>
        Farcaster integration for SkateHive
      </Text>

      <Alert status="info">
        <AlertIcon />
        <Box>
          <AlertTitle>Farcaster Notifications Removed</AlertTitle>
          <AlertDescription>
            Farcaster notification features have been removed from SkateHive.
            You can still connect your Farcaster account using the connection
            modal for authentication and wallet viewing.
          </AlertDescription>
        </Box>
      </Alert>
    </Container>
  );
}
