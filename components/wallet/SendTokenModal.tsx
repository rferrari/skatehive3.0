import {
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
  Box,
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
import SkateModal from "@/components/shared/SkateModal";
import { formatBalance } from "../../lib/utils/portfolioUtils";
import useIsMobile from "@/hooks/useIsMobile";
import { ETH_ADDRESSES } from "@/config/app.config";
import { useTranslations } from "@/contexts/LocaleContext";

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
  const t = useTranslations();

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
        title: t('status.success'),
        description: t('wallet.transactionSuccessful'),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      handleClose();
    }
  }, [isSuccess, currentHash, toast, handleClose, t]);

  // Handle transaction error
  useEffect(() => {
    if (currentError) {
      toast({
        title: t('wallet.transactionFailed'),
        description: currentError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [currentError, toast, t]);

  const handleSend = async () => {
    if (!recipient || !amount || !address) {
      toast({
        title: t('common.error'),
        description: t('forms.errors.amountRequired'),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isAddress(recipient)) {
      toast({
        title: t('common.error'),
        description: t('forms.errors.invalidAddress'),
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
        title: t('common.error'),
        description: t('forms.errors.invalidAmount'),
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
    <SkateModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`send-${token.token.symbol.toLowerCase()}`}
      size={isMobile ? "full" : "md"}
      footer={
        <HStack spacing={3} w="full">
          <Button
            variant="ghost"
            flex={1}
            onClick={handleClose}
            borderColor="border"
          >
            {t('wallet.send.cancel')}
          </Button>
          <Button
            flex={1}
            bg="primary"
            color="background"
            onClick={handleSend}
            isLoading={isPending || isConfirming}
            loadingText={isPending ? t('wallet.send.sending') : t('wallet.send.confirming')}
            isDisabled={!recipient || !amount}
            _hover={{ bg: "accent", color: "background" }}
          >
            {isPending || isConfirming ? (
              <Spinner size="sm" color="background" />
            ) : (
              t('wallet.send.send')
            )}
          </Button>
        </HStack>
      }
    >
      <Box p={4}>
        <VStack spacing={4}>
            <Alert status="info" borderRadius="md" bg="muted" color="text">
              <AlertIcon color="primary" />
              <Text fontSize="sm" color="text">
                {t('wallet.send.balance')}: {formatBalance(token.token.balance)}{" "}
                {token.token.symbol}
              </Text>
            </Alert>

            <FormControl>
              <FormLabel color="primary">{t('wallet.send.recipient')}</FormLabel>
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
              <FormLabel color="primary">{t('wallet.send.amount')}</FormLabel>
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
                {t('wallet.send.decimals')}: {token.token.decimals}
              </Text>
            </FormControl>
          </VStack>
      </Box>
    </SkateModal>
  );
}
