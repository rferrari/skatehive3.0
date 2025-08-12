"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  VStack,
  Alert,
  AlertIcon,
  Skeleton,
  SkeletonText,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { Address } from "viem";

import { MediaRenderer } from "@/components/coin/MediaRenderer";
import { CoinHeader } from "@/components/coin/CoinHeader";
import { CoinStats } from "@/components/coin/CoinStats";
import { TradeInterface } from "@/components/coin/TradeInterface";
import { CoinTabs } from "@/components/coin/CoinTabs";
import { EditMetadataModal } from "@/components/shared/EditMetadataModal";
import { useCoinTrading } from "@/hooks/useCoinTrading";
import { ZoraCoinPageClientProps } from "@/types/coin";

const ZoraCoinPageClient = React.memo<ZoraCoinPageClientProps>(
  ({ address, initialCoinData, error: initialError }) => {
    const [coinData] = useState(initialCoinData);
    const [loading] = useState(!initialCoinData && !initialError);
    const [error] = useState<string | null>(initialError);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { address: connectedAddress } = useAccount();

    const {
      isBuying,
      setIsBuying,
      tradeAmount,
      setTradeAmount,
      tradeComment,
      setTradeComment,
      quoteResult,
      loadingQuote,
      formattedQuoteOutput,
      userBalance,
      handleTrade,
      isTrading,
      ethBalance,
    } = useCoinTrading(coinData);

    // Check if connected user is the creator of the coin
    const isCreator = Boolean(
      connectedAddress &&
        coinData?.creatorAddress &&
        connectedAddress.toLowerCase() === coinData.creatorAddress.toLowerCase()
    );

    if (error) {
      return (
        <Container maxW="container.lg" py={8}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      );
    }

    if (loading || !coinData) {
      return (
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6}>
            <Skeleton height="300px" width="100%" />
            <SkeletonText noOfLines={4} spacing="4" />
          </VStack>
        </Container>
      );
    }

    return (
      <Box minH="100vh" bg="background" color="white">
        <Grid
          templateColumns={{
            base: "1fr",
            lg: "1fr 400px",
          }}
          templateRows={{
            base: "auto 1fr",
            lg: "100vh",
          }}
          h={{ base: "auto", lg: "100vh" }}
        >
          {/* Left Side - Media Content */}
          <GridItem
            bg="background"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={{ base: 1, md: 4 }}
            order={{ base: 1, lg: 0 }}
            minH={{ base: "60vh", lg: "100vh" }}
          >
            <Box
              maxW={{ base: "100%", lg: "800px" }}
              maxH={{ base: "60vh", lg: "600px" }}
              w="100%"
              h={{ base: "auto", lg: "100%" }}
              aspectRatio={{ base: "auto", lg: "unset" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MediaRenderer
                videoUrl={coinData.videoUrl}
                imageUrl={coinData.image}
                hasVideo={coinData.hasVideo}
                altText={coinData.name || "Coin"}
              />
            </Box>
          </GridItem>

          {/* Right Side - Trading Interface */}
          <GridItem
            bg="background"
            borderLeft={{ base: "none", lg: "1px solid" }}
            borderTop={{ base: "1px solid", lg: "none" }}
            borderColor="gray.700"
            order={{ base: 2, lg: 1 }}
            maxH={{ base: "none", lg: "100vh" }}
            overflowY={{ base: "visible", lg: "auto" }}
          >
            <VStack h={{ base: "auto", lg: "100%" }} spacing={0}>
              {/* Header */}
              <CoinHeader
                coinData={coinData}
                isCreator={isCreator}
                onEditMetadata={() => setIsEditModalOpen(true)}
              />

              {/* Stats */}
              <CoinStats coinData={coinData} />

              {/* Trading Section */}
              <Box w="100%" p={{ base: 3, md: 6 }} flex="1">
                <TradeInterface
                  isBuying={isBuying}
                  setIsBuying={setIsBuying}
                  tradeAmount={tradeAmount}
                  setTradeAmount={setTradeAmount}
                  tradeComment={tradeComment}
                  setTradeComment={setTradeComment}
                  formattedQuoteOutput={formattedQuoteOutput}
                  loadingQuote={loadingQuote}
                  quoteResult={quoteResult}
                  isTrading={isTrading}
                  isConnected={!!connectedAddress}
                  ethBalance={ethBalance}
                  userBalance={userBalance}
                  coinSymbol={coinData?.symbol}
                  onTrade={handleTrade}
                />
              </Box>

              {/* Tabs Section */}
              <CoinTabs coinData={coinData} />
            </VStack>
          </GridItem>
        </Grid>

        {/* Edit Metadata Modal */}
        <EditMetadataModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          coinAddress={coinData.address as Address}
          currentMetadata={{
            name: coinData.name,
            description: coinData.description,
            image: coinData.image,
            animation_url: coinData.videoUrl,
          }}
        />
      </Box>
    );
  }
);

ZoraCoinPageClient.displayName = "ZoraCoinPageClient";

export default ZoraCoinPageClient;
