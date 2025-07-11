import {
    Box,
    Text,
    Button,
    VStack,
    Icon,
    Divider,
} from "@chakra-ui/react";
import { FiUser } from "react-icons/fi";

interface ConnectHiveSectionProps {
    onConnectHive: () => void;
}

export default function ConnectHiveSection({ onConnectHive }: ConnectHiveSectionProps) {
    return (
        <Box
            p={6}
            bg="background"
            borderRadius="lg"
            border="2px solid"
            borderColor="green.200"
            textAlign="center"
        >
            <Icon as={FiUser} boxSize={12} color="green.200" mb={4} />
            <Text fontSize="lg" fontWeight="bold" color="green.200" mb={2}>
                Connect Your Hive Account
            </Text>
            <Text fontSize="sm" color="text" mb={4} opacity={0.8}>
                Connect your Hive account to access your HIVE, HBD, and Hive Power balances, plus unlock the SkateBank investment features.
            </Text>
            <Divider mb={4} borderColor="green.200" opacity={0.3} />
            <Button
                onClick={onConnectHive}
                colorScheme="green"
                variant="solid"
                size="lg"
                w="full"
                fontWeight="bold"
            >
                🚀 Connect Hive Wallet
            </Button>
        </Box>
    );
}
