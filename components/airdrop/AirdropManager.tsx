import React, { useState } from "react";
import {
  VStack,
  HStack,
  Button,
  Select,
  Input,
  Textarea,
  Text,
  Box,
  Image,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useDisclosure,
  Icon,
  Avatar,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useAccount } from "wagmi";
import { useAioha } from "@aioha/react-ui";
import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import { Operation } from "@hiveio/dhive";
import { SkaterData, SortOption } from "@/types/airdrop";
import { tokenDictionary } from "@/lib/utils/tokenDictionary";
import { useAirdropManager } from "@/hooks/useAirdropManager";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { ERC20AirdropService } from "@/services/erc20Airdrop";
import TransactionStatusDisplay from "./TransactionStatusDisplay";

interface AirdropManagerProps {
  leaderboardData: SkaterData[];
}

const AirdropManager: React.FC<AirdropManagerProps> = ({ leaderboardData }) => {
  const [sortOption, setSortOption] = useState<SortOption>("points");
  const [limit, setLimit] = useState(25);
  const [selectedToken, setSelectedToken] = useState("HIGHER");
  const [amount, setAmount] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const { airdropUsers, userCount } = useAirdropManager({
    leaderboardData,
    config: {
      sortOption,
      limit,
      selectedToken,
      totalAmount: amount,
      customMessage,
      enablePreviews: false,
      confirmationRequired: true,
    },
  });

  const { status, updateStatus, resetStatus } = useTransactionStatus();
  const { address, isConnected } = useAccount();
  const { user } = useAioha();
  const toast = useToast();

  // Create ERC20 service instance
  const erc20Service = new ERC20AirdropService();

  // UI state for showing recipients
  const { isOpen: isRecipientsOpen, onToggle: onToggleRecipients } =
    useDisclosure();

  const isHiveToken = selectedToken === "HIVE" || selectedToken === "HBD";
  const isHighValueAirdrop = parseFloat(amount) > 1;

  // Aioha-based Hive airdrop execution
  const executeHiveAirdropWithAioha = async () => {
    if (!user) {
      throw new Error("Hive user not connected");
    }

    updateStatus({
      state: "preparing",
      message: "Preparing Hive transfer operations...",
    });

    try {
      const perUserAmount = parseFloat(amount) / userCount.limited;
      const currency = selectedToken === "HBD" ? "HBD" : "HIVE";
      const transferAmount = `${perUserAmount.toFixed(3)} ${currency}`;
      const memo = customMessage || `SkateHive airdrop from ${user} 🛹`;

      // Build operations array for batch transfer
      const operations: Operation[] = airdropUsers.map((recipient) => [
        "transfer",
        {
          from: user,
          to: recipient.hive_author,
          amount: transferAmount,
          memo: memo,
        },
      ]);

      updateStatus({
        state: "transfer-pending",
        message: `Broadcasting ${operations.length} transfer operations...`,
      });

      if (typeof window !== "undefined" && window.hive_keychain) {
        // Use Keychain SDK for batch operations
        const keychain = new KeychainSDK(window);

        const result = await keychain.broadcast({
          username: user,
          operations,
          method: KeychainKeyTypes.active,
        });

        updateStatus({
          state: "transfer-confirming",
          message: "Transaction broadcasted, waiting for confirmation...",
          hash: result?.result?.id || "unknown",
        });

        // Simulate confirmation delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        updateStatus({
          state: "completed",
          message: `Successfully distributed ${amount} ${currency} to ${userCount.limited} recipients!`,
          hash: result?.result?.id || "unknown",
        });

        return result?.result?.id || "unknown";
      } else {
        // Use Aioha's broadcast method
        updateStatus({
          state: "transfer-pending",
          message: "Please confirm the transaction in your wallet...",
        });

        // Split into smaller batches to avoid transaction size limits
        const batchSize = 10; // Conservative batch size for Hive
        const batches = [];

        for (let i = 0; i < operations.length; i += batchSize) {
          batches.push(operations.slice(i, i + batchSize));
        }

        const transactionIds: string[] = [];

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];

          updateStatus({
            state: "transfer-pending",
            message: `Processing batch ${i + 1}/${batches.length} (${
              batch.length
            } transfers)...`,
          });

          try {
            // Use Aioha's broadcast method for each batch
            const result = await user.broadcast(batch);

            if (result?.result?.id) {
              transactionIds.push(result.result.id);
            }

            // Small delay between batches
            if (i < batches.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (batchError) {
            console.error(`Batch ${i + 1} failed:`, batchError);
            throw new Error(`Batch ${i + 1} failed: ${batchError}`);
          }
        }

        updateStatus({
          state: "completed",
          message: `Successfully distributed ${amount} ${currency} to ${userCount.limited} recipients!`,
          hash: transactionIds.join(","),
        });

        return transactionIds.join(",");
      }
    } catch (error: any) {
      console.error("Hive airdrop failed:", error);
      updateStatus({
        state: "failed",
        message: `Airdrop failed: ${error.message || "Unknown error"}`,
        error: error.message,
      });
      throw error;
    }
  };

  const handleExecuteAirdrop = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to distribute",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (userCount.limited === 0) {
      toast({
        title: "No Recipients",
        description: "No users match the current filter criteria",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const totalAmount = parseFloat(amount);

    try {
      if (isHiveToken) {
        if (!user) {
          toast({
            title: "Hive Account Required",
            description:
              "Please connect your Hive account to distribute Hive tokens",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Use Aioha for Hive transactions
        await executeHiveAirdropWithAioha();
      } else {
        if (!isConnected || !address) {
          toast({
            title: "Ethereum Wallet Required",
            description:
              "Please connect your Ethereum wallet to distribute ERC-20 tokens",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        await erc20Service.executeAirdrop(
          selectedToken,
          airdropUsers,
          amount,
          updateStatus
        );
      }

      // Success confetti or celebration could be added here
      toast({
        title: "Airdrop Successful! 🎉",
        description: `Successfully distributed ${totalAmount} ${selectedToken} to ${userCount.limited} recipients`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Airdrop execution failed:", error);
      toast({
        title: "Airdrop Failed",
        description: error.message || "Failed to execute airdrop",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getTokenInfo = (tokenKey: string) => {
    return tokenDictionary[tokenKey];
  };

  return (
    <VStack spacing={6} w="full" maxW="600px" mx="auto" p={6}>
      {/* Filter Configuration Button */}
      <Button
        onClick={() => setIsFilterModalOpen(true)}
        colorScheme="blue"
        size="lg"
        w="full"
        bg="primary"
        color="background"
        _hover={{ bg: "accent" }}
      >
        Configure Airdrop ({userCount.limited} recipients)
      </Button>

      {/* Token Selection */}
      <Box w="full">
        <Text fontWeight="semibold" mb={2} color="text">
          Select Token:
        </Text>
        <HStack spacing={3}>
          <Select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            bg="muted"
            border="1px solid"
            borderColor="border"
            color="text"
            _focus={{ borderColor: "primary" }}
          >
            {Object.keys(tokenDictionary).map((token) => (
              <option
                key={token}
                value={token}
                style={{
                  background: "var(--chakra-colors-muted)",
                  color: "var(--chakra-colors-text)",
                }}
              >
                {token}
              </option>
            ))}
          </Select>
          {getTokenInfo(selectedToken) && (
            <Image
              src={getTokenInfo(selectedToken).tokenLogo}
              alt={selectedToken}
              boxSize="40px"
              borderRadius="full"
            />
          )}
        </HStack>
      </Box>

      {/* Amount Input */}
      <Box w="full">
        <Text fontWeight="semibold" mb={2} color="text">
          Total Amount to Distribute:
        </Text>
        <Input
          placeholder={`Enter amount of ${selectedToken}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.001"
          bg="muted"
          border="1px solid"
          borderColor="border"
          color="text"
          _focus={{ borderColor: "primary" }}
        />
        {amount && userCount.limited > 0 && (
          <Text fontSize="sm" color="textSecondary" mt={1}>
            Each user will receive:{" "}
            {(parseFloat(amount) / userCount.limited).toFixed(6)}{" "}
            {selectedToken}
          </Text>
        )}
      </Box>

      {/* Recipients Display */}
      {userCount.limited > 0 && (
        <Box w="full">
          <Button
            onClick={onToggleRecipients}
            variant="ghost"
            size="sm"
            rightIcon={
              <Icon as={isRecipientsOpen ? ChevronUpIcon : ChevronDownIcon} />
            }
            color="primary"
            _hover={{ bg: "muted" }}
          >
            {isRecipientsOpen ? "Hide" : "Show"} Recipients ({userCount.limited}
            )
          </Button>

          {isRecipientsOpen && (
            <Box
              mt={4}
              p={4}
              bg="muted"
              borderRadius="md"
              border="1px solid"
              borderColor="border"
              maxH="400px"
              overflowY="auto"
            >
              <Text fontWeight="semibold" mb={3} color="text">
                Airdrop Recipients:
              </Text>

              {airdropUsers.length <= 20 ? (
                // Table view for smaller lists
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th color="textSecondary">User</Th>
                        <Th color="textSecondary">Points</Th>
                        <Th color="textSecondary">Amount</Th>
                        <Th color="textSecondary">
                          {isHiveToken ? "Hive User" : "ETH Address"}
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {airdropUsers.map((user, index) => (
                        <Tr key={user.hive_author + index}>
                          <Td>
                            <HStack>
                              <Avatar size="xs" name={user.hive_author} />
                              <Text
                                fontSize="sm"
                                color="text"
                                fontWeight="medium"
                              >
                                {user.hive_author}
                              </Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="blue" fontSize="xs">
                              {user.points?.toFixed(0) || 0}
                            </Badge>
                          </Td>
                          <Td>
                            <Text
                              fontSize="sm"
                              color="primary"
                              fontWeight="semibold"
                            >
                              {user.amount ||
                                (
                                  parseFloat(amount) / userCount.limited
                                ).toFixed(6)}{" "}
                              {selectedToken}
                            </Text>
                          </Td>
                          <Td>
                            <Text
                              fontSize="xs"
                              color="textSecondary"
                              fontFamily="mono"
                              maxW="120px"
                              isTruncated
                              title={
                                isHiveToken
                                  ? user.hive_author
                                  : user.eth_address
                              }
                            >
                              {isHiveToken
                                ? user.hive_author
                                : user.eth_address}
                            </Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                // Compact list view for larger lists
                <VStack
                  spacing={2}
                  align="stretch"
                  maxH="300px"
                  overflowY="auto"
                >
                  {airdropUsers.map((user, index) => (
                    <Flex
                      key={user.hive_author + index}
                      p={2}
                      bg="background"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="border"
                      align="center"
                    >
                      <HStack spacing={3}>
                        <Avatar size="xs" name={user.hive_author} />
                        <VStack spacing={0} align="start">
                          <Text fontSize="sm" color="text" fontWeight="medium">
                            {user.hive_author}
                          </Text>
                          <Text fontSize="xs" color="textSecondary">
                            {user.points?.toFixed(0) || 0} points
                          </Text>
                        </VStack>
                      </HStack>
                      <Spacer />
                      <VStack spacing={0} align="end">
                        <Text
                          fontSize="sm"
                          color="primary"
                          fontWeight="semibold"
                        >
                          {user.amount ||
                            (parseFloat(amount) / userCount.limited).toFixed(
                              6
                            )}{" "}
                          {selectedToken}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="textSecondary"
                          fontFamily="mono"
                          maxW="80px"
                          isTruncated
                        >
                          {isHiveToken ? user.hive_author : user.eth_address}
                        </Text>
                      </VStack>
                    </Flex>
                  ))}
                </VStack>
              )}

              {/* Summary at bottom */}
              <Box mt={4} pt={3} borderTop="1px solid" borderColor="border">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text">
                    Total Recipients:{" "}
                    <Badge colorScheme="blue">{userCount.limited}</Badge>
                  </Text>
                  <Text fontSize="sm" color="text">
                    Total Amount:{" "}
                    <Text as="span" color="primary" fontWeight="semibold">
                      {amount} {selectedToken}
                    </Text>
                  </Text>
                </HStack>
                {userCount.total > userCount.limited && (
                  <Text fontSize="xs" color="textSecondary" mt={1}>
                    {userCount.total - userCount.limited} users filtered out
                  </Text>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Custom Message (for high-value airdrops or always show for Hive) */}
      {(isHighValueAirdrop || isHiveToken) && (
        <Box w="full">
          <Text fontWeight="semibold" mb={2} color="text">
            Custom Message {isHiveToken ? "(recommended)" : "(optional)"}:
          </Text>
          <Textarea
            placeholder={`Enter a message for the ${selectedToken} airdrop recipients...`}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            bg="muted"
            border="1px solid"
            borderColor="border"
            color="text"
            _focus={{ borderColor: "primary" }}
            resize="none"
            rows={3}
          />
        </Box>
      )}

      {/* Connection Status Alert */}
      {!isConnected && !user && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Connect your wallet (Ethereum for ERC-20 tokens, Hive for HIVE/HBD)
            to execute airdrops
          </AlertDescription>
        </Alert>
      )}

      {/* Execute Button */}
      <Button
        colorScheme="green"
        size="lg"
        w="full"
        onClick={handleExecuteAirdrop}
        disabled={
          !amount ||
          userCount.limited === 0 ||
          status.state === "preparing" ||
          status.state === "approval-pending" ||
          status.state === "approval-confirming" ||
          status.state === "transfer-pending" ||
          status.state === "transfer-confirming" ||
          (!isConnected && !isHiveToken) ||
          (!user && isHiveToken)
        }
        isLoading={
          status.state !== "idle" &&
          status.state !== "completed" &&
          status.state !== "failed"
        }
        loadingText="Processing Airdrop..."
        bg="primary"
        color="background"
        _hover={{ bg: "accent" }}
        _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
      >
        Execute Airdrop 🚀
      </Button>

      {/* Transaction Status */}
      <TransactionStatusDisplay status={status} onReset={resetStatus} />
    </VStack>
  );
};

export default AirdropManager;
