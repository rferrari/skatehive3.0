"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Image,
  useToast,
} from "@chakra-ui/react";
import {
  parseEther,
  parseUnits,
  formatEther,
  formatUnits,
  Address,
} from "viem";
import { useZoraTrade } from "@/hooks/useZoraTrade";
import { useProfileCoins } from "@/hooks/useProfileCoins";
import { useSwitchChain, useChainId } from "wagmi";
import { base } from "wagmi/chains";
import { ETH_ADDRESSES } from "@/config/app.config";

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
  image?: string; // Add optional image property
}

const USDC_ADDRESS = ETH_ADDRESSES.USDC; // Base USDC

// Base currencies that are always available
const BASE_CURRENCIES: Currency[] = [
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
    BASE_CURRENCIES[0]
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
  const [availableCurrencies, setAvailableCurrencies] =
    useState<Currency[]>(BASE_CURRENCIES);

  // Get profile coins for enhanced trading options - only when modal is open
  const { profileCoins } = useProfileCoins(isOpen);

  // Build available currencies from base currencies + profile coins
  useEffect(() => {
    const currencies = [...BASE_CURRENCIES];

    if (isOpen && profileCoins && profileCoins.length > 0) {
      profileCoins.forEach((coin) => {
        // Don't add the current coin being traded
        if (coin.address.toLowerCase() !== coinAddress.toLowerCase()) {
          currencies.push({
            type: "erc20" as const,
            address: coin.address as Address,
            symbol: coin.symbol,
            decimals: 18,
            name: coin.name,
            image: coin.image,
          });
        }
      });
    }

    setAvailableCurrencies(currencies);
  }, [profileCoins, coinAddress, isOpen]);

  const {
    executeTrade,
    getTradeQuote,
    getFormattedBalance,
    getTokenDecimals,
    getZoraInternalBalance,
    refreshBalance,
    isTrading,
    isConnected,
    ethBalance,
  } = useZoraTrade();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
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

  // Check if we're on the correct chain (Base)
  const isWrongChain = isConnected && chainId !== base.id;

  // Debug logging
  React.useEffect(() => {
    if (isConnected) {
    }
  }, [chainId, isConnected, isWrongChain]);

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
      // For buying, user can choose between ETH and USDC
      // Keep current selection if it's already ETH or USDC
      if (
        fromCurrency.type === "erc20" &&
        fromCurrency.address === coinAddress
      ) {
        setFromCurrency(availableCurrencies[0]); // Default to ETH
      }
      setToCurrency(creatorCoin);
    } else {
      // For selling, from currency is always the creator coin
      setFromCurrency(creatorCoin);
      // To currency can be ETH or USDC, keep current selection if valid
      if (toCurrency.type === "erc20" && toCurrency.address === coinAddress) {
        setToCurrency(availableCurrencies[0]); // Default to ETH
      }
    }
  }, [tradeType, coinAddress, coinData, availableCurrencies, fromCurrency.address, fromCurrency.type, toCurrency.address, toCurrency.type]);

  // Fetch balance when fromCurrency changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !isHydrated) {
        setFromBalance(null);
        return;
      }

      try {
        // Check if this is a profile coin first
        const profileCoin = profileCoins?.find(
          (coin) =>
            coin.address.toLowerCase() === fromCurrency.address?.toLowerCase()
        );

        if (profileCoin && profileCoin.formattedBalance) {
          // Use the balance from profile coins data

          // Convert formatted balance back to raw (approximate)
          const decimals = fromCurrency.decimals || 18;
          const rawBalance = parseUnits(profileCoin.formattedBalance, decimals);

          setFromBalance({
            raw: rawBalance,
            formatted: profileCoin.formattedBalance,
            symbol: fromCurrency.symbol,
            decimals: decimals,
          });

          console.log("✅ Using profile coin balance:", {
            formatted: profileCoin.formattedBalance,
            symbol: fromCurrency.symbol,
          });
          return;
        }

        // For non-profile coins (ETH, USDC), use the regular balance fetching
        const balance = await getFormattedBalance(
          fromCurrency.type,
          fromCurrency.address
        );
        setFromBalance(balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
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
  }, [
    fromCurrency,
    isConnected,
    getFormattedBalance,
    profileCoins,
    isHydrated,
  ]);

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

  const handleSwitchToBase = async () => {
    try {
      // Show loading state
      toast({
        title: "Switching to Base",
        description: "Please confirm the network switch in your wallet",
        status: "info",
        duration: 3000,
      });

      await switchChain({ chainId: base.id });

      // Wait for chain change to be reflected in the hook
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max wait

      while (chainId !== base.id && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (chainId === base.id) {
        toast({
          title: "Switched to Base",
          description: "You're now connected to Base network",
          status: "success",
          duration: 3000,
        });

        // Refresh balance after successful chain switch
        setTimeout(async () => {
          try {
            // Use external wallet balance for all tokens
            const newBalance = await getFormattedBalance(
              fromCurrency.type,
              fromCurrency.address
            );
            setFromBalance(newBalance);
          } catch (error) {
            console.error(
              "Error refreshing balance after chain switch:",
              error
            );
          }
        }, 500);
      } else {
        throw new Error("Chain switch timeout - still not on Base network");
      }
    } catch (error: any) {
      console.error("Chain switch failed:", error);

      // More specific error messages
      let errorMessage =
        "Please switch to Base network manually in your wallet";
      let status: "error" | "warning" = "error";
      let title = "Failed to switch network";

      if (
        error?.message?.includes("User rejected") ||
        error?.message?.includes("User denied")
      ) {
        title = "Network switch cancelled";
        errorMessage =
          "You cancelled the network switch. You can try again or switch manually in your wallet";
        status = "warning";
      } else if (error?.message?.includes("Unrecognized chain")) {
        errorMessage =
          "Base network not found in wallet. Please add Base network first";
      } else if (error?.message?.includes("timeout")) {
        errorMessage =
          "Chain switch timed out. Please try again or switch manually";
      } else if (error?.code === 4902) {
        errorMessage =
          "Base network not found. Please add Base network to your wallet first";
      } else if (error?.code === -32002) {
        errorMessage =
          "Switch request already pending. Please check your wallet";
      }

      toast({
        title,
        description: errorMessage,
        status,
        duration: status === "warning" ? 3000 : 5000,
      });
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

    // Double-check chain before executing trade
    if (chainId !== base.id) {
      toast({
        title: "Wrong network",
        description: "Please switch to Base network first",
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
      // Last-second chain check
      if (chainId !== base.id) {
        console.error("Chain mismatch detected at trade execution:", {
          current: chainId,
          expected: base.id,
        });
        toast({
          title: "Chain mismatch detected",
          description: `Still on chain ${chainId}, need to be on Base (${base.id})`,
          status: "error",
          duration: 5000,
        });
        return;
      }

      // Parse amount based on actual decimals
      const amountIn =
        fromCurrency.type === "eth"
          ? parseEther(amount)
          : parseUnits(amount, fromBalance?.decimals || fromCurrency.decimals);

      const result = await executeTrade({
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

      // If user cancelled the transaction, just return without further action
      if (result === null) {
        return;
      }

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
    } catch (error: any) {
      // Additional error handling for edge cases not covered in the hook
      console.error("Trade execution error in modal:", error);

      // Only show additional error if it's not a user cancellation
      if (
        !error?.message?.toLowerCase().includes("user denied") &&
        !error?.message?.toLowerCase().includes("user rejected")
      ) {
        // The hook already showed a toast, but we might want to do additional UI updates here
      }
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
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="background" color="primary" mx={4} borderRadius="xl">
        <ModalCloseButton color="primary" />

        <ModalBody p={6}>
          {!isHydrated ? (
            <VStack spacing={4} align="center" py={8}>
              <Spinner size="lg" />
              <Text>Loading trading interface...</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Trade Type Toggle */}
              <HStack spacing={0} bg="muted" borderRadius="xl" p={1}>
                <Button
                  flex={1}
                  variant={tradeType === "buy" ? "solid" : "ghost"}
                  bg={tradeType === "buy" ? "green.500" : "transparent"}
                  color={tradeType === "buy" ? "white" : "primary"}
                  borderRadius="lg"
                  onClick={() => setTradeType("buy")}
                  _hover={{
                    bg: tradeType === "buy" ? "green.600" : "muted",
                  }}
                >
                  Buy
                </Button>
                <Button
                  flex={1}
                  variant={tradeType === "sell" ? "solid" : "ghost"}
                  bg={tradeType === "sell" ? "pink.500" : "transparent"}
                  color={tradeType === "sell" ? "white" : "primary"}
                  borderRadius="lg"
                  onClick={() => setTradeType("sell")}
                  _hover={{
                    bg: tradeType === "sell" ? "pink.600" : "muted",
                  }}
                >
                  Sell
                </Button>
              </HStack>

              {/* Balance Display */}
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  Balance
                </Text>
                <Text fontSize="sm" color="primary">
                  {fromBalance
                    ? `${Number(fromBalance.formatted).toFixed(
                        fromCurrency.symbol === "USDC" ? 2 : 6
                      )} ${fromCurrency.symbol}`
                    : `0.${"0".repeat(
                        fromCurrency.symbol === "USDC" ? 2 : 6
                      )} ${fromCurrency.symbol}`}
                </Text>
              </HStack>

              {/* Amount Input */}
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Input
                    placeholder="0,000111"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    step="any"
                    fontSize="2xl"
                    fontWeight="light"
                    bg="transparent"
                    border="none"
                    _focus={{ border: "none", boxShadow: "none" }}
                    flex={1}
                  />
                  <Select
                    value={
                      tradeType === "buy"
                        ? `${fromCurrency.type}-${
                            fromCurrency.address || "eth"
                          }`
                        : `${toCurrency.type}-${toCurrency.address || "eth"}`
                    }
                    onChange={(e) => {
                      const [type, addr] = e.target.value.split("-");
                      const selectedCurrency = availableCurrencies.find(
                        (c: Currency) =>
                          (c.type === "eth" && addr === "eth") ||
                          (c.type === "erc20" && c.address === addr)
                      );

                      if (selectedCurrency) {
                        if (tradeType === "buy") {
                          setFromCurrency(selectedCurrency);
                        } else {
                          setToCurrency(selectedCurrency);
                        }
                      }
                    }}
                    bg="muted"
                    color="primary"
                    borderRadius="full"
                    border="none"
                    size="md"
                    width="120px"
                    _focus={{ border: "none", boxShadow: "none" }}
                  >
                    {availableCurrencies.map((currency: Currency) => (
                      <option
                        key={`${currency.type}-${currency.address || "eth"}`}
                        value={`${currency.type}-${currency.address || "eth"}`}
                        style={{
                          backgroundColor: "var(--chakra-colors-background)",
                          color: "var(--chakra-colors-primary)",
                        }}
                      >
                        {currency.symbol}
                      </option>
                    ))}
                  </Select>
                </HStack>

                {/* Quick Amount Buttons */}
                <HStack spacing={2}>
                  {tradeType === "buy"
                    ? // For buying, show preset amounts in the selected currency
                      (tradeType === "buy"
                        ? fromCurrency.symbol
                        : toCurrency.symbol) === "ETH"
                      ? [0.001, 0.01, 0.1].map((val) => (
                          <Button
                            key={val}
                            size="sm"
                            variant="outline"
                            borderColor="muted"
                            color="primary"
                            flex={1}
                            onClick={() => setAmount(val.toString())}
                          >
                            {val} ETH
                          </Button>
                        ))
                      : [1, 10, 100].map((val) => (
                          <Button
                            key={val}
                            size="sm"
                            variant="outline"
                            borderColor="muted"
                            color="primary"
                            flex={1}
                            onClick={() => setAmount(val.toString())}
                          >
                            {val} USDC
                          </Button>
                        ))
                    : // For selling, show percentage buttons
                      [25, 50, 75].map((percentage) => (
                        <Button
                          key={percentage}
                          size="sm"
                          variant="outline"
                          borderColor="muted"
                          color="primary"
                          flex={1}
                          onClick={() => handlePercentageClick(percentage)}
                          isDisabled={
                            !fromBalance || fromBalance.raw === BigInt(0)
                          }
                        >
                          {percentage}%
                        </Button>
                      ))}
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="muted"
                    color="primary"
                    onClick={() => {
                      if (fromBalance) {
                        const maxAmount =
                          fromCurrency.type === "eth"
                            ? formatEther(fromBalance.raw)
                            : formatUnits(
                                fromBalance.raw,
                                fromBalance.decimals
                              );
                        setAmount(
                          Number(maxAmount)
                            .toFixed(6)
                            .replace(/\.?0+$/, "")
                        );
                      }
                    }}
                    isDisabled={!fromBalance || fromBalance.raw === BigInt(0)}
                  >
                    {tradeType === "buy" ? "Max" : "100%"}
                  </Button>
                </HStack>

                {/* Comment Input */}
                <Input
                  placeholder="Add a comment..."
                  bg="muted"
                  border="none"
                  borderRadius="lg"
                  _focus={{ border: "none", boxShadow: "none" }}
                />

                {/* Trade Button */}
                <Button
                  size="lg"
                  bg={
                    isWrongChain
                      ? "orange.500"
                      : tradeType === "buy"
                      ? "green.500"
                      : "pink.500"
                  }
                  color="white"
                  borderRadius="xl"
                  onClick={isWrongChain ? handleSwitchToBase : handleTrade}
                  isLoading={isTrading}
                  loadingText="Trading..."
                  isDisabled={
                    !isConnected ||
                    (!isWrongChain &&
                      (!amount ||
                        parseFloat(amount) <= 0 ||
                        isAmountExceedsBalance))
                  }
                  _hover={{
                    bg: isWrongChain
                      ? "orange.600"
                      : tradeType === "buy"
                      ? "green.600"
                      : "pink.600",
                  }}
                  py={6}
                >
                  {isWrongChain
                    ? "Switch to Base Network"
                    : tradeType === "buy"
                    ? "Buy"
                    : "Sell"}
                </Button>

                {/* Minimum Received / Output Info */}
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.400">
                    {tradeType === "buy" ? "Minimum received" : "Only"}
                  </Text>
                  <HStack>
                    <Text fontSize="sm" color="green.400">
                      {estimatedOutput ||
                        (tradeType === "sell" ? "7,856,810" : "3,205")}
                    </Text>
                    {coinData.image && (
                      <Image
                        src={coinData.image}
                        alt={coinData.name}
                        boxSize="16px"
                        borderRadius="sm"
                      />
                    )}
                  </HStack>
                </HStack>

                {tradeType === "sell" && (
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    can be sold right now
                  </Text>
                )}
              </VStack>

              {/* Error Messages */}
              {!isConnected && (
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <Text fontSize="sm">Please connect your wallet to trade</Text>
                </Alert>
              )}

              {isWrongChain && (
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm">
                      Wrong network detected. Zora trading requires Base
                      network.
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Current:{" "}
                      {chainId === 1 ? "Ethereum Mainnet" : `Chain ${chainId}`}{" "}
                      | Required: Base (8453)
                    </Text>
                  </VStack>
                </Alert>
              )}

              {isAmountExceedsBalance && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Insufficient balance. You only have{" "}
                    {Number(fromBalance?.formatted || 0).toFixed(6)}{" "}
                    {fromCurrency.symbol}
                  </Text>
                </Alert>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
