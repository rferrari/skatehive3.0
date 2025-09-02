"use client";

import dynamic from "next/dynamic";
import { Spinner, Box, Text } from "@chakra-ui/react";

// Dynamically import the ZoraCoinPreview to prevent SSR issues
const ZoraCoinPreview = dynamic(() => import("./ZoraCoinPreview"), {
  ssr: false,
  loading: () => (
    <Box
      border="1px"
      borderColor="gray.600"
      borderRadius="md"
      p={3}
      my={4}
      minH="100px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="sm" color="gray.400">
        Loading coin preview...
      </Text>
    </Box>
  ),
});

interface ZoraCoinPreviewLazyProps {
  address: string;
}

export default function ZoraCoinPreviewLazy({
  address,
}: ZoraCoinPreviewLazyProps) {
  return <ZoraCoinPreview address={address} />;
}
