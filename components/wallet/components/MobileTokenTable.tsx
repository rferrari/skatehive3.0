import { Box, VStack, Text, Center } from "@chakra-ui/react";
import { ConsolidatedToken } from "../../../lib/utils/portfolioUtils";
import MobileTokenRow from "./MobileTokenRow";

interface MobileTokenTableProps {
  consolidatedTokens: ConsolidatedToken[];
  expandedTokens: Set<string>;
  onToggleExpansion: (symbol: string) => void;
  onTokenSelect: (token: ConsolidatedToken) => void;
}

export default function MobileTokenTable({
  consolidatedTokens,
  expandedTokens,
  onToggleExpansion,
  onTokenSelect,
}: MobileTokenTableProps) {
  if (consolidatedTokens.length === 0) {
    return (
      <Box
        bg="rgba(255, 255, 255, 0.02)"
        borderRadius="xl"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.08)"
        p={6}
      >
        <Center>
          <Text color="gray.400" fontSize="sm">
            No tokens to display. Try turning off &quot;Hide Dust&quot; to see
            smaller balances.
          </Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box
      bg="rgba(255, 255, 255, 0.02)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
      overflow="hidden"
    >
      {consolidatedTokens.map((consolidatedToken, index) => {
        const isExpanded = expandedTokens.has(consolidatedToken.symbol);

        return (
          <MobileTokenRow
            key={consolidatedToken.symbol}
            consolidatedToken={consolidatedToken}
            isExpanded={isExpanded}
            onToggleExpansion={() =>
              onToggleExpansion(consolidatedToken.symbol)
            }
            onClick={() => onTokenSelect(consolidatedToken)}
          />
        );
      })}
    </Box>
  );
}
