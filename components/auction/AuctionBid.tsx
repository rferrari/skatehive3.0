"use client";

import {
  useWriteAuctionCreateBid,
  useWriteAuctionSettleCurrentAndCreateNewAuction,
} from "@/hooks/wagmiGenerated";
import { useCallback, useState } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useForm } from "react-hook-form";
import { getConfig } from "@/lib/utils/wagmi";
import { DAO_ADDRESSES } from "@/lib/utils/constants";
import {
  calculateMinBid,
  handleAuctionError,
  validateBid,
} from "@/lib/utils/auction";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Link,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
  Divider,
  Center,
} from "@chakra-ui/react";
import { base } from "viem/chains";
import { Name, Avatar } from "@coinbase/onchainkit/identity";

interface Bid {
  bidder: string;
  amount: string;
}

interface BidProps {
  tokenId: bigint;
  winningBid: bigint;
  isAuctionRunning: boolean;
  reservePrice: string;
  minimumBidIncrement: string;
  onBid?: () => void;
  onSettle?: () => void;
  alignContent?: "left" | "right";
  onBidButtonHover?: (isHovering: boolean) => void;
  onBidSectionHover?: (isHovering: boolean) => void;
  bids: Bid[];
  isLatestAuction?: boolean;
}

export function AuctionBid({
  tokenId,
  winningBid,
  isAuctionRunning,
  reservePrice,
  minimumBidIncrement,
  onBid,
  onSettle,
  alignContent = "left",
  onBidButtonHover,
  onBidSectionHover,
  bids,
  isLatestAuction = false,
}: BidProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const account = useAccount();
  const chainId = useChainId();
  const [hasShownToast, setHasShownToast] = useState(false);
  const toast = require("@chakra-ui/react").useToast();
  const { switchChain } = useSwitchChain();

  const isOnBaseNetwork = chainId === base.id;

  const handleSwitchToBase = useCallback(async () => {
    if (!switchChain) return;

    try {
      await switchChain({ chainId: base.id });
    } catch (error: any) {
      toast({
        title: "Network Switch Failed",
        description: error.message || "Failed to switch to Base network",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [switchChain, toast]);

  // Calculate minimum bid: currentBid + (currentBid * increment%)
  const minBidValue = calculateMinBid(
    winningBid,
    BigInt(reservePrice),
    minimumBidIncrement
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: { bidAmount: formatEther(minBidValue) },
  });

  const { writeContractAsync: writeBid } = useWriteAuctionCreateBid();
  const { writeContractAsync: writeSettle } =
    useWriteAuctionSettleCurrentAndCreateNewAuction();

  const onSubmitBid = useCallback(
    async (data: { bidAmount: string }) => {
      setIsLoading(true);
      setErrorMessage(null);
      setTxHash(null);

      try {
        switchChain({ chainId: base.id });

        const txHash = await writeBid({
          address: DAO_ADDRESSES.auction,
          args: [tokenId],
          value: parseEther(data.bidAmount),
        });

        await waitForTransactionReceipt(getConfig(), { hash: txHash });
        setTxHash(txHash);

        // Show toast for successful transaction
        toast({
          title: "Transaction Successful!",
          description: (
            <>
              Your bid was placed successfully.{" "}
              <Link
                href={`https://basescan.org/tx/${txHash}`}
                isExternal
                color="primary"
                textDecoration="underline"
                _hover={{ color: "accent" }}
              >
                View on Basescan
              </Link>
            </>
          ),
          status: "success",
          duration: 9000,
          isClosable: true,
          position: "top",
        });
        setHasShownToast(true);

        // Update for next bid
        const currentBid = parseEther(data.bidAmount);
        const nextMinBid = calculateMinBid(
          currentBid,
          BigInt(reservePrice),
          minimumBidIncrement
        );
        setValue("bidAmount", formatEther(nextMinBid));

        // Wait for subgraph to update
        await new Promise((resolve) => setTimeout(resolve, 5000));
        onBid?.();
      } catch (error: any) {
        console.error("Bid failed:", error);
        setErrorMessage(handleAuctionError(error));
      } finally {
        setIsLoading(false);
      }
    },
    [
      tokenId,
      writeBid,
      onBid,
      minimumBidIncrement,
      setValue,
      reservePrice,
      switchChain,
      toast,
    ]
  );

  const handleSettle = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTxHash(null);

    try {
      const txHash = await writeSettle({
        address: DAO_ADDRESSES.auction,
      });
      await waitForTransactionReceipt(getConfig(), { hash: txHash });
      setTxHash(txHash);

      // Wait for subgraph to update
      await new Promise((resolve) => setTimeout(resolve, 5000));
      onSettle?.();
    } catch (error: any) {
      console.error("Settlement failed:", error);
      setErrorMessage(handleAuctionError(error));
    } finally {
      setIsLoading(false);
    }
  }, [writeSettle, onSettle]);

  return (
    <VStack spacing={4} align="stretch" w="full">
      {/* Error Alert */}
      {errorMessage && (
        <Alert
          status="error"
          bg="error"
          opacity={0.1}
          border="1px solid"
          borderColor="error"
          borderRadius="md"
          py={3}
        >
          <AlertIcon color="error" />
          <AlertDescription color="error" fontSize="sm">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Transaction Hash Toast handled in logic above */}

      {isAuctionRunning ? (
        <Box as="form" onSubmit={handleSubmit(onSubmitBid)} w="full">
          <VStack
            spacing={4}
            align={alignContent === "right" ? "end" : "stretch"}
          >
            <FormControl isInvalid={!!errors.bidAmount}>
              <FormLabel
                color="text"
                fontSize="sm"
                fontWeight="medium"
                mb={2}
                textAlign={alignContent === "right" ? "right" : "left"}
              >
                Your Bid (ETH)
              </FormLabel>
              <Input
                {...register("bidAmount", {
                  required: "Bid amount is required",
                  validate: (value) => {
                    const result = validateBid(
                      value,
                      winningBid,
                      BigInt(reservePrice),
                      minimumBidIncrement
                    );
                    return result.isValid || result.error || "Invalid bid";
                  },
                })}
                placeholder={`Minimum: ${formatEther(minBidValue)} ETH`}
                bg="background"
                border="1px solid"
                borderColor="border"
                color="text"
                size="lg"
                _hover={{ borderColor: "primary" }}
                _focus={{ borderColor: "primary", boxShadow: "outline" }}
                isDisabled={
                  !account.isConnected || isLoading || !isOnBaseNetwork
                }
                textAlign={alignContent === "right" ? "right" : "left"}
              />
              <FormErrorMessage color="error" fontSize="xs">
                {errors.bidAmount?.message}
              </FormErrorMessage>
              <Text
                fontSize="xs"
                color="accent"
                mt={1}
                textAlign={alignContent === "right" ? "right" : "left"}
              >
                Minimum bid: {formatEther(minBidValue)} ETH
              </Text>
            </FormControl>

            <Button
              type={isOnBaseNetwork ? "submit" : "button"}
              onClick={isOnBaseNetwork ? undefined : handleSwitchToBase}
              variant="solid"
              size="lg"
              width="full"
              bg={isOnBaseNetwork ? "primary" : "orange.500"}
              color="background"
              _hover={{
                bg: isOnBaseNetwork ? "accent" : "orange.600",
                color: "background",
              }}
              _disabled={{ bg: "muted", color: "text", cursor: "not-allowed" }}
              isDisabled={!account.isConnected || isLoading}
              isLoading={isLoading}
              loadingText={isOnBaseNetwork ? "Placing Bid..." : "Switching..."}
              h="48px"
              onMouseEnter={() => {
                onBidButtonHover?.(true);
                onBidSectionHover?.(true);
              }}
              onMouseLeave={() => {
                onBidButtonHover?.(false);
                onBidSectionHover?.(false);
              }}
            >
              {isLoading
                ? isOnBaseNetwork
                  ? "Placing Bid..."
                  : "Switching..."
                : isOnBaseNetwork
                ? "Place Bid"
                : "Switch to Base"}
            </Button>
          </VStack>
        </Box>
      ) : (
        <>
          {isLatestAuction && (
            <VStack spacing={4} align="stretch">
              <Button
                onClick={isOnBaseNetwork ? handleSettle : handleSwitchToBase}
                variant="solid"
                size="lg"
                width="full"
                bg={isOnBaseNetwork ? "success" : "orange.500"}
                color="background"
                _hover={{
                  bg: isOnBaseNetwork ? "primary" : "orange.600",
                  color: "background",
                }}
                _disabled={{
                  bg: "muted",
                  color: "text",
                  cursor: "not-allowed",
                }}
                isDisabled={!account.isConnected || isLoading}
                isLoading={isLoading}
                loadingText={isOnBaseNetwork ? "Settling..." : "Switching..."}
                h="48px"
              >
                {isLoading
                  ? isOnBaseNetwork
                    ? "Settling..."
                    : "Switching..."
                  : isOnBaseNetwork
                  ? "Start Next Auction"
                  : "Switch to Base"}
              </Button>
            </VStack>
          )}
        </>
      )}

      {/* Bid History */}
      <Box
        w="full"
        bg="muted"
        borderRadius="md"
        p={3}
        maxH="200px"
        overflowY="auto"
        position="relative"
        zIndex={1}
        sx={{
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--chakra-colors-border)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "var(--chakra-colors-primary)",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "var(--chakra-colors-border) transparent",
        }}
      >
        <VStack spacing={0} align="stretch" style={{ margin: 0, gap: 0 }}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="primary"
            textAlign="center"
          >
            Bid History
          </Text>
          {bids.length === 0 ? (
            <Box
              flex={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="muted"
              borderRadius="md"
              minH="100px"
            >
              <Text fontSize="sm" color="primary" textAlign="center">
                No bid history yet
              </Text>
            </Box>
          ) : (
            [...bids]
              .sort((a, b) => {
                const amountA = BigInt(a.amount);
                const amountB = BigInt(b.amount);
                return amountB > amountA ? 1 : amountB < amountA ? -1 : 0;
              })
              .map((bid, index) => (
                <HStack
                  key={index}
                  justify="space-between"
                  w="full"
                  py={2}
                  px={3}
                  bg="muted"
                  borderRadius="md"
                  style={{ margin: 0, gap: 0 }}
                >
                  <HStack spacing={1} style={{ marginTop: 0 }}>
                    <Avatar address={bid.bidder as `0x${string}`} />
                    <Name
                      address={bid.bidder as `0x${string}`}
                      className="font-bold text-sm text"
                      style={{ padding: 0, margin: 0 }}
                    />
                  </HStack>
                  <Text fontSize="sm" fontWeight="medium" color="text">
                    {formatEther(BigInt(bid.amount))} ETH
                  </Text>
                </HStack>
              ))
          )}
        </VStack>
      </Box>
    </VStack>
  );
}
