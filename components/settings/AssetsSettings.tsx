"use client";
import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  Heading,
  Button,
} from "@chakra-ui/react";
import LottieAnimation from "@/components/shared/LottieAnimation";
import LogoMatrix from "@/components/graphics/LogoMatrix";
import UpvoteStoke from "@/components/graphics/UpvoteStoke";

interface AssetsSettingsProps {
  userData: {
    hiveUsername: string | undefined;
    postingKey: string | undefined;
  };
}

const AssetsSettings: React.FC<AssetsSettingsProps> = ({ userData }) => {
  const [stokeInstances, setStokeInstances] = useState<
    Array<{ id: number; value: number; isVisible: boolean }>
  >([]);

  return (
    <VStack spacing={8} align="stretch">
      {/* Experience Section */}
      <Box
        bg="background"
        border="1px solid"
        borderColor="muted"
        p={6}
        shadow="sm"
      >
        <VStack spacing={4}>
          <Box textAlign="center">
            <Heading size="md" color="primary" mb={1}>
              🎭 Experience
            </Heading>
            <Text color="primary" fontSize="sm">
              Interactive elements and animations
            </Text>
          </Box>

          {/* Lottie Animation */}
          <Box py={4}>
            <LottieAnimation src="https://lottie.host/911167fe-726b-4e03-a295-56839461ebc4/WOauo8GTeO.lottie" />
          </Box>

          {/* UpvoteStoke Test */}
          <Box textAlign="center" py={4}>
            <Text color="primary" fontSize="sm" mb={3}>
              Test the UpvoteStoke animation
            </Text>
            <Button
              onClick={() => {
                const newInstance = {
                  id: Date.now(),
                  value: 0.123,
                  isVisible: true,
                };
                setStokeInstances((prev) => [...prev, newInstance]);
                setTimeout(() => {
                  setStokeInstances((prev) =>
                    prev.filter((instance) => instance.id !== newInstance.id)
                  );
                }, 4000);
              }}
              bg="primary"
              color="background"
              _hover={{ bg: "accent" }}
              size="md"
            >
              🛹 Trigger Stoke Animation
            </Button>
          </Box>
        </VStack>
      </Box>

      {/* Footer Graphics */}
      <Box py={8}>
        <LogoMatrix />
      </Box>

      {/* UpvoteStoke Components */}
      {stokeInstances.map((instance) => (
        <UpvoteStoke
          key={instance.id}
          estimatedValue={instance.value}
          isVisible={instance.isVisible}
        />
      ))}
    </VStack>
  );
};

export default AssetsSettings;