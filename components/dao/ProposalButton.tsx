"use client";

import { Button } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";

export const ProposalButton = () => {
  return (
    <Button
      mt={8}
      size="lg"
      bg="primary"
      color="background"
      fontWeight="bold"
      fontSize="lg"
      px={12}
      py={6}
      borderRadius="xl"
      border="2px solid"
      borderColor="primary"
      boxShadow="0 8px 32px rgba(255, 165, 0, 0.3)"
      _hover={{
        bg: "transparent",
        color: "primary",
        borderColor: "primary",
        boxShadow: "0 12px 48px rgba(255, 165, 0, 0.5)",
        transform: "translateY(-2px)",
      }}
      _active={{
        transform: "translateY(0px)",
        boxShadow: "0 4px 16px rgba(255, 165, 0, 0.4)",
      }}
      transition="all 0.3s ease"
      as="a"
      href="https://snapshot.box/#/s:skatehive.eth"
      target="_blank"
      rel="noopener noreferrer"
      leftIcon={<ExternalLinkIcon />}
    >
      Create DAO Proposal
    </Button>
  );
};
