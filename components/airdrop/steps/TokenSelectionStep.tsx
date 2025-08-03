"use client";

import {
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
  Box,
  Badge,
  Button,
  Image,
  Center,
  Flex,
} from "@chakra-ui/react";
import { tokenDictionary } from "@/lib/utils/tokenDictionary";
import useIsMobile from "@/hooks/useIsMobile";
import { useUserBalances } from "@/hooks/useUserBalances";

interface TokenSelectionStepProps {
  selectedToken: string;
  totalAmount: string;
  tokenOptions: Array<{ value: string; label: string; disabled: boolean }>;
  isHiveConnected: boolean;
  isEthereumConnected: boolean;
  onConfigChange: (updates: {
    selectedToken?: string;
    totalAmount?: string;
  }) => void;
  onNext: () => void;
  onCancel: () => void;
}

export function TokenSelectionStep({
  selectedToken,
  totalAmount,
  tokenOptions,
  isHiveConnected,
  isEthereumConnected,
  onConfigChange,
  onNext,
  onCancel,
}: TokenSelectionStepProps) {
  const isMobile = useIsMobile();
  const selectedTokenInfo = tokenDictionary[selectedToken];
  const { getTokenBalance } = useUserBalances();

  // Get balance for selected token
  const tokenBalance = selectedToken ? getTokenBalance(selectedToken) : null;

  // Check if amount exceeds balance
  const exceedsBalance =
    tokenBalance && parseFloat(totalAmount) > parseFloat(tokenBalance.balance);

  return (
    <>
      <VStack spacing={6} align="stretch">
        {/* Token Logo Display */}
        {selectedToken && (
          <Center>
            <Image
              src={selectedTokenInfo?.tokenLogo}
              alt={selectedToken}
              boxSize={isMobile ? "64px" : "80px"}
              objectFit="cover"
              borderRadius="full"
            />
          </Center>
        )}

        {/* Token Selection */}
        <Box>
          <FormControl>
            <FormLabel color="text">Available Tokens</FormLabel>
            <Select
              value={selectedToken}
              onChange={(e) =>
                onConfigChange({ selectedToken: e.target.value })
              }
              bg="cardBg"
              borderColor="border"
              fontSize={isMobile ? "16px" : "md"}
              placeholder="Select a token..."
            >
              {tokenOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Connection Status */}
          <VStack spacing={2} mt={3} align="start">
            {!isHiveConnected && !isEthereumConnected && (
              <Badge colorScheme="orange" size="sm">
                ⚠ No Wallets Connected
              </Badge>
            )}
          </VStack>

          {/* Token Balance Display */}
          {selectedToken && tokenBalance && (
            <Box
              mt={3}
              p={3}
              bg="cardBg"
              borderRadius="md"
              border="1px solid"
              borderColor="border"
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="textSecondary">
                  Available Balance:
                </Text>
                <VStack spacing={1} align="end">
                  <Text fontSize="sm" fontWeight="semibold" color="text">
                    {parseFloat(tokenBalance.balance).toLocaleString()}{" "}
                    {selectedToken}
                  </Text>
                  {tokenBalance.usdValue && (
                    <Text fontSize="xs" color="textSecondary">
                      ≈ $
                      {tokenBalance.usdValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </Text>
                  )}
                </VStack>
              </Flex>
            </Box>
          )}

          {/* No Balance Warning */}
          {selectedToken &&
            !tokenBalance &&
            (isHiveConnected || isEthereumConnected) && (
              <Box
                mt={3}
                p={3}
                bg="orange.50"
                _dark={{ bg: "orange.900", borderColor: "orange.700" }}
                borderRadius="md"
                border="1px solid"
                borderColor="orange.200"
              >
                <HStack spacing={2}>
                  <Text fontSize="12px">⚠️</Text>
                  <Text
                    fontSize="sm"
                    color="orange.600"
                    _dark={{ color: "orange.200" }}
                  >
                    No {selectedToken} balance found in connected wallets
                  </Text>
                </HStack>
              </Box>
            )}
        </Box>

        {/* Amount Selection */}
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            {/* Use Max Button */}
            {tokenBalance && parseFloat(tokenBalance.balance) > 0 && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={() =>
                  onConfigChange({
                    totalAmount: parseFloat(tokenBalance.balance).toFixed(2),
                  })
                }
              >
                Use Max ({parseFloat(tokenBalance.balance).toFixed(2)})
              </Button>
            )}
          </HStack>
          <FormControl
            isInvalid={parseFloat(totalAmount) <= 0 || !!exceedsBalance}
          >
            <FormLabel color="text">
              Total {selectedToken} to distribute
            </FormLabel>
            <NumberInput
              value={totalAmount}
              onChange={(value) => onConfigChange({ totalAmount: value })}
              min={0}
              precision={2}
              size={isMobile ? "md" : "lg"}
            >
              <NumberInputField
                bg="cardBg"
                borderColor="border"
                fontSize={isMobile ? "16px" : "lg"}
                h={isMobile ? "48px" : "56px"}
              />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>
              {parseFloat(totalAmount) <= 0
                ? "Amount must be greater than 0"
                : exceedsBalance
                ? `Amount exceeds your balance of ${parseFloat(
                    tokenBalance?.balance || "0"
                  ).toFixed(2)} ${selectedToken}`
                : ""}
            </FormErrorMessage>
          </FormControl>
        </Box>

        {/* Quick Amount Suggestions */}
        {selectedToken && (
          <Box>
            <Text fontSize="sm" color="textSecondary" mb={2}>
              Quick amounts:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {["100", "500", "1000", "5000"].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => onConfigChange({ totalAmount: amount })}
                  borderColor="border"
                  color="text"
                  _hover={{ bg: "primary", color: "background" }}
                >
                  {amount} {selectedToken}
                </Button>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </>
  );
}
