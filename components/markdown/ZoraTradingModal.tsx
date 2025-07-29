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

  const { executeTrade, getTradeQuote, isTrading, isConnected } =
    useZoraTrade();
  const toast = useToast();
  const debouncedAmount = useDebounce(amount, 500); // Debounce amount input

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

  // Get trade quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (
        !debouncedAmount ||
        parseFloat(debouncedAmount) <= 0 ||
        !isConnected
      ) {
        setEstimatedOutput("");
        return;
      }

      setIsGettingQuote(true);
      try {
        const amountIn =
          fromCurrency.type === "eth"
            ? parseEther(debouncedAmount)
            : parseUnits(debouncedAmount, fromCurrency.decimals);

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
          const formatted =
            toCurrency.type === "eth"
              ? formatEther(BigInt(quote.quote.amountOut))
              : formatUnits(BigInt(quote.quote.amountOut), toCurrency.decimals);
          setEstimatedOutput(Number(formatted).toFixed(6));
        } else {
          setEstimatedOutput("Unable to estimate");
        }
      } catch (error) {
        console.error("Failed to get quote:", error);
        setEstimatedOutput("Unable to estimate");
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

    try {
      // Parse amount based on currency decimals
      const amountIn =
        fromCurrency.type === "eth"
          ? parseEther(amount)
          : parseUnits(amount, fromCurrency.decimals);

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

      // Reset form on success
      setAmount("");
      setEstimatedOutput("");
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error("Trade failed:", error);
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
      <ModalContent>
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
              <Text fontSize="sm" color="gray.400" mb={2}>
                From
              </Text>
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
                        value={`${currency.type}-${currency.address || "eth"}`}
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
                    value={`${toCurrency.type}-${toCurrency.address || "eth"}`}
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
                        value={`${currency.type}-${currency.address || "eth"}`}
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
                    bg="gray.50"
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

            {/* Slippage */}
            <Box width="100%">
              <Text fontSize="sm" color="gray.400" mb={2}>
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

            {/* Wallet Connection Warning */}
            {!isConnected && (
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">Please connect your wallet to trade</Text>
              </Alert>
            )}

            {/* Coin Info */}
            <Box width="100%" p={3} bg="gray.50" borderRadius="md">
              <VStack spacing={1} align="start">
                <Text fontSize="sm" fontWeight="bold">
                  {coinData.name}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Market Cap: {coinData.marketCap || "N/A"}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Holders: {coinData.uniqueHolders || 0}
                </Text>
              </VStack>
            </Box>
          </VStack>
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
            isDisabled={!isConnected || !amount || parseFloat(amount) <= 0}
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
