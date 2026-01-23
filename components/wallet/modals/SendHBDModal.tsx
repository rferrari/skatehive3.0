import { useState } from "react";
import { Text, VStack, useToast } from "@chakra-ui/react";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput, UsernameInput, MemoInput } from "./components";
import { SendHBDModalProps } from "./types";
import { useHBDActions } from "@/hooks/wallet";
import { useTranslations } from "@/contexts/LocaleContext";

/**
 * Modal for sending HBD to another account
 */
export function SendHBDModal({ isOpen, onClose, balance }: SendHBDModalProps) {
    const [amount, setAmount] = useState("");
    const [username, setUsername] = useState("");
    const [memo, setMemo] = useState("");
    const [encryptMemo, setEncryptMemo] = useState(false);
    const [isUsernameValid, setIsUsernameValid] = useState(false);

    const { sendHBD } = useHBDActions();
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
                title: "Invalid Username",
                description: "Please enter a valid username",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        // Add # prefix for encrypted memo
        const finalMemo = encryptMemo && memo ? `#${memo}` : memo;

        const result = await sendHBD(username, parsedAmount, finalMemo);

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
                    title: "Transaction Failed",
                    description: result.error || "Failed to send HBD",
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
            title={t('wallet.sendHBD')}
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Transfer HBD (Hive Backed Dollars) to another account.
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
                    currency="HBD"
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
