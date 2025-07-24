import { useMemo } from "react";
import { Center, Text } from "@chakra-ui/react";
import { usePortfolioContext } from "@/contexts/PortfolioContext";
import { formatValue } from "@/lib/utils/portfolioUtils";

interface TotalPortfolioValueProps {
  totalHiveAssetsValue: number;
}

export default function TotalPortfolioValue({
  totalHiveAssetsValue,
}: TotalPortfolioValueProps) {
  const { aggregatedPortfolio } = usePortfolioContext();

  // Calculate total portfolio value combining Hive and Ethereum/Farcaster assets
  const totalPortfolioValue = useMemo(() => {
    const ethereumValue = aggregatedPortfolio?.totalNetWorth || 0;
    return totalHiveAssetsValue + ethereumValue;
  }, [totalHiveAssetsValue, aggregatedPortfolio?.totalNetWorth]);

  return (
    <Center display={{ base: "flex", md: "none" }}>
      <Text fontSize="3xl" color="primary" fontWeight="bold" mb={4}>
        {formatValue(totalPortfolioValue)}
      </Text>
    </Center>
  );
}
