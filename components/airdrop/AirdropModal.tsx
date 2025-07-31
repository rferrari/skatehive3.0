"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Divider,
  Box,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Image,
} from "@chakra-ui/react";
import { useState, useCallback } from "react";
import {
  InfoIcon,
  WarningIcon,
  CheckIcon,
  ArrowBackIcon,
} from "@chakra-ui/icons";
import { tokenDictionary } from "@/lib/utils/tokenDictionary";
import { useAirdropManager } from "@/hooks/useAirdropManager";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import useIsMobile from "@/hooks/useIsMobile";
import TransactionStatusDisplay from "./TransactionStatusDisplay";
import { executeHiveAirdrop } from "@/services/hiveAirdrop";
import { ERC20AirdropService } from "@/services/erc20Airdrop";
import { SkaterData, SortOption, AirdropConfig } from "@/types/airdrop";
import { useAioha } from "@aioha/react-ui";

type ModalView = "main" | "filter" | "recipients";

interface AirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboardData: SkaterData[];
  initialSortOption?: SortOption;
}

const erc20Service = new ERC20AirdropService();

export function AirdropModal({
  isOpen,
  onClose,
  leaderboardData,
  initialSortOption = "points",
}: AirdropModalProps) {
  // Modal view state
  const [currentView, setCurrentView] = useState<ModalView>("main");

  // Airdrop configuration
  const [sortOption, setSortOption] = useState<SortOption>(initialSortOption);
  const [limit, setLimit] = useState(10);
  const [selectedToken, setSelectedToken] = useState("HIGHER");
  const [totalAmount, setTotalAmount] = useState("10");

  // UI state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Mobile detection
  const isMobile = useIsMobile();

  // Aioha context
  const { user, aioha } = useAioha();

  // Hooks
  const { airdropUsers, userCount, summary, validation, excludedUsers } =
    useAirdropManager({
      leaderboardData,
      config: {
        sortOption,
        limit,
        selectedToken,
        totalAmount,
        customMessage: "",
        enablePreviews: false,
        confirmationRequired: true,
      },
    });

  const { status, updateStatus, resetStatus } = useTransactionStatus();

  // Handlers
  const handleConfigChange = useCallback(
    (updates: {
      sortOption?: SortOption;
      limit?: number;
      selectedToken?: string;
      totalAmount?: string;
    }) => {
      if (updates.sortOption !== undefined) setSortOption(updates.sortOption);
      if (updates.limit !== undefined) setLimit(updates.limit);
      if (updates.selectedToken !== undefined)
        setSelectedToken(updates.selectedToken);
      if (updates.totalAmount !== undefined)
        setTotalAmount(updates.totalAmount);
      setCostEstimate(null); // Reset cost estimate when config changes
    },
    []
  );

  const handleViewChange = useCallback((view: ModalView) => {
    setCurrentView(view);
  }, []);

  const handleClose = useCallback(() => {
    setCurrentView("main");
    onClose();
  }, [onClose]);

  const handleEstimateCost = useCallback(async () => {
    if (!validation.isValid || airdropUsers.length === 0) return;

    setIsEstimating(true);
    try {
      const tokenInfo = tokenDictionary[selectedToken];

      if (tokenInfo?.network === "hive") {
        // For Hive tokens, cost estimation is simpler
        const perUser = parseFloat(totalAmount) / airdropUsers.length;
        setCostEstimate({
          totalAmount: totalAmount,
          perUserAmount: perUser,
          canExecute: perUser >= 0.001,
          errors: perUser < 0.001 ? ["Amount per user too small"] : [],
          network: "hive",
        });
      } else {
        // For ERC-20 tokens, use the service
        const estimate = await erc20Service.estimateAirdropCost(
          selectedToken,
          airdropUsers,
          totalAmount
        );
        setCostEstimate({ ...estimate, network: "base" });
      }
    } catch (error) {
      console.error("Cost estimation failed:", error);
    } finally {
      setIsEstimating(false);
    }
  }, [selectedToken, totalAmount, airdropUsers, validation.isValid]);

  const handleExecuteAirdrop = async () => {
    if (!validation.isValid || isExecuting) return;

    // Check if Aioha user is available for Hive operations
    const tokenInfo = tokenDictionary[selectedToken];

    setIsExecuting(true);
    resetStatus();

    try {
      const tokenInfo = tokenDictionary[selectedToken];

      if (tokenInfo?.network === "hive") {
        // Execute Hive airdrop
        await executeHiveAirdrop({
          token: selectedToken,
          recipients: airdropUsers,
          totalAmount: parseFloat(totalAmount),
          customMessage: `SkateHive Community Airdrop - ${selectedToken} 🛹`,
          user: { name: user }, // Pass as object with name property
          updateStatus,
          aiohaUser: user,
          aiohaInstance: aioha, // Also pass the aioha instance for fallback
        });
      } else {
        // Execute ERC-20 airdrop
        await erc20Service.executeAirdrop(
          selectedToken,
          airdropUsers,
          totalAmount,
          updateStatus
        );
      }
    } catch (error) {
      console.error("Airdrop execution failed:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApproveToken = async () => {
    if (!validation.isValid || isApproving) return;

    setIsApproving(true);
    resetStatus();

    try {
      await erc20Service.approveToken(selectedToken, totalAmount, updateStatus);
    } catch (error) {
      console.error("Token approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  // Computed values
  const tokenOptions = Object.entries(tokenDictionary).map(
    ([symbol, info]) => ({
      value: symbol,
      label: `${symbol} (${info.network === "hive" ? "Hive" : "Base"})`,
      disabled: false,
    })
  );

  const selectedTokenInfo = tokenDictionary[selectedToken];
  const isHiveToken = selectedTokenInfo?.network === "hive";

  // Modal content based on current view
  const getModalContent = () => {
    switch (currentView) {
      case "filter":
        return {
          title: "🎯 Configure Recipients",
          content: (
            <VStack spacing={6} align="stretch">
              <Box>
                <Text
                  fontSize={isMobile ? "md" : "lg"}
                  fontWeight="bold"
                  mb={4}
                  color="primary"
                >
                  Filter Options
                </Text>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel color="text" fontSize={isMobile ? "sm" : "md"}>
                      Sort By
                    </FormLabel>
                    <Select
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                      }
                      bg="cardBg"
                      borderColor="border"
                      size={isMobile ? "sm" : "md"}
                    >
                      <option value="points">Points</option>
                      <option value="hp_balance">Hive Power</option>
                      <option value="hive_balance">Hive Balance</option>
                      <option value="hbd_savings_balance">HBD Savings</option>
                      <option value="post_count">Post Count</option>
                      <option value="has_voted_in_witness">
                        Witness Voters
                      </option>
                      <option value="gnars_balance">Gnars Balance</option>
                      <option value="skatehive_nft_balance">
                        SkateHive NFTs
                      </option>
                      <option value="gnars_votes">Gnars Votes</option>
                      <option value="giveth_donations_usd">
                        Giveth Donations
                      </option>
                      <option value="airdrop_the_poor">Airdrop the Poor</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel color="text" fontSize={isMobile ? "sm" : "md"}>
                      Limit Recipients
                    </FormLabel>
                    <NumberInput
                      value={limit}
                      onChange={(_, num) => setLimit(num)}
                      min={1}
                      max={1000}
                      size={isMobile ? "sm" : "md"}
                    >
                      <NumberInputField bg="cardBg" borderColor="border" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </VStack>
              </Box>

              <Box>
                <Text
                  fontSize={isMobile ? "md" : "lg"}
                  fontWeight="bold"
                  mb={2}
                  color="primary"
                >
                  Preview
                </Text>
                {isMobile ? (
                  <VStack spacing={2} align="stretch">
                    <Stat textAlign="left">
                      <StatLabel color="textSecondary" fontSize="xs">
                        Total Users
                      </StatLabel>
                      <StatNumber color="text" fontSize="lg">
                        {userCount.total}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="left">
                      <StatLabel color="textSecondary" fontSize="xs">
                        Eligible
                      </StatLabel>
                      <StatNumber color="text" fontSize="lg">
                        {userCount.eligible}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="left">
                      <StatLabel color="textSecondary" fontSize="xs">
                        Selected
                      </StatLabel>
                      <StatNumber color="text" fontSize="lg">
                        {userCount.limited}
                      </StatNumber>
                    </Stat>
                  </VStack>
                ) : (
                  <StatGroup>
                    <Stat>
                      <StatLabel color="textSecondary">Total Users</StatLabel>
                      <StatNumber color="text">{userCount.total}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="textSecondary">Eligible</StatLabel>
                      <StatNumber color="text">{userCount.eligible}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="textSecondary">Selected</StatLabel>
                      <StatNumber color="text">{userCount.limited}</StatNumber>
                    </Stat>
                  </StatGroup>
                )}
              </Box>
            </VStack>
          ),
          footer: (
            <HStack spacing={3}>
              <Button
                variant="ghost"
                onClick={() => setCurrentView("main")}
                leftIcon={<ArrowBackIcon />}
                color="textSecondary"
              >
                Back
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => setCurrentView("main")}
                bg="primary"
                color="background"
              >
                Apply Filters
              </Button>
            </HStack>
          ),
        };

      case "recipients":
        return {
          title: `🎯 Recipients (${airdropUsers.length})`,
          content: (
            <VStack spacing={4} align="stretch">
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
                              <Image
                                src={`https://images.hive.blog/u/${user.hive_author}/avatar/small`}
                                alt={user.hive_author}
                                borderRadius="full"
                                boxSize="24px"
                                objectFit="cover"
                              />
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
                                  parseFloat(totalAmount) / userCount.limited
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
                  maxH="400px"
                  overflowY="auto"
                >
                  {airdropUsers.map((user, index) => (
                    <HStack
                      key={user.hive_author + index}
                      p={3}
                      bg="cardBg"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="border"
                      justify="space-between"
                    >
                      <HStack spacing={3}>
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          bg="primary"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="background"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {user.hive_author.charAt(0).toUpperCase()}
                        </Box>
                        <VStack spacing={0} align="start">
                          <Text fontSize="sm" color="text" fontWeight="medium">
                            {user.hive_author}
                          </Text>
                          <Text fontSize="xs" color="textSecondary">
                            {user.points?.toFixed(0) || 0} points
                          </Text>
                        </VStack>
                      </HStack>
                      <VStack spacing={0} align="end">
                        <Text
                          fontSize="sm"
                          color="primary"
                          fontWeight="semibold"
                        >
                          {user.amount ||
                            (
                              parseFloat(totalAmount) / userCount.limited
                            ).toFixed(6)}{" "}
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
                    </HStack>
                  ))}
                </VStack>
              )}
            </VStack>
          ),
          footer: (
            <HStack spacing={3}>
              <Button
                variant="ghost"
                onClick={() => setCurrentView("main")}
                leftIcon={<ArrowBackIcon />}
                color="textSecondary"
              >
                Back
              </Button>
            </HStack>
          ),
        };

      default: // 'main'
        return {
          title: (
            <HStack justify="center">
              <Text>🎯 Multi-Chain Airdrop</Text>
              <Badge colorScheme={isHiveToken ? "red" : "blue"}>
                {isHiveToken ? "Hive Network" : "Base Network"}
              </Badge>
            </HStack>
          ),
          content: (
            <VStack spacing={6} align="stretch">
              {/* Configuration Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
                  Airdrop Configuration
                </Text>

                <VStack spacing={4}>
                  {isMobile ? (
                    <VStack spacing={4} width="100%">
                      <FormControl>
                        <FormLabel color="text" fontSize="sm">
                          Token
                        </FormLabel>
                        <Select
                          value={selectedToken}
                          onChange={(e) =>
                            handleConfigChange({
                              selectedToken: e.target.value,
                            })
                          }
                          bg="cardBg"
                          borderColor="border"
                          size="sm"
                        >
                          {tokenOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                            >
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isInvalid={parseFloat(totalAmount) <= 0}>
                        <FormLabel color="text" fontSize="sm">
                          Total Amount
                        </FormLabel>
                        <NumberInput
                          value={totalAmount}
                          onChange={(value) =>
                            handleConfigChange({ totalAmount: value })
                          }
                          min={0}
                          precision={6}
                          size="sm"
                        >
                          <NumberInputField bg="cardBg" borderColor="border" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormErrorMessage fontSize="xs">
                          Amount must be greater than 0
                        </FormErrorMessage>
                      </FormControl>
                    </VStack>
                  ) : (
                    <HStack spacing={4} width="100%">
                      <FormControl flex={1}>
                        <FormLabel color="text">Token</FormLabel>
                        <Select
                          value={selectedToken}
                          onChange={(e) =>
                            handleConfigChange({
                              selectedToken: e.target.value,
                            })
                          }
                          bg="cardBg"
                          borderColor="border"
                        >
                          {tokenOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                            >
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl
                        flex={1}
                        isInvalid={parseFloat(totalAmount) <= 0}
                      >
                        <FormLabel color="text">Total Amount</FormLabel>
                        <NumberInput
                          value={totalAmount}
                          onChange={(value) =>
                            handleConfigChange({ totalAmount: value })
                          }
                          min={0}
                          precision={6}
                        >
                          <NumberInputField bg="cardBg" borderColor="border" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormErrorMessage>
                          Amount must be greater than 0
                        </FormErrorMessage>
                      </FormControl>
                    </HStack>
                  )}

                  <HStack spacing={3} width="100%">
                    <Button
                      onClick={() => setCurrentView("filter")}
                      variant="outline"
                      size={isMobile ? "xs" : "sm"}
                      leftIcon={<Icon as={InfoIcon} />}
                      borderColor="primary"
                      color="primary"
                      _hover={{ bg: "primary", color: "background" }}
                      flex={1}
                      fontSize={isMobile ? "xs" : "sm"}
                      px={isMobile ? 2 : 4}
                    >
                      {isMobile
                        ? `Configure (${airdropUsers.length})`
                        : `Configure Recipients (${airdropUsers.length})`}
                    </Button>

                    {airdropUsers.length > 0 && (
                      <Button
                        onClick={() => setCurrentView("recipients")}
                        variant="outline"
                        size={isMobile ? "xs" : "sm"}
                        borderColor="primary"
                        color="primary"
                        _hover={{ bg: "primary", color: "background" }}
                        flex={1}
                        fontSize={isMobile ? "xs" : "sm"}
                        px={isMobile ? 2 : 4}
                      >
                        {isMobile ? "View" : "View Recipients"}
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Box>

              {/* Token Approval Section for ERC-20 Tokens */}
              {!isHiveToken && (
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
                    Token Approval
                  </Text>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Approval Required!</AlertTitle>
                      <AlertDescription>
                        ERC-20 tokens require approval before airdrops. Click
                        &quot;Approve Tokens&quot; to allow the airdrop contract
                        to spend your {selectedToken} tokens.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  <HStack
                    spacing={3}
                    mt={3}
                    flexWrap={isMobile ? "wrap" : "nowrap"}
                  >
                    <Button
                      onClick={handleApproveToken}
                      isLoading={isApproving}
                      loadingText="Approving..."
                      disabled={
                        !validation.isValid || parseFloat(totalAmount) <= 0
                      }
                      leftIcon={isApproving ? undefined : <WarningIcon />}
                      colorScheme="orange"
                      size={isMobile ? "xs" : "sm"}
                      bg="orange.500"
                      color="white"
                      _hover={{ bg: "orange.600" }}
                      fontSize={isMobile ? "xs" : "sm"}
                      px={isMobile ? 2 : 4}
                      flex={isMobile ? "1" : "auto"}
                      minW={isMobile ? "auto" : "fit-content"}
                    >
                      {isApproving
                        ? "Approving..."
                        : isMobile
                        ? `Approve ${selectedToken}`
                        : `Approve ${selectedToken} Tokens`}
                    </Button>
                    <Text
                      fontSize={isMobile ? "xs" : "sm"}
                      color="textSecondary"
                      flex={isMobile ? "1" : "auto"}
                    >
                      Amount: {totalAmount} {selectedToken}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Summary Section */}
              <Box>
                <HStack
                  justify="space-between"
                  mb={4}
                  flexWrap={isMobile ? "wrap" : "nowrap"}
                >
                  <Text
                    fontSize={isMobile ? "md" : "lg"}
                    fontWeight="bold"
                    color="primary"
                  >
                    Airdrop Summary
                  </Text>
                  <Button
                    size={isMobile ? "xs" : "sm"}
                    onClick={handleEstimateCost}
                    isLoading={isEstimating}
                    loadingText="Estimating..."
                    variant="ghost"
                    color="primary"
                    fontSize={isMobile ? "xs" : "sm"}
                  >
                    {isMobile ? "Estimate" : "Estimate Cost"}
                  </Button>
                </HStack>

                {isMobile ? (
                  <VStack spacing={2} align="stretch">
                    <Stat textAlign="left">
                      <StatLabel color="textSecondary" fontSize="xs">
                        Recipients
                      </StatLabel>
                      <StatNumber color="text" fontSize="lg">
                        {airdropUsers.length}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="left">
                      <StatLabel color="textSecondary" fontSize="xs">
                        Per User
                      </StatLabel>
                      <StatNumber color="text" fontSize="lg">
                        {airdropUsers.length > 0
                          ? (
                              parseFloat(totalAmount) / airdropUsers.length
                            ).toFixed(6)
                          : "0.000000"}{" "}
                        {selectedToken}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="left">
                      <StatLabel color="textSecondary" fontSize="xs">
                        Total Cost
                      </StatLabel>
                      <StatNumber color="text" fontSize="lg">
                        {totalAmount} {selectedToken}
                      </StatNumber>
                    </Stat>
                  </VStack>
                ) : (
                  <StatGroup>
                    <Stat>
                      <StatLabel color="textSecondary">Recipients</StatLabel>
                      <StatNumber color="text">
                        {airdropUsers.length}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="textSecondary">Per User</StatLabel>
                      <StatNumber color="text">
                        {airdropUsers.length > 0
                          ? (
                              parseFloat(totalAmount) / airdropUsers.length
                            ).toFixed(6)
                          : "0.000000"}{" "}
                        {selectedToken}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="textSecondary">Total Cost</StatLabel>
                      <StatNumber color="text">
                        {totalAmount} {selectedToken}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                )}

                {/* Cost Estimate Display */}
                {costEstimate && (
                  <Box
                    mt={4}
                    p={4}
                    bg="cardBg"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border"
                  >
                    <Text fontWeight="bold" mb={2} color="primary">
                      Cost Breakdown
                    </Text>
                    {costEstimate.network === "base" && (
                      <VStack
                        align="start"
                        spacing={1}
                        fontSize="sm"
                        color="text"
                      >
                        <Text>
                          Gas Estimate:{" "}
                          {costEstimate.gasEstimate?.totalCost || "N/A"} wei
                        </Text>
                        <Text>
                          Token Amount: {costEstimate.tokenAmount || "N/A"}
                        </Text>
                        {costEstimate.errors?.length > 0 && (
                          <Alert status="warning" size="sm">
                            <AlertIcon />
                            <AlertDescription>
                              {costEstimate.errors.join(", ")}
                            </AlertDescription>
                          </Alert>
                        )}
                      </VStack>
                    )}
                    {costEstimate.network === "hive" && (
                      <VStack
                        align="start"
                        spacing={1}
                        fontSize="sm"
                        color="text"
                      >
                        <Text>
                          Resource Credits: ~{airdropUsers.length * 50} RC
                        </Text>
                        <Text>Network: Hive Blockchain</Text>
                      </VStack>
                    )}
                  </Box>
                )}
              </Box>

              {/* Validation Errors */}
              {!validation.isValid && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Configuration Issues:</AlertTitle>
                    <AlertDescription>
                      <VStack align="start" spacing={1}>
                        {validation.errors.map((error, index) => (
                          <Text key={index} fontSize="sm">
                            • {error}
                          </Text>
                        ))}
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Aioha Connection Warning for Hive Tokens */}
              {isHiveToken && !user && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Hive Wallet Required!</AlertTitle>
                    <AlertDescription>
                      Please connect your Hive wallet (Keychain, HiveAuth, etc.)
                      to perform airdrops on the Hive network.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Excluded Users Info */}
              {excludedUsers.length > 0 && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    {excludedUsers.length} users excluded due to missing{" "}
                    {isHiveToken ? "Hive usernames" : "ETH addresses"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Transaction Status */}
              {(status.state !== "idle" || isExecuting) && (
                <TransactionStatusDisplay
                  status={status}
                  onReset={resetStatus}
                />
              )}
            </VStack>
          ),
          footer: (
            <HStack
              spacing={isMobile ? 2 : 3}
              flexWrap={isMobile ? "wrap" : "nowrap"}
              w="100%"
            >
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isExecuting || isApproving}
                color="textSecondary"
                _hover={{ color: "text" }}
                size={isMobile ? "sm" : "md"}
                flex={isMobile ? "1" : "auto"}
              >
                Cancel
              </Button>

              {/* Show approval button for ERC-20 tokens when needed */}
              {!isHiveToken &&
                status.state === "failed" &&
                status.message?.toLowerCase().includes("allowance") && (
                  <Button
                    colorScheme="orange"
                    onClick={handleApproveToken}
                    isLoading={isApproving}
                    loadingText="Approving..."
                    disabled={!validation.isValid}
                    leftIcon={isApproving ? undefined : <WarningIcon />}
                    bg="orange.500"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                    size={isMobile ? "sm" : "md"}
                    fontSize={isMobile ? "sm" : "md"}
                    flex={isMobile ? "1" : "auto"}
                  >
                    {isApproving
                      ? "Approving..."
                      : isMobile
                      ? "Approve"
                      : "Approve Tokens"}
                  </Button>
                )}

              <Button
                colorScheme="blue"
                onClick={handleExecuteAirdrop}
                isLoading={isExecuting}
                loadingText="Executing..."
                leftIcon={isExecuting ? undefined : <CheckIcon />}
                bg="primary"
                color="background"
                _hover={{ bg: "primaryDark" }}
                size={isMobile ? "sm" : "md"}
                fontSize={isMobile ? "sm" : "md"}
                flex={isMobile ? "1" : "auto"}
              >
                {isExecuting
                  ? "Processing..."
                  : isMobile
                  ? "Execute"
                  : `Execute Airdrop`}
              </Button>
            </HStack>
          ),
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={isMobile ? "full" : "xl"}
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        bg="background"
        color="text"
        borderRadius={isMobile ? "0" : "20px"}
        border="1px solid"
        borderColor="border"
        shadow="2xl"
        mx={isMobile ? 0 : 4}
        maxH={isMobile ? "100vh" : "90vh"}
        h={isMobile ? "100vh" : "auto"}
      >
        <ModalHeader
          textAlign="center"
          fontSize="2xl"
          fontWeight="bold"
          color="primary"
          pb={2}
        >
          {modalContent.title}
        </ModalHeader>
        <ModalCloseButton
          color="text"
          _hover={{ color: "background", bg: "primary" }}
          borderRadius="full"
        />

        <ModalBody px={isMobile ? 4 : 8} pb={isMobile ? 4 : 8}>
          {modalContent.content}
        </ModalBody>

        <ModalFooter>{modalContent.footer}</ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AirdropModal;
