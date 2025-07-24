import { useMemo } from "react";
import { Text } from "@chakra-ui/react";
import { usePortfolioContext } from "@/contexts/PortfolioContext";
import { formatValue } from "@/lib/utils/portfolioUtils";

interface TotalPortfolioValueProps {
  totalHiveAssetsValue: number;
}

export default function TotalPortfolioValue({
  totalHiveAssetsValue,
}: TotalPortfolioValueProps) {
  const { aggregatedPortfolio } = usePortfolioContext();

  // Calculate total portfolio value combining Hive and Ethereum assets
  const totalPortfolioValue = useMemo(() => {
    const ethereumValue = aggregatedPortfolio?.totalBalanceUSDApp || 0;
    return totalHiveAssetsValue + ethereumValue;
  }, [totalHiveAssetsValue, aggregatedPortfolio?.totalBalanceUSDApp]);

  return (
    <Text fontSize="lg" color="primary" fontWeight="bold" mb={4}>
      Total Portfolio Value: {formatValue(totalPortfolioValue)}
    </Text>
  );
}
