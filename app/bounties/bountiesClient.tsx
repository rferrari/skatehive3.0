"use client";

import { useState } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import BountyComposer from "./BountyComposer";
import BountyList from "./BountyList";
import { Discussion } from "@hiveio/dhive";

export default function BountiesClient() {
  const [newBounty, setNewBounty] = useState<Partial<Discussion> | null>(null);

  return (
    <Box maxW="900px" mx="auto" py={8} px={4}>
      <Heading as="h1" fontSize="4xl" fontWeight="bold" mb={4} textAlign="center">
        Skatehive Bounties
      </Heading>
      <Text fontSize="lg" color="text" mb={8} textAlign="center">
        Create a trick bounty or complete one by posting your video submission!
      </Text>
      <BountyComposer onNewBounty={setNewBounty} />
      <BountyList newBounty={newBounty as any} />
    </Box>
  );
} 