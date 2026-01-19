import React, { useMemo, useState } from "react";
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
  Progress,
  Spinner,
} from "@chakra-ui/react";
import { CheckIcon, InfoIcon } from "@chakra-ui/icons";
import { APP_CONFIG, ETH_ADDRESSES } from "@/config/app.config";

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

  // Progress tracking for coin creation
  const [currentProgress, setCurrentProgress] = useState<{
    step: number;
    message: string;
    details: string;
  } | null>(null);

  const progressSteps = [
    {
      step: 1,
      message: "🖼️ Uploading generated card to IPFS...",
      details: "Storing your magazine cover image permanently on IPFS",
    },
    {
      step: 2,
      message: "📸 Uploading carousel images to IPFS...",
      details: "Securing your selected images on the decentralized web",
    },
    {
      step: 3,
      message: "📋 Creating metadata structure...",
      details: "Building the coin metadata with your content details",
    },
    {
      step: 4,
      message: "🌐 Uploading metadata to IPFS...",
      details: "Storing coin metadata permanently on IPFS",
    },
    {
      step: 5,
      message: "🪙 Coining your magazine page...",
      details: "Calling Zora Protocol to create your coin on Base network",
    },
    {
      step: 6,
      message: "✅ Preparing transaction...",
      details: "Building transaction data - wallet popup may take 30-60 seconds to appear",
    },
    {
      step: 7,
      message: "🔐 Waiting for wallet confirmation...",
      details: "Please confirm the transaction in your wallet when it appears",
    },
  ];

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
        original_url: `${APP_CONFIG.BASE_URL}/post/${author}/[permlink]`,
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
        platformReferrer: ETH_ADDRESSES.PLATFORM_REFERRER, // SKATEHIVE_PLATFORM_REFERRER
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
        skatehive: `${APP_CONFIG.BASE_URL}/post/${author}/[permlink]`,
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

      // Simulate progress steps during coin creation
      const simulateProgress = async () => {
        try {
          // Steps 1-5: Normal progression with shorter delays
          for (let i = 0; i < 5; i++) {
            setCurrentProgress(progressSteps[i]);
            await new Promise((resolve) =>
              setTimeout(resolve, 800 + Math.random() * 700)
            );
          }
          
          // Step 6: Transaction preparation (this is where the delay usually happens)
          setCurrentProgress(progressSteps[5]);
          // Longer delay for this step since transaction building actually takes time
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 + Math.random() * 3000)
          );
          
          // Step 7: Wallet confirmation
          setCurrentProgress(progressSteps[6]);
        } catch (progressError) {
          console.warn("Progress simulation interrupted:", progressError);
          // Don't throw here, let the main onCreate handle errors
        }
      };

      // Start progress simulation (don't await, let it run in parallel)
      const progressPromise = simulateProgress();

      // Call the actual coin creation function
      await onCreate(
        {
          name: title.trim(),
          description: markdownDescription.trim(),
        },
        includedImages
      );

      // Wait for progress simulation to complete if it hasn't already
      await progressPromise;

      // Clear progress when done
      setCurrentProgress(null);
    } catch (error) {
      // Don't log the full error - just a summary
      console.error("❌ ConfirmStep: Coin creation failed");
      setCurrentProgress(null); // Clear progress on error

      // Re-throw the error so the parent modal can handle it with professional error handling
      throw error;
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

      {/* Progress Display */}
      {currentProgress && (
        <Box
          p={4}
          bg="blue.900"
          borderRadius="md"
          border="2px solid"
          borderColor="blue.400"
          position="relative"
          overflow="hidden"
        >
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Spinner size="sm" color="blue.400" />
                <Text fontSize="md" fontWeight="bold" color="white">
                  {currentProgress.message}
                </Text>
              </HStack>
              <Badge colorScheme="blue" fontSize="xs">
                {currentProgress.step} of {progressSteps.length}
              </Badge>
            </HStack>

            <Text fontSize="sm" color="blue.200">
              {currentProgress.details}
            </Text>

            {/* Show helpful tip during transaction preparation */}
            {currentProgress.step === 6 && (
              <Alert status="info" bg="blue.800" borderRadius="md">
                <AlertIcon color="blue.300" />
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" fontWeight="bold" color="blue.100">
                    💡 Why does this take time?
                  </Text>
                  <Text fontSize="xs" color="blue.200">
                    The app is generating your coin image, uploading to IPFS, and building the blockchain transaction. This process ensures your coin has high-quality metadata and images.
                  </Text>
                </VStack>
              </Alert>
            )}

            <Progress
              value={(currentProgress.step / progressSteps.length) * 100}
              colorScheme="blue"
              size="sm"
              borderRadius="full"
              bg="blue.800"
            />
          </VStack>

          {/* Animated background effect */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)"
            animation="shimmer 2s linear infinite"
            zIndex="0"
          />
        </Box>
      )}

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
                    Coin metadata structure that will be uploaded to IPFS
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
        </VStack>
      </Box>

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
          loadingText={
            currentProgress
              ? currentProgress.message.replace(/🖼️|📸|📋|🌐|🪙|✅/g, "").trim()
              : "Creating Coin..."
          }
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
