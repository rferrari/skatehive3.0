"use client";

import { useState } from "react";
import { Box, Text, Button, Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";
import BountyComposer from "./BountyComposer";
import BountyList from "./BountyList";
import { Discussion } from "@hiveio/dhive";
import Image from "next/image";

export default function BountiesClient() {
  const [newBounty, setNewBounty] = useState<Partial<Discussion> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <Box maxW="900px" mx="auto" py={8} px={4} className="hide-scrollbar" style={{ overflowY: 'auto', height: '100vh' }}>
      <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr auto" }} alignItems="center" mb={4}>
        <Box>
          <Box display="flex" alignItems="center" mb={1}>
            <Image src="/images/ripper.png" alt="Ripper" height={96} width={96} style={{ marginRight: 12 }} />
            <Text
              fontSize={{ base: "4xl", md: "7xl" }}
              fontWeight="extrabold"
              color="primary"
              letterSpacing="wider"
              textAlign="left"
              mb={0}
              style={{ textTransform: "uppercase" }}
            >
              Bounties
            </Text>
          </Box>
          <Text
            color="primary"
            fontSize={{ base: "md", md: "lg" }}
            textAlign="left"
            mb={0}
          >
            Create a bounty or die trying to complete one
          </Text>
        </Box>
        <Box display="flex" justifyContent="flex-end" alignItems="flex-start" mt={{ base: 4, md: 0 }}>
          <Button
            colorScheme="primary"
            size="lg"
            onClick={() => setIsModalOpen(true)}
            fontWeight="bold"
            px={8}
            py={6}
            borderRadius="xl"
            boxShadow="md"
          >
            Create a Bounty
          </Button>
        </Box>
      </Box>
      <BountyList newBounty={newBounty as any} refreshTrigger={refreshTrigger} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="background" color="text" p={0} borderRadius="xl">
          <BountyComposer
            onNewBounty={(bounty) => {
              setNewBounty(bounty);
              setIsModalOpen(false);
              setRefreshTrigger((prev) => prev + 1);
            }}
            onClose={() => setIsModalOpen(false)}
          />
        </ModalContent>
      </Modal>
    </Box>
  );
} 