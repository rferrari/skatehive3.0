import { Box, Text, IconButton } from "@chakra-ui/react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface AssetsHeaderProps {
    showTokenBalances: boolean;
    onToggleBalances: () => void;
}

export default function AssetsHeader({ showTokenBalances, onToggleBalances }: AssetsHeaderProps) {
    return (
        <Box
            p={4}
            bg="background"
            borderRadius="md"
            mb={4}
            border="2px solid"
            borderColor="blue.200"
            textAlign="center"
            position="relative"
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            {/* Absolutely centered text */}
            <Box position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)" zIndex={1}>
                <Text fontSize="sm" color="blue.200" mb={1}>
                    Digital Assets
                </Text>
            </Box>
            {/* IconButton on the right */}
            <Box position="absolute" right={4} top="50%" transform="translateY(-50%)" zIndex={2}>
                <IconButton
                    aria-label={showTokenBalances ? "Hide Token Balances" : "Show Token Balances"}
                    icon={showTokenBalances ? <FaEyeSlash /> : <FaEye />}
                    onClick={onToggleBalances}
                    variant="ghost"
                    colorScheme="blue"
                    size="sm"
                />
            </Box>
        </Box>
    );
}
