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
  Stack,
  Heading,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { convertVestToHive } from "@/lib/hive/client-functions";
import { extractNumber } from "@/lib/utils/extractNumber";
import WalletModal from "@/components/wallet/WalletModal";
import { useTheme } from "../../app/themeProvider";
import ConnectButton from "../wallet/ConnectButton";
import ConnectModal from "../wallet/ConnectModal";
import { Asset } from "@hiveio/dhive";
import HivePowerSection from "./HivePowerSection";
import HiveSection from "./HiveSection";
import HBDSection from "./HBDSection";
import MarketPrices from "./MarketPrices";
import SwapSection from "./SwapSection";
import EthereumAssetsSection from "./EthereumAssetsSection";

interface MainWalletProps {
  username: string;
}

export default function MainWallet({ username }: MainWalletProps) {
  const { hiveAccount, isLoading, error } = useHiveAccount(username);
  const { handleConfirm, handleClaimInterest } = useWalletActions();
  const { isConnected } = useAccount();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { theme } = useTheme();
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
    daysSinceLastPayment = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
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

  return (
    <>
      <Box w="100%">
        <Grid
          templateColumns={{ base: "1fr", md: "2fr 1fr" }}
          gap={{ base: 2, md: 6 }}
          alignItems="stretch"
          m={{ base: 1, md: 4 }}
          height={{ md: "100%" }}
        >
          {/* Left: Wallet Balances and Actions */}
          <Box
            p={{ base: 2, md: 4 }}
            border="none"
            borderRadius="base"
            bg="muted"
            boxShadow="none"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            height="100%"
          >
            <Flex align="center" justify="space-between" mb={6}>
              <Heading as="h2" size="lg" fontFamily="Joystix" color="primary">
                Skatehive Wallet
              </Heading>
              <Box>
                <ConnectButton onOpen={openConnectModal} />
                <ConnectModal
                  isOpen={isConnectModalOpen}
                  onClose={closeConnectModal}
                />
              </Box>
            </Flex>

            <Box w="100%" display="flex" flexDirection="column" gap={3} mb={0}>
              <HivePowerSection
                hivePower={hivePower}
                onModalOpen={handleModalOpen}
              />
              <HiveSection balance={balance} onModalOpen={handleModalOpen} />
              <HBDSection
                hbdBalance={hbdBalance}
                hbdSavingsBalance={hbdSavingsBalance}
                estimatedClaimableInterest={estimatedClaimableInterest}
                daysUntilClaim={daysUntilClaim}
                lastInterestPayment={lastInterestPayment}
                onModalOpen={handleModalOpen}
                onClaimInterest={handleClaimInterest}
              />
            </Box>
          </Box>

          {/* Right: Market Stats and Swap */}
          <VStack
            spacing={4}
            align="stretch"
            maxW={{ base: "100%", md: "340px" }}
            mx="auto"
            mb={{ base: 24, md: 0 }}
            height="100%"
            justifyContent="space-between"
          >
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

      {isConnected && <EthereumAssetsSection />}
    </>
  );
}
