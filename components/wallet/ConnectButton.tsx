"use client";

import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Avatar, Name } from "@coinbase/onchainkit/identity";
import { Box, Text, Icon } from "@chakra-ui/react";
import { FaEthereum } from "react-icons/fa";
import { useAccount } from "wagmi";

export default function ConnectButton() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <></>;
  }

  return (
    <Wallet>
      <Box
        as={ConnectWallet}
        w="full"
        bg="muted"
        border="2px solid"
        borderColor="primary"
        borderRadius="xl"
        p={4}
        minH="80px"
        transition="all 0.3s ease"
        _hover={{
          borderColor: "accent",
          bg: "background",
          transform: "translateY(-2px)",
        }}
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          "& > div": {
            display: "none !important",
          },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={4}
          w="full"
          justifyContent="center"
          position="absolute"
          zIndex={10}
        >
          <Icon as={FaEthereum} boxSize={6} color="primary" />
          <Box display="flex" flexDirection="column" alignItems="start">
            <Text fontSize="sm" fontWeight="semibold" color="primary">
              Connect Ethereum
            </Text>
            <Text fontSize="xs" color="primary" fontWeight="medium">
              🛹 Join the session
            </Text>
          </Box>
        </Box>
      </Box>
    </Wallet>
  );
}
