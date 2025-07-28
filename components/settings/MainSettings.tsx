"use client";
import React from "react";
import { Box, Select, Text, useToast, VStack, Heading } from "@chakra-ui/react";
import { useTheme, ThemeName, themeMap } from "@/app/themeProvider";
import LottieAnimation from "@/components/shared/LottieAnimation";
import UpvoteSnapContainer from "@/components/homepage/UpvoteSnapContainer";
import LogoMatrix from "@/components/graphics/LogoMatrix";
import FarcasterUniversalLink from "@/components/farcaster/FarcasterUniversalLink";
import VoteWeightSlider from "@/components/settings/VoteWeightSlider";

interface MainSettingsProps {
  userData: {
    hiveUsername: string | undefined;
    postingKey: string | undefined;
  };
}

const MainSettings: React.FC<MainSettingsProps> = ({ userData }) => {
  const { themeName, setThemeName } = useTheme();
  const toast = useToast();

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

      {/* Farcaster Account Link */}
      {userData.hiveUsername && (
        <FarcasterUniversalLink
          hiveUsername={userData.hiveUsername}
          postingKey={userData.postingKey}
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
                Help support the SkateHive community
              </Text>
            </Box>
            <UpvoteSnapContainer />
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
          <Box py={4}>
            <LottieAnimation src="https://lottie.host/911167fe-726b-4e03-a295-56839461ebc4/WOauo8GTeO.lottie" />
          </Box>
        </VStack>
      </Box>

      {/* Footer Graphics */}
      <Box py={8}>
        <LogoMatrix />
      </Box>
    </VStack>
  );
};

export default MainSettings;
