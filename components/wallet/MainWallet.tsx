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
} from "react-icons/fa";
import { convertVestToHive } from "@/lib/hive/client-functions";
import { extractNumber } from "@/lib/utils/extractNumber";
import WalletModal from "@/components/wallet/WalletModal";
import { useRouter } from "next/navigation";
import { useAioha } from "@aioha/react-ui";
import { Asset, KeyTypes } from "@aioha/aioha";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { ArrowForwardIcon } from "@chakra-ui/icons";

interface MainWalletProps {
  username: string;
}

export default function MainWallet({ username }: MainWalletProps) {
  const router = useRouter();

  const { user, aioha } = useAioha();

  const { hiveAccount, isLoading, error } = useHiveAccount(username);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
  const [convertDirection, setConvertDirection] = useState<'HIVE_TO_HBD' | 'HBD_TO_HIVE'>('HIVE_TO_HBD');
  const [convertAmount, setConvertAmount] = useState('');

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
    direction?: 'HIVE_TO_HBD' | 'HBD_TO_HIVE',
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
        if (direction === 'HIVE_TO_HBD') {
          // HIVE to HBD
          aioha.signAndBroadcastTx(
            [
              [
                "convert",
                {
                  owner: user,
                  requestid: Math.floor(1000000000 + Math.random() * 9000000000),
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
        } else if (direction === 'HBD_TO_HIVE') {
          // HBD to HIVE
          aioha.signAndBroadcastTx(
            [
              [
                "convert",
                {
                  owner: user,
                  requestid: Math.floor(1000000000 + Math.random() * 9000000000),
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
              pl={{ base: 2, md: 6 }}
              borderLeft="none"
              borderColor="none"
              mb={4}
            >
              <Stack
                direction={{ base: "column", md: "row" }}
                mb={1}
                align="center"
              >
                <Text fontWeight="bold">Staked HIVE - Hive Power (HP)</Text>
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
                      <Icon as={FaArrowDown} boxSize={4} mr={1} />
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
                    <Icon as={FaPaperPlane} boxSize={4} mr={1} />
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
                    <Icon as={FaArrowUp} boxSize={4} mr={1} />
                    <Icon as={FaPiggyBank} boxSize={4} ml={1} />
                  </Box>
                </Tooltip>
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
                  >
                    <Icon as={FaStore} boxSize={4} mr={1} />
                  </Box>
                </Tooltip>
                <Tooltip label="Buy Hive" hasArrow>
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
                      router.push(
                        `https://global.transak.com/?apiKey=771c8ab6-b3ba-4450-b69d-ca35e4b25eb8&redirectURL=${window.location.href}&cryptoCurrencyCode=HIVE&defaultCryptoAmount=200&exchangeScreenTitle=Buy%20HIVE&isFeeCalculationHidden=false&defaultPaymentMethod=credit_debit_card&walletAddress=${user}`
                      )
                    }
                  >
                    <Icon as={FaShoppingCart} boxSize={4} mr={1} />
                  </Box>
                </Tooltip>
              </HStack>
            </Stack>
            <Text color="gray.400" mb={4}>
              The primary token of the Hive Blockchain and often a reward on
              posts.
            </Text>
          </Box>
          {/* Inserted Convert button centered on the divider between HIVE and HBD sections */}
          <Box display="flex" alignItems="center" my={6}>
            <Divider flex={1} borderColor="lime" />
            <Box mx={4} display="flex" alignItems="center" gap={4}>
              <IconButton
                aria-label="Flip direction"
                icon={<ArrowForwardIcon />}
                onClick={() => setConvertDirection(convertDirection === 'HIVE_TO_HBD' ? 'HBD_TO_HIVE' : 'HIVE_TO_HBD')}
                variant="ghost"
                fontSize="2xl"
                sx={{
                  transition: 'transform 0.3s',
                  transform: convertDirection === 'HIVE_TO_HBD' ? 'rotate(90deg)' : 'rotate(-90deg)',
                  borderLeft: '6px solid #39ff14',
                  borderRight: '6px solid #39ff14',
                  borderTop: 'none',
                  borderBottom: 'none',
                  borderRadius: '12px',
                  color: '#00FF00',
                  background: 'transparent',
                  minW: '48px',
                  minH: '48px',
                  _hover: {
                    borderLeft: '6px solid #39ff14',
                    borderRight: '6px solid #39ff14',
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderRadius: '12px',
                  },
                  _active: {
                    transform: `${convertDirection === 'HIVE_TO_HBD' ? 'rotate(90deg)' : 'rotate(-90deg)'} scale(1.15)`,
                    bg: 'rgba(0,255,0,0.08)',
                    color: 'black',
                    borderLeft: '6px solid #39ff14',
                    borderRight: '6px solid #39ff14',
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderRadius: '12px',
                  },
                }}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                min={0}
                width="100px"
                mx={2}
              />
              <Button
                colorScheme="teal"
                onClick={() => handleConfirm(Number(convertAmount), convertDirection)}
                isDisabled={!convertAmount || isNaN(Number(convertAmount)) || Number(convertAmount) <= 0}
              >
                Convert
              </Button>
            </Box>
            <Divider flex={1} borderColor="lime" />
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
                    <Icon as={FaPaperPlane} boxSize={4} mr={1} />
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
                    <Icon as={FaArrowUp} boxSize={4} mr={1} />
                    <Icon as={FaPiggyBank} boxSize={4} ml={1} />
                  </Box>
                </Tooltip>
                <Tooltip label="Use HBD in Store" hasArrow>
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
                      handleModalOpen("HBD Store", "Use HBD in the store")
                    }
                  >
                    <Icon as={FaStore} boxSize={4} mr={1} />
                  </Box>
                </Tooltip>
              </HStack>
            </Stack>
            <Text color="gray.400" mb={4}>
              A token that is always worth ~1 dollar of hive. It is often
              rewarded on posts along with HIVE.
            </Text>
            {/* Staked HBD (Savings) */}
            <Box
              pl={{ base: 2, md: 6 }}
              borderLeft="none"
              borderColor="none"
              mb={4}
            >
              <Stack
                direction={{ base: "column", md: "row" }}
                mb={1}
                align="center"
              >
                <Text fontWeight="bold">Staked HBD (Savings)</Text>
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
                      <Icon as={FaArrowDown} boxSize={4} mr={1} />
                    </Box>
                  </Tooltip>
                </HStack>
              </Stack>
              <Text color="gray.400">
                Staked HBD generates 15.00% APR (defined by the{" "}
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
        {/* Right: Market Stats */}
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
          mb={{ base: 24, md: 0 }}
        >
          <Text
            fontWeight="extrabold"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={4}
            color="lime"
          >
            Market Prices
          </Text>
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
      </Grid>
    </>
  );
}
