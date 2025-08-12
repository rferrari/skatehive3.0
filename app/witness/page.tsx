"use client";

import { KeychainSDK } from "keychain-sdk";
import { useState, useEffect } from "react";
import { useAioha } from "@aioha/react-ui";
import {
  Box,
  Button,
  Heading,
  Image,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";

interface WitnessVote {
  username: string;
  witness: string;
  vote: boolean;
}

export async function witnessVoteWithKeychain(
  username: string,
  witness: string
) {
  const keychain = new KeychainSDK(window);
  try {
    const formParamsAsObject = {
      data: {
        username: username,
        witness: "skatehive",
        vote: true,
      },
    };
    const witnessvote = await keychain.witnessVote(
      formParamsAsObject.data as WitnessVote
    );
    console.log({ witnessvote });
    return witnessvote;
  } catch (error) {
    console.log({ error });
    throw error;
  }
}

export default function WitnessPage() {
  const { user } = useAioha();
  const [isVoting, setIsVoting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVote = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote for the witness",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVoting(true);
    try {
      await witnessVoteWithKeychain(user, "skatehive");
      toast({
        title: "Success!",
        description: "Successfully voted for skatehive witness!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      padding={6}
    >
      <VStack spacing={6} textAlign="center">
        <Image
          src="/SKATE_HIVE_VECTOR_FIN.svg"
          alt="SkateHive Logo"
          boxSize="150px"
          objectFit="contain"
        />

        {!isMounted ? (
          // Show loading state during hydration
          <VStack spacing={4}>
            <Text fontSize="lg">Loading...</Text>
            <Button size="lg" isLoading colorScheme="gray">
              Loading
            </Button>
          </VStack>
        ) : user ? (
          <VStack spacing={4}>
            <Button
              size="lg"
              colorScheme="green"
              onClick={handleVote}
              isLoading={isVoting}
              loadingText="Voting..."
              shadow="lg"
              _hover={{ shadow: "xl" }}
            >
              Vote for SkateHive Witness
            </Button>
            <Text fontSize="lg">
              Logged in as:{" "}
              <Text as="span" fontWeight="semibold" color="blue.500">
                @{user}
              </Text>
            </Text>
          </VStack>
        ) : (
          <VStack spacing={4}>
            <Text fontSize="lg" color="red.500">
              Please log in to vote for the witness
            </Text>
            <Button size="lg" isDisabled colorScheme="gray">
              Login Required
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
