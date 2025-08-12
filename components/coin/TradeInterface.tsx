"use client";

import React from "react";
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  Text,
  Avatar,
  Spinner,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { formatUnits } from "viem";
import { UserBalance } from "@/types/coin";

interface TradeInterfaceProps {
  isBuying: boolean;
  setIsBuying: (buying: boolean) => void;
  tradeAmount: string;
  setTradeAmount: (amount: string) => void;
  tradeComment: string;
  setTradeComment: (comment: string) => void;
  formattedQuoteOutput: string;
  loadingQuote: boolean;
  quoteResult: any;
  isTrading: boolean;
  isConnected: boolean;
  ethBalance: any;
  userBalance: UserBalance | null;
  coinSymbol?: string;
  onTrade: () => void;
}

export const TradeInterface: React.FC<TradeInterfaceProps> = ({
  isBuying,
  setIsBuying,
  tradeAmount,
  setTradeAmount,
  tradeComment,
  setTradeComment,
  formattedQuoteOutput,
  loadingQuote,
  quoteResult,
  isTrading,
  isConnected,
  ethBalance,
  userBalance,
  coinSymbol = "COIN",
  onTrade,
}) => {
  return (
    <VStack spacing={{ base: 3, md: 4 }} align="stretch">
      {/* Buy/Sell Toggle */}
      <HStack spacing={0}>
        <Button
          variant="ghost"
          bg={isBuying ? "green.500" : "transparent"}
          color={isBuying ? "black" : "gray.400"}
          borderRadius="lg"
          flex="1"
          fontWeight="bold"
          h={{ base: "48px", md: "40px" }}
          fontSize={{ base: "md", md: "sm" }}
          onClick={() => setIsBuying(true)}
          _hover={{ bg: isBuying ? "green.400" : "gray.700" }}
        >
          Buy
        </Button>
        <Button
          variant="ghost"
          bg={!isBuying ? "red.500" : "transparent"}
          color={!isBuying ? "black" : "gray.400"}
          borderRadius="lg"
          flex="1"
          fontWeight="bold"
          h={{ base: "48px", md: "40px" }}
          fontSize={{ base: "md", md: "sm" }}
          onClick={() => setIsBuying(false)}
          _hover={{ bg: !isBuying ? "red.400" : "gray.700" }}
        >
          Sell
        </Button>
      </HStack>

      {/* Balance */}
      <HStack justify="space-between" flexWrap="wrap">
        <Text fontSize={{ base: "sm", md: "sm" }} color="gray.400">
          Balance
        </Text>
        <Text
          fontSize={{ base: "sm", md: "sm" }}
          color="gray.400"
          textAlign="right"
          wordBreak="break-all"
        >
          {isBuying
            ? ethBalance?.formatted
              ? `${parseFloat(ethBalance.formatted).toFixed(6)} ETH`
              : "0.000000 ETH"
            : userBalance?.formatted
            ? `${parseFloat(userBalance.formatted).toFixed(6)} ${coinSymbol}`
            : `0.000000 ${coinSymbol}`}
        </Text>
      </HStack>

      {/* Amount Input */}
      <Box>
        <Input
          placeholder={isBuying ? "0.000111" : "0.000111"}
          bg="gray.800"
          border="none"
          color="white"
          fontSize={{ base: "lg", md: "lg" }}
          h={{ base: "56px", md: "50px" }}
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          _placeholder={{ color: "gray.500" }}
        />
        <VStack spacing={3} mt={3}>
          <HStack
            spacing={{ base: 1, md: 2 }}
            flexWrap="wrap"
            justify="center"
            w="100%"
          >
            {isBuying ? (
              // Buy mode - show ETH amounts
              <>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => setTradeAmount("0.001")}
                  minW={{ base: "70px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                >
                  0.001 ETH
                </Button>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => setTradeAmount("0.01")}
                  minW={{ base: "70px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                >
                  0.01 ETH
                </Button>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => setTradeAmount("0.1")}
                  minW={{ base: "70px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                >
                  0.1 ETH
                </Button>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => setTradeAmount(ethBalance?.formatted || "0")}
                  minW={{ base: "50px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                >
                  Max
                </Button>
              </>
            ) : (
              // Sell mode - show percentages of token balance
              <>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="red"
                  minW={{ base: "50px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                  onClick={() => {
                    if (userBalance?.raw) {
                      const amount25 =
                        (userBalance.raw * BigInt(25)) / BigInt(100);
                      setTradeAmount(
                        formatUnits(amount25, userBalance.decimals)
                      );
                    }
                  }}
                  isDisabled={
                    !userBalance?.raw || userBalance.raw === BigInt(0)
                  }
                >
                  25%
                </Button>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="red"
                  minW={{ base: "50px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                  onClick={() => {
                    if (userBalance?.raw) {
                      const amount50 =
                        (userBalance.raw * BigInt(50)) / BigInt(100);
                      setTradeAmount(
                        formatUnits(amount50, userBalance.decimals)
                      );
                    }
                  }}
                  isDisabled={
                    !userBalance?.raw || userBalance.raw === BigInt(0)
                  }
                >
                  50%
                </Button>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="red"
                  minW={{ base: "50px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                  onClick={() => {
                    if (userBalance?.raw) {
                      const amount75 =
                        (userBalance.raw * BigInt(75)) / BigInt(100);
                      setTradeAmount(
                        formatUnits(amount75, userBalance.decimals)
                      );
                    }
                  }}
                  isDisabled={
                    !userBalance?.raw || userBalance.raw === BigInt(0)
                  }
                >
                  75%
                </Button>
                <Button
                  size={{ base: "sm", md: "xs" }}
                  variant="outline"
                  colorScheme="red"
                  minW={{ base: "50px", md: "auto" }}
                  fontSize={{ base: "xs", md: "xs" }}
                  onClick={() => {
                    if (userBalance?.raw) {
                      setTradeAmount(
                        formatUnits(userBalance.raw, userBalance.decimals)
                      );
                    }
                  }}
                  isDisabled={
                    !userBalance?.raw || userBalance.raw === BigInt(0)
                  }
                >
                  100%
                </Button>
              </>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Currency Selector */}
      <HStack justify="space-between" w="100%">
        <Box
          bg="gray.800"
          borderRadius="lg"
          p={{ base: 2, md: 3 }}
          display="flex"
          alignItems="center"
          cursor="pointer"
          flex="1"
          maxW="120px"
        >
          <Avatar size="xs" name="ETH" mr={2} />
          <Text fontSize={{ base: "sm", md: "sm" }} mr={2}>
            ETH
          </Text>
          <ChevronDownIcon />
        </Box>
      </HStack>

      {/* Comment Box */}
      <Box>
        <Input
          placeholder="Add a comment..."
          bg="gray.800"
          border="none"
          color="white"
          h={{ base: "48px", md: "40px" }}
          fontSize={{ base: "sm", md: "sm" }}
          value={tradeComment}
          onChange={(e) => setTradeComment(e.target.value)}
          _placeholder={{ color: "gray.500" }}
        />
      </Box>

      {/* Quote Preview */}
      {tradeAmount && (
        <Box bg="gray.800" p={3} borderRadius="lg">
          {loadingQuote ? (
            <HStack>
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.400">
                Getting quote...
              </Text>
            </HStack>
          ) : quoteResult ? (
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  {isBuying ? "You will receive" : "You will get"}
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={isBuying ? "green.400" : "blue.400"}
                >
                  {formattedQuoteOutput} {isBuying ? coinSymbol : "ETH"}
                </Text>
              </HStack>
              {quoteResult?.quote?.minimumAmountOut && (
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.500">
                    Minimum received
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatUnits(
                      BigInt(quoteResult.quote.minimumAmountOut),
                      18
                    )}{" "}
                    {isBuying ? coinSymbol : "ETH"}
                  </Text>
                </HStack>
              )}
            </VStack>
          ) : (
            <Text fontSize="sm" color="red.400">
              Unable to get quote
            </Text>
          )}
        </Box>
      )}

      {/* Buy/Sell Button */}
      <Button
        bg={isBuying ? "green.500" : "red.500"}
        color="black"
        size={{ base: "lg", md: "lg" }}
        fontWeight="bold"
        borderRadius="lg"
        h={{ base: "56px", md: "50px" }}
        fontSize={{ base: "lg", md: "md" }}
        onClick={onTrade}
        isLoading={isTrading}
        loadingText={isBuying ? "Buying..." : "Selling..."}
        isDisabled={!tradeAmount || !isConnected}
        _hover={{ bg: isBuying ? "green.400" : "red.400" }}
      >
        {isBuying ? "Buy" : "Sell"}
      </Button>
    </VStack>
  );
};
