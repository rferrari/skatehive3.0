import { Box, HStack, Input, Button, Text } from "@chakra-ui/react";
import useIsMobile from "@/hooks/useIsMobile";

interface AmountInputProps {
    value: string;
    onChange: (value: string) => void;
    balance?: string;
    currency?: string;
    placeholder?: string;
    onMaxClick?: () => void;
}

/**
 * Reusable amount input component with max button
 */
export function AmountInput({
    value,
    onChange,
    balance,
    currency = "",
    placeholder = "Enter amount",
    onMaxClick,
}: AmountInputProps) {
    const isMobile = useIsMobile();

    const handleMaxClick = () => {
        if (onMaxClick) {
            onMaxClick();
        } else if (balance) {
            // Default behavior: parse balance and set as value
            const parsedBalance = parseFloat(balance.split(" ")[0]);
            if (!isNaN(parsedBalance)) {
                onChange(parsedBalance.toString());
            }
        }
    };

    return (
        <Box mb={4}>
            {balance && (
                <Text fontSize="sm" color="gray.400" mb={2}>
                    Available: {balance} {currency}
                </Text>
            )}
            <HStack>
                <Input
                    type="number"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    min={0}
                    step="any"
                    bg="muted"
                    border="1px solid"
                    borderColor="border"
                    color="text"
                    fontSize={isMobile ? "16px" : "md"}
                />
                {(balance || onMaxClick) && (
                    <Button
                        size={isMobile ? "sm" : "sm"}
                        variant="outline"
                        colorScheme="blue"
                        onClick={handleMaxClick}
                    >
                        🔝
                    </Button>
                )}
            </HStack>
        </Box>
    );
}
