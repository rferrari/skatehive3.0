import { useState } from "react";
import {
  Box,
  Text,
  Stack,
  Button,
  Input,
  IconButton,
  Divider,
  useBreakpointValue,
  HStack,
} from "@chakra-ui/react";
import { FaExchangeAlt } from "react-icons/fa";
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

  const [youPayBalance, youReceiveBalance] = [126.38, 0.02806];

  const fromToken = convertDirection === "HIVE_TO_HBD" ? "HIVE" : "HBD";
  const toToken = convertDirection === "HIVE_TO_HBD" ? "HBD" : "HIVE";
  const fromBalance = youPayBalance;
  const toBalance = youReceiveBalance;

  const handleSwapDirection = () => {
    setConvertDirection((prev) =>
      prev === "HIVE_TO_HBD" ? "HBD_TO_HIVE" : "HIVE_TO_HBD"
    );
  };

  return (
    <Box
      borderRadius="xl"
      bg={theme.colors.muted}
      p={6}
      width="100%"
      maxW="420px"
      mx="auto"
    >
      <Text fontWeight="bold" fontSize="xl" mb={4} color={theme.colors.primary}>
        Swap
      </Text>

      {/* You Pay */}
      <Box bg={theme.colors.dark} p={4} borderRadius="lg" mb={4}>
        <Text fontSize="sm" color="gray.400" mb={1}>
          You Pay
        </Text>
        <HStack justifyContent="space-between">
          <Input
            type="number"
            placeholder="0"
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
            fontSize="2xl"
            variant="unstyled"
            color="white"
          />
          <Button size="sm" variant="ghost" color="white" fontWeight="bold">
            {fromToken}
          </Button>
        </HStack>
        <Text fontSize="xs" color="gray.500" mt={1}>
          {fromBalance} {fromToken}
        </Text>
      </Box>

      {/* Swap Icon */}
      <Box textAlign="center" my={2}>
        <IconButton
          aria-label="Swap direction"
          icon={<FaExchangeAlt />}
          onClick={handleSwapDirection}
          bg="transparent"
          _hover={{ bg: "transparent", transform: "rotate(180deg)" }}
          transition="transform 0.3s"
        />
      </Box>

      {/* You Receive */}
      <Box bg={theme.colors.dark} p={4} borderRadius="lg" mb={4}>
        <Text fontSize="sm" color="gray.400" mb={1}>
          You Receive
        </Text>
        <HStack justifyContent="space-between">
          <Text fontSize="2xl" color="white">
            0
          </Text>
          <Button size="sm" variant="ghost" color="white" fontWeight="bold">
            {toToken}
          </Button>
        </HStack>
        <Text fontSize="xs" color="gray.500" mt={1}>
          {toBalance} {toToken}
        </Text>
      </Box>

      <Button
        colorScheme="teal"
        width="100%"
        isDisabled={
          !convertAmount ||
          isNaN(Number(convertAmount)) ||
          Number(convertAmount) <= 0
        }
        onClick={() => onModalOpen("Convert HIVE")}
      >
        Swap
      </Button>

      <Text fontSize="sm" mt={4} textAlign="center">
        <a
          href={
            isMobile ? "https://hivedex.io/" : "https://hivehub.dev/market/swap"
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: theme.colors.primary,
            textDecoration: "underline",
          }}
        >
          ...More Swap Options
        </a>
      </Text>
    </Box>
  );
}
