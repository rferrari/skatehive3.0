"use client";

import { useState, useEffect, useMemo } from "react";
import {
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Heading,
} from "@chakra-ui/react";
import { FaEthereum, FaHive } from "react-icons/fa";
import {
  DAO_ADDRESSES,
  SKATEHIVE_HOT_ADDRESS,
  SKATEHIVE_BASE_MULTISIG,
} from "@/lib/utils/constants";
import useHiveAccount from "@/hooks/useHiveAccount";
import useMarketPrices from "@/hooks/useMarketPrices";
import { AddressDisplay } from "./AddressDisplay";
import { HiveBalanceDisplay } from "./HiveBalanceDisplay";
import { TreasuryTotalCard } from "./TreasuryTotalCard";
import { ProposalButton } from "./ProposalButton";
import {
  formatCurrency,
  calculateHiveAccountValue,
} from "@/lib/utils/daoUtils";

interface PortfolioData {
  totalNetWorth: number;
  totalBalanceUsdTokens: number;
  totalBalanceUSDApp: number;
  nftUsdNetWorth: { [key: string]: string };
  tokens: any[];
  nfts: any[];
}

export default function DAOAssets() {
  const [ethereumBalances, setEthereumBalances] = useState<{
    [key: string]: PortfolioData;
  }>({});
  const [isLoadingEthereum, setIsLoadingEthereum] = useState(false);

  // Hive account data for all three wallets
  const { hiveAccount: skateHiveAccount, isLoading: isLoadingSkateHive } =
    useHiveAccount("skatehive");
  const { hiveAccount: steemSkateAccount, isLoading: isLoadingSteemSkate } =
    useHiveAccount("steemskate");
  const { hiveAccount: gnarsAccount, isLoading: isLoadingGnars } =
    useHiveAccount("gnars");

  // Market prices using centralized hook
  const { hivePrice, hbdPrice, isPriceLoading } = useMarketPrices();

  // Global properties for accurate vesting shares conversion
  const [globalProps, setGlobalProps] = useState<any>(null);

  // Fetch global properties for accurate Hive Power conversion
  useEffect(() => {
    const fetchGlobalProps = async () => {
      try {
        const response = await fetch("https://api.hive.blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_dynamic_global_properties",
            params: [],
            id: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setGlobalProps(data.result);
        }
      } catch (error) {
        console.error("Error fetching global properties:", error);
      }
    };

    fetchGlobalProps();
  }, []);

  // Ethereum addresses configuration
  const ethereumAddresses = useMemo(
    () => [
      {
        label: "SkateHive Hot Wallet",
        address: SKATEHIVE_HOT_ADDRESS,
      },
      {
        label: "SkateHive Base Multisig",
        address: SKATEHIVE_BASE_MULTISIG,
      },
      {
        label: "Treasury Contract",
        address: DAO_ADDRESSES.treasury,
      },
    ],
    []
  );

  const hiveAddresses = [
    {
      label: "SkateHive Community Account",
      address: "skatehive",
      account: skateHiveAccount,
      isLoading: isLoadingSkateHive,
    },
    {
      label: "SteemSkate Community Account",
      address: "steemskate",
      account: steemSkateAccount,
      isLoading: isLoadingSteemSkate,
    },
    {
      label: "Gnars Community Account",
      address: "gnars",
      account: gnarsAccount,
      isLoading: isLoadingGnars,
    },
  ];

  // Fetch Ethereum portfolio data
  useEffect(() => {
    const fetchEthereumBalances = async () => {
      setIsLoadingEthereum(true);
      const balances: { [key: string]: PortfolioData } = {};

      for (const addr of ethereumAddresses) {
        if (addr.address) {
          try {
            const response = await fetch(`/api/portfolio/${addr.address}`);
            if (response.ok) {
              const data: PortfolioData = await response.json();
              balances[addr.address] = data;
            }
          } catch (error) {
            console.error(`Error fetching balance for ${addr.address}:`, error);
          }
        }
      }

      setEthereumBalances(balances);
      setIsLoadingEthereum(false);
    };

    fetchEthereumBalances();
  }, [ethereumAddresses]);

  const getEthereumBalance = (address: string) => {
    const data = ethereumBalances[address];
    if (!data) return undefined;
    return formatCurrency(data.totalNetWorth);
  };

  // Calculate totals
  const totalEthereumValue = Object.values(ethereumBalances).reduce(
    (sum, data) => sum + data.totalNetWorth,
    0
  );

  const totalHiveValue =
    calculateHiveAccountValue(
      skateHiveAccount,
      hivePrice || 0.21,
      hbdPrice || 1.0,
      globalProps
    ) +
    calculateHiveAccountValue(
      steemSkateAccount,
      hivePrice || 0.21,
      hbdPrice || 1.0,
      globalProps
    ) +
    calculateHiveAccountValue(
      gnarsAccount,
      hivePrice || 0.21,
      hbdPrice || 1.0,
      globalProps
    );

  const grandTotal = totalEthereumValue + totalHiveValue;

  return (
    <Card maxW="6xl" bg={"background"} backdropFilter="blur(10px)" w="full">
      <CardBody p={8}>
        <VStack spacing={8}>
          <VStack spacing={4}>
            <Heading
              size="lg"
              color={"primary"}
              textAlign="center"
              fontWeight="semibold"
            >
              DAO Assets & Addresses
            </Heading>

            <TreasuryTotalCard totalValue={grandTotal} />
          </VStack>

          <Tabs
            variant="enclosed"
            colorScheme="orange"
            w="full"
            bg={"background"}
            borderRadius="lg"
          >
            <TabList justifyContent="center" border="none">
              <Tab
                color={"accent"}
                _selected={{
                  bg: "muted",
                  color: "background",
                  fontWeight: "medium",
                }}
                _hover={{ color: "primary" }}
                px={6}
                py={3}
                borderRadius="md"
                mx={1}
              >
                <VStack spacing={2}>
                  <HStack spacing={2} align="center">
                    <FaEthereum color="#627EEA" size={20} />
                    <Text fontSize="lg" fontWeight="semibold">
                      Ethereum Assets
                    </Text>
                  </HStack>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color="#627EEA"
                    textShadow="0 0 8px rgba(98, 126, 234, 0.3)"
                  >
                    {formatCurrency(totalEthereumValue)}
                  </Text>
                </VStack>
              </Tab>
              <Tab
                color={"accent"}
                _selected={{
                  bg: "muted",
                  color: "background",
                  fontWeight: "medium",
                }}
                _hover={{ color: "primary" }}
                px={8}
                py={4}
                borderRadius="md"
                mx={1}
              >
                <VStack spacing={2}>
                  <HStack spacing={2} align="center">
                    <FaHive color="#E94266" size={20} />
                    <Text fontSize="lg" fontWeight="semibold">
                      Hive Wallets
                    </Text>
                  </HStack>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color="#E94266"
                    textShadow="0 0 8px rgba(233, 66, 102, 0.3)"
                  >
                    {formatCurrency(totalHiveValue)}
                  </Text>
                </VStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0} py={6}>
                <VStack spacing={4} w="full">
                  {ethereumAddresses.map((addr, index) => (
                    <AddressDisplay
                      key={index}
                      label={addr.label}
                      address={addr.address}
                      type="ethereum"
                      balance={getEthereumBalance(addr.address)}
                      isLoading={isLoadingEthereum}
                    />
                  ))}
                </VStack>
              </TabPanel>

              <TabPanel px={0} py={6}>
                <VStack spacing={4} w="full">
                  {hiveAddresses.map((addr, index) => (
                    <AddressDisplay
                      key={index}
                      label={addr.label}
                      address={addr.address}
                      type="hive"
                      balance={
                        addr.account ? (
                          <HiveBalanceDisplay
                            account={addr.account}
                            hivePrice={hivePrice || 0.21}
                            hbdPrice={hbdPrice || 1.0}
                            globalProps={globalProps}
                          />
                        ) : (
                          "No data"
                        )
                      }
                      isLoading={addr.isLoading}
                    />
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <ProposalButton />
        </VStack>
      </CardBody>
    </Card>
  );
}
