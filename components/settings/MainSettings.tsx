"use client";
import React, { useState } from "react";
import {
  Box,
  Select,
  Text,
  useToast,
  VStack,
  Heading,
  Button,
} from "@chakra-ui/react";
import { useTheme, ThemeName, themeMap } from "@/app/themeProvider";
import LottieAnimation from "@/components/shared/LottieAnimation";
import LogoMatrix from "@/components/graphics/LogoMatrix";
import VoteWeightSlider from "@/components/settings/VoteWeightSlider";
import UpvoteStoke from "@/components/graphics/UpvoteStoke";

interface MainSettingsProps {
  userData: {
    hiveUsername: string | undefined;
    postingKey: string | undefined;
  };
}

const MainSettings: React.FC<MainSettingsProps> = ({ userData }) => {
  const { themeName, setThemeName } = useTheme();
  const toast = useToast();
  const [stokeInstances, setStokeInstances] = useState<
    Array<{ id: number; value: number; isVisible: boolean }>
  >([]);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as ThemeName;
    setThemeName(newTheme);
    toast({
      title: "Theme Updated!",
      description: `Successfully switched to ${newTheme} theme`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Format theme name for display
  const formatThemeName = (name: string) => {
    return name
      .split(/(?=[A-Z])|[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Theme Selection Card */}
      <Box
        bg="background"
        border="1px solid"
        borderColor="muted"
        p={6}
        shadow="sm"
      >
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading size="md" color="primary" mb={1}>
              🎨 Theme Selection
            </Heading>
            <Text color="primary" fontSize="sm">
              Choose your preferred visual style
            </Text>
          </Box>
          <Select
            value={themeName}
            onChange={handleThemeChange}
            size="lg"
            bg="background"
            color="primary"
            borderColor="muted"
            borderWidth="2px"
            fontWeight="semibold"
            _focus={{
              borderColor: "accent",
              boxShadow: "0 0 0 3px rgba(var(--chakra-colors-accent), 0.1)",
              outline: "none",
            }}
            _hover={{ borderColor: "accent" }}
            sx={{
              option: {
                background: "var(--chakra-colors-background)",
                color: "var(--chakra-colors-primary)",
              },
            }}
          >
            {Object.keys(themeMap).map((theme) => (
              <option key={theme} value={theme}>
                {formatThemeName(theme)}
              </option>
            ))}
          </Select>
        </VStack>
      </Box>

      {/* Vote Weight Slider */}
      {userData.hiveUsername && (
        <VoteWeightSlider
          username={userData.hiveUsername}
          onVoteWeightUpdate={(voteWeight) => {
            // Vote weight updated
          }}
        />
      )}

      {/* Community Section */}
      {userData.hiveUsername && (
        <Box
          bg="background"
          border="1px solid"
          borderColor="muted"
          p={6}
          shadow="sm"
        >
          <VStack spacing={4} align="stretch">
            <Box>
              <Heading size="md" color="primary" mb={1}>
                🏆 Community
              </Heading>
              <Text color="primary" fontSize="sm">
                SkateHive shows periodic reminders to upvote the community snap
                container post (desktop only). This helps support the platform
                and community content.
              </Text>
            </Box>
          </VStack>
        </Box>
      )}

      {/* Fun Section */}
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

export default MainSettings;
