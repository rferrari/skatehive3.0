import { useState } from "react";
import { Text, VStack, Box, HStack, IconButton, useToast } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { BaseWalletModal, showTransactionSuccess, isUserCancelled } from "./BaseWalletModal";
import { AmountInput } from "./components";
import { ConvertHiveModalProps, ConversionDirection } from "./types";
import { useHBDActions } from "@/hooks/wallet";
import { useTranslations } from "@/contexts/LocaleContext";

/**
 * Modal for converting between HIVE and HBD
 */
export function ConvertHiveModal({
    isOpen,
    onClose,
    hiveBalance,
    hbdBalance,
}: ConvertHiveModalProps) {
    const [amount, setAmount] = useState("");
    const [direction, setDirection] = useState<ConversionDirection>("HIVE_TO_HBD");

    const { convertHive } = useHBDActions();
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

        const result = await convertHive(parsedAmount, direction);

        if (result.success && result.result) {
            showTransactionSuccess(result.result, toast, t);
            onClose();
            setAmount("");
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

    const toggleDirection = () => {
        setDirection(
            direction === "HIVE_TO_HBD" ? "HBD_TO_HIVE" : "HIVE_TO_HBD"
        );
        setAmount(""); // Reset amount when switching direction
    };

    const isConfirmDisabled = !amount || parseFloat(amount) <= 0;
    const currentBalance = direction === "HIVE_TO_HBD" ? hiveBalance : hbdBalance;
    const fromCurrency = direction === "HIVE_TO_HBD" ? "HIVE" : "HBD";
    const toCurrency = direction === "HIVE_TO_HBD" ? "HBD" : "HIVE";

    return (
        <BaseWalletModal
            isOpen={isOpen}
            onClose={onClose}
            title={t('wallet.convert')}
            onConfirm={handleConfirm}
            isConfirmDisabled={isConfirmDisabled}
            confirmText={t('buttons.convert')}
        >
            <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="text">
                    Convert between HIVE and HBD using the internal market.
                </Text>

                {/* Direction Selector */}
                <HStack justify="center" align="center" spacing={4} p={3} bg="muted" borderRadius="md">
                    <Text fontWeight="bold" fontSize="lg" color="primary">
                        {fromCurrency}
                    </Text>
                    <IconButton
                        aria-label="Flip direction"
                        icon={<ArrowForwardIcon />}
                        onClick={toggleDirection}
                        variant="ghost"
                        fontSize="2xl"
                        color="primary"
                        _hover={{ color: "background", bg: "primary" }}
                        sx={{
                            transition: "transform 0.3s",
                            transform:
                                direction === "HIVE_TO_HBD"
                                    ? "rotate(0deg)"
                                    : "rotate(180deg)",
                        }}
                    />
                    <Text fontWeight="bold" fontSize="lg" color="primary">
                        {toCurrency}
                    </Text>
                </HStack>

                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    balance={currentBalance}
                    currency={fromCurrency}
                    placeholder={`Amount of ${fromCurrency} to convert`}
                />

                <Box p={3} bg="blue.900" borderRadius="md" borderLeft="4px solid" borderColor="blue.500">
                    <Text fontSize="sm" fontWeight="bold" color="blue.200" mb={1}>
                        ⏱️ Conversion Time
                    </Text>
                    <Text fontSize="xs" color="blue.100">
                        Conversions take approximately 3.5 days to complete. The conversion
                        rate is determined at the time of execution, not when you submit.
                    </Text>
                </Box>

                <Box p={2} bg="muted" borderRadius="md">
                    <Text fontSize="xs" color="gray.400">
                        💡 Market rate conversions use the median price feed from witnesses
                    </Text>
                </Box>
            </VStack>
        </BaseWalletModal>
    );
}
