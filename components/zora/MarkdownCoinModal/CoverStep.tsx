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
  Input,
  Textarea,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

interface CoverStepProps {
  previewImageUrl: string | null;
  isGeneratingPreview: boolean;
  postTitle: string;
  author: string;
  wordCount?: number;
  readTime?: number;
  symbol?: string;
  onRegeneratePreview: () => void;
  onNext: () => void;
  onBack?: () => void;
  selectedThumbnail?: string | null;
  onGeneratePreview?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onDescriptionChange?: (newDescription: string) => void;
  editableDescription?: string;
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
  onBack,
  selectedThumbnail,
  onGeneratePreview,
  onTitleChange,
  onDescriptionChange,
  editableDescription,
}: CoverStepProps) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Step Header */}
      <Box>
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold" color="colorBackground">
            Step 2: Card Preview
          </Text>
          <Badge colorScheme="blue" fontSize="xs">
            2 of 3
          </Badge>
        </HStack>
        <Text fontSize="sm" color="accent">
          This card will be the cover image for your coin and the first image in
          the carousel.
        </Text>
        {selectedThumbnail && (
          <Text fontSize="xs" color="green.400" mt={1}>
            Using selected thumbnail for card generation
          </Text>
        )}
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
              Click "Generate Preview" to create your coin card
            </Text>
            <Button
              colorScheme="blue"
              onClick={onGeneratePreview || onRegeneratePreview}
            >
              🎨 Generate Preview
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

      {/* Editable Title and Description */}
      {onTitleChange && onDescriptionChange && (
        <Box
          p={4}
          bg="muted"
          borderRadius="md"
          border="1px solid"
          borderColor="primary"
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="bold" color="colorBackground">
              Customize Your Card
            </Text>

            {/* Title Input */}
            <FormControl>
              <FormLabel fontSize="sm" color="colorBackground">
                Card Title
              </FormLabel>
              <Input
                value={postTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter card title..."
                bg="blackAlpha.300"
                border="1px solid"
                borderColor="primary"
                color="colorBackground"
                _focus={{
                  borderColor: "accent",
                  boxShadow: "0 0 0 1px var(--chakra-colors-accent)",
                }}
              />
            </FormControl>

            {/* Description Input */}
            <FormControl>
              <FormLabel fontSize="sm" color="colorBackground">
                Card Description
              </FormLabel>
              <Textarea
                value={editableDescription || ""}
                onChange={(e) =>
                  onDescriptionChange && onDescriptionChange(e.target.value)
                }
                placeholder="Enter card description..."
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
            </FormControl>

            <Text fontSize="xs" color="muted">
              Changes will automatically update the card preview above
            </Text>
          </VStack>
        </Box>
      )}

      {/* Navigation */}
      <HStack justify="space-between" pt={4}>
        <Button variant="ghost" leftIcon={<Text>←</Text>} onClick={onBack}>
          Back to Images
        </Button>
        <Button
          colorScheme="blue"
          isDisabled={!previewImageUrl || isGeneratingPreview}
          onClick={onNext}
          rightIcon={<Text>→</Text>}
        >
          Continue to Review
        </Button>
      </HStack>
    </VStack>
  );
}
