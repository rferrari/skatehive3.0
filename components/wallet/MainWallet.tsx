'use client';
import { useState, useEffect } from "react";
import useHiveAccount from "@/hooks/useHiveAccount";
import { useWalletActions } from "@/hooks/useWalletActions";
import { useAccount } from "wagmi";
import {
  Box,
  Grid,
  Text,
  Spinner,
  useDisclosure,
  Heading,
  VStack,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { convertVestToHive } from "@/lib/hive/client-functions";
import { extractNumber } from "@/lib/utils/extractNumber";
import WalletModal from "@/components/wallet/WalletModal";
import ConnectModal from "../wallet/ConnectModal";
import { Asset } from "@hiveio/dhive";
import HivePowerSection from "./HivePowerSection";
import HiveSection from "./HiveSection";
import HBDSection from "./HBDSection";
import MarketPrices from "./MarketPrices";
import SwapSection from "./SwapSection";
import EthereumAssetsSection from "./EthereumAssetsSection";
import WalletSummary from "./WalletSummary";

interface MainWalletProps {
  username: string;
}

export default function MainWallet({ username }: MainWalletProps) {
  const { hiveAccount, isLoading, error } = useHiveAccount(username);
  const { handleConfirm, handleClaimHbdInterest } = useWalletActions();
  const { isConnected } = useAccount();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isConnectModalOpen,
    onOpen: openConnectModal,
    onClose: closeConnectModal,
  } = useDisclosure();

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

  function assetToString(val: string | Asset): string {
    return typeof val === "string" ? val : val.toString();
  }

  useEffect(() => {
    const fetchHivePower = async () => {
      if (hiveAccount?.vesting_shares) {
        try {
          const power = (
            await convertVestToHive(
              Number(extractNumber(String(hiveAccount.vesting_shares)))
            )
          ).toFixed(3);
          setHivePower(power.toString());
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

  const handleConnectHive = () => {
    // TODO: Implement Hive connection logic
    // This could open a modal to enter username or connect via Keychain
    // For now, we could redirect to a login page or show a modal
    alert("Hive connection coming soon! For now, the app uses the URL username parameter.");
  };

  const onConfirm = async (
    amount: number,
    direction?: "HIVE_TO_HBD" | "HBD_TO_HIVE",
    username?: string,
    memo?: string
  ) => {
    if (modalContent) {
      await handleConfirm(
        amount,
        direction,
        username,
        memo,
        modalContent.title
      );
    }
    onClose();
  };

  // Calculate HBD interest data
  const savingsHbdBalance = parseFloat(
    String(hiveAccount?.savings_hbd_balance || "0.000")
  );
  const lastInterestPayment = hiveAccount?.savings_hbd_last_interest_payment;
  const APR = 0.15;
  let daysSinceLastPayment = 0;
  if (lastInterestPayment) {
    const last = new Date(lastInterestPayment);
    const now = new Date();
    daysSinceLastPayment = Math.max(
      0,
      Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    );
  }
  const estimatedClaimableInterest =
    savingsHbdBalance * APR * (daysSinceLastPayment / 365);
  let daysUntilClaim = 0;
  if (lastInterestPayment) {
    const last = new Date(lastInterestPayment);
    const nextClaimDate = new Date(last.getTime() + 30 * 24 * 60 * 60 * 1000);
    daysUntilClaim = Math.max(
      0,
      Math.ceil((nextClaimDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
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
    ? String(extractNumber(assetToString(hiveAccount.balance)))
    : "N/A";
  const hbdBalance = hiveAccount?.hbd_balance
    ? String(extractNumber(assetToString(hiveAccount.hbd_balance)))
    : "N/A";
  const hbdSavingsBalance = hiveAccount?.savings_hbd_balance
    ? String(extractNumber(assetToString(hiveAccount.savings_hbd_balance)))
    : "N/A";

  // Calculate total Hive assets value in USD
  const calculateTotalHiveAssetsValue = () => {
    if (!hivePrice || !hbdPrice) return 0;

    const hiveBalance = parseFloat(balance === "N/A" ? "0" : balance);
    const hivePowerBalance = parseFloat(hivePower || "0");
    const hbdLiquidBalance = parseFloat(hbdBalance === "N/A" ? "0" : hbdBalance);
    const hbdSavingsBalanceNum = parseFloat(hbdSavingsBalance === "N/A" ? "0" : hbdSavingsBalance);

    const totalHiveValue = (hiveBalance + hivePowerBalance) * hivePrice;
    const totalHbdValue = (hbdLiquidBalance + hbdSavingsBalanceNum) * hbdPrice;

    return totalHiveValue + totalHbdValue;
  };

  const totalHiveAssetsValue = calculateTotalHiveAssetsValue();

  return (
    <>
      <Box w="100%" maxW="100vw" overflowX="hidden">
        <Grid
          templateColumns={{ base: "1fr", md: "2fr 1fr" }}
          gap={{ base: 4, md: 6 }}
          alignItems="stretch"
          m={{ base: 0, md: 4 }}
          px={{ base: 0, md: 0 }}
          height={{ md: "100%" }}
        >
          {/* Left: Tabbed Wallet Interface */}
          <Box
            p={{ base: 2, sm: 3, md: 4 }}
            border="none"
            borderRadius="base"
            bg="muted"
            boxShadow="none"
            display="flex"
            flexDirection="column"
            height="100%"
            minW={0}
          >
            <Tabs variant="soft-rounded" colorScheme="blue" size="md" flex={1}>
              <TabList mb={4} bg="background" p={1} borderRadius="lg">
                <Tab
                  _selected={{ bg: "primary", color: "background" }}
                  _hover={{ bg: "primary", opacity: 0.8 }}
                  fontWeight="bold"
                  fontSize={{ base: "sm", md: "md" }}
                  flex={1}
                >
                  💰 Wallet
                </Tab>
                <Tab
                  _selected={{ bg: "primary", color: "background" }}
                  _hover={{ bg: "primary", opacity: 0.8 }}
                  fontWeight="bold"
                  fontSize={{ base: "sm", md: "md" }}
                  flex={1}
                >
                  🏦 SkateBank
                </Tab>
              </TabList>

              <TabPanels flex={1}>
                {/* Wallet Tab - Token Information */}
                <TabPanel p={0}>
                  <Box w="100%" display="flex" flexDirection="column" gap={3} p={2}>
                    <HivePowerSection
                      hivePower={hivePower}
                      hivePrice={hivePrice}
                      onModalOpen={handleModalOpen}
                    />
                    <HiveSection
                      balance={balance}
                      hivePrice={hivePrice}
                      onModalOpen={handleModalOpen}
                    />
                    <HBDSection
                      hbdBalance={hbdBalance}
                      hbdSavingsBalance="0.000" // Only show liquid HBD in wallet tab
                      hbdPrice={hbdPrice}
                      estimatedClaimableInterest={0}
                      daysUntilClaim={0}
                      lastInterestPayment={lastInterestPayment}
                      onModalOpen={handleModalOpen}
                      onClaimInterest={handleClaimHbdInterest}
                      isWalletView={true}
                    />
                  </Box>
                  {/* Ethereum Assets Section - Outside tabs */}
                  {isConnected && <EthereumAssetsSection />}
                </TabPanel>

                {/* SkateBank Tab - Investment Options */}
                <TabPanel p={0}>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading size="md" mb={3} color="primary" fontFamily="Joystix">
                        💎 Investment Portfolio
                      </Heading>
                      <Text fontSize="sm" color="text" mb={4}>
                        Grow your tokens with SkateHive's investment options. Earn passive income and build your skateboarding empire!
                      </Text>
                    </Box>

                    {/* HBD Savings Investment */}
                    <Box
                      p={4}
                      bg="background"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="muted"
                    >
                      <Heading size="sm" mb={2} color="primary">
                        🏛️ Dollar Savings (15% APR)
                      </Heading>
                      <Text fontSize="sm" color="text" mb={3}>
                        Earn guaranteed 15% annual interest on your Dollar Savings. Perfect for long-term hodlers!
                      </Text>
                      <HBDSection
                        hbdBalance={hbdBalance}
                        hbdSavingsBalance={hbdSavingsBalance}
                        hbdPrice={hbdPrice}
                        estimatedClaimableInterest={estimatedClaimableInterest}
                        daysUntilClaim={daysUntilClaim}
                        lastInterestPayment={lastInterestPayment}
                        onModalOpen={handleModalOpen}
                        onClaimInterest={handleClaimHbdInterest}
                        isBankView={true}
                      />
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>

          {/* Right: Market Stats and Swap */}
          <VStack
            spacing={4}
            align="stretch"
            maxW={{ base: "100%", md: "340px" }}
            mx={{ base: 0, md: "auto" }}
            mt={{ base: 6, md: 0 }}
            mb={{ base: 4, md: 0 }}
            height="100%"
            justifyContent="flex-start"
            minW={0}
          >
            <WalletSummary
              hiveUsername={username}
              totalHiveValue={totalHiveAssetsValue}
              isPriceLoading={isPriceLoading}
              onConnectEthereum={openConnectModal}
              onConnectHive={handleConnectHive}
            />
            <ConnectModal
              isOpen={isConnectModalOpen}
              onClose={closeConnectModal}
            />
            <MarketPrices
              hivePrice={hivePrice}
              hbdPrice={hbdPrice}
              isPriceLoading={isPriceLoading}
            />
            <SwapSection onModalOpen={handleModalOpen} />
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
            onConfirm={onConfirm}
          />
        )}
      </Box>
    </>
  );
}
