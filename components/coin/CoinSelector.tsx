"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Avatar,
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useProfileCoins, ProfileCoin } from "@/hooks/useProfileCoins";
import { Address } from "viem";

// Helper function to truncate very long coin names
const truncateCoinName = (name: string, maxLength = 50) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + "...";
};

interface CoinSelectorProps {
  selectedCoin: {
    address?: Address;
    symbol: string;
    name: string;
    image?: string;
  };
  onSelectCoin: (coin: {
    address?: Address;
    symbol: string;
    name: string;
    image?: string;
  }) => void;
  isBuying: boolean;
}

export const CoinSelector: React.FC<CoinSelectorProps> = ({
  selectedCoin,
  onSelectCoin,
  isBuying,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { profileCoins, loading, error } = useProfileCoins();

  // Debug logs for coin selector state
  console.log("🔧 CoinSelector: Profile coins loaded:", {
    count: profileCoins.length,
    loading,
    error: !!error,
    isBuying,
  });

  // ETH option
  const ethOption = {
    symbol: "ETH",
    name: "Ethereum",
    image: undefined,
  };

  const handleCoinSelect = (coin: {
    address?: Address;
    symbol: string;
    name: string;
    image?: string;
  }) => {
    onSelectCoin(coin);
    onClose();
  };

  return (
    <>
      <Box
        bg="background"
        borderRadius="lg"
        p={{ base: 2, md: 3 }}
        display="flex"
        alignItems="center"
        cursor="pointer"
        flex="1"
        maxW="120px"
        onClick={onOpen}
        _hover={{ bg: "gray.700" }}
      >
        <Avatar
          size="xs"
          name={selectedCoin.symbol}
          src={selectedCoin.image}
          mr={2}
        />
        <Text fontSize={{ base: "sm", md: "sm" }} mr={2}>
          {selectedCoin.symbol}
        </Text>
        <ChevronDownIcon />
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="background" color="white">
          <ModalHeader>
            Select {isBuying ? "Payment" : "Trading"} Currency
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={3} align="stretch">
              {/* Always show ETH option */}
              <Button
                variant="ghost"
                justifyContent="flex-start"
                h="60px"
                overflow="hidden"
                onClick={() => handleCoinSelect(ethOption)}
                _hover={{ bg: "gray.700" }}
                bg={selectedCoin.symbol === "ETH" ? "gray.700" : "transparent"}
              >
                <HStack w="full" overflow="hidden">
                  <Avatar size="sm" name="ETH" flexShrink={0} />
                  <VStack align="start" spacing={0} flex={1} minW={0}>
                    <Text fontWeight="bold" isTruncated maxW="100%">ETH</Text>
                    <Text fontSize="sm" color="gray.400" isTruncated maxW="100%">
                      Ethereum
                    </Text>
                  </VStack>
                </HStack>
              </Button>

              {/* Show profile coins only for buying mode or selling mode */}
              {(!isBuying || profileCoins.length > 0) && (
                <>
                  <Divider />
                  <Text fontSize="sm" color="gray.400" fontWeight="bold">
                    Your Coins
                  </Text>
                </>
              )}

              {loading && (
                <HStack justify="center" py={4}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.400">
                    Loading your coins...
                  </Text>
                </HStack>
              )}

              {error && (
                <Text fontSize="sm" color="red.400" textAlign="center">
                  Error loading coins: {error}
                </Text>
              )}

              {!loading && profileCoins.length === 0 && !error && (
                <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
                  No coins found in your wallet
                </Text>
              )}

              {profileCoins.map((coin, index) => (
                <Button
                  key={`${coin.address}-${index}`}
                  variant="ghost"
                  justifyContent="flex-start"
                  h="60px"
                  overflow="hidden"
                  onClick={() =>
                    handleCoinSelect({
                      address: coin.address,
                      symbol: coin.symbol,
                      name: coin.name,
                      image: coin.image,
                    })
                  }
                  _hover={{ bg: "gray.700" }}
                  bg={
                    selectedCoin.address === coin.address
                      ? "gray.700"
                      : "transparent"
                  }
                >
                  <HStack w="full" overflow="hidden">
                    <Avatar
                      size="sm"
                      name={coin.symbol}
                      src={coin.image}
                      onError={() => {
                        console.log(
                          `🖼️ Avatar load error for ${coin.symbol}:`,
                          coin.image
                        );
                      }}
                      flexShrink={0}
                    />
                    <VStack align="start" spacing={0} flex={1} minW={0}>
                      <Text 
                        fontWeight="bold" 
                        isTruncated 
                        maxW="100%"
                      >
                        {coin.symbol}
                      </Text>
                      <Text 
                        fontSize="sm" 
                        color="gray.400" 
                        isTruncated 
                        maxW="100%"
                        title={coin.name} // Show full name on hover
                      >
                        {truncateCoinName(coin.name)}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={0} flexShrink={0} minW="100px">
                      <Text fontSize="sm" fontWeight="bold" isTruncated>
                        {parseFloat(coin.formattedBalance).toFixed(4)}
                      </Text>
                      {coin.valueUsd && (
                        <Text fontSize="xs" color="gray.400" isTruncated>
                          ${parseFloat(coin.valueUsd).toFixed(2)}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Button>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
