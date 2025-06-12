import { useState } from "react";
import { Box, Text, Stack, Button, Input, useBreakpointValue } from "@chakra-ui/react";
import { useTheme } from "@/app/themeProvider";

interface SwapSectionProps {
  onModalOpen: (title: string) => void;
}

export default function SwapSection({ onModalOpen }: SwapSectionProps) {
  const { theme } = useTheme();
  const [convertDirection, setConvertDirection] = useState<
    "HIVE_TO_HBD" | "HBD_TO_HIVE"
  >("HIVE_TO_HBD");
  const [convertAmount, setConvertAmount] = useState("");
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box p={4} borderRadius="md" bg="muted" width="100%">
      <Text fontWeight="bold" fontSize="xl" mb={2} color="primary">
        Swap
      </Text>
      <Text fontSize="sm" mb={3}>
        
        <a
          href={isMobile ? "https://hivedex.io/" : "https://hivehub.dev/market/swap"}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme.colors.primary, textDecoration: "underline" }}
        >
          ...More Swap Options
        </a>
      </Text>
      <Stack direction="row" spacing={4} align="center" mb={3}>
        <Text fontWeight="medium">Direction:</Text>
        <Button
          size="sm"
          variant={convertDirection === "HIVE_TO_HBD" ? "solid" : "outline"}
          colorScheme="teal"
          onClick={() => setConvertDirection("HIVE_TO_HBD")}
        >
          HIVE → HBD
        </Button>
        <Button
          size="sm"
          variant={convertDirection === "HBD_TO_HIVE" ? "solid" : "outline"}
          colorScheme="teal"
          onClick={() => setConvertDirection("HBD_TO_HIVE")}
        >
          HBD → HIVE
        </Button>
      </Stack>
      <Input
        type="number"
        placeholder="Amount"
        value={convertAmount}
        onChange={(e) => setConvertAmount(e.target.value)}
        min={0}
        width="100%"
        mb={3}
      />
      <Button
        colorScheme="teal"
        width="100%"
        onClick={() => onModalOpen("Convert HIVE")}
        isDisabled={
          !convertAmount ||
          isNaN(Number(convertAmount)) ||
          Number(convertAmount) <= 0
        }
      >
        Swap
      </Button>
    </Box>
  );
}
