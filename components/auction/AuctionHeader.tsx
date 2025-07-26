"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons";

interface AuctionHeaderProps {
  tokenName: string;
  tokenId: string;
  startTime: string;
  showNavigation?: boolean;
  currentTokenId?: number;
  isLatestAuction?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export function AuctionHeader({
  tokenName,
  tokenId,
  startTime,
  showNavigation = false,
  currentTokenId,
  isLatestAuction = false,
  onPrev,
  onNext,
}: AuctionHeaderProps) {
  return (
    <VStack spacing={1}>
      {/* NFT Title with Navigation Arrows */}
      <HStack spacing={4} justify="center" w="full" align="center">
        {showNavigation && currentTokenId && (
          <Tooltip
            label={
              currentTokenId && currentTokenId > 1
                ? `View Auction #${currentTokenId - 1}`
                : "No previous auction"
            }
            hasArrow
            placement="bottom"
          >
            <IconButton
              aria-label="Previous Auction"
              icon={<ArrowBackIcon />}
              onClick={onPrev}
              isDisabled={!currentTokenId || currentTokenId <= 1}
              size="lg"
              variant="ghost"
              colorScheme="red"
              color="primary"
              bg="background"
              border="2px solid"
              borderColor="primary"
              borderRadius="full"
              _hover={{
                bg: "primary",
                color: "background",
                transform: "scale(1.1)",
              }}
              _active={{ transform: "scale(0.95)" }}
              transition="all 0.2s ease"
            />
          </Tooltip>
        )}

        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="text"
          textAlign="center"
          pt={2}
          mb={0}
        >
          {tokenName.includes(`#${tokenId}`)
            ? tokenName
            : `${tokenName} #${tokenId}`}
        </Text>

        {showNavigation && currentTokenId && (
          <Tooltip
            label={
              !currentTokenId || isLatestAuction
                ? "Latest auction - no future auctions available"
                : `View Auction #${currentTokenId + 1}`
            }
            hasArrow
            placement="bottom"
          >
            <IconButton
              aria-label="Next Auction"
              icon={<ArrowForwardIcon />}
              onClick={onNext}
              isDisabled={!!(!currentTokenId || !currentTokenId || isLatestAuction)}
              size="lg"
              variant="ghost"
              colorScheme="red"
              color="primary"
              bg="background"
              border="2px solid"
              borderColor="primary"
              borderRadius="full"
              _hover={{
                bg: "primary",
                color: "background",
                transform: "scale(1.1)",
              }}
              _active={{ transform: "scale(0.95)" }}
              transition="all 0.2s ease"
            />
          </Tooltip>
        )}
      </HStack>
      
      {/* Date */}
      <Text
        fontSize="xs"
        color="primary"
        textAlign="center"
        mt={0}
        mb={0}
      >
        {new Date(parseInt(startTime) * 1000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </Text>
    </VStack>
  );
} 