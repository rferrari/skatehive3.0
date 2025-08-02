"use client";

import { VStack, HStack, Text, Badge, Box } from "@chakra-ui/react";
import useIsMobile from "@/hooks/useIsMobile";

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  emoji: string;
}

export function StepHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
  emoji,
}: StepHeaderProps) {
  const isMobile = useIsMobile();

  const progressIndicator = (
    <HStack spacing={2} justify="center" mb={4}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Box
          key={i}
          w={isMobile ? "8px" : "10px"}
          h={isMobile ? "8px" : "10px"}
          borderRadius="full"
          bg={i + 1 <= currentStep ? "primary" : "border"}
          transition="all 0.3s"
        />
      ))}
    </HStack>
  );

  return (
    <VStack spacing={3}>
      {progressIndicator}
      <HStack justify="center" spacing={3}>
        <Text fontSize={isMobile ? "lg" : "xl"}>
          {emoji} {title}
        </Text>
        <Badge colorScheme="blue" fontSize="xs">
          Step {currentStep} of {totalSteps}
        </Badge>
      </HStack>
      <Text fontSize="sm" color="textSecondary" fontWeight="normal">
        {subtitle}
      </Text>
    </VStack>
  );
}
