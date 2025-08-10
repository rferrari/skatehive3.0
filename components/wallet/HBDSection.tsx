import {
    Box,
    Text,
    HStack,
    VStack,
    Tooltip,
    Icon,
    Image,
    Button,
    IconButton,
    Badge,
} from "@chakra-ui/react";
import {
    FaPaperPlane,
    FaArrowDown,
    FaArrowUp,
    FaQuestionCircle,
    FaPiggyBank,
} from "react-icons/fa";
import { useState, useCallback, useMemo, memo } from "react";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { useTheme } from "@/app/themeProvider";
import useIsMobile from "@/hooks/useIsMobile";

interface HBDSectionProps {
    hbdBalance: string;
    hbdSavingsBalance: string;
    hbdPrice: number | null;
    estimatedClaimableInterest: number;
    daysUntilClaim: number;
    lastInterestPayment?: string;
    onModalOpen: (
        title: string,
        description?: string,
        showMemoField?: boolean,
        showUsernameField?: boolean
    ) => void;
    onClaimInterest: () => void;
    isWalletView?: boolean;
    isBankView?: boolean;
}

function daysAgo(dateString: string) {
    const last = new Date(dateString);
    const now = new Date();
    const diff = Math.floor(
        (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
}

const HBDSection = memo(function HBDSection({
    hbdBalance,
    hbdSavingsBalance,
    hbdPrice,
    estimatedClaimableInterest,
    daysUntilClaim,
    lastInterestPayment,
    onModalOpen,
    onClaimInterest,
}: HBDSectionProps) {
    const { theme } = useTheme();
    const [showInfo, setShowInfo] = useState(false);
    const isMobile = useIsMobile();

    // Memoized calculations
    const liquidUsdValue = useMemo(() => {
        if (hbdBalance === "N/A" || !hbdPrice || parseFloat(hbdBalance) <= 0) {
            return null;
        }
        return (parseFloat(hbdBalance) * hbdPrice).toFixed(2);
    }, [hbdBalance, hbdPrice]);

    const savingsUsdValue = useMemo(() => {
        if (
            hbdSavingsBalance === "N/A" ||
            !hbdPrice ||
            parseFloat(hbdSavingsBalance) <= 0
        ) {
            return null;
        }
        return (parseFloat(hbdSavingsBalance) * hbdPrice).toFixed(2);
    }, [hbdSavingsBalance, hbdPrice]);

    const lastPaymentDays = useMemo(() => {
        return lastInterestPayment ? daysAgo(lastInterestPayment) : 0;
    }, [lastInterestPayment]);

    // Memoized event handlers
    const handleInfoToggle = useCallback(() => {
        setShowInfo((prev) => !prev);
    }, []);

    const handleSendHBD = useCallback(() => {
        onModalOpen("Send HBD", "Send HBD to another account", true, true);
    }, [onModalOpen]);

    const handleHBDToSavings = useCallback(() => {
        onModalOpen("HBD Savings", "Convert HBD to Savings (15% APR)");
    }, [onModalOpen]);

    const handleAddToSavings = useCallback(() => {
        onModalOpen("HBD Savings", "Add HBD to Savings (Earn 15% APR)");
    }, [onModalOpen]);

    const handleWithdrawFromSavings = useCallback(() => {
        onModalOpen(
            "Withdraw HBD Savings",
            "HBD savings balance is subject to a 3-day unstake (withdraw) waiting period.",
            false,
            false
        );
    }, [onModalOpen]);

    const handleWithdrawFromSavingsAlt = useCallback(() => {
        onModalOpen(
            "Withdraw HBD Savings",
            "HBD savings balance is subject to a 3-day unstake (withdraw) waiting period.",
            true,
            false
        );
    }, [onModalOpen]);

    const handleSendToSavings = useCallback(() => {
        onModalOpen("HBD Savings", "Send HBD to Savings");
    }, [onModalOpen]);

    // Wallet view: Only show liquid HBD
    return (
        <Box
            p={4}
            mt={2}
            mb={2}
            bg="transparent"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
        >
            <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                    <CustomHiveIcon color="lime" />
                    <Box>
                        <HStack spacing={2} align="center">
                            <Text fontSize="lg" fontWeight="bold" color="primary">
                                HBD
                            </Text>
                            <IconButton
                                aria-label="Info about HBD"
                                icon={<FaQuestionCircle />}
                                size="xs"
                                variant="ghost"
                                color="gray.400"
                                onClick={handleInfoToggle}
                            />
                        </HStack>
                        {/* {!isMobile && (
                                <Text fontSize="sm" color="gray.400">
                                    Liquid HBD ready for transactions
                                </Text>
                            )} */}
                    </Box>
                </HStack>

                <HStack spacing={3} align="center">
                    <HStack spacing={1}>
                        <Tooltip label="Send HBD" hasArrow>
                            <IconButton
                                aria-label="Send HBD"
                                icon={<FaPaperPlane />}
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                onClick={handleSendHBD}
                            />
                        </Tooltip>
                        <Tooltip label="Convert to Savings" hasArrow>
                            <IconButton
                                aria-label="Convert to Savings"
                                icon={<FaPiggyBank />}
                                size="sm"
                                colorScheme="green"
                                variant="outline"
                                onClick={handleHBDToSavings}
                            />
                        </Tooltip>
                    </HStack>
                    <Box textAlign="right">
                        <Text fontSize="2xl" fontWeight="bold" color="primary">
                            {hbdBalance}
                        </Text>
                        {liquidUsdValue && (
                            <Text fontSize="sm" color="gray.400">
                                (${liquidUsdValue})
                            </Text>
                        )}
                    </Box>
                </HStack>
            </HStack>

            {showInfo && (
                <Box mt={3} p={3} bg="muted" borderRadius="md">
                    <Text color="gray.400" fontSize="sm">
                        Liquid HBD ready for transactions. Convert to Savings in SkateBank
                        to earn 15% APR!
                    </Text>
                </Box>
            )}
        </Box>
    );

});

export default HBDSection;
