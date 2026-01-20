import React, { useState } from "react";
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { ColorOptions } from "@/lib/utils/markdownCoinUtils";

interface ColorOption extends ColorOptions {
  name: string;
}

interface CustomizationStepProps {
  selectedColors: ColorOptions;
  onColorsChange: (colors: ColorOptions) => void;
  onBack: () => void;
  onNext: () => void;
  onPreviewUpdate: () => void;
}

const colorPresets: ColorOption[] = [
  {
    name: "Skatehive Green",
    primary: "#00ff88",
    secondary: "#00ff88",
    gradient: {
      start: "#2a2a2a",
      middle: "#000000",
      end: "#1a1a1a",
    },
  },
  {
    name: "Electric Blue",
    primary: "#00ccff",
    secondary: "#0088ff",
    gradient: {
      start: "#2a2a3a",
      middle: "#000011",
      end: "#1a1a2a",
    },
  },
  {
    name: "Neon Purple",
    primary: "#cc00ff",
    secondary: "#8800ff",
    gradient: {
      start: "#3a2a3a",
      middle: "#110011",
      end: "#2a1a2a",
    },
  },
  {
    name: "Sunset Orange",
    primary: "#ff6600",
    secondary: "#ff3300",
    gradient: {
      start: "#3a2a1a",
      middle: "#221100",
      end: "#2a1a0a",
    },
  },
  {
    name: "Hot Pink",
    primary: "#ff0088",
    secondary: "#ff0066",
    gradient: {
      start: "#3a1a2a",
      middle: "#220011",
      end: "#2a0a1a",
    },
  },
  {
    name: "Cyber Cyan",
    primary: "#00ffcc",
    secondary: "#00ddaa",
    gradient: {
      start: "#1a3a3a",
      middle: "#001122",
      end: "#0a2a2a",
    },
  },
  {
    name: "Golden Yellow",
    primary: "#ffcc00",
    secondary: "#ffaa00",
    gradient: {
      start: "#3a3a1a",
      middle: "#222200",
      end: "#2a2a0a",
    },
  },
  {
    name: "Blood Red",
    primary: "#ff3333",
    secondary: "#dd1111",
    gradient: {
      start: "#3a1a1a",
      middle: "#220000",
      end: "#2a0a0a",
    },
  },
];

export function CustomizationStep({
  selectedColors,
  onColorsChange,
  onBack,
  onNext,
  onPreviewUpdate,
}: CustomizationStepProps) {
  const [selectedColorName, setSelectedColorName] = useState("Skatehive Green");
  const toast = useToast();

  const handleColorSelect = (colors: ColorOption) => {
    setSelectedColorName(colors.name);
    onColorsChange({
      primary: colors.primary,
      secondary: colors.secondary,
      gradient: colors.gradient,
    });
    // Update preview when colors change
    setTimeout(() => {
      onPreviewUpdate();
    }, 100);
    
    toast({
      title: "Colors Updated",
      description: `Applied ${colors.name} color scheme`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const ColorPreview = ({ colors }: { colors: ColorOption }) => (
    <Box
      position="relative"
      w="100%"
      h="120px"
      borderRadius="12px"
      overflow="hidden"
      cursor="pointer"
      border={selectedColorName === colors.name ? "3px solid" : "2px solid"}
      borderColor={selectedColorName === colors.name ? colors.primary : "gray.600"}
      transition="all 0.2s"
      _hover={{
        transform: "scale(1.02)",
        borderColor: colors.primary,
        boxShadow: `0 0 20px ${colors.primary}40`,
      }}
      onClick={() => handleColorSelect(colors)}
    >
      {/* Background gradient */}
      <Box
        position="absolute"
        inset="0"
        bgGradient={`linear(to-b, ${colors.gradient.start}, ${colors.gradient.middle}, ${colors.gradient.end})`}
      />
      
      {/* Border simulation */}
      <Box
        position="absolute"
        top="8px"
        left="8px"
        right="8px"
        bottom="8px"
        borderRadius="8px"
        border="2px solid"
        borderColor={colors.primary}
        boxShadow={`0 0 15px ${colors.primary}60`}
      />
      
      {/* Header simulation */}
      <Box
        position="absolute"
        top="14px"
        left="14px"
        right="14px"
        h="24px"
        borderRadius="6px"
        bg={colors.gradient.start}
        border="1px solid"
        borderColor={colors.primary}
        opacity="0.8"
      />
      
      {/* Avatar simulation */}
      <Box
        position="absolute"
        top="18px"
        left="18px"
        w="16px"
        h="16px"
        borderRadius="full"
        bg="gray.400"
        border="1px solid"
        borderColor={colors.primary}
      />
      
      {/* Content area simulation */}
      <Box
        position="absolute"
        top="45px"
        left="14px"
        right="14px"
        bottom="25px"
        borderRadius="6px"
        bg="blackAlpha.300"
        border="1px solid"
        borderColor={`${colors.primary}60`}
      />
      
      {/* Footer simulation */}
      <Box
        position="absolute"
        bottom="14px"
        left="14px"
        right="14px"
        h="16px"
        borderRadius="4px"
        bg="blackAlpha.400"
        border="1px solid"
        borderColor={colors.primary}
      />
      
      {/* Color name overlay */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        bg="blackAlpha.800"
        py="1"
        px="2"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={colors.primary}
          textAlign="center"
          textShadow={`0 0 8px ${colors.primary}`}
        >
          {colors.name}
        </Text>
      </Box>
      
      {/* Selection indicator */}
      {selectedColorName === colors.name && (
        <Box
          position="absolute"
          top="2"
          right="2"
          w="6"
          h="6"
          borderRadius="full"
          bg={colors.primary}
          boxShadow={`0 0 10px ${colors.primary}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="xs" color="black">
            ✓
          </Text>
        </Box>
      )}
    </Box>
  );

  return (
    <VStack spacing={6} align="stretch" py={4}>
      <VStack spacing={2} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" color="primary">
          🎨 Customize Your Card Colors
        </Text>
        <Text fontSize="sm" color="muted">
          Choose a color scheme for your coin card borders and effects
        </Text>
      </VStack>

      <Box>
        <FormLabel color="primary" fontWeight="bold" mb={4}>
          Color Presets
        </FormLabel>
        <Grid templateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap={4}>
          {colorPresets.map((colors) => (
            <GridItem key={colors.name}>
              <ColorPreview colors={colors} />
            </GridItem>
          ))}
        </Grid>
      </Box>

      <Box
        p={4}
        borderRadius="12px"
        border="2px solid"
        borderColor={selectedColors.primary}
        bg="blackAlpha.300"
        boxShadow={`0 0 20px ${selectedColors.primary}30`}
      >
        <Text fontSize="sm" fontWeight="bold" color={selectedColors.primary} mb={2}>
          Selected: {selectedColorName}
        </Text>
        <HStack spacing={4} justify="center">
          <VStack spacing={1} align="center">
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg={selectedColors.primary}
              boxShadow={`0 0 15px ${selectedColors.primary}60`}
            />
            <Text fontSize="xs" color="muted">
              Primary
            </Text>
          </VStack>
          <VStack spacing={1} align="center">
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg={selectedColors.secondary}
              boxShadow={`0 0 15px ${selectedColors.secondary}60`}
            />
            <Text fontSize="xs" color="muted">
              Secondary
            </Text>
          </VStack>
          <VStack spacing={1} align="center">
            <Box
              w="40px"
              h="20px"
              borderRadius="none"
              bgGradient={`linear(to-r, ${selectedColors.gradient.start}, ${selectedColors.gradient.middle}, ${selectedColors.gradient.end})`}
            />
            <Text fontSize="xs" color="muted">
              Gradient
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Navigation */}
      <Flex justify="space-between" pt={4}>
        <Button
          variant="outline"
          colorScheme="gray"
          onClick={onBack}
          leftIcon={<span>←</span>}
        >
          Back to Cover
        </Button>
        <Button
          bg={selectedColors.primary}
          color="black"
          _hover={{ 
            bg: selectedColors.secondary,
            boxShadow: `0 0 20px ${selectedColors.primary}60` 
          }}
          onClick={onNext}
          rightIcon={<span>→</span>}
        >
          Continue to Carousel
        </Button>
      </Flex>
    </VStack>
  );
}
