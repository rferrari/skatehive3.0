"use client";

import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Button,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckIcon, WarningIcon } from "@chakra-ui/icons";
import { tokenDictionary } from "@/lib/utils/tokenDictionary";
import TransactionStatusDisplay from "../TransactionStatusDisplay";
import useIsMobile from "@/hooks/useIsMobile";

interface ConfirmationStepProps {
  selectedToken: string;
  totalAmount: string;
  airdropUsers: any[];
  isHiveToken: boolean;
  isHiveConnected: boolean;
  isEthereumConnected: boolean;
  isExecuting: boolean;
  isApproving: boolean;
  isEstimating: boolean;
  costEstimate: any;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  status: any;
  onBack: () => void;
  onStartOver: () => void;
  onExecute: () => void;
  onApprove: () => void;
  onEstimateCost: () => void;
  onResetStatus: () => void;
}

export function ConfirmationStep({
  selectedToken,
  totalAmount,
  airdropUsers,
  isHiveToken,
  isHiveConnected,
  isEthereumConnected,
  isExecuting,
  isApproving,
  isEstimating,
  costEstimate,
  validation,
  status,
  onBack,
  onStartOver,
  onExecute,
  onApprove,
  onEstimateCost,
  onResetStatus,
}: ConfirmationStepProps) {
  const isMobile = useIsMobile();
  const selectedTokenInfo = tokenDictionary[selectedToken];

  return (
    <>
      <VStack spacing={6} align="stretch">
        {/* Final Summary */}
        <Box
          bg="cardBg"
          p={6}
          borderRadius="lg"
          border="2px solid"
          borderColor="primary"
        >
          <VStack spacing={4} align="center">
            {/* Token Logo */}
            <Image
              src={selectedTokenInfo?.tokenLogo}
              alt={selectedToken}
              boxSize="64px"
              objectFit="cover"
              borderRadius="full"
            />

            <VStack spacing={2} textAlign="center">
              <Text fontSize="xl" fontWeight="bold" color="primary">
                {totalAmount} {selectedToken} Airdrop
              </Text>
              <Text fontSize="lg" color="text">
                to {airdropUsers.length} recipients
              </Text>
              <Text fontSize="md" color="textSecondary">
                {(parseFloat(totalAmount) / airdropUsers.length).toFixed(2)}{" "}
                {selectedToken} per user
              </Text>
              <Badge colorScheme={isHiveToken ? "red" : "blue"} fontSize="sm">
                {isHiveToken ? "Hive Network" : "Base Network"}
              </Badge>
            </VStack>
          </VStack>
        </Box>

        {/* Cost Estimate */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="bold" color="primary">
              Cost Breakdown
            </Text>
            <Button
              size="sm"
              onClick={onEstimateCost}
              isLoading={isEstimating}
              loadingText="Estimating..."
              variant="ghost"
              color="primary"
            >
              {costEstimate ? "Refresh Estimate" : "Estimate Cost"}
            </Button>
          </HStack>

          {costEstimate && (
            <Box
              p={4}
              bg="cardBg"
              borderRadius="none"
              border="1px solid"
              borderColor="border"
            >
              {costEstimate.network === "hive" && (
                <VStack align="start" spacing={2} fontSize="sm" color="text">
                  <Text>
                    <strong>Network:</strong> Hive Blockchain
                  </Text>
                  <Text>
                    <strong>Resource Credits:</strong> ~
                    {airdropUsers.length * 50} RC
                  </Text>
                  <Text>
                    <strong>Transaction Fee:</strong> Free (RC based)
                  </Text>
                  <Text color="green.500">
                    <strong>Total Cost:</strong> 0 HIVE (only RC required)
                  </Text>
                </VStack>
              )}
              {costEstimate.network === "base" && (
                <VStack align="start" spacing={2} fontSize="sm" color="text">
                  <Text>
                    <strong>Network:</strong> Base Network
                  </Text>
                  <Text>
                    <strong>Token Amount:</strong> {costEstimate.tokenAmount}
                  </Text>
                  <Text>
                    <strong>Gas Estimate:</strong>{" "}
                    {costEstimate.gasEstimate?.totalCost || "N/A"} wei
                  </Text>
                  {costEstimate.errors?.length > 0 && (
                    <Alert status="warning" size="sm">
                      <AlertIcon />
                      <AlertDescription fontSize="xs">
                        {costEstimate.errors.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>
              )}
            </Box>
          )}
        </Box>

        {/* Token Approval for ERC-20 */}
        {!isHiveToken && (
          <Button
            onClick={onApprove}
            isLoading={isApproving}
            loadingText="Approving..."
            disabled={!validation.isValid || parseFloat(totalAmount) <= 0}
            leftIcon={isApproving ? undefined : <WarningIcon />}
            colorScheme="orange"
            size="md"
            width="100%"
          >
            {isApproving
              ? "Approving..."
              : `Approve ${selectedToken} Tokens First`}
          </Button>
        )}

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

        {/* Wallet Connection Warning */}
        {isHiveToken && !isHiveConnected && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Hive Wallet Required!</AlertTitle>
              <AlertDescription>
                Please connect your Hive wallet (Keychain, HiveAuth, etc.) to
                execute this airdrop.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {!isHiveToken && !isEthereumConnected && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Ethereum Wallet Required!</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet to execute this airdrop.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Transaction Status */}
        {(status.state !== "idle" || isExecuting) && (
          <TransactionStatusDisplay status={status} onReset={onResetStatus} />
        )}
      </VStack>
    </>
  );
}
