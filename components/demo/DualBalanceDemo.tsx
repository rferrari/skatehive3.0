"use client";

import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  Badge,
  useToast,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { useZoraTrade, TradeConfig } from "@/hooks/useZoraTrade";
import { Address, parseEther, parseUnits } from "viem";
import { useAccount } from "wagmi";

// Major tokens on Base
const TOKENS = [
  { symbol: "ETH", type: "eth" as const, address: undefined, decimals: 18 },
  {
    symbol: "USDC",
    type: "erc20" as const,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913" as Address,
    decimals: 6,
  },
  {
    symbol: "WETH",
    type: "erc20" as const,
    address: "0x4200000000000000000000000000000000000006" as Address,
    decimals: 18,
  },
];

export default function DualBalanceDemo() {
  const { address, isConnected } = useAccount();
  const {
    getEnhancedFormattedBalance,
    getDualBalances,
    executeTrade,
    isTrading,
  } = useZoraTrade();

  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState("0.01");
  const [tradeSource, setTradeSource] = useState<"external" | "zora-internal">(
    "external"
  );
  const toast = useToast();

  // Load balance data for selected token
  const loadBalances = async () => {
    if (!isConnected || !selectedToken) return;

    setLoading(true);
    try {
      const enhanced = await getEnhancedFormattedBalance(
        selectedToken.type,
        selectedToken.address
      );
      setBalanceData(enhanced);
    } catch (error) {
      console.error("Error loading balances:", error);
      toast({
        title: "Error loading balances",
        description: "Failed to fetch balance data",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [selectedToken, isConnected]);

  const handleTestTrade = async () => {
    if (!isConnected || !selectedToken || !balanceData) return;

    try {
      const amount =
        selectedToken.type === "eth"
          ? parseEther(tradeAmount)
          : parseUnits(tradeAmount, selectedToken.decimals);

      // Check if user has enough balance from selected source
      const sourceBalance =
        tradeSource === "external"
          ? balanceData.external.raw
          : balanceData.internal.raw;

      if (sourceBalance < amount) {
        toast({
          title: "Insufficient balance",
          description: `Not enough ${selectedToken.symbol} in ${tradeSource} balance`,
          status: "error",
          duration: 3000,
        });
        return;
      }

      const tradeConfig: TradeConfig = {
        fromToken: {
          type: selectedToken.type,
          address: selectedToken.address,
          amount,
          source: tradeSource,
        },
        toToken: {
          type: "erc20",
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913", // USDC
        },
        slippage: 5,
      };

      console.log("🚀 Testing trade with config:", tradeConfig);

      toast({
        title: "Trade Test",
        description: `Testing ${tradeAmount} ${selectedToken.symbol} from ${tradeSource} balance`,
        status: "info",
        duration: 3000,
      });

      // Uncomment to actually execute trade
      // const result = await executeTrade(tradeConfig);
    } catch (error) {
      console.error("Test trade error:", error);
      toast({
        title: "Test trade failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    }
  };

  if (!isConnected) {
    return (
      <Box p={6} borderWidth={1} borderRadius="md" bg="gray.900">
        <Text color="gray.400">
          Please connect your wallet to view dual balances
        </Text>
      </Box>
    );
  }

  return (
    <Box p={6} borderWidth={1} borderRadius="md" bg="gray.900" color="white">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">
          Dual Balance Demo (External vs Zora Internal)
        </Text>

        {/* Token Selection */}
        <Box>
          <Text mb={2} fontSize="sm" color="gray.400">
            Select Token:
          </Text>
          <Select
            value={selectedToken.symbol}
            onChange={(e) => {
              const token = TOKENS.find((t) => t.symbol === e.target.value);
              if (token) setSelectedToken(token);
            }}
            bg="gray.800"
          >
            {TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </Select>
        </Box>

        {/* Balance Display */}
        {loading ? (
          <HStack justify="center">
            <Spinner size="sm" />
            <Text color="gray.400">Loading balances...</Text>
          </HStack>
        ) : balanceData ? (
          <VStack spacing={3} align="stretch">
            <Text fontSize="lg" fontWeight="semibold">
              {selectedToken.symbol} Balances:
            </Text>

            {/* External Balance */}
            <HStack
              justify="space-between"
              p={3}
              bg="gray.800"
              borderRadius="md"
            >
              <VStack align="start" spacing={1}>
                <HStack>
                  <Badge colorScheme="blue">External Wallet</Badge>
                </HStack>
                <Text fontSize="sm" color="gray.400">
                  Your wallet balance
                </Text>
              </VStack>
              <Text fontSize="lg" fontWeight="bold">
                {balanceData.external.formatted}
              </Text>
            </HStack>

            {/* Internal Balance */}
            <HStack
              justify="space-between"
              p={3}
              bg="gray.800"
              borderRadius="md"
            >
              <VStack align="start" spacing={1}>
                <HStack>
                  <Badge colorScheme="purple">Zora Internal</Badge>
                </HStack>
                <Text fontSize="sm" color="gray.400">
                  Deposited in Zora
                </Text>
              </VStack>
              <Text fontSize="lg" fontWeight="bold">
                {balanceData.internal.formatted}
              </Text>
            </HStack>

            {/* Total Balance */}
            <HStack
              justify="space-between"
              p={3}
              bg="gray.700"
              borderRadius="md"
            >
              <VStack align="start" spacing={1}>
                <HStack>
                  <Badge colorScheme="green">Total Available</Badge>
                </HStack>
                <Text fontSize="sm" color="gray.400">
                  Combined balance
                </Text>
              </VStack>
              <Text fontSize="lg" fontWeight="bold">
                {balanceData.total.formatted}
              </Text>
            </HStack>
          </VStack>
        ) : (
          <Text color="gray.400">No balance data available</Text>
        )}

        <Divider />

        {/* Test Trade Section */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="lg" fontWeight="semibold">
            Test Trade Configuration:
          </Text>

          <HStack>
            <Box flex={1}>
              <Text mb={1} fontSize="sm" color="gray.400">
                Amount:
              </Text>
              <Input
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="0.01"
                bg="gray.800"
              />
            </Box>

            <Box flex={1}>
              <Text mb={1} fontSize="sm" color="gray.400">
                Use Balance From:
              </Text>
              <Select
                value={tradeSource}
                onChange={(e) =>
                  setTradeSource(e.target.value as "external" | "zora-internal")
                }
                bg="gray.800"
              >
                <option value="external">External Wallet</option>
                <option value="zora-internal">Zora Internal</option>
              </Select>
            </Box>
          </HStack>

          <Button
            onClick={handleTestTrade}
            isLoading={isTrading}
            colorScheme="blue"
            isDisabled={!balanceData || parseFloat(tradeAmount) <= 0}
          >
            Test Trade (Logs Only)
          </Button>

          <Text fontSize="xs" color="gray.500">
            This will test the trade configuration and log the results. No
            actual trade will be executed.
          </Text>
        </VStack>

        <Button onClick={loadBalances} variant="outline" size="sm">
          Refresh Balances
        </Button>
      </VStack>
    </Box>
  );
}
