"use client";

import React, { useState, useEffect } from "react";
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
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Box,
  Alert,
  AlertIcon,
  Spinner,
  Image,
  useToast,
  Divider,
} from "@chakra-ui/react";
import {
  parseEther,
  parseUnits,
  formatEther,
  formatUnits,
  Address,
} from "viem";
import { useZoraTrade } from "@/hooks/useZoraTrade";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

// Simple inline debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ZoraTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinAddress: string;
  coinData: {
    name?: string;
    symbol?: string;
    image?: string;
    marketCap?: string;
    uniqueHolders?: number;
  };
}

interface Currency {
  type: "eth" | "erc20";
  address?: Address;
  symbol: string;
  decimals: number;
  name: string;
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address; // Base USDC

const SUPPORTED_CURRENCIES: Currency[] = [
  {
    type: "eth",
    symbol: "ETH",
    decimals: 18,
    name: "Ethereum",
  },
  {
    type: "erc20",
    address: USDC_ADDRESS,
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
  },
];

export default function ZoraTradingModal({
  isOpen,
  onClose,
  coinAddress,
  coinData,
}: ZoraTradingModalProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [fromCurrency, setFromCurrency] = useState<Currency>(
    SUPPORTED_CURRENCIES[0]
  );
  const [toCurrency, setToCurrency] = useState<Currency>({
    type: "erc20",
    address: coinAddress as Address,
    symbol: coinData.symbol || "COIN",
    decimals: 18,
    name: coinData.name || "Creator Coin",
  });
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(5); // 5% default
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [fromBalance, setFromBalance] = useState<{
    raw: bigint;
    formatted: string;
    symbol: string;
    decimals: number;
  } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    executeTrade,
    getTradeQuote,
    getFormattedBalance,
    getTokenDecimals,
    refreshBalance,
    isTrading,
    isConnected,
    ethBalance,
  } = useZoraTrade();
  const toast = useToast();
  const debouncedAmount = useDebounce(amount, 500); // Debounce amount input

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check if amount exceeds balance
  const isAmountExceedsBalance = React.useMemo(() => {
    if (!fromBalance || !amount || parseFloat(amount) <= 0) return false;

    try {
      const amountIn =
        fromCurrency.type === "eth"
          ? parseEther(amount)
          : parseUnits(amount, fromBalance.decimals); // Use actual decimals
      return amountIn > fromBalance.raw;
    } catch {
      return false;
    }
  }, [amount, fromBalance, fromCurrency]);

  // Update currencies when trade type changes
  useEffect(() => {
    const creatorCoin: Currency = {
      type: "erc20",
      address: coinAddress as Address,
      symbol: coinData.symbol || "COIN",
      decimals: 18,
      name: coinData.name || "Creator Coin",
    };

    if (tradeType === "buy") {
      setFromCurrency(SUPPORTED_CURRENCIES[0]); // Default to ETH
      setToCurrency(creatorCoin);
    } else {
      setFromCurrency(creatorCoin);
      setToCurrency(SUPPORTED_CURRENCIES[0]); // Default to ETH
    }
  }, [tradeType, coinAddress, coinData]);

  // Fetch balance when fromCurrency changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !isHydrated) {
        setFromBalance(null);
        return;
      }

      try {
        const balance = await getFormattedBalance(
          fromCurrency.type,
          fromCurrency.address
          // Don't pass decimals, let the hook fetch the real ones
        );

        setFromBalance(balance);
      } catch (error) {
        // Set a default balance to prevent UI errors
        setFromBalance({
          raw: BigInt(0),
          formatted: "0",
          symbol: fromCurrency.symbol,
          decimals: fromCurrency.decimals,
        });
      }
    };

    fetchBalance();
  }, [fromCurrency, isConnected, getFormattedBalance, isHydrated]);

  // Get trade quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (
        !debouncedAmount ||
        parseFloat(debouncedAmount) <= 0 ||
        !isConnected ||
        !isHydrated
      ) {
        setEstimatedOutput("");
        return;
      }

      setIsGettingQuote(true);
      try {
        const amountIn =
          fromCurrency.type === "eth"
            ? parseEther(debouncedAmount)
            : parseUnits(
                debouncedAmount,
                fromBalance?.decimals || fromCurrency.decimals
              );

        const quote = await getTradeQuote({
          fromToken: {
            type: fromCurrency.type,
            address: fromCurrency.address,
            amount: amountIn,
          },
          toToken: {
            type: toCurrency.type,
            address: toCurrency.address,
          },
          slippage,
        });

        if (quote && quote.quote?.amountOut) {
          // Get the actual decimals for the to currency
          let toDecimals = toCurrency.decimals;
          if (toCurrency.type === "erc20" && toCurrency.address) {
            try {
              toDecimals = await getTokenDecimals(toCurrency.address);
            } catch (error) {
              // Use default decimals if unable to fetch
            }
          }

          const formatted =
            toCurrency.type === "eth"
              ? formatEther(BigInt(quote.quote.amountOut))
              : formatUnits(BigInt(quote.quote.amountOut), toDecimals);
          setEstimatedOutput(Number(formatted).toFixed(6));
        } else {
          setEstimatedOutput("Unable to estimate");
        }
      } catch (error) {
        setEstimatedOutput("Quote unavailable");
      } finally {
        setIsGettingQuote(false);
      }
    };

    getQuote();
  }, [
    debouncedAmount,
    fromCurrency,
    toCurrency,
    slippage,
    isConnected,
    getTradeQuote,
    isHydrated,
  ]);

  const handleCurrencySwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setAmount("");
    setEstimatedOutput("");

    // Update trade type based on what's being swapped
    const creatorCoinAddress = coinAddress.toLowerCase();
    if (temp.address?.toLowerCase() === creatorCoinAddress) {
      setTradeType("sell");
    } else if (toCurrency.address?.toLowerCase() === creatorCoinAddress) {
      setTradeType("buy");
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (!fromBalance || fromBalance.raw === BigInt(0)) return;

    try {
      const rawAmount = (fromBalance.raw * BigInt(percentage)) / BigInt(100);
      const formattedAmount =
        fromCurrency.type === "eth"
          ? formatEther(rawAmount)
          : formatUnits(rawAmount, fromBalance.decimals); // Use actual decimals from balance

      // Format to 6 decimal places max to avoid very long decimal numbers
      const cleanAmount = Number(formattedAmount)
        .toFixed(6)
        .replace(/\.?0+$/, "");
      setAmount(cleanAmount);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleTrade = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to trade",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Check if user has sufficient balance
    if (fromBalance) {
      const amountIn =
        fromCurrency.type === "eth"
          ? parseEther(amount)
          : parseUnits(amount, fromBalance.decimals); // Use actual decimals

      if (amountIn > fromBalance.raw) {
        toast({
          title: "Insufficient balance",
          description: `You only have ${Number(fromBalance.formatted).toFixed(
            6
          )} ${fromCurrency.symbol}`,
          status: "error",
          duration: 3000,
        });
        return;
      }
    }

    try {
      // Parse amount based on actual decimals
      const amountIn =
        fromCurrency.type === "eth"
          ? parseEther(amount)
          : parseUnits(amount, fromBalance?.decimals || fromCurrency.decimals);

      await executeTrade({
        fromToken: {
          type: fromCurrency.type,
          address: fromCurrency.address,
          amount: amountIn,
        },
        toToken: {
          type: toCurrency.type,
          address: toCurrency.address,
        },
        slippage,
      });

      // Refresh balances after successful trade
      toast({
        title: "Trade successful!",
        description: "Refreshing balances...",
        status: "success",
        duration: 3000,
      });

      // Refresh both from and to currency balances
      setTimeout(async () => {
        try {
          const newFromBalance = await refreshBalance(
            fromCurrency.type,
            fromCurrency.address
          );
          const newToBalance = await refreshBalance(
            toCurrency.type,
            toCurrency.address
          );

          setFromBalance(newFromBalance);
        } catch (error) {
          // Handle error silently
        }
      }, 2000); // Wait 2 seconds for blockchain confirmation

      // Reset form on success
      setAmount("");
      setEstimatedOutput("");
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const formatCurrencyAmount = (amount: string, currency: Currency) => {
    if (!amount) return "";
    try {
      const num = parseFloat(amount);
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: currency.decimals === 18 ? 6 : currency.decimals,
      });
    } catch {
      return amount;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg={"background"} color={"primary"}>
        <ModalHeader>
          <HStack>
            {coinData.image && (
              <Image
                src={coinData.image}
                alt={coinData.name}
                boxSize="32px"
                borderRadius="md"
              />
            )}
            <Text>Trade {coinData.symbol || "Coin"}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {!isHydrated ? (
            <VStack spacing={4} align="center" py={8}>
              <Spinner size="lg" />
              <Text>Loading trading interface...</Text>
            </VStack>
          ) : (
            <VStack spacing={4}>
              {/* Trade Type Selector */}
              <HStack spacing={2} width="100%">
                <Button
                  flex={1}
                  variant={tradeType === "buy" ? "solid" : "outline"}
                  colorScheme="green"
                  onClick={() => setTradeType("buy")}
                >
                  Buy {coinData.symbol}
                </Button>
                <Button
                  flex={1}
                  variant={tradeType === "sell" ? "solid" : "outline"}
                  colorScheme="red"
                  onClick={() => setTradeType("sell")}
                >
                  Sell {coinData.symbol}
                </Button>
              </HStack>

              {/* From Currency */}
              <Box width="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" color="gray.400">
                    From
                  </Text>
                  {fromBalance && (
                    <Text fontSize="xs" color="gray.500">
                      Balance: {Number(fromBalance.formatted).toFixed(6)}{" "}
                      {fromBalance.symbol !== "TOKEN"
                        ? fromBalance.symbol
                        : fromCurrency.symbol}
                    </Text>
                  )}
                </HStack>
                <VStack spacing={2}>
                  <HStack width="100%">
                    <Select
                      value={`${fromCurrency.type}-${
                        fromCurrency.address || "eth"
                      }`}
                      onChange={(e) => {
                        const [type, addr] = e.target.value.split("-");
                        if (type === "eth") {
                          setFromCurrency(SUPPORTED_CURRENCIES[0]);
                        } else {
                          const currency = SUPPORTED_CURRENCIES.find(
                            (c) => c.address === addr
                          ) || {
                            type: "erc20" as const,
                            address: coinAddress as Address,
                            symbol: coinData.symbol || "COIN",
                            decimals: 18,
                            name: coinData.name || "Creator Coin",
                          };
                          setFromCurrency(currency);
                        }
                      }}
                      disabled={tradeType === "buy"}
                    >
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <option
                          key={`${currency.type}-${currency.address || "eth"}`}
                          value={`${currency.type}-${
                            currency.address || "eth"
                          }`}
                        >
                          {currency.symbol} - {currency.name}
                        </option>
                      ))}
                      <option value={`erc20-${coinAddress}`}>
                        {coinData.symbol} - {coinData.name}
                      </option>
                    </Select>
                  </HStack>
                  <Input
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    step="any"
                  />

                  {/* Percentage Buttons */}
                  {fromBalance && isConnected && isHydrated && (
                    <HStack spacing={2} width="100%">
                      {[25, 50, 75, 100].map((percentage) => (
                        <Button
                          key={percentage}
                          size="xs"
                          variant="outline"
                          onClick={() => handlePercentageClick(percentage)}
                          flex={1}
                          colorScheme="blue"
                          isDisabled={fromBalance.raw === BigInt(0)}
                        >
                          {percentage}%
                        </Button>
                      ))}
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Swap Button */}
              <Button variant="ghost" onClick={handleCurrencySwap} size="sm">
                ↕️ Swap
              </Button>

              {/* To Currency */}
              <Box width="100%">
                <Text fontSize="sm" color="gray.400" mb={2}>
                  To (estimated)
                </Text>
                <VStack spacing={2}>
                  <HStack width="100%">
                    <Select
                      value={`${toCurrency.type}-${
                        toCurrency.address || "eth"
                      }`}
                      onChange={(e) => {
                        const [type, addr] = e.target.value.split("-");
                        if (type === "eth") {
                          setToCurrency(SUPPORTED_CURRENCIES[0]);
                        } else {
                          const currency = SUPPORTED_CURRENCIES.find(
                            (c) => c.address === addr
                          ) || {
                            type: "erc20" as const,
                            address: coinAddress as Address,
                            symbol: coinData.symbol || "COIN",
                            decimals: 18,
                            name: coinData.name || "Creator Coin",
                          };
                          setToCurrency(currency);
                        }
                      }}
                      disabled={tradeType === "sell"}
                    >
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <option
                          key={`${currency.type}-${currency.address || "eth"}`}
                          value={`${currency.type}-${
                            currency.address || "eth"
                          }`}
                        >
                          {currency.symbol} - {currency.name}
                        </option>
                      ))}
                      <option value={`erc20-${coinAddress}`}>
                        {coinData.symbol} - {coinData.name}
                      </option>
                    </Select>
                  </HStack>
                  <InputGroup>
                    <Input
                      placeholder={isGettingQuote ? "Getting quote..." : "0.0"}
                      value={estimatedOutput}
                      readOnly
                      bg="muted"
                    />
                    {isGettingQuote && (
                      <InputRightElement>
                        <Spinner size="sm" />
                      </InputRightElement>
                    )}
                  </InputGroup>
                </VStack>
              </Box>

              <Divider />

              {/* Advanced Settings */}
              <Box width="100%">
                <Button
                  variant="ghost"
                  size="sm"
                  width="100%"
                  justifyContent="space-between"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  rightIcon={
                    showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />
                  }
                >
                  <Text fontSize="sm" color="primary">
                    Advanced
                  </Text>
                </Button>
                
                {showAdvanced && (
                  <Box mt={3} p={3} bg="muted" borderRadius="md">
                    <VStack spacing={3}>
                      {/* Slippage */}
                      <Box width="100%">
                        <Text fontSize="sm" color="primary" mb={2}>
                          Slippage Tolerance
                        </Text>
                        <HStack>
                          <Input
                            type="number"
                            value={slippage}
                            onChange={(e) => setSlippage(Number(e.target.value))}
                            min="0.1"
                            max="50"
                            step="0.1"
                            width="100px"
                          />
                          <Text fontSize="sm">%</Text>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                )}
              </Box>

              {/* Wallet Connection Warning */}
              {!isConnected && (
                <Alert status="warning">
                  <AlertIcon />
                  <Text fontSize="sm">Please connect your wallet to trade</Text>
                </Alert>
              )}

              {/* Insufficient Balance Warning */}
              {isAmountExceedsBalance && (
                <Alert status="error">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Insufficient balance. You only have{" "}
                    {Number(fromBalance?.formatted || 0).toFixed(6)}{" "}
                    {fromCurrency.symbol}
                  </Text>
                </Alert>
              )}

              {/* Coin Info */}
              <Box width="100%" p={3} bg="muted" borderRadius="md">
                <VStack spacing={1} align="start" color={"primary"}>
                  <Text fontSize="sm" fontWeight="bold">
                    {coinData.name}
                  </Text>
                  <Text fontSize="xs">
                    Market Cap: {coinData.marketCap || "N/A"}
                  </Text>
                  <Text fontSize="xs">
                    Holders: {coinData.uniqueHolders || 0}
                  </Text>
                </VStack>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme={tradeType === "buy" ? "green" : "red"}
            onClick={handleTrade}
            isLoading={isTrading}
            loadingText="Trading..."
            isDisabled={
              !isConnected ||
              !amount ||
              parseFloat(amount) <= 0 ||
              isAmountExceedsBalance
            }
            size="lg"
          >
            {isTrading ? (
              <Spinner size="sm" />
            ) : (
              `${tradeType === "buy" ? "Buy" : "Sell"} ${coinData.symbol}`
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
