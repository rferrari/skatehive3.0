import { Box, Image, Text } from "@chakra-ui/react";
import { TokenDetail, blockchainDictionary } from "../../../types/portfolio";
import { getTokenLogoSync } from "../../../lib/utils/portfolioUtils";

interface TokenLogoProps {
    token: TokenDetail;
    size: string;
    showNetworkBadge?: boolean;
    networkBadgeSize?: string;
}

export default function TokenLogo({
    token,
    size,
    showNetworkBadge = false,
    networkBadgeSize = "12px"
}: TokenLogoProps) {
    const networkInfo = blockchainDictionary[token.network];
    const isHigherToken = token.token.symbol.toLowerCase() === 'higher';

    // Special handling for known tokens
    const getTokenLogoUrl = () => {
        if (isHigherToken) {
            return "/logos/higher.png";
        }

        const symbol = token.token.symbol.toLowerCase();

        // Handle common tokens with known logos
        const knownTokenLogos: Record<string, string> = {
            'hive': '/logos/hiveLogo.png',
            'hbd': '/logos/hbd_logo.png',
            'eth': '/logos/ethereum_logo.png',
            'matic': '/logos/polygon_logo.png',
            'pol': '/logos/polygon_logo.png',
            'degen': '/logos/degen.png',
            'higher': '/logos/higher.png',
            'nog': '/logos/nog.png',
        };

        if (knownTokenLogos[symbol]) {
            return knownTokenLogos[symbol];
        }

        // Fallback to the sync function
        const syncLogo = getTokenLogoSync(token.token, networkInfo, token.network);
        if (syncLogo && syncLogo !== "missing.png" && syncLogo !== "") {
            return syncLogo;
        }

        return null;
    };

    const tokenLogoUrl = getTokenLogoUrl();

    const fallbackElement = (
        <Box
            w={size}
            h={size}
            borderRadius="full"
            bg="gray.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            border="1px solid"
            borderColor="gray.500"
        >
            <Text
                fontSize={size === "40px" ? "lg" : size === "32px" ? "md" : "xs"}
                fontWeight="bold"
                color="white"
            >
                {token.token.symbol.charAt(0).toUpperCase()}
            </Text>
        </Box>
    );

    const tokenLogo = tokenLogoUrl ? (
        <Image
            src={tokenLogoUrl}
            alt={token.token.symbol}
            w={size}
            h={size}
            borderRadius="full"
            objectFit="cover"
            flexShrink={0}
            border="1px solid"
            borderColor="gray.600"
            bg="gray.700"
            fallback={fallbackElement}
            onError={(e) => {
                console.warn(`Failed to load logo for ${token.token.symbol}:`, tokenLogoUrl);
            }}
        />
    ) : fallbackElement;

    if (!showNetworkBadge) {
        return (
            <Box flexShrink={0}>
                {tokenLogo}
            </Box>
        );
    }

    return (
        <Box position="relative" display="inline-block" flexShrink={0}>
            {tokenLogo}
            {/* Network Badge */}
            {networkInfo?.logo && (
                <Image
                    src={networkInfo.logo}
                    alt={networkInfo?.alias || token.network}
                    w={networkBadgeSize}
                    h={networkBadgeSize}
                    borderRadius="full"
                    position="absolute"
                    bottom="-1px"
                    right="-1px"
                    border="2px solid"
                    borderColor="background"
                    bg="background"
                    objectFit="cover"
                    flexShrink={0}
                />
            )}
        </Box>
    );
}
