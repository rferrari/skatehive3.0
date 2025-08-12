"use client";

import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Heading,
  Button,
} from "@chakra-ui/react";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";
import { CoinData } from "@/types/coin";

interface CoinHeaderProps {
  coinData: CoinData;
  isCreator: boolean;
  onEditMetadata: () => void;
}

export const CoinHeader: React.FC<CoinHeaderProps> = ({
  coinData,
  isCreator,
  onEditMetadata,
}) => {
  return (
    <Box
      w="100%"
      p={{ base: 4, md: 6 }}
      borderBottom="1px solid"
      borderColor="gray.700"
    >
      <VStack align="start" spacing={3}>
        <HStack
          justify="space-between"
          w="100%"
          flexWrap={{ base: "wrap", md: "nowrap" }}
        >
          <HStack minW={{ base: "100%", sm: "auto" }} mb={{ base: 2, sm: 0 }}>
            <Avatar
              size={{ base: "md", md: "sm" }}
              name={coinData.name || coinData.symbol}
            />
            <VStack align="start" spacing={1}>
              <Heading size={{ base: "sm", md: "md" }} fontWeight="bold">
                {coinData.name || "Unknown Coin"}
              </Heading>
              <Text fontSize="xs" color="gray.400">
                {coinData.symbol || "COIN"}
              </Text>
            </VStack>
          </HStack>
          <HStack
            minW={{ base: "100%", sm: "auto" }}
            mb={{ base: 2, sm: 0 }}
            spacing={2}
            flexWrap="wrap"
          >
            <Button
              size={{ base: "xs", md: "sm" }}
              variant="outline"
              colorScheme="blue"
              fontSize="xs"
              as="a"
              href={`https://zora.co/coin/base:${coinData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              flex={{ base: "1", sm: "auto" }}
            >
              See on Zora
            </Button>
            {isCreator && (
              <Button
                size={{ base: "xs", md: "sm" }}
                variant="outline"
                colorScheme="green"
                fontSize="xs"
                onClick={onEditMetadata}
                flex={{ base: "1", sm: "auto" }}
              >
                Edit Metadata
              </Button>
            )}
          </HStack>
        </HStack>
        <Box
          maxW="100%"
          overflow="hidden"
          wordBreak="break-all"
          overflowWrap="break-word"
          sx={{
            "& *": {
              wordBreak: "break-all",
              overflowWrap: "break-word",
              maxWidth: "100%",
            },
            "& a": {
              wordBreak: "break-all",
              overflowWrap: "break-word",
            },
          }}
        >
          <EnhancedMarkdownRenderer
            content={coinData.description || `${coinData.name} creator coin`}
            className="text-sm text-gray-400"
          />
        </Box>
      </VStack>
    </Box>
  );
};
