import {
    Box,
    HStack,
    Input,
    IconButton,
    Tooltip,
    Text,
} from "@chakra-ui/react";
import { LockIcon, ViewIcon } from "@chakra-ui/icons";
import { useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";

interface MemoInputProps {
    value: string;
    onChange: (value: string) => void;
    encrypted: boolean;
    onToggleEncrypt: () => void;
    placeholder?: string;
    maxLength?: number;
}

/**
 * Reusable memo input component with encryption toggle
 */
export function MemoInput({
    value,
    onChange,
    encrypted,
    onToggleEncrypt,
    placeholder = "Enter memo (optional)",
    maxLength = 2048,
}: MemoInputProps) {
    const isMobile = useIsMobile();

    return (
        <Box mb={4}>
            <HStack>
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    bg="muted"
                    border="1px solid"
                    borderColor="border"
                    color="text"
                    fontSize={isMobile ? "16px" : "md"}
                />
                <Tooltip
                    label={encrypted ? "Encrypted memo" : "Public memo"}
                    placement="left"
                >
                    <IconButton
                        aria-label={encrypted ? "Disable encryption" : "Enable encryption"}
                        icon={encrypted ? <LockIcon /> : <ViewIcon />}
                        onClick={onToggleEncrypt}
                        colorScheme={encrypted ? "blue" : "gray"}
                        variant="outline"
                        size={isMobile ? "sm" : "md"}
                    />
                </Tooltip>
            </HStack>
            <HStack justify="space-between" mt={1}>
                <Text fontSize="xs" color="gray.400">
                    {encrypted ? "🔒 Encrypted" : "👁️ Public"}
                </Text>
                <Text fontSize="xs" color="gray.400">
                    {value.length}/{maxLength}
                </Text>
            </HStack>
        </Box>
    );
}
