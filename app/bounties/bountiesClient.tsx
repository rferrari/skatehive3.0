"use client";

import { useState } from "react";
import { Box, Text, Button, Modal, ModalOverlay, ModalContent, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";
import BountyComposer from "./BountyComposer";
import BountyList from "./BountyList";
import { Discussion } from "@hiveio/dhive";
import Image from "next/image";

export default function BountiesClient() {
  const [newBounty, setNewBounty] = useState<Partial<Discussion> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showRules, setShowRules] = useState(false);

  return (
    <Box maxW="900px" mx="auto" py={8} px={4} className="hide-scrollbar" style={{ overflowY: 'auto', height: '100vh' }}>
      <Box display="flex" alignItems="center" mb={4} gap={4}>
        <Box display="flex" alignItems="center" gap={4} flex="1">
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
        <Button
          colorScheme="primary"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          fontWeight="bold"
          px={8}
          py={6}
          borderRadius="xl"
          boxShadow="md"
          ml={4}
        >
          Create a Bounty
        </Button>
      </Box>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Text
            color="primary"
            fontSize={{ base: "md", md: "lg" }}
            textAlign="left"
            mb={0}
          >
            Create a bounty or die trying to complete one
          </Text>
          <Button
            size="sm"
            colorScheme="primary"
            variant="outline"
            onClick={() => setShowRules((prev) => !prev)}
            ml={2}
          >
            Rules
          </Button>
        </Box>
        {showRules && (
          <Accordion allowToggle defaultIndex={[0]} mt={2}>
            <AccordionItem border="none">
              <AccordionButton px={0} _hover={{ bg: "muted" }}>
                <Box as="span" flex="1" textAlign="left" color="accent" fontSize="md">
                  READ THIS and follow these simple rules before submitting or issuing a bounty:
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={2} color="text" fontSize="sm">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li>Anyone can post a bounty or claim one. Got crypto? Submit. Got tricks? Send it.</li>
                  <li>All clips must be original and filmed for the bounty. <b>NO RECYCLED CLIPS!</b> Cheaters get roasted by the community.</li>
                  <li>Bounty creators gotta send the prize. If you don't, the community will clown your ass hard.</li>
                  <li>Bounties are for fun, hype, and getting rewarded. Skatehive is not liable for injuries, broken boards, or copyright violations.</li>
                </ul>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
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