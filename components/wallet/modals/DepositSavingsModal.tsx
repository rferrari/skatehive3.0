import { useState } from "react";
import { Text, VStack, Box, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput } from "./components";
import { DepositHBDSavingsModalProps } from "./types";
import { useBankActions } from "@/hooks/wallet";

/**
 * Modal for depositing HBD to savings (15% APR)
 */
export function DepositSavingsModal({
    isOpen,
    onClose,
    hbdBalance,
}: DepositHBDSavingsModalProps) {
    const [amount, setAmount] = useState("");
    const { depositToSavings } = useBankActions();
    const toast = useToast();

    const handleConfirm = async () => {
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const result = await depositToSavings(parsedAmount, "HBD");

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast);
            onClose();
            setAmount("");
        } else if (result.error) {
            if (!isUserCancelled(result.error, result.errorCode)) {
                toast({
                    title: "Transaction Failed",
                    description: result.error || "Failed to deposit to savings",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    };

    const isConfirmDisabled = !amount || parseFloat(amount) <= 0;

    return (
        <BaseWalletModal
            isOpen={isOpen}
            onClose={onClose}
            title="Deposit to HBD Savings"
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText="Deposit"
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Deposit HBD to your savings account and earn 15% APR!
                </Text>

                <Box p={3} bg="green.900" borderRadius="md" borderLeft="4px solid" borderColor="green.500">
                    <Text fontSize="sm" fontWeight="bold" color="green.200" mb={2}>
                        💰 Earn 15% APR
                    </Text>
                    <Text fontSize="xs" color="green.100">
                        • Guaranteed 15% annual interest on HBD savings
                        <br />
                        • Interest paid monthly
                        <br />
                        • Completely safe and secure
                        <br />• Backed by the Hive blockchain
                    </Text>
                </Box>

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={hbdBalance}
                    currency="HBD"
                    placeholder="Amount to deposit"
                />

                <Box p={2} bg="yellow.900" borderRadius="md" borderLeft="4px solid" borderColor="yellow.500">
                    <Text fontSize="xs" color="yellow.200">
                        ⚠️ Withdrawals from savings have a 3-day waiting period
                    </Text>
                </Box>

                <Box p={2} bg="muted" borderRadius="md">
                    <Text fontSize="xs" color="gray.400">
                        💡 Interest compounds monthly when claimed
                    </Text>
                </Box>
            </VStack>
        </BaseWalletModal>
    );
}
