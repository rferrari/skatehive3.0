"use client";

import dynamic from "next/dynamic";
import { Spinner, VStack, Text } from "@chakra-ui/react";

// Dynamically import the trading modal to prevent SSR issues
const ZoraTradingModal = dynamic(() => import("./ZoraTradingModal"), {
  ssr: false,
  loading: () => (
    <VStack spacing={4} align="center" py={8}>
      <Spinner size="lg" />
      <Text>Loading trading interface...</Text>
    </VStack>
  ),
});

export default ZoraTradingModal;
