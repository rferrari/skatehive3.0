"use client";
import { safeCopyToClipboard } from "@/lib/utils/clipboardUtils";

import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  IconButton,
  Link,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { CopyIcon, ExternalLinkIcon, CheckIcon } from "@chakra-ui/icons";

interface AddressDisplayProps {
  label: string;
  address: string;
  type: "ethereum" | "hive";
  balance?: string | React.ReactNode;
  isLoading?: boolean;
}

export const AddressDisplay = ({
  label,
  address,
  type,
  balance,
  isLoading,
}: AddressDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copyToClipboard = async () => {
    if (!address || address === "Not configured") {
      toast({
        title: "Cannot Copy",
        description: "Address is not configured",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const result = await safeCopyToClipboard(address, {
      successMessage: "Address Copied",
      errorMessage: "Copy Failed",
      showToast: (options) => toast({
        title: options.title,
        description: options.status === "success" 
          ? `${label} address copied to clipboard` 
          : "Failed to copy address to clipboard",
        status: options.status,
        duration: 2000,
        isClosable: true,
      })
    });

    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  

  const getExplorerLink = () => {
    if (type === "ethereum") {
      return `https://basescan.org/address/${address}`;
    } else {
      return `https://hivehub.dev/@${address}`;
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr || type === "hive") return addr; // Don't truncate Hive usernames or if address is undefined
    if (addr.length < 10) return addr; // Don't truncate short addresses
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card
      variant="outline"
      bg={"background"}
      borderColor={"muted"}
      _hover={{ borderColor: "primary" }}
      transition="border-color 0.2s"
      w="full"
      h="auto"
      minH="120px"
    >
      <CardBody p={4}>
        <VStack align="stretch" spacing={3} h="full">
          <HStack justify="space-between" align="flex-start">
            <VStack align="start" spacing={1} flex="1" minW="0">
              <HStack spacing={2} align="center" w="full">
                <Text
                  color={"primary"}
                  fontWeight="semibold"
                  fontSize="md"
                  isTruncated
                  maxW="calc(100% - 60px)"
                >
                  {label}
                </Text>
                <HStack spacing={1} flexShrink={0}>
                  <IconButton
                    aria-label="Copy address"
                    icon={copied ? <CheckIcon /> : <CopyIcon />}
                    size="xs"
                    variant="ghost"
                    colorScheme={copied ? "green" : "gray"}
                    color={copied ? "green.400" : "accent"}
                    _hover={{ color: copied ? "green.300" : "primary" }}
                    onClick={copyToClipboard}
                    isDisabled={!address || address === "Not configured"}
                  />
                  <IconButton
                    aria-label="View on explorer"
                    icon={<ExternalLinkIcon />}
                    size="xs"
                    variant="ghost"
                    color={"accent"}
                    _hover={{ color: "primary" }}
                    as={Link}
                    href={getExplorerLink()}
                    isExternal
                    isDisabled={!address || address === "Not configured"}
                  />
                </HStack>
              </HStack>
            </VStack>
            <Box flex="0 0 auto">
              {isLoading ? (
                <HStack spacing={2}>
                  <Spinner size="sm" color={"primary"} />
                  <Text color={"accent"} fontSize="sm">
                    Loading...
                  </Text>
                </HStack>
              ) : typeof balance === "string" ? (
                <Text
                  color={"primary"}
                  fontWeight="bold"
                  fontSize="xl"
                  textAlign="right"
                >
                  {balance || "No data"}
                </Text>
              ) : (
                balance || (
                  <Text color={"primary"} fontWeight="bold" fontSize="xl">
                    No data
                  </Text>
                )
              )}
            </Box>
          </HStack>
          <Box>
            <Text
              color={"accent"}
              fontFamily="mono"
              fontSize="xs"
              wordBreak="break-all"
              display={{ base: "none", md: "block" }}
              opacity={0.7}
            >
              {address}
            </Text>
            <Text
              color={"accent"}
              fontFamily="mono"
              fontSize="xs"
              display={{ base: "block", md: "none" }}
              opacity={0.7}
            >
              {truncateAddress(address)}
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};
