import {
    Button,
    useToast,
    HStack,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { CopyIcon } from "@chakra-ui/icons";
import SkateModal from "@/components/shared/SkateModal";
import { Box } from "@chakra-ui/react";

interface BaseWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    isConfirmDisabled?: boolean;
}

/**
 * Utility function to check if an error is from user cancellation
 * @param error - Error message
 * @param errorCode - Optional error code
 * @returns true if the error indicates user cancellation
 */
export function isUserCancelled(error?: any, errorCode?: number): boolean {
    if (!error) return false;

    // Convert to string and handle objects that might have a message property
    const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
    const lowerError = errorString.toLowerCase();

    return (
        lowerError.includes('cancel') ||
        lowerError.includes('user rejected') ||
        lowerError.includes('user denied') ||
        lowerError.includes('rejected') ||
        lowerError.includes('denied') ||
        errorCode === 4001
    );
}

/**
 * Base modal wrapper for all wallet operations
 * Provides consistent styling, mobile responsiveness, and transaction handling
 */
export function BaseWalletModal({
    isOpen,
    onClose,
    title,
    children,
    onConfirm,
    confirmText = "Confirm",
    isConfirmDisabled = false,
}: BaseWalletModalProps) {
    const isMobile = useIsMobile();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Transaction failed",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SkateModal
            isOpen={isOpen}
            onClose={onClose}
            title={title.toLowerCase().replace(/\s+/g, '-')}
            size={isMobile ? "full" : "md"}
            footer={
                <HStack spacing={3} justify="flex-end" width="100%">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        color="primary"
                        _hover={{ color: "background", bg: "primary" }}
                        isDisabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        color="background"
                        bg="primary"
                        _hover={{ bg: "accent", color: "background" }}
                        isLoading={isLoading}
                        isDisabled={isConfirmDisabled || isLoading}
                    >
                        {confirmText}
                    </Button>
                </HStack>
            }
        >
            <Box p={4}>
                {children}
            </Box>
        </SkateModal>
    );
}

/**
 * Show success toast with transaction ID
 */
export function showTransactionSuccess(txId: string, toast: any) {
    toast({
        title: "Success!",
        description: (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>Tx:</strong> {txId}
                <CopyIcon
                    cursor="pointer"
                    onClick={() => {
                        navigator.clipboard.writeText(txId);
                        toast({
                            title: "Copied!",
                            description: "TX copied to clipboard",
                            status: "info",
                            duration: 2000,
                            isClosable: true,
                        });
                    }}
                />
            </span>
        ),
        status: "success",
        duration: 8000,
        isClosable: true,
    });
}
