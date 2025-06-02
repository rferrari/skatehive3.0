import { useState, useEffect } from "react";
import useHiveAccount from "@/hooks/useHiveAccount";
import {
  Box,
  Grid,
  GridItem,
  Text,
  Icon,
  HStack,
  Divider,
  Spinner,
  useDisclosure,
  Tooltip,
  Stack,
  Heading,
  IconButton,
  Input,
  Button,
  VStack,
  Image,
  Badge,
} from "@chakra-ui/react";
import {
  FaExchangeAlt,
  FaPiggyBank,
  FaStore,
  FaShoppingCart,
  FaArrowDown,
  FaShareAlt,
  FaDollarSign,
  FaArrowUp,
  FaPaperPlane,
  FaArrowRight,
} from "react-icons/fa";
import { convertVestToHive } from "@/lib/hive/client-functions";
import { extractNumber } from "@/lib/utils/extractNumber";
import WalletModal from "@/components/wallet/WalletModal";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { Asset, KeyTypes } from "@aioha/aioha";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { useTheme } from "../../app/themeProvider";

interface MainWalletProps {
  username: string;
}

export default function MainWallet({ username }: MainWalletProps) {
  const router = useRouter();

  const { user, aioha } = useAioha();

  const { hiveAccount, isLoading, error } = useHiveAccount(username);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { theme } = useTheme();

  const [modalContent, setModalContent] = useState<{
    title: string;
    description?: string;
    showMemoField?: boolean;
    showUsernameField?: boolean;
  } | null>(null);
  const [hivePower, setHivePower] = useState<string | undefined>(undefined);
  const [hivePrice, setHivePrice] = useState<number | null>(null);
  const [hbdPrice, setHbdPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [convertDirection, setConvertDirection] = useState<
    "HIVE_TO_HBD" | "HBD_TO_HIVE"
  >("HIVE_TO_HBD");
  const [convertAmount, setConvertAmount] = useState("");

  useEffect(() => {
    const fetchHivePower = async () => {
      if (hiveAccount?.vesting_shares) {
        try {
          const power = (
            await convertVestToHive(
              Number(extractNumber(String(hiveAccount.vesting_shares)))
            )
          ).toFixed(3);
          setHivePower(power.toString()); // Set the Hive Power as a string
        } catch (err) {
          console.error("Failed to convert vesting shares to Hive power", err);
        }
      }
    };

    fetchHivePower();
  }, [hiveAccount?.vesting_shares]);

  useEffect(() => {
    async function fetchPrices() {
      setIsPriceLoading(true);
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=hive,hive_dollar&vs_currencies=usd"
        );
        const data = await res.json();
        setHivePrice(data.hive ? data.hive.usd : null);
        setHbdPrice(data.hive_dollar ? data.hive_dollar.usd : null);
      } catch (e) {
        setHivePrice(null);
        setHbdPrice(null);
      } finally {
        setIsPriceLoading(false);
      }
    }
    fetchPrices();
  }, []);

  const handleModalOpen = (
    title: string,
    description?: string,
    showMemoField?: boolean,
    showUsernameField?: boolean
  ) => {
    setModalContent({ title, description, showMemoField, showUsernameField });
    onOpen();
  };

  async function handleConfirm(
    amount: number,
    direction?: "HIVE_TO_HBD" | "HBD_TO_HIVE",
    username?: string,
    memo?: string
  ) {
    if (!modalContent) return;

    switch (modalContent.title) {
      case "Send HIVE":
        // Handle Send Hive logic here
        if (username) {
          await aioha.transfer(username, amount, Asset.HIVE, memo);
        }
        break;
      case "Power Up":
        await aioha.stakeHive(amount);
        break;
      case "Convert HIVE":
        if (direction === "HIVE_TO_HBD") {
          // HIVE to HBD
          aioha.signAndBroadcastTx(
            [
              [
                "convert",
                {
                  owner: user,
                  requestid: Math.floor(
                    1000000000 + Math.random() * 9000000000
                  ),
                  amount: {
                    amount: amount.toFixed(3),
                    precision: 3,
                    nai: "@@000000013", // HIVE NAI
                  },
                },
              ],
            ],
            KeyTypes.Active
          );
        } else if (direction === "HBD_TO_HIVE") {
          // HBD to HIVE
          aioha.signAndBroadcastTx(
            [
              [
                "convert",
                {
                  owner: user,
                  requestid: Math.floor(
                    1000000000 + Math.random() * 9000000000
                  ),
                  amount: {
                    amount: amount.toFixed(3),
                    precision: 3,
                    nai: "@@000000013", // HBD NAI (should be @@000000013 for HIVE, @@000000014 for HBD)
                  },
                },
              ],
            ],
            KeyTypes.Active
          );
        }
        break;
      case "HIVE Savings":
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_to_savings",
              {
                from: user,
                to: user,
                amount: amount.toFixed(3) + " HIVE",
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      case "Power Down":
        const unstake = await aioha.unstakeHive(amount);
        break;
      case "Delegate":
        if (username) {
          const delegate = await aioha.delegateStakedHive(username, amount);
        }
        break;
      case "Send HBD":
        if (username) {
          await aioha.transfer(username, amount, Asset.HBD, memo);
        }
        break;
      case "HBD Savings":
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_to_savings",
              {
                from: user,
                to: user,
                amount: amount.toFixed(3) + " HBD",
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      case "Withdraw HBD Savings":
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_from_savings",
              {
                from: user,
                to: user,
                request_id: Math.floor(1000000000 + Math.random() * 9000000000),
                amount: amount.toFixed(3) + " HBD",
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      case "Withdraw HIVE Savings":
        await aioha.signAndBroadcastTx(
          [
            [
              "transfer_from_savings",
              {
                from: user,
                to: user,
                request_id: Math.floor(1000000000 + Math.random() * 9000000000),
                amount: amount.toFixed(3) + " HIVE",
                memo: memo || "",
              },
            ],
          ],
          KeyTypes.Active
        );
        break;
      default:
        console.log("Default action - Amount:", amount, "Memo:", memo);
        break;
    }
    onClose();
  }

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" color="primary" />
      </Box>
    );
  }

  if (error) {
    return <Text color="warning">Failed to load account information.</Text>;
  }

  const balance = hiveAccount?.balance
    ? extractNumber(String(hiveAccount.balance))
    : "N/A";
  const hbdBalance = hiveAccount?.hbd_balance
    ? extractNumber(String(hiveAccount.hbd_balance))
    : "N/A";
  const savingsBalance = hiveAccount?.savings_balance
    ? extractNumber(String(hiveAccount.savings_balance))
    : "N/A";
  const hbdSavingsBalance = hiveAccount?.savings_hbd_balance
    ? extractNumber(String(hiveAccount.savings_hbd_balance))
    : "N/A";

  return (
    <>
      <Heading as="h2" size="lg" mb={4} fontFamily="Joystix" color="primary">
        Hive Wallet
      </Heading>
      <Grid
        templateColumns={{ base: "1fr", md: "2fr 1fr" }}
        gap={{ base: 2, md: 6 }}
        alignItems="start"
        m={{ base: 1, md: 4 }}
      >
        {/* Left: Wallet Balances and Actions */}
        <Box
          p={{ base: 2, md: 4 }}
          border="none"
          borderRadius="base"
          bg="muted"
          boxShadow="none"
        >
          {/* Staked HIVE - Hive Power (HP) */}
          <Box mb={8}>
            <Box
              pl={{ base: 0, md: 0 }}
              borderLeft="none"
              borderColor="none"
              mb={4}
            >
              <Stack
                direction={{ base: "column", md: "row" }}
                mb={1}
                align="center"
              >
                <Image
                  src="/images/hp_logo.png"
                  alt="Skatehive Logo"
                  width="6"
                  height="6"
                  style={{ marginTop: 4 }}
                />
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
                  HIVE POWER (HP)
                </Text>
                <Box flex={1} display={{ base: "none", md: "block" }} />
                <Text
                  fontSize={{ base: "xl", md: "3xl" }}
                  fontWeight="extrabold"
                  color="lime"
                >
                  {hivePower !== undefined ? hivePower : "Loading..."}
                </Text>
                <HStack spacing={1} wrap="wrap">
                  <Tooltip label="Power Down" hasArrow>
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
                      onClick={() =>
                        handleModalOpen("Power Down", "Unstake Hive Power")
                      }
                    >
                      <Icon
                        as={FaArrowDown}
                        boxSize={4}
                        mr={1}
                        color={theme.colors.primary}
                      />
                    </Box>
                  </Tooltip>
                </HStack>
              </Stack>
              <Text color="gray.400">
                your upvote (curation) power. Exchanging Hive for Hive Power is
                called &quot;Powering Up&quot; or &quot;Staking&quot;.
              </Text>
              <Text color="gray.400">
                Increases the more effectively you vote on posts
              </Text>
            </Box>
          </Box>
          {/* HIVE Section */}
          <Box mb={8}>
            <Stack
              direction={{ base: "column", md: "row" }}
              align="flex-start"
              mb={1}
              spacing={{ base: 2, md: 4 }}
            >
              <HStack align="center" mb={1} spacing={2} width="100%">
                <CustomHiveIcon
                  color="rgb(233, 66, 95)"
                  style={{ marginTop: 4 }}
                />
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
                  HIVE
                </Text>
                <Box flex={1} />
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
                  {balance}
                </Text>
              </HStack>
              <HStack spacing={1} wrap={{ base: "wrap", md: "nowrap" }} mb={2}>
                <Tooltip label="Send HIVE" hasArrow>
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
                    onClick={() =>
                      handleModalOpen(
                        "Send HIVE",
                        "Send Hive to another account",
                        true,
                        true
                      )
                    }
                  >
                    <Icon
                      as={FaPaperPlane}
                      boxSize={4}
                      mr={1}
                      color={theme.colors.primary}
                    />
                  </Box>
                </Tooltip>
                <Tooltip label="Power Up" hasArrow>
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
                    onClick={() =>
                      handleModalOpen("Power Up", "Power Up your HIVE to HP")
                    }
                  >
                    <Icon
                      as={FaArrowUp}
                      boxSize={4}
                      mr={1}
                      color={theme.colors.primary}
                    />
                  </Box>
                </Tooltip>
              </HStack>
            </Stack>
            <Text color="gray.400" mb={4}>
              The primary token of the Hive Blockchain and often a reward on
              posts.
            </Text>
          </Box>
          {/* HBD Section */}
          <Box mb={8}>
            <Stack
              direction={{ base: "column", md: "row" }}
              align="flex-start"
              mb={1}
              spacing={{ base: 2, md: 4 }}
            >
              <HStack align="center" mb={1} spacing={2} width="100%">
                <CustomHiveIcon color="lime" style={{ marginTop: 4 }} />
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
                  HBD
                </Text>
                <Box flex={1} />
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
                  {hbdBalance}
                </Text>
              </HStack>
              <HStack spacing={1} wrap={{ base: "wrap", md: "nowrap" }} mb={2}>
                <Tooltip label="Send HBD" hasArrow>
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
                    onClick={() =>
                      handleModalOpen(
                        "Send HBD",
                        "Send HBD to another account",
                        true,
                        true
                      )
                    }
                  >
                    <Icon
                      as={FaPaperPlane}
                      boxSize={4}
                      mr={1}
                      color={theme.colors.primary}
                    />
                  </Box>
                </Tooltip>
                <Tooltip label="Send HBD to Savings" hasArrow>
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
                    onClick={() =>
                      handleModalOpen("HBD Savings", "Send HBD to Savings")
                    }
                  >
                    <Icon
                      as={FaArrowDown}
                      boxSize={4}
                      mr={1}
                      color={theme.colors.primary}
                    />
                  </Box>
                </Tooltip>
              </HStack>
            </Stack>
            <Text color="gray.400" mb={4}>
              A token that is always worth ~1 dollar of hive. It is often
              rewarded on posts along with HIVE.
            </Text>
            {/* Staked HBD (Savings) */}
            <Box mb={4}>
              <Stack
                direction={{ base: "column", md: "row" }}
                mb={1}
                align="center"
              >
                <Image
                  src="/images/hbd_savings.png"
                  alt="HBD Savings Logo"
                  width="6"
                  height="6"
                  style={{ marginTop: 4 }}
                />
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">Staked HBD (Savings)</Text>
                <Box flex={1} display={{ base: "none", md: "block" }} />
                <Text
                  fontSize={{ base: "xl", md: "3xl" }}
                  fontWeight="extrabold"
                  color="lime"
                >
                  {hbdSavingsBalance}
                </Text>
                <HStack spacing={1} wrap="wrap">
                  <Tooltip label="Unstake HBD" hasArrow>
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
                    >
                      <Icon
                        as={FaArrowUp}
                        boxSize={4}
                        mr={1}
                        color={theme.colors.primary}
                      />
                    </Box>
                  </Tooltip>
                </HStack>
              </Stack>
              <Text color="gray.400">
                Staked HBD generates{" "}
                <Badge colorScheme="green" fontSize="sm" px={1} py={0}>
                  15.00% APR
                </Badge>{" "}
                (defined by the{" "}
                <Text
                  as="a"
                  href="https://peakd.com/me/witnesses"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="blue.300"
                  _hover={{ textDecoration: "underline", color: "blue.400" }}
                  display="inline"
                >
                  witnesses
                </Text>
                ) that is paid out monthly
              </Text>
            </Box>
            {/* Staked HBD - Claimable */}
            <Box pl={{ base: 4, md: 12 }}>
              <Box borderLeft="none" borderColor="none" pl={4}>
                <Text fontWeight="bold">Staked HBD - Claimable</Text>
                <Text color="gray.400">Under construction</Text>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Right: Market Stats and Swap */}
        <VStack
          spacing={4}
          align="stretch"
          maxW={{ base: "100%", md: "340px" }}
          mx="auto"
          mb={{ base: 24, md: 0 }}
        >
          <Box
            p={{ base: 2, md: 4 }}
            border="none"
            borderRadius="base"
            bg="muted"
            boxShadow="none"
            minW={undefined}
            width="100%"
            maxW={{ base: "100%", md: "340px" }}
            mx="auto"
            mb={0}
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
          <Box
            p={4}
            borderRadius="md"
            bg="gray.800"
            boxShadow="md"
            width="100%"
            maxW={{ base: "100%", md: "340px" }}
            mx="auto"
          >
            <Text fontWeight="bold" fontSize="xl" mb={2} color="lime">
              Swap
            </Text>
            <Text fontSize="sm" mb={3}>
              Need more options?{" "}
              <a
                href="https://hive-engine.com/?p=market&t=SWAP.HIVE"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: theme.colors.primary,
                  textDecoration: "underline",
                }}
              >
                Try Hive Engine Swap
              </a>
            </Text>
            <Stack direction="row" spacing={4} align="center" mb={3}>
              <Text fontWeight="medium">Direction:</Text>
              <Button
                size="sm"
                variant={
                  convertDirection === "HIVE_TO_HBD" ? "solid" : "outline"
                }
                colorScheme="teal"
                onClick={() => setConvertDirection("HIVE_TO_HBD")}
              >
                HIVE → HBD
              </Button>
              <Button
                size="sm"
                variant={
                  convertDirection === "HBD_TO_HIVE" ? "solid" : "outline"
                }
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
              onClick={() =>
                handleModalOpen("Convert HIVE", undefined, false, false)
              }
              isDisabled={
                !convertAmount ||
                isNaN(Number(convertAmount)) ||
                Number(convertAmount) <= 0
              }
            >
              Swap
            </Button>
          </Box>
        </VStack>
      </Grid>
      {modalContent && (
        <WalletModal
          isOpen={isOpen}
          onClose={onClose}
          title={modalContent.title}
          description={modalContent.description}
          showMemoField={modalContent.showMemoField}
          showUsernameField={modalContent.showUsernameField}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
