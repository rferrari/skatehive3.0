"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Box,
  Container,
  Button,
  Center,
  HStack,
  Text,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { Name, Avatar, Identity } from "@coinbase/onchainkit/identity";
import { CustomConnectButton } from "../shared/CustomConnectButton";
import { useRouter } from "next/navigation";

export default function AuctionMobileNavbar() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const router = useRouter();

  // Only render on mobile
  if (!isMobile) return null;

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <Box
      position="sticky"
      top={0}
      bg="background"
      borderBottom="1px solid"
      borderColor="primary"
      zIndex={1000}
      py={3}
      backdropFilter="blur(15px)"
    >
      <Container maxW="7xl" px={{ base: 4, md: 6 }}>
        <HStack justify="space-between" align="center" w="full">
          {/* Back Button */}
          <IconButton
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            onClick={handleGoBack}
            variant="ghost"
            color="primary"
            size="md"
            _hover={{
              bg: "rgba(124, 255, 0, 0.1)",
              transform: "scale(1.05)"
            }}
            _active={{
              transform: "scale(0.95)"
            }}
            transition="all 0.2s ease"
          />

          {/* Connect Button */}
          <CustomConnectButton />
        </HStack>
      </Container>
    </Box>
  );
}
