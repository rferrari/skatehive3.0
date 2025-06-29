'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Box, Text, Spinner, useToast } from '@chakra-ui/react';
import { useAioha } from '@aioha/react-ui';
import { getLastSnapsContainer, getPost } from '@/lib/hive/client-functions';
import { Discussion } from '@hiveio/dhive';

interface SnapContainer {
  author: string;
  permlink: string;
}

interface UpvoteSnapContainerProps {
  hideIfVoted?: boolean;
}

export default function UpvoteSnapContainer({ hideIfVoted = false }: UpvoteSnapContainerProps) {
  const { user, aioha } = useAioha();
  const [snapContainer, setSnapContainer] = useState<Discussion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const toast = useToast();

  const fetchSnapContainerData = useCallback(async () => {
    try {
      const containerInfo = await getLastSnapsContainer();
      if (containerInfo) {
        const postDetails = await getPost(containerInfo.author, containerInfo.permlink);
        setSnapContainer(postDetails);
        if (user && postDetails) {
          const userVote = postDetails.active_votes.some(v => v.voter === user);
          setHasVoted(userVote);
        } else {
          setHasVoted(false);
        }
      }
    } catch (error) {
      console.error("Failed to get snap container", error);
      toast({
        title: "Error",
        description: "Failed to load snap container information.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [user, toast]);

  useEffect(() => {
    setIsLoading(true);
    setHasVoted(false);

    const loadData = async () => {
      await fetchSnapContainerData();
      setIsLoading(false);
    };

    loadData();
  }, [user, fetchSnapContainerData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSnapContainerData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSnapContainerData]);

  if (!user) return null;

  const handleUpvote = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to vote.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!snapContainer) {
      toast({
        title: "Error",
        description: "Snap container not found.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsVoting(true);
    try {
      const response = await aioha.vote(
        snapContainer.author,
        snapContainer.permlink,
        10000 // 100% upvote
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Successfully upvoted the snap container!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setHasVoted(true); // Optimistically update the UI
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error("Failed to upvote, error object:", error);
      toast({
        title: "Upvote Failed",
        description: error.message || "An error occurred while trying to upvote.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Spinner />
        <Text>Loading Snap Container info...</Text>
      </Box>
    );
  }

  if (!snapContainer) {
    return <Text>Could not load Snap Container information.</Text>;
  }

  if (hideIfVoted && hasVoted) {
    return null;
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Text fontSize="lg" fontWeight="bold">Upvote Snap Container</Text>
      <Text mb={4}>Help the community by upvoting the main post where all snaps are stored.</Text>
      <Button
        onClick={handleUpvote}
        isLoading={isVoting}
        loadingText="Voting..."
        colorScheme={hasVoted ? "green" : "blue"}
        disabled={!user || isVoting || hasVoted}
      >
        {hasVoted ? "Already Voted" : "Upvote Container Post"}
      </Button>
      <Text fontSize="xs" mt={2}>
        Container: {snapContainer.author}/{snapContainer.permlink}
      </Text>
    </Box>
  );
} 