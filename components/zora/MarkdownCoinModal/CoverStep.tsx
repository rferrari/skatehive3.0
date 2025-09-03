import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Spinner,
  Button,
  Badge,
} from "@chakra-ui/react";

interface CoverStepProps {
  previewImageUrl: string | null;
  isGeneratingPreview: boolean;
  postTitle: string;
  author: string;
  wordCount: number;
  readTime: number;
  symbol: string;
  onRegeneratePreview: () => void;
  onNext: () => void;
}

export function CoverStep({
  previewImageUrl,
  isGeneratingPreview,
  postTitle,
  author,
  wordCount,
  readTime,
  symbol,
  onRegeneratePreview,
  onNext,
}: CoverStepProps) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Step Header */}
      <Box>
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold" color="colorBackground">
            Step 1: Coin Cover Card
          </Text>
          <Badge colorScheme="blue" fontSize="xs">
            1 of 3
          </Badge>
        </HStack>
        <Text fontSize="sm" color="accent">
          This card will be the cover image for your coin and the first image in
          the carousel.
        </Text>
      </Box>

      {/* Card Preview */}

      <Box
        display="flex"
        justifyContent="center"
        p={6}
        bg="muted"
        borderRadius="md"
        border="1px solid"
        borderColor="primary"
        minH="400px"
        alignItems="center"
      >
        {isGeneratingPreview ? (
          <VStack spacing={4}>
            <Spinner color="primary" size="xl" />
            <Text fontSize="sm" color="muted" textAlign="center">
              Generating your custom coin card...
              <br />
              This may take a few seconds
            </Text>
          </VStack>
        ) : previewImageUrl ? (
          <VStack spacing={4}>
            <Box position="relative">
              <Image
                src={previewImageUrl}
                alt="Coin Card Preview"
                maxW="250px"
                maxH="375px"
                borderRadius="md"
              />
              <Badge
                position="absolute"
                top="-10px"
                left="50%"
                transform="translateX(-50%)"
                colorScheme="green"
                fontSize="xs"
              >
                400×600 Card
              </Badge>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={4}>
            <Text color="muted" textAlign="center">
              Failed to generate preview
            </Text>
            <Button colorScheme="blue" onClick={onRegeneratePreview}>
              🔄 Try Again
            </Button>
          </VStack>
        )}
      </Box>
      {/* Only show regenerate button when preview is successfully loaded */}
      {previewImageUrl && !isGeneratingPreview && (
        <Button
          size="sm"
          variant="ghost"
          color="primary"
          onClick={onRegeneratePreview}
        >
          🔄 Regenerate Card
        </Button>
      )}
      {/* Navigation */}
      <HStack justify="space-between" pt={4}>
        <Box />
        <Button
          colorScheme="blue"
          isDisabled={!previewImageUrl || isGeneratingPreview}
          onClick={onNext}
          rightIcon={<Text>→</Text>}
        >
          Continue to Carousel
        </Button>
      </HStack>
    </VStack>
  );
}
