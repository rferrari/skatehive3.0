"use client";

import React from "react";
import { Box, HStack, Text, Spinner } from "@chakra-ui/react";

interface LoadingStateProps {
  isLoading: boolean;
}

export default function LoadingState({ isLoading }: LoadingStateProps) {
  if (!isLoading) return null;

  return (
    <Box p={4} textAlign="center">
      <HStack justify="center" spacing={3}>
        <Spinner size="sm" color="secondary" />
        <Text color="primary" fontSize="sm">
          Searching skaters...
        </Text>
      </HStack>
    </Box>
  );
}
