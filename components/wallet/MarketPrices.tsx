"use client";

import {
  Box,
  Text,
  HStack,
  Icon,
  Tooltip,
  Button,
  useToken,
  VStack,
} from "@chakra-ui/react";
import { FaStore } from "react-icons/fa";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { useTheme } from "@/app/themeProvider";
import { useRouter } from "next/navigation";

interface MarketPricesProps {
  hivePrice: number | null;
  hbdPrice: number | null;
  isPriceLoading: boolean;
}

export default function MarketPrices({
  hivePrice,
  hbdPrice,
  isPriceLoading,
}: MarketPricesProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const [primary, accent, background, muted, success] = useToken("colors", [
    theme.colors.primary,
    theme.colors.accent,
    theme.colors.background,
    theme.colors.muted,
    theme.colors.success || theme.colors.primary,
  ]);

  return (
    <Box
      bg={muted}
      borderRadius="md"
      px={4}
      py={3}
      width="100%"
      overflowX="auto"
      whiteSpace="nowrap"
    >
      <VStack spacing={4}>
        <HStack
          spacing={2}
          onClick={() => router.push("https://hivedex.io/")}
          cursor={"pointer"}
        >
          <CustomHiveIcon color={primary} />
          <Text color={primary} fontWeight="bold">
            HIVE
          </Text>
          <Text color={success} fontWeight="extrabold">
            {isPriceLoading ? "..." : hivePrice?.toFixed(3) + " USD"}
          </Text>
        </HStack>

        <HStack
          spacing={2}
          onClick={() => router.push("https://hivedex.io/")}
          cursor={"pointer"}
        >
          <CustomHiveIcon color={accent} />
          <Text color={accent} fontWeight="bold">
            HBD
          </Text>
          <Text color={success} fontWeight="extrabold">
            {isPriceLoading ? "..." : hbdPrice?.toFixed(3) + " USD"}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
