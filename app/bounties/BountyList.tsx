import React, { useEffect, useState } from "react";
import { Box, SimpleGrid, Text, Spinner, Button, Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";
import { useComments } from "@/hooks/useComments";
import { Discussion } from "@hiveio/dhive";
import BountySnap from "./BountySnap";
import BountySubmission from "./BountySubmission";
import VoteListModal from "@/components/blog/VoteListModal";

interface BountyListProps {
  newBounty?: Discussion | null;
}

export default function BountyList({ newBounty }: BountyListProps) {
  const { comments, isLoading, error } = useComments(
    "skatehive",
    "skatehive-bounties",
    false
  );
  const [displayedBounties, setDisplayedBounties] = useState<Discussion[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [submission, setSubmission] = useState<Discussion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voteListModalOpen, setVoteListModalOpen] = useState(false);
  const [voteListBounty, setVoteListBounty] = useState<Discussion | null>(null);

  useEffect(() => {
    let bounties = [...comments];
    if (newBounty) {
      const exists = bounties.some((c) => c.permlink === newBounty.permlink);
      if (!exists) {
        bounties = [newBounty, ...bounties];
      }
    }
    bounties.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    setDisplayedBounties(bounties);
  }, [comments, newBounty]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleOpenSubmission = (bounty: Discussion) => {
    setSubmission(bounty);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmission(null);
  };

  const handleOpenVoteList = (bounty: Discussion) => {
    setVoteListBounty(bounty);
    setVoteListModalOpen(true);
  };

  const handleCloseVoteList = () => {
    setVoteListModalOpen(false);
    setVoteListBounty(null);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" my={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading bounties...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" my={8} color="red.500">
        <Text>Error loading bounties: {error}</Text>
      </Box>
    );
  }

  if (displayedBounties.length === 0) {
    return (
      <Box textAlign="center" my={8}>
        <Text>No bounties have been submitted yet.</Text>
      </Box>
    );
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} my={8}>
        {displayedBounties.slice(0, visibleCount).map((bounty) => (
          <BountySnap
            key={bounty.permlink}
            Discussion={bounty}
            onOpen={() => handleOpenSubmission(bounty)}
            setReply={() => {}}
            setConversation={handleOpenSubmission}
            onOpenVoteList={() => handleOpenVoteList(bounty)}
          />
        ))}
      </SimpleGrid>
      {visibleCount < displayedBounties.length && (
        <Box display="flex" justifyContent="center" my={4}>
          <Button onClick={handleLoadMore} colorScheme="primary" variant="outline">
            Load More
          </Button>
        </Box>
      )}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
        <ModalOverlay />
        <ModalContent bg="background" color="text">
          {submission && (
            <BountySubmission
              Discussion={submission}
              setSubmission={() => setIsModalOpen(false)}
              onOpen={() => {}}
              setReply={() => {}}
            />
          )}
        </ModalContent>
      </Modal>
      {voteListBounty && (
        <VoteListModal
          isOpen={voteListModalOpen}
          onClose={handleCloseVoteList}
          votes={voteListBounty.active_votes || []}
          post={voteListBounty}
        />
      )}
    </>
  );
} 