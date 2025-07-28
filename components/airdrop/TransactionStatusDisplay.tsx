import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  Link,
  Button,
  Icon,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { TransactionStatus } from "@/types/airdrop";

interface TransactionStatusDisplayProps {
  status: TransactionStatus;
  onReset?: () => void;
}

const TransactionStatusDisplay: React.FC<TransactionStatusDisplayProps> = ({
  status,
  onReset,
}) => {
  const getStatusColor = () => {
    switch (status.state) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "idle":
        return "info";
      default:
        return "info";
    }
  };

  const getExplorerUrl = (hash: string) => {
    // Base network explorer for ERC-20 transactions
    if (hash.startsWith("0x")) {
      return `https://basescan.org/tx/${hash}`;
    }
    // Hive explorer for Hive transactions
    return `https://hiveblocks.com/tx/${hash}`;
  };

  if (status.state === "idle") {
    return null;
  }

  return (
    <Box
      w="full"
      p={4}
      bg="muted"
      borderRadius="lg"
      border="1px solid"
      borderColor="border"
    >
      <VStack spacing={4} align="stretch">
        <Alert status={getStatusColor()} bg="transparent" p={0}>
          <AlertIcon />
          <AlertDescription flex="1" color="text">
            {status.message}
          </AlertDescription>
        </Alert>

        {status.progress !== undefined &&
          status.state !== "completed" &&
          status.state !== "failed" && (
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="textSecondary">
                  Progress
                </Text>
                <Text fontSize="sm" color="textSecondary">
                  {status.progress}%
                </Text>
              </HStack>
              <Progress
                value={status.progress}
                colorScheme="green"
                size="sm"
                borderRadius="full"
                bg="border"
              />
            </VStack>
          )}

        {status.hash && (
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color="textSecondary">
              Transaction:
            </Text>
            <Link
              href={getExplorerUrl(status.hash)}
              isExternal
              color="primary"
              _hover={{ color: "accent" }}
              fontSize="sm"
              display="flex"
              alignItems="center"
              gap={1}
            >
              View on Explorer
              <Icon as={ExternalLinkIcon} boxSize={3} />
            </Link>
          </HStack>
        )}

        {status.error && (
          <Alert status="error" bg="red.50" borderRadius="md">
            <AlertIcon />
            <AlertDescription fontSize="sm" color="red.700">
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        {(status.state === "completed" || status.state === "failed") &&
          onReset && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              borderColor="border"
              color="text"
              _hover={{ borderColor: "primary", color: "primary" }}
            >
              Start New Airdrop
            </Button>
          )}
      </VStack>
    </Box>
  );
};

export default TransactionStatusDisplay;
