import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  Image,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { parseUnits, isAddress } from "viem";
import { TokenDetail } from "../../types/portfolio";
import { formatBalance } from "../../lib/utils/portfolioUtils";
import useIsMobile from "@/hooks/useIsMobile";
import { ETH_ADDRESSES } from "@/config/app.config";

interface SendTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenDetail;
  tokenLogo?: string;
}

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export default function SendTokenModal({
  isOpen,
  onClose,
  token,
  tokenLogo,
}: SendTokenModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const toast = useToast();
  const { address } = useAccount();
  const isMobile = useIsMobile();

  // For ERC20 transfers
  const {
    writeContract,
    data: contractHash,
    error: contractError,
    isPending: isContractPending,
    reset: resetContract,
  } = useWriteContract();

  // For ETH transfers
  const {
    sendTransaction,
    data: ethHash,
    error: ethError,
    isPending: isEthPending,
    reset: resetEth,
  } = useSendTransaction();

  const currentHash = contractHash || ethHash;
  const currentError = contractError || ethError;
  const isPending = isContractPending || isEthPending;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: currentHash,
  });

  const handleClose = useCallback(() => {
    setRecipient("");
    setAmount("");
    resetContract();
    resetEth();
    onClose();
  }, [resetContract, resetEth, onClose]);

  useEffect(() => {
    if (isSuccess && currentHash) {
      toast({
        title: "Success",
        description: "Transaction sent successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      handleClose();
    }
  }, [isSuccess, currentHash, toast, handleClose]);

  // Handle transaction error
  useEffect(() => {
    if (currentError) {
      toast({
        title: "Transaction Failed",
        description: currentError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [currentError, toast]);

  const handleSend = async () => {
    if (!recipient || !amount || !address) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isAddress(recipient)) {
      toast({
        title: "Error",
        description: "Invalid recipient address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(String(token.token.balance));

    if (amountNum <= 0 || amountNum > balanceNum) {
      toast({
        title: "Error",
        description: "Invalid amount",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Ensure decimals is a number
      const decimals = Number(token.token.decimals);

      // parseUnits expects (value: string, decimals: number)
      const parsedAmount = parseUnits(amount as string, decimals);

      // Handle ETH transfer differently from ERC20 tokens
      if (
        token.token.address === ETH_ADDRESSES.ZERO
      ) {
        // ETH transfer
        sendTransaction({
          to: recipient as `0x${string}`,
          value: parsedAmount,
        });
      } else {
        // ERC20 token transfer
        writeContract({
          address: token.token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient as `0x${string}`, parsedAmount],
        });
      }
    } catch (err) {
      console.error("Transfer error:", err);
      toast({
        title: "Error",
        description: "Failed to send transaction",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={isMobile ? "full" : "md"}
    >
      <ModalOverlay />
      <ModalContent
        bg="background"
        color="text"
        borderRadius={isMobile ? "0" : "lg"}
        border="1px solid"
        borderColor="border"
        h={isMobile ? "100vh" : "auto"}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader flexShrink={0}>
          <HStack spacing={3}>
            {tokenLogo && (
              <Image
                src={tokenLogo}
                alt={token.token.symbol}
                w="32px"
                h="32px"
                borderRadius="full"
              />
            )}
            <Text color="primary">Send {token.token.symbol}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          color="text"
          _hover={{ color: "background", bg: "primary" }}
        />

        <ModalBody flex="1" overflowY="auto">
          <VStack spacing={4}>
            <Alert status="info" borderRadius="md" bg="muted" color="text">
              <AlertIcon color="primary" />
              <Text fontSize="sm" color="text">
                Balance: {formatBalance(token.token.balance)}{" "}
                {token.token.symbol}
              </Text>
            </Alert>

            <FormControl>
              <FormLabel color="primary">Recipient Address</FormLabel>
              <Input
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                bg="muted"
                border="1px solid"
                borderColor="border"
                color="text"
                fontSize={isMobile ? "16px" : "md"}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="primary">Amount</FormLabel>
              <Input
                type="number"
                step="any"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                bg="muted"
                border="1px solid"
                borderColor="border"
                color="text"
                fontSize={isMobile ? "16px" : "md"}
              />
              <Text fontSize="xs" color="muted" mt={1}>
                Decimals: {token.token.decimals}
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter
          flexShrink={0}
          pb={isMobile ? "calc(1.5rem + env(safe-area-inset-bottom))" : 4}
        >
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            color="primary"
            _hover={{ color: "background", bg: "primary" }}
          >
            Cancel
          </Button>
          <Button
            bg="primary"
            color="background"
            onClick={handleSend}
            isLoading={isPending || isConfirming}
            loadingText={isPending ? "Sending..." : "Confirming..."}
            disabled={!recipient || !amount}
            _hover={{ bg: "accent", color: "background" }}
          >
            {isPending || isConfirming ? (
              <Spinner size="sm" color="background" />
            ) : (
              "Send"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
