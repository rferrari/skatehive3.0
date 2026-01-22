import { useState } from "react";
import { Text, VStack, Box, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput, UsernameInput } from "./components";
import { DelegateHiveModalProps } from "./types";
import { useHiveActions } from "@/hooks/wallet";

/**
 * Modal for delegating Hive Power to another account
 */
export function DelegateHiveModal({
    isOpen,
    onClose,
    hivePower,
}: DelegateHiveModalProps) {
    const [amount, setAmount] = useState("");
    const [username, setUsername] = useState("");
    const [isUsernameValid, setIsUsernameValid] = useState(false);

    const { delegate } = useHiveActions();
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

        if (!username || !isUsernameValid) {
            toast({
                title: "Invalid Username",
                description: "Please enter a valid username",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const result = await delegate(username, parsedAmount);

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast);
            onClose();
            setAmount("");
            setUsername("");
        } else if (result.error) {
            if (!isUserCancelled(result.error, result.errorCode)) {
                toast({
                    title: "Transaction Failed",
                    description: result.error || "Failed to delegate HIVE",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
    };

    const isConfirmDisabled = !amount || !username || !isUsernameValid;

    return (
        <BaseWalletModal
            isOpen={isOpen}
            onClose={onClose}
            title="Delegate Hive Power"
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText="Delegate"
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Delegate your Hive Power to another account to help them grow.
                </Text>

                <Box p={3} bg="muted" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" color="primary" mb={2}>
                        About Delegation:
                    </Text>
                    <Text fontSize="xs" color="text">
                        • Delegated HP increases the recipient&apos;s voting power
                        <br />
                        • You retain ownership of your HP
                        <br />
                        • Can be undelegated at any time
                        <br />• 5-day cooldown when undelegating
                    </Text>
                </Box>

                <UsernameInput
                    value={username}
                    onChange={setUsername}
                    onValidation={setIsUsernameValid}
                    placeholder="Recipient username"
                />

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={hivePower}
                    currency="HP"
                    placeholder="Amount to delegate"
                />

                <Box p={2} bg="blue.900" borderRadius="md" borderLeft="4px solid" borderColor="blue.500">
                    <Text fontSize="xs" color="blue.200">
                        💡 To undelegate, set the delegation amount to 0
                    </Text>
                </Box>
            </VStack>
        </BaseWalletModal>
    );
}
