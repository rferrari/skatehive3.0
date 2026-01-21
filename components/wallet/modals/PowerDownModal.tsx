import { useState } from "react";
import { Text, VStack, Box, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput } from "./components";
import { PowerDownModalProps } from "./types";
import { useHiveActions } from "@/hooks/wallet";

/**
 * Modal for powering down HIVE (unstaking Hive Power)
 */
export function PowerDownModal({
    isOpen,
    onClose,
    hivePower,
}: PowerDownModalProps) {
    const [amount, setAmount] = useState("");
    const { powerDown } = useHiveActions();
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

        const result = await powerDown(parsedAmount);

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast);
            onClose();
            setAmount("");
        } else if (result.error) {
            if (!isUserCancelled(result.error, result.errorCode)) {
                toast({
                    title: "Transaction Failed",
                    description: result.error || "Failed to power down HIVE",
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
            title="Power Down HIVE"
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText="Power Down"
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Unstake your Hive Power and convert it back to liquid HIVE.
                </Text>

                <Box p={3} bg="orange.900" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
                    <Text fontSize="sm" fontWeight="bold" color="orange.200" mb={2}>
                        ⚠️ Important: 13-Week Cooldown
                    </Text>
                    <Text fontSize="xs" color="orange.100">
                        Powered down HIVE will be returned to you in 13 equal weekly
                        installments. You will lose voting power and curation rewards during
                        this period.
                    </Text>
                </Box>

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={hivePower}
                    currency="HP"
                    placeholder="Amount to power down"
                />

                <Box p={2} bg="muted" borderRadius="md">
                    <Text fontSize="xs" color="gray.400">
                        💡 You can cancel the power down at any time before completion
                    </Text>
                </Box>
            </VStack>
        </BaseWalletModal>
    );
}
