import {
    Box,
    Text,
    VStack,
    HStack,
    Progress,
    Badge,
    Divider,
    useColorModeValue,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
} from "@chakra-ui/react";
import { memo } from "react";
import { formatValue, formatBalance } from "../../lib/utils/portfolioUtils";
import { PortfolioData } from "../../types/portfolio";

interface PortfolioBreakdownProps {
    portfolio: PortfolioData | null;
    farcasterPortfolio: PortfolioData | null;
    farcasterVerifiedPortfolios: Record<string, PortfolioData>;
    hiveValue: number;
    hiveUsername?: string;
}

const PortfolioBreakdown = memo(function PortfolioBreakdown({
    portfolio,
    farcasterPortfolio,
    farcasterVerifiedPortfolios,
    hiveValue,
    hiveUsername,
}: PortfolioBreakdownProps) {
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const ethereumValue = portfolio?.totalNetWorth || 0;
    const farcasterValue = farcasterPortfolio?.totalNetWorth || 0;
    const verifiedValue = Object.values(farcasterVerifiedPortfolios).reduce((sum, p) => sum + (p.totalNetWorth || 0), 0);
    const totalValue = ethereumValue + farcasterValue + verifiedValue + hiveValue;

    const wallets = [
        {
            name: "Hive Blockchain",
            value: hiveValue,
            percentage: totalValue > 0 ? (hiveValue / totalValue) * 100 : 0,
            color: "green.400",
            identifier: hiveUsername ? `@${hiveUsername}` : "Not connected",
            connected: !!hiveUsername,
        },
        {
            name: "Ethereum Network",
            value: ethereumValue,
            percentage: totalValue > 0 ? (ethereumValue / totalValue) * 100 : 0,
            color: "blue.400",
            identifier: portfolio ? `${portfolio.tokens?.length || 0} tokens` : "Not connected",
            connected: !!portfolio,
        },
        {
            name: "Farcaster Custody",
            value: farcasterValue,
            percentage: totalValue > 0 ? (farcasterValue / totalValue) * 100 : 0,
            color: "purple.400",
            identifier: farcasterPortfolio ? `${farcasterPortfolio.tokens?.length || 0} tokens` : "Not connected",
            connected: !!farcasterPortfolio,
        }
    ];

    // Add verified wallets to the list
    Object.entries(farcasterVerifiedPortfolios).forEach(([address, portfolioData], index) => {
        wallets.push({
            name: `Verified Wallet ${index + 1}`,
            value: portfolioData.totalNetWorth || 0,
            percentage: totalValue > 0 ? ((portfolioData.totalNetWorth || 0) / totalValue) * 100 : 0,
            color: "orange.400",
            identifier: `${address.slice(0, 6)}...${address.slice(-4)} • ${portfolioData.tokens?.length || 0} tokens`,
            connected: true,
        });
    });

    const connectedWallets = wallets.filter(wallet => wallet.connected);

    if (connectedWallets.length === 0) {
        return (
            <Box p={4} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
                <Text color="gray.500" textAlign="center">
                    No wallets connected yet
                </Text>
            </Box>
        );
    }

    return (
        <Box p={4} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
            <Text fontSize="lg" fontWeight="bold" mb={4} color="primary">
                Portfolio Distribution
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Stat>
                    <StatLabel color="gray.500">Total Value</StatLabel>
                    <StatNumber color="primary">{formatValue(totalValue)}</StatNumber>
                    <StatHelpText color="gray.400">
                        Across {connectedWallets.length} networks
                    </StatHelpText>
                </Stat>

                <Stat>
                    <StatLabel color="gray.500">Largest Holdings</StatLabel>
                    <StatNumber color="primary">
                        {connectedWallets.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
                    </StatNumber>
                    <StatHelpText color="gray.400">
                        {formatValue(connectedWallets.sort((a, b) => b.value - a.value)[0]?.value || 0)}
                    </StatHelpText>
                </Stat>

                <Stat>
                    <StatLabel color="gray.500">Digital Assets</StatLabel>
                    <StatNumber color="primary">{formatValue(ethereumValue + farcasterValue)}</StatNumber>
                    <StatHelpText color="gray.400">
                        ETH + Farcaster tokens
                    </StatHelpText>
                </Stat>
            </SimpleGrid>

            <Divider mb={4} borderColor={borderColor} />

            <VStack spacing={4} align="stretch">
                {connectedWallets.map((wallet) => (
                    <Box key={wallet.name}>
                        <HStack justify="space-between" align="center" mb={2}>
                            <HStack spacing={2}>
                                <Text fontSize="sm" fontWeight="medium" color="white">
                                    {wallet.name}
                                </Text>
                                <Badge
                                    colorScheme={wallet.color.split('.')[0]}
                                    fontSize="xs"
                                    variant="solid"
                                >
                                    {wallet.percentage.toFixed(1)}%
                                </Badge>
                            </HStack>
                            <Text fontSize="sm" fontWeight="bold" color="white">
                                {formatValue(wallet.value)}
                            </Text>
                        </HStack>

                        <Progress
                            value={wallet.percentage}
                            colorScheme={wallet.color.split('.')[0]}
                            size="sm"
                            borderRadius="full"
                            mb={1}
                        />

                        <Text fontSize="xs" color="gray.400">
                            {wallet.identifier}
                        </Text>
                    </Box>
                ))}
            </VStack>

            {/* Token Distribution Details */}
            <Divider my={4} borderColor={borderColor} />

            <Text fontSize="md" fontWeight="medium" mb={3} color="white">
                Asset Breakdown
            </Text>

            <VStack spacing={2} align="stretch">
                {portfolio && portfolio.tokens && portfolio.tokens.length > 0 && (
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.300">Ethereum tokens:</Text>
                        <Text fontSize="sm" color="white">{portfolio.tokens.length} assets</Text>
                    </HStack>
                )}

                {farcasterPortfolio && farcasterPortfolio.tokens && farcasterPortfolio.tokens.length > 0 && (
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.300">Farcaster tokens:</Text>
                        <Text fontSize="sm" color="white">{farcasterPortfolio.tokens.length} assets</Text>
                    </HStack>
                )}

                {hiveUsername && (
                    <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.300">Hive assets:</Text>
                        <Text fontSize="sm" color="white">HIVE + HBD tokens</Text>
                    </HStack>
                )}
            </VStack>
        </Box>
    );
});

export default PortfolioBreakdown;
