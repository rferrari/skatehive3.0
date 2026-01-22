"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useFarcasterSession } from "../../hooks/useFarcasterSession";
import useHiveAccount from "@/hooks/useHiveAccount";
import useMarketPrices from "@/hooks/useMarketPrices";
import { useBankActions } from "@/hooks/wallet";
import { useAccount } from "wagmi";
import {
  Box,
  Grid,
  Text,
  Spinner,
  useDisclosure,
  Heading,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { AiohaModal, useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import "@aioha/react-ui/dist/build.css";
import { convertVestToHive } from "@/lib/hive/client-functions";
import { extractNumber } from "@/lib/utils/extractNumber";
import SendTokenModal from "@/components/wallet/SendTokenModal";
import { Asset } from "@hiveio/dhive";
import HivePowerSection from "./HivePowerSection";
import HiveSection from "./HiveSection";
import SkateBankSection from "./SkateBankSection";
import HBDSection from "./HBDSection";
import MarketPrices from "./MarketPrices";
import SwapSection from "./SwapSection";
import EthereumAssetsSection from "./EthereumAssetsSection";
import NFTSection from "./NFTSection";
import WalletSummary from "./WalletSummary";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { FarcasterEnhancedUserData } from "@/types/farcaster";
import TotalPortfolioValue from "./components/TotalPortfolioValue";
import MobileActionButtons from "./components/MobileActionButtons";
import { TokenDetail } from "@/types/portfolio";
import PIXTabContent from "./components/PIXTabContent";
import HiveTransactionHistory from "./components/HiveTransactionHistory";
import ClaimRewards from "./components/ClaimRewards";

interface HiveToken {
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  logo: string;
  network: "hive";
  type: "liquid" | "savings" | "power";
}

interface MainWalletProps {
  username?: string;
}

export default function MainWallet({ username }: MainWalletProps) {
  // Use the connected user from Aioha for Hive account data
  const { user } = useAioha();
  const { hiveAccount, isLoading, error } = useHiveAccount(user || "");
  const { claimInterest } = useBankActions();
  const { isConnected, address } = useAccount();
  const { colorMode } = useColorMode();

  // Get Farcaster profile for wallet integration
  const { isAuthenticated: isFarcasterConnected, profile: farcasterProfile } =
    useFarcasterSession();

  // State for enhanced Farcaster user data (custody + verified addresses)
  const [farcasterUserData, setFarcasterUserData] =
    useState<FarcasterEnhancedUserData | null>(null);

  // Prevent hydration mismatch by tracking if component is mounted
  const [isMounted, setIsMounted] = useState(false);
  const {
    isOpen: isConnectModalOpen,
    onOpen: openConnectModal,
    onClose: closeConnectModal,
  } = useDisclosure();
  const {
    isOpen: isHiveModalOpen,
    onOpen: openHiveModal,
    onClose: closeHiveModal,
  } = useDisclosure();
  const {
    isOpen: isSendTokenModalOpen,
    onOpen: openSendTokenModal,
    onClose: closeSendTokenModal,
  } = useDisclosure();

  const [selectedToken, setSelectedToken] = useState<TokenDetail | null>(null);
  const [hivePower, setHivePower] = useState<string | undefined>(undefined);
  const { hivePrice, hbdPrice, isPriceLoading } = useMarketPrices();
  const toast = useToast();

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handleConnectHive = useCallback(() => {
    if (user) {
      // User is already connected to Hive
      return;
    } else {
      // User is not connected, open the Aioha modal
      openHiveModal();
    }
  }, [user, openHiveModal]);

  const handleClaimHbdInterest = useCallback(async () => {
    const result = await claimInterest();
    if (result.success) {
      toast({
        title: "Success!",
        description: "HBD interest claimed successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to claim interest",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [claimInterest, toast]);

  // Memoize balance calculations - only if user is connected to Hive
  const hiveBalances = useMemo(() => {
    const balance =
      user && hiveAccount?.balance
        ? String(extractNumber(assetToString(hiveAccount.balance)))
        : "N/A";
    const hbdBalance =
      user && hiveAccount?.hbd_balance
        ? String(extractNumber(assetToString(hiveAccount.hbd_balance)))
        : "N/A";
    const hbdSavingsBalance =
      user && hiveAccount?.savings_hbd_balance
        ? String(extractNumber(assetToString(hiveAccount.savings_hbd_balance)))
        : "N/A";

    return { balance, hbdBalance, hbdSavingsBalance };
  }, [
    user,
    hiveAccount?.balance,
    hiveAccount?.hbd_balance,
    hiveAccount?.savings_hbd_balance,
  ]);

  // Memoize HBD interest calculations
  const hbdInterestData = useMemo(() => {
    if (!user || !hiveAccount?.savings_hbd_balance) {
      return {
        savingsHbdBalance: 0,
        estimatedClaimableInterest: 0,
        daysUntilClaim: 0,
        lastInterestPayment: undefined,
      };
    }

    const savingsHbdBalance = parseFloat(
      String(hiveAccount.savings_hbd_balance || "0.000")
    );
    const lastInterestPayment = hiveAccount.savings_hbd_last_interest_payment;
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
        Math.ceil(
          (nextClaimDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      );
    }

    return {
      savingsHbdBalance,
      estimatedClaimableInterest,
      daysUntilClaim,
      lastInterestPayment,
    };
  }, [
    user,
    hiveAccount?.savings_hbd_balance,
    hiveAccount?.savings_hbd_last_interest_payment,
  ]);

  // Memoize total Hive assets value calculation
  const totalHiveAssetsValue = useMemo(() => {
    if (!user || !hivePrice || !hbdPrice) return 0;

    const hiveBalance = parseFloat(
      hiveBalances.balance === "N/A" ? "0" : hiveBalances.balance
    );
    const hivePowerBalance = parseFloat(hivePower || "0");
    const hbdLiquidBalance = parseFloat(
      hiveBalances.hbdBalance === "N/A" ? "0" : hiveBalances.hbdBalance
    );
    const hbdSavingsBalanceNum = parseFloat(
      hiveBalances.hbdSavingsBalance === "N/A"
        ? "0"
        : hiveBalances.hbdSavingsBalance
    );

    const totalHiveValue = (hiveBalance + hivePowerBalance) * hivePrice;
    const totalHbdValue = (hbdLiquidBalance + hbdSavingsBalanceNum) * hbdPrice;

    return totalHiveValue + totalHbdValue;
  }, [user, hivePrice, hbdPrice, hiveBalances, hivePower]);

  // Mobile action handlers for Ethereum tokens
  const handleMobileSend = useCallback(
    (token: TokenDetail | HiveToken) => {
      if (token.network && token.network === "hive") {
        // Hive tokens are now handled by individual section modals
        // This handler is kept for backward compatibility but shouldn't be called
        console.warn("Hive token send should use section-specific modals");
      } else {
        // This is an Ethereum token, open SendTokenModal
        const ethToken = token as TokenDetail;
        setSelectedToken(ethToken);
        openSendTokenModal();
      }
    },
    [openSendTokenModal]
  );

  const handleMobileSwap = useCallback((token: TokenDetail | HiveToken) => {
    // TODO: Open swap interface with selected token
  }, []);

  // Only show loading if user is trying to access Hive data
  if ((isLoading && user) || !isMounted) {
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

  return (
    <>
      <PortfolioProvider
        address={isConnected ? address : undefined}
        farcasterAddress={
          // Use enhanced data if available and valid, otherwise fallback to profile custody
          farcasterUserData && !farcasterUserData.failed
            ? farcasterUserData.custody
            : isFarcasterConnected &&
              farcasterProfile &&
              "custody" in farcasterProfile
              ? farcasterProfile?.custody
              : undefined
        }
        farcasterVerifiedAddresses={
          // Use enhanced data if available and valid, otherwise fallback to profile verifications
          farcasterUserData && !farcasterUserData.failed
            ? farcasterUserData.verifications
            : isFarcasterConnected &&
              farcasterProfile &&
              "verifications" in farcasterProfile
              ? farcasterProfile?.verifications
              : undefined
        }
      >
        <Box
          w="100%"
          maxW="100vw"
          overflowX="hidden"
          sx={{ scrollbarWidth: "none" }}
        >
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
              bg="muted"
              boxShadow="none"
              display="flex"
              flexDirection="column"
              height="100%"
              minW={0}
            >
              <Tabs
                variant="enclosed"
                colorScheme="blue"
                size="md"
                flex={1}
              >
                <TabList mb={4} bg="background" p={1}>
                  <Tab
                    _selected={{ bg: "primary", color: "background" }}
                    _hover={{ bg: "primary", opacity: 0.8 }}
                    fontWeight="bold"
                    fontSize={{ base: "sm", md: "md" }}
                    flex={1}
                  >
                    💰 Wallet
                  </Tab>

                  {/* Only show SkateBank tab if user is connected to Hive */}
                  {user && (
                    <Tab
                      _selected={{ bg: "primary", color: "background" }}
                      _hover={{ bg: "primary", opacity: 0.8 }}
                      fontWeight="bold"
                      fontSize={{ base: "sm", md: "md" }}
                      flex={1}
                    >
                      🏦 SkateBank
                    </Tab>
                  )}

                  {/* Only show SkateBank tab if user is connected to Hive */}
                  {user && (
                    <Tab
                      _selected={{ bg: "primary", color: "background" }}
                      _hover={{ bg: "primary", opacity: 0.8 }}
                      fontWeight="bold"
                      fontSize={{ base: "sm", md: "md" }}
                      flex={1}
                    >
                      💸 PIX
                    </Tab>
                  )}
                </TabList>

                <TabPanels flex={1}>
                  {/* Wallet Tab - Token Information */}
                  <TabPanel p={0}>
                    <Box
                      w="100%"
                      display={{ base: "flex", md: "none" }} // Only display on mobile
                      flexDirection="column"
                      gap={3}
                      p={2}
                    >
                      {/* Mobile Action Buttons - Always at the top on mobile */}
                      <Box
                        display={{ base: "block", md: "none" }}
                        px={4}
                        pt={4}
                        pb={2}
                      >
                        <MobileActionButtons
                          onSend={handleMobileSend}
                          onSwap={handleMobileSwap}
                        />
                      </Box>

                      <TotalPortfolioValue
                        totalHiveAssetsValue={totalHiveAssetsValue}
                      />
                    </Box>

                    {/* Hive Sections - Show if user is connected to Hive */}
                    {user ? (
                      <>
                        <HiveSection
                          balance={hiveBalances.balance}
                          hivePrice={hivePrice}
                        />

                        <HBDSection
                          hbdBalance={hiveBalances.hbdBalance}
                          hbdSavingsBalance="0.000"
                          hbdPrice={hbdPrice}
                          estimatedClaimableInterest={0}
                          daysUntilClaim={0}
                          lastInterestPayment={
                            hbdInterestData.lastInterestPayment
                          }
                          onClaimInterest={handleClaimHbdInterest}
                          isWalletView={true}
                        />

                        <ClaimRewards
                          reward_hbd_balance={hiveAccount?.reward_hbd_balance}
                          reward_hive_balance={hiveAccount?.reward_hive_balance}
                          reward_vesting_balance={
                            hiveAccount?.reward_vesting_balance
                          }
                          reward_vesting_hive={hiveAccount?.reward_vesting_hive}
                        />

                        {/* Transaction History  - Show if user is connected to Hive */}
                        <HiveTransactionHistory searchAccount={user} />
                      </>
                    ) : (
                      /* Show Connect Hive Section if not connected */
                      <MobileActionButtons
                        onSend={handleMobileSend}
                        onSwap={handleMobileSwap}
                      />
                    )}

                    {/* Ethereum Assets Section - Show if connected to Ethereum OR have Farcaster data */}
                    {isMounted && (isConnected || isFarcasterConnected) && (
                      <EthereumAssetsSection />
                    )}

                    {/* NFT Section - Show if connected to Ethereum */}
                    {isMounted && isConnected && <NFTSection />}
                  </TabPanel>

                  {/* SkateBank Tab - Investment Options - Only show if connected to Hive */}
                  {user && (
                    <TabPanel p={0}>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Heading
                            size="md"
                            mb={3}
                            color="primary"
                            fontFamily="Joystix"
                          >
                            💎 Investment Portfolio
                          </Heading>
                          <Text fontSize="sm" color="text" mb={4}>
                            Grow your tokens with SkateHive&apos;s investment
                            options and Earn passive income and build your
                            skateboarding empire!
                          </Text>

                          <Box mb={5}>
                            <HivePowerSection
                              hivePower={hivePower}
                              hivePrice={hivePrice}
                              hiveBalance={hiveBalances.balance}
                            />
                          </Box>

                          {/* SkateBank Investment */}
                          <Box
                            p={4}
                            bg="background"
                            border="1px solid"
                            borderColor="muted"
                          >
                            <SkateBankSection
                              hbdBalance={hiveBalances.hbdBalance}
                              hbdSavingsBalance={hiveBalances.hbdSavingsBalance}
                              hbdPrice={hbdPrice}
                              estimatedClaimableInterest={
                                hbdInterestData.estimatedClaimableInterest
                              }
                              daysUntilClaim={hbdInterestData.daysUntilClaim}
                              lastInterestPayment={
                                hbdInterestData.lastInterestPayment
                              }
                              savings_withdraw_requests={
                                hiveAccount?.savings_withdraw_requests || 0
                              }
                              onClaimInterest={handleClaimHbdInterest}
                            />
                          </Box>
                        </Box>
                      </VStack>
                    </TabPanel>
                  )}

                  {/* PIX Tab - Pixbee - Only show if connected to Hive */}
                  {user && (
                    <TabPanel p={0}>
                      <VStack spacing={4} align="stretch">
                        <PIXTabContent />
                      </VStack>
                    </TabPanel>
                  )}
                </TabPanels>
              </Tabs>
            </Box>

            {/* Right: Market Stats and Swap */}
            {/* Hide right sidebar on mobile */}
            <VStack
              display={{ base: "none", md: "flex" }}
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
                hiveUsername={user}
                totalHiveValue={totalHiveAssetsValue}
                isPriceLoading={isPriceLoading}
                onConnectEthereum={openConnectModal}
                onConnectHive={handleConnectHive}
              />
              <MarketPrices
                hivePrice={hivePrice}
                hbdPrice={hbdPrice}
                isPriceLoading={isPriceLoading}
              />
              <SwapSection
                hivePrice={hivePrice}
                hbdPrice={hbdPrice}
                isPriceLoading={isPriceLoading}
              />
            </VStack>
          </Grid>

          {/* Aioha Modal for Hive Connection */}
          <div className={colorMode}>
            <AiohaModal
              displayed={isHiveModalOpen}
              loginOptions={{
                msg: "Connect to Hive",
                keyType: KeyTypes.Posting,
                loginTitle: "Connect Your Hive Account",
              }}
              onLogin={() => {
                closeHiveModal();
              }}
              onClose={() => closeHiveModal()}
            />
          </div>

          {/* SendTokenModal for Ethereum tokens */}
          {selectedToken && (
            <SendTokenModal
              isOpen={isSendTokenModalOpen}
              onClose={closeSendTokenModal}
              token={selectedToken}
            />
          )}
        </Box>
      </PortfolioProvider>
    </>
  );
}
