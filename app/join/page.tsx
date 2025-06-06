"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";
import {
  validateAccountName,
  checkAccountExists,
} from "@/lib/invite/helpers";

export default function JoinPage() {
  const [desiredUsername, setDesiredUsername] = useState("");
  const [desiredEmail, setDesiredEmail] = useState("");
  const [accountAvailable, setAccountAvailable] = useState<boolean | null>(null);
  const [accountInvalid, setAccountInvalid] = useState<string | null>(null);
  const [isCheckedOnce, setIsCheckedOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    setError("");
    setIsCheckedOnce(false);
    setAccountAvailable(null);
    setAccountInvalid(null);

    if (!desiredEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!desiredUsername) {
      setError("Please enter a username.");
      return;
    }
    const isValidAccountName = validateAccountName(desiredUsername);
    if (isValidAccountName !== null) {
      setAccountInvalid(String(isValidAccountName));
      setIsCheckedOnce(true);
      setAccountAvailable(false);
      return;
    }
    setAccountInvalid("");
    setLoading(true);
    const isAvailable = await checkAccountExists(desiredUsername);
    setIsCheckedOnce(true);
    setAccountAvailable(isAvailable);
    setLoading(false);
    if (!isAvailable) {
      setError("Account is not available. Please choose another username.");
    }
  };

  return (
    <Box p={8} maxW="container.sm" mx="auto">
      <Heading size="lg" mb={4} textAlign="center">
        Join Skatehive
      </Heading>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <Text fontWeight="bold">Choose your Hive Username</Text>
          <Input
            type="text"
            placeholder="Desired Hive Username"
            value={desiredUsername}
            onChange={(e) => setDesiredUsername(e.target.value)}
            maxW="375px"
            bg="black"
            color="white"
            mb={2}
          />
        </FormControl>
        <FormControl>
          <Text fontWeight="bold">Your Email Address</Text>
          <Input
            type="email"
            placeholder="Email Address"
            value={desiredEmail}
            onChange={(e) => setDesiredEmail(e.target.value)}
            maxW="375px"
            bg="black"
            color="white"
            mb={2}
          />
        </FormControl>
        <Button
          colorScheme="yellow"
          onClick={handleCheck}
          isLoading={loading}
          isDisabled={!desiredUsername || !desiredEmail}
        >
          Check if @{desiredUsername || "..."} is available!
        </Button>
        {isCheckedOnce && (
          <Flex
            border="2px solid yellow"
            borderRadius="5px"
            bg="black"
            p="10px"
            align="center"
            mb={2}
          >
            {accountAvailable ? (
              <Icon as={FaCheck} color="green" />
            ) : (
              <Icon as={FaTimes} color="red" />
            )}
            <Text color={accountAvailable ? "yellow" : "white"} ml={2}>
              {accountAvailable
                ? "Username is available!"
                : "Please choose another username! " + String(accountInvalid).replace(/'/g, "&apos;")}
            </Text>
          </Flex>
        )}
        {accountAvailable && isCheckedOnce && (
          <Button colorScheme="green" w="full" mt={2}>
            Submit
          </Button>
        )}
        {error && (
          <Text color="red.300" fontSize="sm" textAlign="center">
            {error}
          </Text>
        )}
      </VStack>
    </Box>
  );
} 