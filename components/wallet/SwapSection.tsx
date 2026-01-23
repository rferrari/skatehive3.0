import { useState, useMemo } from "react";
import {
  Box,
  Text,
  Button,
  Input,
  IconButton,
  useBreakpointValue,
  HStack,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { FaExchangeAlt, FaHive } from "react-icons/fa";
import { useTheme } from "@/app/themeProvider";
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { useHiveUser } from "@/contexts/UserContext";
import useHiveAccount from "@/hooks/useHiveAccount";
import { useWalletActions } from "@/hooks/useWalletActions";
import { extractNumber } from "@/lib/utils/extractNumber";
import { useTranslations } from "@/contexts/LocaleContext";

interface SwapSectionProps {
  hivePrice?: number | null;
  hbdPrice?: number | null;
  isPriceLoading?: boolean;
}

export default function SwapSection({
  hivePrice,
  hbdPrice,
  isPriceLoading = false,
}: SwapSectionProps) {
  const { theme } = useTheme();
  const { user, aioha } = useAioha();
  const { hiveUser } = useHiveUser();
  const { hiveAccount } = useHiveAccount(user || "");
  const { handleConfirm } = useWalletActions();
  const toast = useToast();
  const t = useTranslations();

  const [convertDirection, setConvertDirection] = useState<
    "HIVE_TO_HBD" | "HBD_TO_HIVE"
  >("HIVE_TO_HBD");
  const [convertAmount, setConvertAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Get actual user balances from Hive account
  const balances = useMemo(() => {
    if (!hiveAccount) {
      return { hiveBalance: 0, hbdBalance: 0 };
    }

    const hiveBalance = hiveAccount.balance
      ? extractNumber(
          typeof hiveAccount.balance === "string"
            ? hiveAccount.balance
            : hiveAccount.balance.toString()
        )
      : 0;

    const hbdBalance = hiveAccount.hbd_balance
      ? extractNumber(
          typeof hiveAccount.hbd_balance === "string"
            ? hiveAccount.hbd_balance
            : hiveAccount.hbd_balance.toString()
        )
      : 0;

    return { hiveBalance, hbdBalance };
  }, [hiveAccount]);

  const fromToken = convertDirection === "HIVE_TO_HBD" ? "HIVE" : "HBD";
  const toToken = convertDirection === "HIVE_TO_HBD" ? "HBD" : "HIVE";
  const fromBalance =
    convertDirection === "HIVE_TO_HBD"
      ? balances.hiveBalance
      : balances.hbdBalance;
  const toBalance =
    convertDirection === "HIVE_TO_HBD"
      ? balances.hbdBalance
      : balances.hiveBalance;

  const handleSwapDirection = () => {
    setConvertDirection((prev) =>
      prev === "HIVE_TO_HBD" ? "HBD_TO_HIVE" : "HIVE_TO_HBD"
    );
    setConvertAmount(""); // Clear amount when switching direction
  };

  const handleConvert = async () => {
    if (
      !user ||
      !convertAmount ||
      isNaN(Number(convertAmount)) ||
      Number(convertAmount) <= 0
    ) {
      toast({
        title: t('forms.errors.invalidAmount'),
        description: t('wallet.invalidConversion'),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const amount = Number(convertAmount);

    // Check if user has sufficient balance
    if (amount > fromBalance) {
      toast({
        title: t('wallet.insufficientBalance'),
        description: t('wallet.insufficientForConversion')
          .replace('{token1}', fromToken)
          .replace('{available}', fromBalance.toFixed(3))
          .replace('{token2}', fromToken),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsConverting(true);
    try {
      let operation;

      if (convertDirection === "HBD_TO_HIVE") {
        // HBD to HIVE: Use convert operation
        operation = [
          "convert",
          {
            owner: user,
            requestid: Math.floor(1000000000 + Math.random() * 9000000000),
            amount: `${amount.toFixed(3)} HBD`,
          },
        ];
      } else {
        // HIVE to HBD: Use collateralized_convert operation
        operation = [
          "collateralized_convert",
          {
            owner: user,
            requestid: Math.floor(1000000000 + Math.random() * 9000000000),
            amount: `${amount.toFixed(3)} HIVE`,
          },
        ];
      }

      await aioha.signAndBroadcastTx([operation], KeyTypes.Active);

      toast({
        title: t('wallet.conversionInitiated'),
        description: t('wallet.conversionProcessing')
          .replace('{amount}', amount.toFixed(3))
          .replace('{from}', fromToken)
          .replace('{to}', toToken),
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setConvertAmount(""); // Clear the input after successful conversion
    } catch (error) {
      console.error("Conversion failed:", error);
      toast({
        title: t('wallet.conversionFailed'),
        description: t('wallet.conversionError'),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Calculate estimated output based on actual market prices
  const estimatedOutput = useMemo(() => {
    if (!convertAmount || isNaN(Number(convertAmount))) return "0";
    if (!hivePrice || !hbdPrice) return "0";

    const amount = Number(convertAmount);

    // Convert based on actual market prices
    let outputAmount: number;
    if (convertDirection === "HIVE_TO_HBD") {
      // Converting HIVE to HBD: (HIVE amount * HIVE price) / HBD price
      outputAmount = (amount * hivePrice) / hbdPrice;
    } else {
      // Converting HBD to HIVE: (HBD amount * HBD price) / HIVE price
      outputAmount = (amount * hbdPrice) / hivePrice;
    }

    // Apply small conversion fee (approximately 0.5%)
    const feeRate = 0.005;
    const outputAmountWithFee = outputAmount * (1 - feeRate);

    return outputAmountWithFee.toFixed(3);
  }, [convertAmount, convertDirection, hivePrice, hbdPrice]);

  return (
    <Box
      bg={theme.colors.muted}
      p={6}
      width="100%"
      maxW="420px"
      mx="auto"
    >
      <HStack>
        <FaHive />
        <Text fontWeight="bold" fontSize="xl" color={theme.colors.primary}>
          Hive Swap
        </Text>
      </HStack>
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
          {fromBalance.toFixed(3)} {fromToken}
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
            {isPriceLoading ? "..." : estimatedOutput}
          </Text>
          <Button size="sm" variant="ghost" color="white" fontWeight="bold">
            {toToken}
          </Button>
        </HStack>
        <Text fontSize="xs" color="gray.500" mt={1}>
          {toBalance.toFixed(3)} {toToken}
        </Text>
      </Box>

      <Button
        colorScheme="teal"
        width="100%"
        isDisabled={
          !user ||
          !convertAmount ||
          isNaN(Number(convertAmount)) ||
          Number(convertAmount) <= 0 ||
          Number(convertAmount) > fromBalance ||
          isConverting ||
          isPriceLoading ||
          !hivePrice ||
          !hbdPrice
        }
        onClick={handleConvert}
        leftIcon={isConverting ? <Spinner size="sm" /> : undefined}
      >
        {isConverting
          ? "Converting..."
          : isPriceLoading
          ? "Loading Prices..."
          : "Convert"}
      </Button>

      {/* Show connection prompt if user is not connected */}
      {!user && (
        <Text fontSize="sm" color="gray.400" textAlign="center" mt={2}>
          Please connect your Hive wallet to start converting
        </Text>
      )}

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
