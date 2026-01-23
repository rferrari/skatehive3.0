import { useState } from "react";
import { Text, VStack, Box, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput } from "./components";
import { PowerUpModalProps } from "./types";
import { useHiveActions } from "@/hooks/wallet";import { useTranslations } from "@/contexts/LocaleContext";
/**
 * Modal for powering up HIVE (converting to Hive Power)
 */
export function PowerUpModal({ isOpen, onClose, balance }: PowerUpModalProps) {
    const [amount, setAmount] = useState("");
    const { powerUp } = useHiveActions();
    const toast = useToast();
    const t = useTranslations();

    const handleConfirm = async () => {
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({
                title: t('forms.errors.invalidAmount'),
                description: t('forms.errors.amountRequired'),
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const result = await powerUp(parsedAmount);

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast, t);
            onClose();
            setAmount("");
        } else if (result.error) {
            // Only show error toast if not cancelled by user
            if (!isUserCancelled(result.error, result.errorCode)) {
                toast({
                    title: t('wallet.transactionFailed'),
                    description: result.error || t('notifications.error.failedToSend'),
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
            title={t('wallet.powerUp')}
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText={t('wallet.powerUp')}
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Convert your liquid HIVE to Hive Power for increased influence and
                    curation rewards.
                </Text>

                <Box p={3} bg="muted" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" color="primary" mb={2}>
                        Benefits of Hive Power:
                    </Text>
                    <Text fontSize="xs" color="text">
                        • Increased voting power for content curation
                        <br />
                        • Earn curation rewards
                        <br />
                        • Governance participation
                        <br />• Resource Credits for transactions
                    </Text>
                </Box>

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={balance}
                    currency="HIVE"
                    placeholder="Amount to power up"
                />

                <Box p={2} bg="yellow.900" borderRadius="md" borderLeft="4px solid" borderColor="yellow.500">
                    <Text fontSize="xs" color="yellow.200">
                        ⚠️ Powered up HIVE can be powered down over 13 weeks
                    </Text>
                </Box>
            </VStack>
        </BaseWalletModal>
    );
}
