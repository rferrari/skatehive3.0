import { usePortfolioContext } from "@/contexts/PortfolioContext";
import PortfolioBreakdown from "./PortfolioBreakdown";

interface PortfolioBreakdownWrapperProps {
    hiveValue: number;
    hiveUsername?: string;
}

export default function PortfolioBreakdownWrapper({
    hiveValue,
    hiveUsername
}: PortfolioBreakdownWrapperProps) {
    const { portfolio, farcasterPortfolio, farcasterVerifiedPortfolios } = usePortfolioContext();

    return (
        <PortfolioBreakdown
            portfolio={portfolio}
            farcasterPortfolio={farcasterPortfolio}
            farcasterVerifiedPortfolios={farcasterVerifiedPortfolios}
            hiveValue={hiveValue}
            hiveUsername={hiveUsername}
        />
    );
}
