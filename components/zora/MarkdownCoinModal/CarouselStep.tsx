import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  Badge,
  SimpleGrid,
  IconButton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
} from "@chakra-ui/icons";

export interface CarouselImage {
  uri: string;
  mime: string;
  type?: string;
  isIncluded: boolean;
  isGenerated?: boolean;
}

interface CarouselPreviewItem {
  uri: string;
  mime: string;
  type?: string;
  isIncluded?: boolean;
  isGenerated?: boolean;
}

interface CarouselStepProps {
  carouselPreview?: CarouselPreviewItem[];
  carouselImages?: CarouselImage[];
  onBack: () => void;
  onNext: () => void;
  onImagesChange: (images: CarouselImage[]) => void;
  selectedThumbnail?: string | null;
  onThumbnailSelect?: (thumbnail: string) => void;
  showThumbnailSelection?: boolean;
}

export function CarouselStep({
  carouselPreview,
  carouselImages: initialCarouselImages,
  onBack,
  onNext,
  onImagesChange,
  selectedThumbnail,
  onThumbnailSelect,
  showThumbnailSelection = false,
}: CarouselStepProps) {
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(
    initialCarouselImages || []
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize carousel images when carouselPreview changes and we don't have images yet
  useEffect(() => {
    // Only initialize from carouselPreview if we don't have images from props and carouselPreview exists
    if (
      carouselPreview &&
      carouselPreview.length > 0 &&
      (!initialCarouselImages || initialCarouselImages.length === 0) &&
      (!carouselImages || carouselImages.length === 0)
    ) {
      const images = carouselPreview.map((item, index) => ({
        uri: item.uri,
        mime: item.mime,
        type: item.type,
        isIncluded: item.isIncluded ?? true,
        isGenerated: item.isGenerated ?? index === 0, // First image is the generated card
      }));
      setCarouselImages(images);
      setCurrentIndex(0); // Reset to first image

      // Notify parent component of the initial images
      onImagesChange(images);
    }
  }, [carouselPreview, initialCarouselImages, onImagesChange, carouselImages]);

  // Sync with initialCarouselImages prop
  useEffect(() => {
    if (initialCarouselImages && initialCarouselImages.length > 0) {
      setCarouselImages(initialCarouselImages);
      // Notify parent of the synced images
      onImagesChange(initialCarouselImages);
    }
  }, [initialCarouselImages, onImagesChange]);

  // Keep index within bounds whenever the list length changes
  useEffect(() => {
    setCurrentIndex((idx) =>
      Math.max(0, Math.min(idx, carouselImages.length - 1))
    );
  }, [carouselImages.length]);
  const handleToggleImage = (index: number) => {
    if (index === 0) return; // Can't exclude the generated card

    const updatedImages = carouselImages.map((img, i) =>
      i === index ? { ...img, isIncluded: !img.isIncluded } : img
    );
    setCarouselImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const currentImage = carouselImages[currentIndex];

  // Don't render if no images are loaded yet
  if (carouselImages.length === 0) {
    return (
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="lg" fontWeight="bold" color="colorBackground">
              Step 1: Choose Images & Thumbnail
            </Text>
            <Badge colorScheme="green" fontSize="xs">
              1 of 3
            </Badge>
          </HStack>
          <Text fontSize="sm" color="muted">
            Loading images from your post...
          </Text>
        </Box>
      </VStack>
    );
  }

  const navigateCarousel = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    } else if (direction === "next") {
      setCurrentIndex((prev) => Math.min(carouselImages.length - 1, prev + 1));
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Step Header */}
      <Box>
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold" color="colorBackground">
            Step 1: Choose Images & Thumbnail
          </Text>
          <Badge colorScheme="blue" fontSize="xs">
            1 of 3
          </Badge>
        </HStack>
        <Text fontSize="sm" color="accent">
          Select which images from your post to include in the Zora carousel
          {showThumbnailSelection
            ? ", and choose a thumbnail for the coin card"
            : ""}
          .
        </Text>
      </Box>

      {carouselImages.length > 1 ? (
        <>
          {/* Current Image Display */}

          <Box
            p={4}
            bg="muted"
            borderRadius="md"
            border="1px solid"
            borderColor="primary"
          >
            {/* Main carousel viewer */}
            <Box position="relative" mb={4}>
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                borderRadius="md"
                minH="250px"
                opacity={currentImage?.isIncluded ? 1 : 0.5}
              >
                <Image
                  src={currentImage?.uri}
                  alt={`Carousel image ${currentIndex + 1}`}
                  maxW="400px"
                  maxH="240px"
                  objectFit="contain"
                  borderRadius="md"
                />
              </Box>

              {/* Navigation arrows */}
              <IconButton
                aria-label="Previous image"
                icon={<ChevronLeftIcon />}
                position="absolute"
                left="2"
                top="50%"
                transform="translateY(-50%)"
                size="sm"
                colorScheme="whiteAlpha"
                bg="blackAlpha.700"
                color="white"
                _hover={{ bg: "blackAlpha.900" }}
                isDisabled={currentIndex === 0}
                onClick={() => navigateCarousel("prev")}
              />
              <IconButton
                aria-label="Next image"
                icon={<ChevronRightIcon />}
                position="absolute"
                right="2"
                top="50%"
                transform="translateY(-50%)"
                size="sm"
                colorScheme="whiteAlpha"
                bg="blackAlpha.700"
                color="white"
                _hover={{ bg: "blackAlpha.900" }}
                isDisabled={currentIndex === carouselImages.length - 1}
                onClick={() => navigateCarousel("next")}
              />

              {/* Image position indicator */}
              <Box
                position="absolute"
                bottom="2"
                left="50%"
                transform="translateX(-50%)"
                bg="blackAlpha.800"
                px={3}
                py={1}
                borderRadius="full"
              >
                <Text fontSize="xs" color="white">
                  {currentIndex + 1} / {carouselImages.length}
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Thumbnail Grid */}
          <Box>
            <Text
              fontSize="md"
              fontWeight="bold"
              color="colorBackground"
              mb={3}
            >
              All Images:
            </Text>
            <SimpleGrid columns={{ base: 3, md: 4, lg: 5 }} spacing={3}>
              {carouselImages.map((item, index) => (
                <Box
                  key={index}
                  position="relative"
                  cursor="pointer"
                  onClick={() => setCurrentIndex(index)}
                  border="3px solid"
                  borderColor={
                    index === currentIndex
                      ? "accent"
                      : item.isIncluded
                      ? "primary"
                      : "red.500"
                  }
                  borderRadius="md"
                  overflow="hidden"
                  opacity={item.isIncluded ? 1 : 0.5}
                  _hover={{
                    borderColor: index === currentIndex ? "accent" : "primary",
                    opacity: 1,
                  }}
                  w="100%"
                  h="0"
                  paddingBottom="100%" // This creates a 1:1 aspect ratio
                >
                  <Box position="absolute" top="0" left="0" w="100%" h="100%">
                    <Image
                      src={item.uri}
                      alt={`Thumbnail ${index + 1}`}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      objectPosition="center"
                      position="absolute"
                      top="0"
                      left="0"
                    />

                    {/* Badges */}
                    <VStack position="absolute" top="1" left="1" spacing={1}>
                      {item.isGenerated && (
                        <Badge fontSize="xs" colorScheme="blue">
                          Card
                        </Badge>
                      )}
                      {!item.isIncluded && (
                        <Badge fontSize="xs" colorScheme="red">
                          ✕
                        </Badge>
                      )}
                      {showThumbnailSelection &&
                        selectedThumbnail === item.uri && (
                          <Badge fontSize="xs" colorScheme="yellow">
                            Thumb
                          </Badge>
                        )}
                    </VStack>

                    {/* Thumbnail selection button for thumbnail selection mode */}
                    {showThumbnailSelection && onThumbnailSelect && (
                      <Button
                        size="xs"
                        position="absolute"
                        bottom="1"
                        left="1"
                        colorScheme={
                          selectedThumbnail === item.uri ? "yellow" : "gray"
                        }
                        variant={
                          selectedThumbnail === item.uri ? "solid" : "outline"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onThumbnailSelect(item.uri);
                        }}
                        fontSize="9px"
                        px={1}
                        py={0}
                        h="18px"
                      >
                        {selectedThumbnail === item.uri ? "✓" : "Use"}
                      </Button>
                    )}

                    {/* Toggle button for non-generated images */}
                    {!item.isGenerated && (
                      <IconButton
                        aria-label={
                          item.isIncluded ? "Exclude image" : "Include image"
                        }
                        icon={<DeleteIcon />}
                        position="absolute"
                        top="1"
                        right="1"
                        size="xs"
                        colorScheme={item.isIncluded ? "red" : "green"}
                        bg={item.isIncluded ? "red.600" : "green.600"}
                        color="white"
                        _hover={{
                          bg: item.isIncluded ? "red.700" : "green.700",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleImage(index);
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </>
      ) : (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold">
              No additional images found
            </Text>
            <Text fontSize="xs">
              Your post doesn&apos;t contain any markdown images. Only the generated
              coin card will be used.
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Navigation */}
      <HStack justify="space-between" pt={4}>
        <Button
          variant="ghost"
          leftIcon={<Text>←</Text>}
          onClick={onBack}
          isDisabled
        >
          {/* No back button on first step */}
        </Button>
        <Button colorScheme="blue" onClick={onNext} rightIcon={<Text>→</Text>}>
          Generate Card Preview
        </Button>
      </HStack>
    </VStack>
  );
}
