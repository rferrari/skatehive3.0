"use client";

import React from "react";
import { Box, HStack, Text, Spinner } from "@chakra-ui/react";

interface NoResultsProps {
  query: string;
  hasPages: boolean;
  hasSkaters: boolean;
}

export default function NoResults({
  query,
  hasPages,
  hasSkaters,
}: NoResultsProps) {
  if (hasPages || hasSkaters) return null;

  return (
    <Box p={4} textAlign="center">
      <Text color="primary" fontSize="md">
        No results found for &ldquo;{query}&rdquo;
      </Text>
      {!query.startsWith("/") && (
        <Text color="secondary" fontSize="sm" mt={1}>
          Try typing / to search pages
        </Text>
      )}
    </Box>
  );
}
