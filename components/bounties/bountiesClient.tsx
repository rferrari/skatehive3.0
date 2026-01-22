"use client";

import { useState } from "react";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import BountyComposer from "./BountyComposer";
import BountyList from "./BountyList";
import { Discussion } from "@hiveio/dhive";
import Image from "next/image";
import useIsMobile from "@/hooks/useIsMobile";

export default function BountiesClient() {
  const [newBounty, setNewBounty] = useState<Partial<Discussion> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Box
      maxW="900px"
      mx="auto"
      py={{ base: 4, md: 8 }}
      px={{ base: 2, md: 4 }}
      className="hide-scrollbar"
      style={{ overflowY: "auto", height: "100vh" }}
    >
      <Box
        display={{ base: "block", md: "flex" }}
        alignItems="center"
        mb={4}
        gap={{ base: 4, md: 8 }}
        justifyContent={{ base: "flex-start", md: "space-between" }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={{ base: 1, md: 4 }}
          flex="1"
          mb={{ base: 4, md: 0 }}
        >
          <Image
            src="/images/ripper.png"
            alt="Ripper"
            height={120}
            width={120}
            style={{ height: "auto", width: "auto" }}
            className="ripper-logo"
          />
          <Text
            className="spoghettiwestern-title"
            fontWeight="extrabold"
            color="primary"
            letterSpacing="wider"
            textAlign="left"
            mb={0}
            style={{
              textTransform: "uppercase",
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              marginLeft: "2rem",
            }}
          >
            Bounties
          </Text>
        </Box>
        <Box
          flex={{ base: "unset", md: "0 0 auto" }}
          display="flex"
          justifyContent={{ base: "flex-start", md: "flex-end" }}
          width={{ base: "100%", md: "auto" }}
        >
          <Button
            size="lg"
            onClick={() => setIsModalOpen(true)}
            fontWeight="bold"
            px={{ base: 4, md: 8 }}
            py={{ base: 4, md: 6 }}
            boxShadow="md"
            ml={{ base: 0, md: 8 }}
            width={{ base: "100%", md: "auto" }}
            mt={{ base: 2, md: 0 }}
            bg="primary"
            color="background"
            _hover={{
              bg: "accent",
              color: "primary",
            }}
          >
            Create a Bounty
          </Button>
        </Box>
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
                <Box
                  as="span"
                  flex="1"
                  textAlign="left"
                  color="accent"
                  fontSize="md"
                >
                  READ THIS and follow these simple rules before submitting or
                  issuing a bounty:
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={2} color="text" fontSize="sm">
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li>
                    Anyone can post a bounty or claim one. Got crypto? Submit.
                    Got tricks? Send it.
                  </li>
                  <li>
                    All clips must be original and filmed for the bounty.{" "}
                    <b>NO RECYCLED CLIPS!</b> Cheaters get roasted by the
                    community.
                  </li>
                  <li>
                    Bounty creators gotta send the prize. If you don&apos;t, the
                    community will clown your ass hard.
                  </li>
                  <li>
                    Bounties are for fun, hype, and getting rewarded. Skatehive
                    is not liable for injuries, broken boards, or copyright
                    violations.
                  </li>
                </ul>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
      </Box>
      <BountyList
        newBounty={newBounty as any}
        refreshTrigger={refreshTrigger}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={isMobile ? "full" : "2xl"}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          bg="background"
          color="text"
          p={0}
          borderRadius={isMobile ? "0" : "xl"}
          h={isMobile ? "100vh" : "auto"}
          display="flex"
          flexDirection="column"
        >
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
