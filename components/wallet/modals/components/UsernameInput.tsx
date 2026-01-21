import { Box, HStack, Input, Avatar, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { getProfile } from "@/lib/hive/client-functions";

interface UsernameInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onValidation?: (isValid: boolean) => void;
}

/**
 * Reusable username input component with avatar preview and validation
 */
export function UsernameInput({
    value,
    onChange,
    placeholder = "Enter username",
    onValidation,
}: UsernameInputProps) {
    const isMobile = useIsMobile();
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
        if (!value || value.length < 3) {
            setIsValid(null);
            onValidation?.(false);
            return;
        }

        const validateUsername = async () => {
            setIsValidating(true);
            try {
                await getProfile(value);
                setIsValid(true);
                onValidation?.(true);
            } catch (error) {
                setIsValid(false);
                onValidation?.(false);
            } finally {
                setIsValidating(false);
            }
        };

        const timeoutId = setTimeout(validateUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [value, onValidation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value.trim().toLowerCase());
    };

    return (
        <Box mb={4}>
            <HStack>
                <Avatar
                    src={`https://images.hive.blog/u/${value}/avatar/small`}
                    name={value}
                    size={isMobile ? "xs" : "sm"}
                />
                <Box flex={1}>
                    <Input
                        placeholder={placeholder}
                        value={value}
                        onChange={handleChange}
                        bg="muted"
                        border="1px solid"
                        borderColor={
                            isValid === null ? "border" : isValid ? "green.500" : "red.500"
                        }
                        color="text"
                        fontSize={isMobile ? "16px" : "md"}
                    />
                </Box>
            </HStack>
            {isValidating && (
                <Text fontSize="xs" color="gray.400" mt={1}>
                    Validating username...
                </Text>
            )}
            {isValid === false && value.length >= 3 && (
                <Text fontSize="xs" color="red.500" mt={1}>
                    Username not found
                </Text>
            )}
            {isValid === true && (
                <Text fontSize="xs" color="green.500" mt={1}>
                    Valid username ✓
                </Text>
            )}
        </Box>
    );
}
