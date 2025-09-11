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
  IconButton,
  Image,
  Tooltip,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { EnhancedMarkdownRenderer } from "@/components/markdown/EnhancedMarkdownRenderer";
import { CoinData } from "@/types/coin";

interface CoinHeaderProps {
  coinData: CoinData;
  isCreator: boolean;
  onEditMetadata: () => void;
}

/**
 * Utility function to trim description for markdown coins
 * Removes content after "Original post:" link to avoid duplication
 */
function trimDescriptionForMarkdownCoin(description: string, coinType?: string): string {
  if (coinType !== "markdown" || !description) {
    return description;
  }

  // Find the "Original post:" link and trim everything after it
  const originalPostIndex = description.indexOf("Original post:");
  if (originalPostIndex === -1) {
    return description;
  }

  // Find the end of the line containing "Original post:"
  const endOfLineIndex = description.indexOf("\n", originalPostIndex);
  if (endOfLineIndex === -1) {
    // If there's no newline after, just return up to the original post line
    return description.substring(0, originalPostIndex).trim();
  }

  return description.substring(0, endOfLineIndex).trim();
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
              src={
                coinData.creatorProfile?.avatar?.previewImage?.small ||
                coinData.image
              }
              bg="gray.600"
              color="white"
            />
            <VStack align="start" spacing={1}>
              <Heading size={{ base: "sm", md: "md" }} fontWeight="bold">
                {coinData.name || "Unknown Coin"}
              </Heading>
              <Text fontSize="xs" color="gray.400">
                {coinData.symbol || "COIN"}
                {coinData.creatorProfile?.handle && (
                  <> • by @{coinData.creatorProfile.handle}</>
                )}
              </Text>
            </VStack>
          </HStack>
          <HStack
            minW={{ base: "100%", sm: "auto" }}
            mb={{ base: 2, sm: 0 }}
            spacing={2}
            flexWrap="wrap"
          >
            <Tooltip label="See on Zora" placement="top">
              <IconButton
                size={{ base: "sm", md: "sm" }}
                variant="outline"
                colorScheme="blue"
                as="a"
                href={`https://zora.co/coin/base:${coinData.address}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="See on Zora"
                icon={
                  <Image
                    src="/logos/Zorb.png"
                    alt="Zora"
                    w="16px"
                    h="16px"
                    fallback={
                      <Box
                        w="16px"
                        h="16px"
                        bg="blue.500"
                        borderRadius="2px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="xs"
                        fontWeight="bold"
                        color="white"
                      >
                        Z
                      </Box>
                    }
                  />
                }
              />
            </Tooltip>
            {isCreator && (
              <Tooltip label="Edit Metadata" placement="top">
                <IconButton
                  size={{ base: "sm", md: "sm" }}
                  variant="outline"
                  colorScheme="green"
                  onClick={onEditMetadata}
                  aria-label="Edit Metadata"
                  icon={<EditIcon />}
                />
              </Tooltip>
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
            content={
              trimDescriptionForMarkdownCoin(
                coinData.description || `${coinData.name} creator coin`,
                coinData.coinType
              )
            }
            className="text-sm text-gray-400"
          />
        </Box>
      </VStack>
    </Box>
  );
};
