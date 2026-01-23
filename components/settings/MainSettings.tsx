"use client";
import React from "react";
import {
  Box,
  Select,
  Text,
  useToast,
  VStack,
  Heading,
} from "@chakra-ui/react";
import { useTheme, ThemeName, themeMap } from "@/app/themeProvider";
import VoteWeightSlider from "@/components/settings/VoteWeightSlider";
import { useTranslations } from "@/contexts/LocaleContext";

interface MainSettingsProps {
  userData: {
    hiveUsername: string | undefined;
    postingKey: string | undefined;
  };
}

const MainSettings: React.FC<MainSettingsProps> = ({ userData }) => {
  const t = useTranslations();
  const { themeName, setThemeName } = useTheme();
  const toast = useToast();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as ThemeName;
    setThemeName(newTheme);
    toast({
      title: t('settings.themeUpdated'),
      description: t('settings.themeSwitched').replace('{theme}', newTheme),
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
              {t('settings.themeSelection')}
            </Heading>
            <Text color="primary" fontSize="sm">
              {t('settings.themeDescription')}
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
                {t('settings.community')}
              </Heading>
              <Text color="primary" fontSize="sm">
                {t('settings.communityDescription')}
              </Text>
            </Box>
          </VStack>
        </Box>
      )}

      
    </VStack>
  );
};

export default MainSettings;
