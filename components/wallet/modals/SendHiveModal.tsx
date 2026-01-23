import { useState } from "react";
import { Text, VStack, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput, UsernameInput, MemoInput } from "./components";
import { SendHiveModalProps } from "./types";
import { useHiveActions } from "@/hooks/wallet";
import { useTranslations } from "@/contexts/LocaleContext";

/**
 * Modal for sending HIVE to another account
 */
export function SendHiveModal({
    isOpen,
    onClose,
    balance,
}: SendHiveModalProps) {
    const [amount, setAmount] = useState("");
    const [username, setUsername] = useState("");
    const [memo, setMemo] = useState("");
    const [encryptMemo, setEncryptMemo] = useState(false);
    const [isUsernameValid, setIsUsernameValid] = useState(false);

    const { sendHive } = useHiveActions();
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

        // Add # prefix for encrypted memo
        const finalMemo = encryptMemo && memo ? `#${memo}` : memo;

        const result = await sendHive(username, parsedAmount, finalMemo);

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast, t);
            onClose();
            // Reset form
            setAmount("");
            setUsername("");
            setMemo("");
            setEncryptMemo(false);
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
            title={t('wallet.sendHive')}
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Transfer HIVE to another account on the Hive blockchain.
                </Text>

                <UsernameInput
                    value={username}
                    onChange={setUsername}
                    onValidation={setIsUsernameValid}
                />

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={balance}
                    currency="HIVE"
                />

                <MemoInput
                    value={memo}
                    onChange={setMemo}
                    encrypted={encryptMemo}
                    onToggleEncrypt={() => setEncryptMemo(!encryptMemo)}
                />
            </VStack>
        </BaseWalletModal>
    );
}
