import React, { useMemo } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Image,
  SimpleGrid,
  Divider,
  useToast,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { CheckIcon, InfoIcon } from "@chakra-ui/icons";

import { CarouselImage } from "./CarouselStep";

interface ConfirmStepProps {
  cardPreview: string;
  title: string;
  carouselImages: CarouselImage[];
  markdownDescription: string;
  isCreating: boolean;
  onBack: () => void;
  onCreate: (
    metadata: { name: string; description: string },
    carouselImages: CarouselImage[]
  ) => Promise<void>;
  author?: string;
}

export function ConfirmStep({
  cardPreview,
  title,
  carouselImages,
  markdownDescription,
  isCreating,
  onBack,
  onCreate,
  author,
}: ConfirmStepProps) {
  const toast = useToast();

  const includedImages = carouselImages.filter((img) => img.isIncluded);
  const generatedCard = carouselImages.find((img) => img.isGenerated);

  // Generate actual metadata structure that will be used (based on useMarkdownCoin.ts)
  const metadataPreview = useMemo(
    () => ({
      name: title.trim(),
      description: markdownDescription.trim(),
      image: `ipfs://[card-image-hash]`, // Will be the generated card uploaded to IPFS
      content: {
        mime: "image/png",
        uri: `ipfs://[carousel-content-hash]`, // Carousel JSON structure
        type: "CAROUSEL",
        carousel: {
          version: "1.0.0",
          media: includedImages.map((img) => ({
            uri: img.uri.startsWith("ipfs://")
              ? img.uri
              : `ipfs://[${img.uri.split("/").pop()}]`,
            mime: img.mime || "image/jpeg",
          })),
        },
      },
      properties: {
        content_type: "longform-post",
        skatehive_post: "true",
        markdown_ipfs: "ipfs://[markdown-content-hash]",
        word_count: "[calculated-from-post-body]",
        reading_time: "[calculated-minutes]",
        original_author: author,
        original_permlink: "[post-permlink]",
        original_url: `https://skatehive.app/post/${author}/[permlink]`,
        carousel_images: includedImages.length.toString(),
        has_carousel: includedImages.length > 0 ? "true" : "false",
        carousel_type: "CAROUSEL",
        carousel_version: "1.0.0",
        carousel_ipfs: "ipfs://[carousel-json-hash]",
      },
    }),
    [title, markdownDescription, author, includedImages]
  );

  // Actual transaction parameters that will be sent to Zora Protocol
  const transactionPreview = useMemo(
    () => ({
      function: "createCoin",
      parameters: {
        name: title.trim(),
        symbol: "[auto-generated-from-title]", // e.g., "HELLO" from "Hello World"
        uri: "ipfs://[metadata-json-hash]", // Points to the metadata JSON
      },
      coinParams: {
        payoutRecipient: "[user-wallet-address]",
        platformReferrer: "0x8D36b2cBc8f5Bc9fB43065D5E0485bc2a37eA94E", // SKATEHIVE_PLATFORM_REFERRER
        currency: "ZORA", // DeployCurrency.ZORA
      },
      network: {
        chainId: 8453,
        name: "Base Mainnet",
        rpcUrl: "https://mainnet.base.org",
        explorer: "https://basescan.org",
      },
      gasSettings: {
        gasMultiplier: 120, // 20% buffer
        estimatedGas: "~500,000",
        estimatedCost: "~0.001 ETH",
      },
      workflow: [
        "1. Upload generated card to IPFS",
        "2. Upload carousel images to IPFS",
        "3. Create carousel JSON structure",
        "4. Upload metadata JSON to IPFS",
        "5. Call createCoin on Zora Protocol",
        "6. Return contract address and transaction hash",
      ],
    }),
    [title]
  );

  // Final coin structure after successful creation (based on actual implementation)
  const coinSkeletonPreview = useMemo(
    () => ({
      coinAddress: "[deployed-contract-address]", // From createCoin result.address
      metadata: {
        name: title.trim(),
        symbol: "[generated-symbol]",
        uri: "ipfs://[metadata-json-hash]",
      },
      content: {
        markdownPost: {
          title: title.trim(),
          author: author,
          description: markdownDescription.trim(),
          wordCount: "[calculated-from-body]",
          readingTime: "[calculated-minutes]",
        },
        carousel: {
          type: "CAROUSEL",
          version: "1.0.0",
          totalImages: includedImages.length,
          coverCard: "ipfs://[generated-card-hash]",
          media: includedImages.map((img, index) => ({
            index,
            uri: img.uri,
            mime: img.mime || "image/jpeg",
            isGenerated: img.isGenerated || false,
          })),
        },
        ipfsStorage: {
          metadata: "ipfs://[metadata-json-hash]",
          markdown: "ipfs://[markdown-content-hash]",
          carousel: "ipfs://[carousel-json-hash]",
          coverCard: "ipfs://[card-image-hash]",
        },
      },
      blockchain: {
        network: "Base",
        chainId: 8453,
        protocol: "Zora Protocol",
        currency: "ZORA",
        transactionHash: "[creation-tx-hash]",
      },
      urls: {
        zora: "https://zora.co/coin/base/[contract-address]",
        skatehive: `https://skatehive.app/post/${author}/[permlink]`,
        basescan: "https://basescan.org/address/[contract-address]",
      },
      postUpdate: {
        willUpdate: author ? true : false,
        addToBody: "https://zora.co/coin/base/[contract-address]",
        addToMetadata: {
          zora_coin_address: "[contract-address]",
          zora_coin_url: "https://zora.co/coin/base/[contract-address]",
        },
      },
    }),
    [title, markdownDescription, author, includedImages]
  );

  const handleCreateCoin = async () => {
    if (!title?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please go back and provide a title for your coin.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (includedImages.length === 0) {
      toast({
        title: "No Images Selected",
        description:
          "Please go back to the carousel step and ensure at least one image is included.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      console.log("🔥 CONFIRM STEP: Creating coin with:");
      console.log("- title:", title);
      console.log("- markdownDescription:", markdownDescription);
      console.log("- carouselImages received:", carouselImages);
      console.log("- carouselImages length:", carouselImages?.length || 0);
      console.log(
        "- carouselImages details:",
        carouselImages?.map((img) => ({
          uri: img.uri,
          isIncluded: img.isIncluded,
        }))
      );

      await onCreate(
        {
          name: title.trim(),
          description: markdownDescription.trim(),
        },
        includedImages
      );
    } catch (error) {
      console.error("❌ CONFIRM STEP: Failed to create coin:", error);
      toast({
        title: "Creation Failed",
        description: "There was an error creating your coin. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Step Header */}
      <Box>
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold" color="colorBackground">
            Step 3: Review & Confirm
          </Text>
          <Badge colorScheme="green" fontSize="xs">
            3 of 3
          </Badge>
        </HStack>
        <Text fontSize="sm" color="accent">
          Review your coin details before creating it on the Base network
        </Text>
      </Box>

      {/* Coin Preview */}
      <Box
        p={4}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
      >
        <VStack spacing={4} align="stretch">
          <Text fontSize="md" fontWeight="bold" color="colorBackground">
            Coin Preview
          </Text>

          <SimpleGrid columns={[1, 2]} spacing={4}>
            {/* Card Preview */}
            <Box>
              <Text fontSize="sm" color="accent" mb={2}>
                Cover Card
              </Text>
              <Box
                borderRadius="md"
                overflow="hidden"
                border="1px solid"
                borderColor="primary"
              >
                <Image
                  src={cardPreview}
                  alt="Coin Card Preview"
                  width="100%"
                  height="250px"
                  objectFit="cover"
                />
              </Box>
            </Box>

            {/* Metadata */}
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontSize="sm" color="accent" fontWeight="semibold">
                  Title
                </Text>
                <Text
                  fontSize="md"
                  color="colorBackground"
                  wordBreak="break-word"
                >
                  {title}
                </Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="accent" fontWeight="semibold">
                  Description
                </Text>
                <Text
                  fontSize="sm"
                  color="colorBackground"
                  noOfLines={4}
                  wordBreak="break-word"
                >
                  {markdownDescription}
                </Text>
              </Box>

              {author && (
                <Box>
                  <Text fontSize="sm" color="accent" fontWeight="semibold">
                    Author
                  </Text>
                  <Text fontSize="sm" color="colorBackground">
                    @{author}
                  </Text>
                </Box>
              )}
            </VStack>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Carousel Images Preview */}
      <Box
        p={4}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Text fontSize="md" fontWeight="bold" color="colorBackground">
              Carousel Images
            </Text>
            <Badge colorScheme="blue" fontSize="xs">
              {includedImages.length} image
              {includedImages.length !== 1 ? "s" : ""}
            </Badge>
          </HStack>

          <SimpleGrid columns={[2, 3, 4]} spacing={3}>
            {includedImages.slice(0, 8).map((image, index) => (
              <Box
                key={index}
                position="relative"
                borderRadius="md"
                overflow="hidden"
                border="1px solid"
                borderColor="primary"
                bg="blackAlpha.300"
              >
                <Image
                  src={image.uri}
                  alt={`Carousel image ${index + 1}`}
                  width="100%"
                  height="80px"
                  objectFit="cover"
                />
                {image.isGenerated && (
                  <Badge
                    position="absolute"
                    top="2px"
                    left="2px"
                    colorScheme="green"
                    fontSize="xs"
                  >
                    Card
                  </Badge>
                )}
              </Box>
            ))}
            {includedImages.length > 8 && (
              <Box
                borderRadius="md"
                border="1px solid"
                borderColor="primary"
                bg="blackAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="80px"
              >
                <Text fontSize="xs" color="accent">
                  +{includedImages.length - 8} more
                </Text>
              </Box>
            )}
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Transaction Details */}
      <Box
        p={4}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
      >
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="bold" color="colorBackground">
            Transaction Details
          </Text>

          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color="accent">
                Network:
              </Text>
              <Text fontSize="sm" color="colorBackground">
                Base (Mainnet)
              </Text>
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="sm" color="accent">
                Protocol:
              </Text>
              <Text fontSize="sm" color="colorBackground">
                Zora Protocol
              </Text>
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="sm" color="accent">
                Type:
              </Text>
              <Text fontSize="sm" color="colorBackground">
                Markdown Coin
              </Text>
            </HStack>

            <Divider borderColor="primary" />

            <HStack justify="space-between">
              <Text fontSize="sm" color="accent">
                Estimated Gas:
              </Text>
              <Text fontSize="sm" color="yellow.400">
                ~0.001 ETH
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>

      {/* Developer JSON Preview */}
      <Box
        p={4}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Text fontSize="md" fontWeight="bold" color="colorBackground">
              Developer Preview
            </Text>
            <Badge colorScheme="purple" fontSize="xs">
              JSON Data
            </Badge>
          </HStack>

          <Accordion allowMultiple>
            {/* Metadata JSON */}
            <AccordionItem
              border="1px solid"
              borderColor="primary"
              borderRadius="md"
              mb={2}
            >
              <AccordionButton
                bg="blackAlpha.300"
                _hover={{ bg: "blackAlpha.400" }}
              >
                <Box flex="1" textAlign="left">
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="colorBackground"
                  >
                    📄 Metadata JSON
                  </Text>
                  <Text fontSize="xs" color="accent">
                    NFT metadata structure that will be uploaded to IPFS
                  </Text>
                </Box>
                <AccordionIcon color="primary" />
              </AccordionButton>
              <AccordionPanel
                bg="blackAlpha.200"
                maxHeight="300px"
                overflowY="auto"
              >
                <Code
                  display="block"
                  whiteSpace="pre"
                  fontSize="xs"
                  p={3}
                  bg="blackAlpha.500"
                  color="colorBackground"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="primary"
                >
                  {JSON.stringify(metadataPreview, null, 2)}
                </Code>
              </AccordionPanel>
            </AccordionItem>

            {/* Transaction JSON */}
            <AccordionItem
              border="1px solid"
              borderColor="primary"
              borderRadius="md"
              mb={2}
            >
              <AccordionButton
                bg="blackAlpha.300"
                _hover={{ bg: "blackAlpha.400" }}
              >
                <Box flex="1" textAlign="left">
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="colorBackground"
                  >
                    ⛓️ Transaction Preview
                  </Text>
                  <Text fontSize="xs" color="accent">
                    Blockchain transaction that will be sent to Zora Protocol
                  </Text>
                </Box>
                <AccordionIcon color="primary" />
              </AccordionButton>
              <AccordionPanel
                bg="blackAlpha.200"
                maxHeight="300px"
                overflowY="auto"
              >
                <Code
                  display="block"
                  whiteSpace="pre"
                  fontSize="xs"
                  p={3}
                  bg="blackAlpha.500"
                  color="colorBackground"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="primary"
                >
                  {JSON.stringify(transactionPreview, null, 2)}
                </Code>
              </AccordionPanel>
            </AccordionItem>

            {/* Coin Skeleton JSON */}
            <AccordionItem
              border="1px solid"
              borderColor="primary"
              borderRadius="md"
            >
              <AccordionButton
                bg="blackAlpha.300"
                _hover={{ bg: "blackAlpha.400" }}
              >
                <Box flex="1" textAlign="left">
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="colorBackground"
                  >
                    🪙 Coin Structure
                  </Text>
                  <Text fontSize="xs" color="accent">
                    Final coin structure after deployment on Base network
                  </Text>
                </Box>
                <AccordionIcon color="primary" />
              </AccordionButton>
              <AccordionPanel
                bg="blackAlpha.200"
                maxHeight="300px"
                overflowY="auto"
              >
                <Code
                  display="block"
                  whiteSpace="pre"
                  fontSize="xs"
                  p={3}
                  bg="blackAlpha.500"
                  color="colorBackground"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="primary"
                >
                  {JSON.stringify(coinSkeletonPreview, null, 2)}
                </Code>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          <Alert status="info" borderRadius="md" size="sm">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" fontWeight="bold">
                Real Implementation Data
              </Text>
              <Text fontSize="xs">
                These JSON structures reflect the actual data that will be
                created and sent to Zora Protocol. Values in [brackets] will be
                populated with real IPFS hashes and contract addresses during
                execution.
              </Text>
            </VStack>
          </Alert>
        </VStack>
      </Box>

      {/* Important Notice */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="bold">
            Ready to Create
          </Text>
          <Text fontSize="xs">
            Your coin will be minted on the Base network. Make sure you have ETH
            for gas fees. Once created, the coin cannot be modified.
          </Text>
        </VStack>
      </Alert>

      {/* Navigation */}
      <HStack justify="space-between" pt={4}>
        <Button
          variant="ghost"
          leftIcon={<Text>←</Text>}
          onClick={onBack}
          isDisabled={isCreating}
        >
          Back to Preview
        </Button>

        <Button
          colorScheme="green"
          size="lg"
          leftIcon={<CheckIcon />}
          onClick={handleCreateCoin}
          isLoading={isCreating}
          loadingText="Creating Coin..."
          _loading={{
            bg: "green.700",
            color: "white",
          }}
        >
          Create Coin on Zora
        </Button>
      </HStack>
    </VStack>
  );
}
