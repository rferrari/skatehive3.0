import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";

interface CarouselImage {
  uri: string;
  mime: string;
  type: string;
  isIncluded: boolean;
  isGenerated?: boolean;
}

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
}

export function ConfirmStep({
  cardPreview,
  title,
  carouselImages,
  markdownDescription,
  isCreating,
  onBack,
  onCreate,
}: ConfirmStepProps) {
  const [coinName, setCoinName] = useState(title || "");
  const [coinDescription, setCoinDescription] = useState(
    markdownDescription ||
      `A unique coin created from the post "${title}". This coin represents the content and includes a carousel of related images.`
  );
  const toast = useToast();

  const includedImages = carouselImages.filter((img) => img.isIncluded);

  const handleCreateCoin = async () => {
    if (!coinName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your coin.",
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
      console.log("- coinName:", coinName);
      console.log("- coinDescription:", coinDescription);
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
          name: coinName,
          description: coinDescription,
        },
        carouselImages
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
            Step 3: Review & Create
          </Text>
          <Badge colorScheme="green" fontSize="xs">
            3 of 3
          </Badge>
        </HStack>
      </Box>

      {/* Card Preview */}

      <Box
        display="flex"
        justifyContent="center"
        p={4}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
      >
        <Image
          src={cardPreview}
          alt="Coin Card Preview"
          maxW="300px"
          maxH="400px"
          objectFit="contain"
          borderRadius="md"
          border="2px solid"
          borderColor="accent"
        />
      </Box>

      {/* Coin Configuration */}
      <Box
        p={4}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
      >
        <Text fontSize="md" fontWeight="bold" color="colorBackground" mb={4}>
          Coin Configuration:
        </Text>

        <VStack spacing={4} align="stretch">
          {/* Coin Name */}
          <FormControl>
            <FormLabel fontSize="sm" color="colorBackground">
              Coin Name
            </FormLabel>
            <Input
              value={coinName}
              onChange={(e) => setCoinName(e.target.value)}
              placeholder="Enter coin name..."
              bg="blackAlpha.300"
              border="1px solid"
              borderColor="primary"
              color="colorBackground"
              _focus={{
                borderColor: "accent",
                boxShadow: "0 0 0 1px var(--chakra-colors-accent)",
              }}
            />
            <FormHelperText fontSize="xs" color="muted">
              This will be displayed as the coin title on Zora.
            </FormHelperText>
          </FormControl>

          {/* Coin Description */}
          <FormControl>
            <FormLabel fontSize="sm" color="colorBackground">
              Description
            </FormLabel>
            <Textarea
              value={coinDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCoinDescription(e.target.value)
              }
              placeholder="Enter coin description..."
              bg="blackAlpha.300"
              border="1px solid"
              borderColor="primary"
              color="colorBackground"
              minHeight="100px"
              resize="vertical"
              _focus={{
                borderColor: "accent",
                boxShadow: "0 0 0 1px var(--chakra-colors-accent)",
              }}
            />
            <FormHelperText fontSize="xs" color="muted">
              A brief description of your coin (optional).
            </FormHelperText>
          </FormControl>
        </VStack>
      </Box>

      {/* Summary Stats */}
      <Box
        p={4}
        bg="blue.900"
        borderRadius="md"
        border="1px solid"
        borderColor="blue.500"
      >
        <Text fontSize="md" fontWeight="bold" color="blue.200" mb={3}>
          Creation Summary:
        </Text>

        <HStack spacing={6} justify="space-around">
          <Stat>
            <StatLabel fontSize="xs" color="blue.300">
              Images
            </StatLabel>
            <StatNumber fontSize="lg" color="blue.100">
              {includedImages.length}
            </StatNumber>
            <StatHelpText fontSize="xs" color="blue.400">
              in carousel
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel fontSize="xs" color="blue.300">
              Supply
            </StatLabel>
            <StatNumber fontSize="lg" color="blue.100">
              Unlimited
            </StatNumber>
            <StatHelpText fontSize="xs" color="blue.400">
              managed by Zora
            </StatHelpText>
          </Stat>

          <Stat>
            <StatLabel fontSize="xs" color="blue.300">
              Network
            </StatLabel>
            <StatNumber fontSize="lg" color="blue.100">
              Base
            </StatNumber>
            <StatHelpText fontSize="xs" color="blue.400">
              blockchain
            </StatHelpText>
          </Stat>
        </HStack>
      </Box>

      {/* Important Notice */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="bold">
            Ready to Create
          </Text>
          <Text fontSize="xs">
            Your coin will be created on the Base network using Zora Protocol.
            Make sure you have ETH for gas fees.
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
          Back to Carousel
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
          Create Coin
        </Button>
      </HStack>
    </VStack>
  );
}
