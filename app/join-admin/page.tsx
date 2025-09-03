"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { FaCheck, FaTimes, FaUserPlus } from "react-icons/fa";
import { useAioha } from "@aioha/react-ui";
import useHiveAccount from "@/hooks/useHiveAccount";
import { useKeychainSDK } from "@/hooks/useKeychainSDK";
import * as dhive from "@hiveio/dhive";

interface JoinRequest {
  id: number;
  email: string;
  username_1: string;
  username_2?: string;
  username_3?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

const randomLanguages = [
  { code: "EN", label: "English" },
  { code: "PT-BR", label: "Português (Brasil)" },
  { code: "ES", label: "Español" },
];

export default function JoinAdminPage() {
  const { user } = useAioha();
  const { hiveAccount, isLoading: isAccountLoading } = useHiveAccount(user || "");
  const { KeychainSDK, KeychainRequestTypes, KeychainKeyTypes, isLoaded } = useKeychainSDK();
  const toast = useToast();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [useAccountToken, setUseAccountToken] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/join-requests-memory?status=pending');
      const data = await response.json();
      console.log('Fetched requests:', data); // Debug log
      if (data.success) {
        setRequests(data.requests);
        console.log('Set requests:', data.requests); // Debug log
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (request: JoinRequest, action: 'approve' | 'reject') => {
    if (action === 'approve' && !selectedUsername) {
      toast({
        title: "Error",
        description: "Please select a username to approve",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (action === 'approve' && !user) {
      toast({
        title: "Error",
        description: "You must be logged in to approve requests",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setProcessing(request.id);

    try {
      const response = await fetch(`/api/join-requests-memory/${request.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          username: action === 'approve' ? selectedUsername : null,
          createdBy: user,
          useAccountToken,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh requests
        await fetchRequests();
        
        // Reset form
        setSelectedRequest(null);
        setSelectedUsername("");
      } else {
        toast({
          title: "Error",
          description: data.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  // Show loading state during hydration to prevent mismatch
  if (!isClient) {
    return (
      <Flex align="center" justify="center" h="100vh" direction="column">
        <Spinner size="lg" />
        <Text mt={4}>Loading...</Text>
      </Flex>
    );
  }

  if (!user) {
    return (
      <Flex align="center" justify="center" h="100vh" direction="column">
        <Heading color="red.400" mb={4}>
          You need to be logged in to access this page!
        </Heading>
        <Text color="gray.400">Please log in and try again.</Text>
      </Flex>
    );
  }

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <Heading size="lg" mb={6}>
        Join Requests Admin
      </Heading>

      {/* ACT Balance Display */}
      {isAccountLoading ? (
        <Flex align="center" mb={4}>
          <Spinner size="sm" mr={2} /> Loading ACT balance...
        </Flex>
      ) : (
        <Box mb={6}>
          <Text fontWeight="bold" color="primary">
            Account Creation Tokens (ACT): {hiveAccount?.pending_claimed_accounts ?? 0}
          </Text>
          {Number(hiveAccount?.pending_claimed_accounts ?? 0) === 0 && (
            <Text color="error" fontSize="sm">
              You have no ACTs. You must pay 3 HIVE to create accounts.
            </Text>
          )}
        </Box>
      )}

      {loading ? (
        <Flex align="center" justify="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <VStack spacing={6} align="stretch">
          {requests.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>No pending requests!</AlertTitle>
              <AlertDescription>All join requests have been processed.</AlertDescription>
            </Alert>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Email</Th>
                    <Th>Username</Th>
                    <Th>Submitted</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {requests.map((request) => (
                    <Tr key={request.id}>
                      <Td>{request.email}</Td>
                      <Td>
                        <Text fontWeight="bold">@{request.username_1}</Text>
                      </Td>
                      <Td>{formatDate(request.created_at)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="red"
                            leftIcon={<FaTimes />}
                            onClick={() => handleProcessRequest(request, 'reject')}
                            isLoading={processing === request.id}
                            isDisabled={processing !== null}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<FaUserPlus />}
                            onClick={() => setSelectedRequest(request)}
                            isLoading={processing === request.id}
                            isDisabled={processing !== null}
                          >
                            Approve
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </VStack>
      )}

      {/* Approval Modal */}
      {selectedRequest && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box
            bg="background"
            p={6}
            borderRadius="lg"
            maxW="500px"
            w="90%"
            maxH="90vh"
            overflow="auto"
          >
            <Heading size="md" mb={4}>
              Approve Join Request
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold">Email:</Text>
                <Text>{selectedRequest.email}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold">Username:</Text>
                <Text>@{selectedRequest.username_1}</Text>
              </Box>

              <FormControl>
                <FormLabel>Username to Create:</FormLabel>
                <Text fontWeight="bold" color="primary">@{selectedRequest.username_1}</Text>
                <Input
                  value={selectedRequest.username_1}
                  isReadOnly
                  bg="muted"
                  color="text"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Account Creation Method:</FormLabel>
                <Switch
                  isChecked={useAccountToken}
                  onChange={() => setUseAccountToken(!useAccountToken)}
                />
                <Text fontSize="sm" color="accent" mt={1}>
                  {useAccountToken ? "Using Account Creation Token" : "Paying 3 HIVE"}
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Email Language:</FormLabel>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {randomLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <HStack spacing={3}>
                <Button
                  colorScheme="green"
                  onClick={() => handleProcessRequest(selectedRequest, 'approve')}
                  isLoading={processing === selectedRequest.id}
                  isDisabled={!selectedUsername}
                  flex={1}
                >
                  Create Account & Send Invite
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  flex={1}
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
