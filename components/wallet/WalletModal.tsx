import { useState } from 'react';
import { Box, Button, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, IconButton, Flex } from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    showMemoField?: boolean;
    showUsernameField?: boolean; // New prop to show the username field
    onConfirm: (amount: number, direction: 'HIVE_TO_HBD' | 'HBD_TO_HIVE', username?: string, memo?: string) => void; // direction is now before optional params
}

export default function WalletModal({ isOpen, onClose, title, description, showMemoField = false, showUsernameField = false, onConfirm }: WalletModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [memo, setMemo] = useState<string>('');
    const [username, setUsername] = useState<string>(''); // State to hold username
    const [direction, setDirection] = useState<'HIVE_TO_HBD' | 'HBD_TO_HIVE'>('HIVE_TO_HBD');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleMemoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMemo(e.target.value);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleConfirm = () => {
        const parsedAmount = parseFloat(amount);
        onConfirm(
            isNaN(parsedAmount) ? 0 : parsedAmount,
            direction,
            showUsernameField ? username : undefined,
            showMemoField ? memo : undefined
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg="background" color="text" borderRadius="lg" border="1px solid" borderColor="border">
                <ModalHeader color="primary">{title}</ModalHeader>
                <ModalCloseButton color="text" _hover={{ color: "background", bg: "primary" }} />
                <ModalBody>
                    {description && <Text fontSize={'small'} mb={4} color="text">{description}</Text>}
                    {title.toLowerCase().includes('convert') && (
                        <Flex mb={4} align="center" justify="center" gap={4}>
                            <Text fontWeight="bold" fontSize="lg" color="primary">HIVE</Text>
                            <IconButton
                                aria-label="Flip direction"
                                icon={<ArrowForwardIcon />}
                                onClick={() => setDirection(direction === 'HIVE_TO_HBD' ? 'HBD_TO_HIVE' : 'HIVE_TO_HBD')}
                                variant="ghost"
                                fontSize="2xl"
                                color="primary"
                                _hover={{ color: "background", bg: "primary" }}
                                sx={{
                                    transition: 'transform 0.3s',
                                    transform: direction === 'HIVE_TO_HBD' ? 'rotate(0deg)' : 'rotate(180deg)',
                                }}
                            />
                            <Text fontWeight="bold" fontSize="lg" color="primary">HBD</Text>
                        </Flex>
                    )}
                    <Box mb={4}>
                        <Input
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={handleAmountChange}
                            min={0}
                            bg="muted"
                            border="1px solid"
                            borderColor="border"
                            color="text"
                        />
                    </Box>
                    {showUsernameField && (
                        <Box mb={4}>
                            <Input
                                placeholder="Enter username"
                                value={username}
                                onChange={handleUsernameChange}
                                bg="muted"
                                border="1px solid"
                                borderColor="border"
                                color="text"
                            />
                        </Box>
                    )}
                    {showMemoField && (
                        <Box mb={4}>
                            <Input
                                placeholder="Enter memo (optional)"
                                value={memo}
                                onChange={handleMemoChange}
                                bg="muted"
                                border="1px solid"
                                borderColor="border"
                                color="text"
                            />
                        </Box>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} color="primary" _hover={{ color: "background", bg: "primary" }}>Cancel</Button>
                    <Button ml={3} onClick={handleConfirm} color="background" bg="primary" _hover={{ bg: "accent", color: "background" }}>Confirm</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
