import { useState } from "react";
import { Text, VStack, Box, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput, UsernameInput } from "./components";
import { DelegateHiveModalProps } from "./types";
import { useHiveActions } from "@/hooks/wallet";
import { useTranslations } from "@/contexts/LocaleContext";
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

        if (!username || !isUsernameValid) {
            toast({
                title: t('forms.errors.invalidUsername'),
                description: t('forms.errors.usernameRequired'),
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const result = await delegate(username, parsedAmount);

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast, t);
            onClose();
            setAmount("");
            setUsername("");
        } else if (result.error) {
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

    const isConfirmDisabled = !amount || !username || !isUsernameValid;

    return (
        <BaseWalletModal
            isOpen={isOpen}
            onClose={onClose}
            title={t('wallet.delegate')}
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText={t('wallet.delegate')}
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    {t('wallet.delegateDescription')}
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
                    placeholder={t('forms.placeholders.enterUsername')}
                />

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={hivePower}
                    currency="HP"
                    placeholder={t('forms.placeholders.enterAmount')}
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
