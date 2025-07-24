import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Box,
  Text,
  Image,
  Spinner,
  Badge,
  useColorMode,
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { TokenDetail } from "../../../types/portfolio";
import { usePortfolioContext } from "../../../contexts/PortfolioContext";
import { consolidateTokensBySymbol } from "../../../lib/utils/portfolioUtils";
import { useAioha } from "@aioha/react-ui";
import useHiveAccount from "../../../hooks/useHiveAccount";

interface HiveToken {
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  logo: string;
  network: "hive";
  type: "liquid" | "savings" | "power";
}

interface TokenSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: TokenDetail | HiveToken) => void;
  title: string;
}

export default function TokenSearchModal({
  isOpen,
  onClose,
  onTokenSelect,
  title,
}: TokenSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { aggregatedPortfolio } = usePortfolioContext();
  const { user } = useAioha();
  const { hiveAccount } = useHiveAccount(user || "");
  const { colorMode } = useColorMode();

  // Reset search when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Prepare Hive tokens
  const hiveTokens = useMemo((): HiveToken[] => {
    if (!user || !hiveAccount) return [];

    const tokens: HiveToken[] = [];

    // HIVE liquid balance
    if (hiveAccount.balance) {
      const balance = parseFloat(String(hiveAccount.balance).split(" ")[0]);
      if (balance > 0) {
        tokens.push({
          symbol: "HIVE",
          name: "Hive",
          balance: balance.toFixed(3),
          balanceUSD: balance * 0.2, // You might want to get real price
          logo: "/logos/hive-logo.png",
          network: "hive",
          type: "liquid",
        });
      }
    }

    // HBD liquid balance
    if (hiveAccount.hbd_balance) {
      const balance = parseFloat(String(hiveAccount.hbd_balance).split(" ")[0]);
      if (balance > 0) {
        tokens.push({
          symbol: "HBD",
          name: "Hive Backed Dollar",
          balance: balance.toFixed(3),
          balanceUSD: balance * 1.0, // HBD is pegged to $1
          logo: "/logos/hbd-logo.png",
          network: "hive",
          type: "liquid",
        });
      }
    }

    // HBD savings balance
    if (hiveAccount.savings_hbd_balance) {
      const balance = parseFloat(
        String(hiveAccount.savings_hbd_balance).split(" ")[0]
      );
      if (balance > 0) {
        tokens.push({
          symbol: "HBD",
          name: "HBD Savings (15% APR)",
          balance: balance.toFixed(3),
          balanceUSD: balance * 1.0,
          logo: "/logos/hbd-logo.png",
          network: "hive",
          type: "savings",
        });
      }
    }

    return tokens;
  }, [user, hiveAccount]);

  // Prepare Ethereum tokens
  const ethereumTokens = useMemo(() => {
    if (!aggregatedPortfolio?.tokens) return [];
    return consolidateTokensBySymbol(aggregatedPortfolio.tokens);
  }, [aggregatedPortfolio?.tokens]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const filteredHive = hiveTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
    );

    const filteredEthereum = ethereumTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.primaryChain.token.address.toLowerCase().includes(query)
    );

    return {
      hive: filteredHive,
      ethereum: filteredEthereum,
    };
  }, [searchQuery, hiveTokens, ethereumTokens]);

  const handleTokenClick = (token: TokenDetail | HiveToken) => {
    onTokenSelect(token);
    onClose();
  };

  const isHiveToken = (token: any): token is HiveToken => {
    return token.network === "hive";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="background" border="1px solid" borderColor="muted">
        <ModalHeader color="primary" fontFamily="Joystix">
          {title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Search Input */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Search tokens by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="muted"
                border="1px solid"
                borderColor="border"
                _focus={{
                  borderColor: "primary",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                }}
              />
            </InputGroup>

            {/* Token Lists */}
            <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
              {/* Hive Tokens */}
              {filteredTokens.hive.length > 0 && (
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="primary"
                    mb={2}
                    fontFamily="Joystix"
                  >
                    🚀 Hive Tokens
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {filteredTokens.hive.map((token, index) => (
                      <HStack
                        key={`${token.symbol}-${token.type}-${index}`}
                        p={3}
                        bg="muted"
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: "hover" }}
                        onClick={() => handleTokenClick(token)}
                        justify="space-between"
                      >
                        <HStack spacing={3}>
                          <Image
                            src={token.logo}
                            alt={token.symbol}
                            w="32px"
                            h="32px"
                            borderRadius="full"
                            fallbackSrc="/logos/default-token.png"
                          />
                          <VStack align="start" spacing={0}>
                            <HStack>
                              <Text fontWeight="bold" color="text">
                                {token.symbol}
                              </Text>
                              {token.type === "savings" && (
                                <Badge colorScheme="green" size="sm">
                                  Savings
                                </Badge>
                              )}
                              {token.type === "power" && (
                                <Badge colorScheme="purple" size="sm">
                                  Power
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="textSecondary">
                              {token.name}
                            </Text>
                          </VStack>
                        </HStack>
                        <VStack align="end" spacing={0}>
                          <Text fontWeight="bold" color="text">
                            {token.balance} {token.symbol}
                          </Text>
                          <Text fontSize="sm" color="textSecondary">
                            ${token.balanceUSD.toFixed(2)}
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Ethereum Tokens */}
              {filteredTokens.ethereum.length > 0 && (
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="primary"
                    mb={2}
                    fontFamily="Joystix"
                  >
                    ⚡ Ethereum Tokens
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {filteredTokens.ethereum.map((consolidatedToken, index) => {
                      const token = consolidatedToken.primaryChain;
                      return (
                        <HStack
                          key={`${token.token.symbol}-${index}`}
                          p={3}
                          bg="muted"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: "hover" }}
                          onClick={() => handleTokenClick(token)}
                          justify="space-between"
                        >
                          <HStack spacing={3}>
                            <Image
                              src={`https://token-icons.s3.amazonaws.com/${token.token.address.toLowerCase()}.png`}
                              alt={token.token.symbol}
                              w="32px"
                              h="32px"
                              borderRadius="full"
                              fallbackSrc="/logos/default-token.png"
                            />
                            <VStack align="start" spacing={0}>
                              <HStack>
                                <Text fontWeight="bold" color="text">
                                  {token.token.symbol}
                                </Text>
                                {consolidatedToken.chains.length > 1 && (
                                  <Badge colorScheme="blue" size="sm">
                                    {consolidatedToken.chains.length} chains
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="sm" color="textSecondary">
                                {token.token.name}
                              </Text>
                            </VStack>
                          </HStack>
                          <VStack align="end" spacing={0}>
                            <Text fontWeight="bold" color="text">
                              {token.token.balance.toFixed(4)}{" "}
                              {token.token.symbol}
                            </Text>
                            <Text fontSize="sm" color="textSecondary">
                              ${consolidatedToken.totalBalanceUSD.toFixed(2)}
                            </Text>
                          </VStack>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>
              )}

              {/* No results */}
              {searchQuery &&
                filteredTokens.hive.length === 0 &&
                filteredTokens.ethereum.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color="textSecondary">
                      No tokens found matching "{searchQuery}"
                    </Text>
                  </Box>
                )}

              {/* Empty state */}
              {!searchQuery &&
                filteredTokens.hive.length === 0 &&
                filteredTokens.ethereum.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color="textSecondary">
                      No tokens available for {title.toLowerCase()}
                    </Text>
                  </Box>
                )}
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
