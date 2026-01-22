"use client";

import { Box, Text, HStack, useToken, VStack } from "@chakra-ui/react";
import { CustomHiveIcon } from "./CustomHiveIcon";
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
  const router = useRouter();

  return (
    <Box
      bg={"muted"}
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
          <CustomHiveIcon color={"primary"} />
          <Text color={"red.200"} fontWeight="bold">
            HIVE -
          </Text>
          <Text color={"success"} fontWeight="extrabold">
            {isPriceLoading ? "..." : hivePrice?.toFixed(3) + " USD"}
          </Text>
        </HStack>

        <HStack
          spacing={2}
          onClick={() => router.push("https://hivedex.io/")}
          cursor={"pointer"}
        >
          <CustomHiveIcon color={"accent"} />
          <Text color={"green.200"} fontWeight="bold">
            HBD -
          </Text>
          <Text color={"success"} fontWeight="extrabold">
            {isPriceLoading ? "..." : hbdPrice?.toFixed(3) + " USD"}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
