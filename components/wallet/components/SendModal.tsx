import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightAddon,
  Divider,
  Box,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { TokenDetail, blockchainDictionary } from "../../../types/portfolio";
import { formatBalance, formatValue } from "../../../lib/utils/portfolioUtils";
import TokenLogo from "./TokenLogo";
import useIsMobile from "@/hooks/useIsMobile";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenDetail | null;
}

export default function SendModal({ isOpen, onClose, token }: SendModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const isMobile = useIsMobile();

  // Reset form when modal closes or token changes
  useEffect(() => {
    if (!isOpen) {
      setRecipientAddress("");
      setAmount("");
      setIsLoading(false);
    }
  }, [isOpen, token]);

  if (!token) return null;

  const networkInfo = blockchainDictionary[token.network];
  const maxAmount = token.token.balance;
  const estimatedValue = parseFloat(amount || "0") * (token.token.price || 0);

  const handleMaxClick = () => {
    setAmount(maxAmount.toString());
  };

  const handleSend = async () => {
    if (!recipientAddress || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter both recipient address and amount",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (parseFloat(amount) > maxAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Amount exceeds available balance",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual sending logic here
      // This would connect to wallet and execute the transaction

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Transaction Initiated",
        description: `Sending ${amount} ${
          token.token.symbol
        } to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Failed to send transaction. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "md"}>
      <ModalOverlay />
      <ModalContent
        bg="gray.900"
        border="1px solid"
        borderColor="gray.700"
        h={isMobile ? "100vh" : "auto"}
        borderRadius={isMobile ? "0" : "md"}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader flexShrink={0}>
          <HStack spacing={3}>
            <TokenLogo
              token={token}
              size="32px"
              showNetworkBadge={true}
              networkBadgeSize="12px"
            />
            <VStack spacing={0} align="start">
              <Text fontSize="lg" fontWeight="bold" color="white">
                Send {token.token.symbol}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {networkInfo?.alias || token.network}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody
          pb={isMobile ? "calc(1.5rem + env(safe-area-inset-bottom))" : 6}
          flex="1"
          overflowY="auto"
        >
          <VStack spacing={4} align="stretch">
            {/* Available Balance */}
            <Box
              p={4}
              bg="gray.800"
              borderRadius="none"
              border="1px solid"
              borderColor="gray.700"
            >
              <VStack spacing={1} align="start">
                <Text fontSize="sm" color="gray.400">
                  Available Balance
                </Text>
                <HStack justify="space-between" w="100%">
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {formatBalance(maxAmount)} {token.token.symbol}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {formatValue(token.token.balanceUSD)}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Recipient Address */}
            <FormControl>
              <FormLabel color="white" fontSize="sm">
                Recipient Address
              </FormLabel>
              <Input
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                bg="gray.800"
                border="1px solid"
                borderColor="gray.600"
                color="white"
                fontSize={isMobile ? "16px" : "md"}
                _placeholder={{ color: "gray.500" }}
                _focus={{
                  borderColor: "blue.400",
                  boxShadow: "0 0 0 1px #63B3ED",
                }}
              />
            </FormControl>

            {/* Amount */}
            <FormControl>
              <FormLabel color="white" fontSize="sm">
                Amount
              </FormLabel>
              <InputGroup>
                <Input
                  placeholder="0.0"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  bg="gray.800"
                  border="1px solid"
                  borderColor="gray.600"
                  fontSize={isMobile ? "16px" : "md"}
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 1px #63B3ED",
                  }}
                />
                <InputRightAddon bg="gray.700" borderColor="gray.600">
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="white">
                      {token.token.symbol}
                    </Text>
                    <Button size="xs" variant="ghost" onClick={handleMaxClick}>
                      MAX
                    </Button>
                  </HStack>
                </InputRightAddon>
              </InputGroup>
              {amount && (
                <Text fontSize="xs" color="gray.400" mt={1}>
                  ≈ {formatValue(estimatedValue)}
                </Text>
              )}
            </FormControl>

            {/* Warning for high amounts */}
            {parseFloat(amount || "0") > maxAmount * 0.8 && amount && (
              <Alert status="warning" bg="orange.900" borderColor="orange.700">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  You&apos;re sending a large portion of your balance. Please
                  double-check the amount.
                </AlertDescription>
              </Alert>
            )}

            <Divider borderColor="gray.700" />

            {/* Action Buttons */}
            <HStack spacing={3}>
              <Button
                variant="outline"
                borderColor="gray.600"
                color="white"
                _hover={{ bg: "gray.800" }}
                flex={1}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<FaPaperPlane />}
                flex={1}
                isLoading={isLoading}
                loadingText="Sending..."
                onClick={handleSend}
                isDisabled={
                  !recipientAddress || !amount || parseFloat(amount || "0") <= 0
                }
              >
                Send
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
