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
} from "@chakra-ui/react";
import { tokenDictionary } from "@/lib/utils/tokenDictionary";
import useIsMobile from "@/hooks/useIsMobile";

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
          <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
            Choose Token
          </Text>
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
        </Box>

        {/* Amount Selection */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
            Total Amount
          </Text>
          <FormControl isInvalid={parseFloat(totalAmount) <= 0}>
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
            <FormErrorMessage>Amount must be greater than 0</FormErrorMessage>
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
