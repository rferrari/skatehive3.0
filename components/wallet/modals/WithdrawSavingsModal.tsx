import { useState } from "react";
import { Text, VStack, Box, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput } from "./components";
import { WithdrawHBDSavingsModalProps } from "./types";
import { useBankActions } from "@/hooks/wallet";

/**
 * Modal for withdrawing HBD from savings
 */
export function WithdrawSavingsModal({
    isOpen,
    onClose,
    savingsBalance,
}: WithdrawHBDSavingsModalProps) {
    const [amount, setAmount] = useState("");
    const { withdrawFromSavings } = useBankActions();
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

        const result = await withdrawFromSavings(parsedAmount, "HBD");

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast);
            onClose();
            setAmount("");
        } else if (result.error) {
            if (!isUserCancelled(result.error, result.errorCode)) {
                toast({
                    title: "Transaction Failed",
                    description: result.error || "Failed to withdraw from savings",
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
            title="Withdraw from HBD Savings"
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText="Withdraw"
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Withdraw HBD from your savings account.
                </Text>

                <Box p={3} bg="orange.900" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
                    <Text fontSize="sm" fontWeight="bold" color="orange.200" mb={2}>
                        ⏱️ 3-Day Waiting Period
                    </Text>
                    <Text fontSize="xs" color="orange.100">
                        HBD savings withdrawals are subject to a 3-day security waiting
                        period. Your funds will be available in your liquid balance after 3
                        days.
                    </Text>
                </Box>

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={savingsBalance}
                    currency="HBD"
                    placeholder="Amount to withdraw"
                />

                <Box p={2} bg="muted" borderRadius="md">
                    <Text fontSize="xs" color="gray.400">
                        💡 You can cancel pending withdrawals before they complete
                    </Text>
                </Box>

                <Box p={2} bg="red.900" borderRadius="md" borderLeft="4px solid" borderColor="red.500">
                    <Text fontSize="xs" color="red.200">
                        ⚠️ Withdrawn funds will stop earning 15% APR interest
                    </Text>
                </Box>
            </VStack>
        </BaseWalletModal>
    );
}
