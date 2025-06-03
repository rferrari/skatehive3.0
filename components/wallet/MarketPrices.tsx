import { Box, Text, HStack, Tooltip, Icon } from "@chakra-ui/react";
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

  return (
    <Box
      p={{ base: 2, md: 4 }}
      border="none"
      borderRadius="base"
      bg="muted"
      boxShadow="none"
      width="100%"
    >
      <Box display="flex" alignItems="center" mb={4}>
        <Text
          fontWeight="extrabold"
          fontSize={{ base: "xl", md: "2xl" }}
          color="lime"
          mr={2}
        >
          Market Prices
        </Text>
        <Tooltip label="Hive/HBD Market" hasArrow>
          <Box
            as="button"
            px={2}
            py={1}
            fontSize="sm"
            bg="teal.500"
            color="white"
            borderRadius="md"
            fontWeight="bold"
            _hover={{ bg: "teal.600" }}
            onClick={() => router.push("https://hivedex.io/")}
            ml={2}
          >
            <Icon
              as={FaStore}
              boxSize={4}
              mr={1}
              color={theme.colors.primary}
            />
          </Box>
        </Tooltip>
      </Box>

      {/* HIVE Market Stat */}
      <Box mb={6}>
        <HStack align="center" justify="center" mb={1} spacing={2}>
          <CustomHiveIcon color="rgb(233, 66, 95)" />
          <Text
            fontWeight="bold"
            fontSize={{ base: "md", md: "lg" }}
            color="gray.100"
          >
            HIVE
          </Text>
        </HStack>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Text
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
            color="green.200"
          >
            {isPriceLoading
              ? "Loading..."
              : hivePrice !== null
              ? `${hivePrice.toFixed(3)} USD`
              : "N/A"}
          </Text>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            HIVE price by
            <Text
              as="a"
              href="https://www.coingecko.com/en/coins/hive"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.300"
              _hover={{ textDecoration: "underline", color: "blue.400" }}
              ml={1}
              display="inline"
            >
              CoinGecko
            </Text>
          </Text>
        </Box>
      </Box>

      {/* HBD Market Stat */}
      <Box mb={4}>
        <HStack align="center" justify="center" mb={1} spacing={2}>
          <CustomHiveIcon color="lime" />
          <Text
            fontWeight="bold"
            fontSize={{ base: "md", md: "lg" }}
            color="gray.100"
          >
            HBD
          </Text>
        </HStack>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Text
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
            color="green.200"
          >
            {isPriceLoading
              ? "Loading..."
              : hbdPrice !== null
              ? `${hbdPrice.toFixed(3)} USD`
              : "N/A"}
          </Text>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            HBD price by
            <Text
              as="a"
              href="https://www.coingecko.com/en/coins/hive_dollar"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.300"
              _hover={{ textDecoration: "underline", color: "blue.400" }}
              ml={1}
              display="inline"
            >
              CoinGecko
            </Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
