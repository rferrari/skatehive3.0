"use client";

import { useEffect } from "react";
import {
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
  Text,
} from "@chakra-ui/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error is already captured by the error boundary
  }, [error]);

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription>
            Failed to load coin data. This could be due to an invalid contract
            address or network issues.
          </AlertDescription>
        </Alert>

        <VStack spacing={4}>
          <Text color="gray.600" fontSize="sm">
            Error details: {error.message}
          </Text>

          <Button onClick={reset} colorScheme="blue">
            Try again
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}
