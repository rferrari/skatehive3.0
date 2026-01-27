"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  useToast,
  Flex,
  Image,
  Checkbox,
  HStack,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import { DEFAULT_VOTE_WEIGHT } from "@/lib/utils/constants";
import { mergeHiveProfileMetadata } from "@/lib/hive/profile-metadata";
import { Operation } from "@hiveio/dhive";
import { useVoteWeightContext } from "@/contexts/VoteWeightContext";
import fetchAccount from "@/lib/hive/fetchAccount";
import { useTranslations } from "@/contexts/LocaleContext";

interface VoteWeightSliderProps {
  username: string;
  currentVoteWeight?: number;
  onVoteWeightUpdate?: (voteWeight: number) => void;
}

const VoteWeightSlider: React.FC<VoteWeightSliderProps> = ({
  username,
  currentVoteWeight,
  onVoteWeightUpdate,
}) => {
  const t = useTranslations();
  const { user } = useAioha();
  const { voteWeight, disableSlider, updateVoteWeight, updateDisableSlider, refreshVoteWeight } = useVoteWeightContext();
  const toast = useToast();
  const [sliderValue, setSliderValue] = useState(voteWeight);
  const [disableSliderValue, setDisableSliderValue] = useState(disableSlider);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Use the global vote weight if no currentVoteWeight is provided
  const effectiveCurrentVoteWeight = currentVoteWeight ?? voteWeight;

  // Update slider value when vote weight changes from context
  useEffect(() => {
    setSliderValue(effectiveCurrentVoteWeight);
    setDisableSliderValue(disableSlider);
    setHasChanges(false);
  }, [effectiveCurrentVoteWeight, disableSlider]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setHasChanges(value !== effectiveCurrentVoteWeight || disableSliderValue !== disableSlider);
  };

  const handleDisableSliderChange = (checked: boolean) => {
    setDisableSliderValue(checked);
    setHasChanges(sliderValue !== effectiveCurrentVoteWeight || checked !== disableSlider);
  };

  const handleSave = async () => {
    if (!user || user !== username) {
      toast({
        title: t('settings.errorTitle'),
        description: t('settings.errorOwnPreferences'),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const keychain = new KeychainSDK(window);

      // Get current profile metadata
      const { jsonMetadata: currentMetadata, postingMetadata } =
        await fetchAccount(username);

      const { postingMetadata: mergedPosting, jsonMetadata: mergedJson } =
        mergeHiveProfileMetadata({
          currentPosting: postingMetadata,
          currentJson: currentMetadata,
          extensionsPatch: {
            settings: {
              voteSettings: {
                default_voting_weight: sliderValue * 100,
                enable_slider: !disableSliderValue,
              },
            },
          },
        });

      // Create the account update operation
      const operation: Operation = [
        "account_update2",
        {
          account: username,
          json_metadata: JSON.stringify(mergedJson),
          posting_json_metadata: JSON.stringify(mergedPosting || {}),
          extensions: [],
        },
      ];

      const formParamsAsObject = {
        data: {
          username: username,
          operations: [operation],
          method: KeychainKeyTypes.active,
        },
      };

      const result = await keychain.broadcast(formParamsAsObject.data as any);

      if (!result) {
        throw new Error("Failed to update vote weight preferences");
      }

      // Update the global context immediately (optimistic update)
      updateVoteWeight(sliderValue);
      updateDisableSlider(disableSliderValue);

      toast({
        title: t('settings.preferencesUpdated'),
        description: t('settings.voteWeightSaved'),
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setHasChanges(false);
      onVoteWeightUpdate?.(sliderValue);
      
      // Refresh from blockchain to ensure consistency
      setTimeout(() => {
        refreshVoteWeight();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to update vote weight preferences:", error);
      
      // Check if it's a user cancellation
      if (error.message?.includes("user_cancel") || 
          error.message?.includes("cancelled") ||
          error.message?.includes("User cancelled") ||
          error.message?.includes("User rejected") ||
          error.message?.includes("User denied")) {
        // Don't show error toast for user cancellation
      } else {
        // Show error toast for actual errors
        let errorMessage = "Failed to update vote weight preferences";
        if (error.message?.includes("insufficient")) {
          errorMessage = "Insufficient resource credits to update";
        } else if (error.message?.includes("serialize")) {
          errorMessage = "Transaction serialization failed. Please try again.";
        } else if (error.message?.includes("network") || error.message?.includes("timeout")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }

        toast({
          title: t('settings.errorTitle'),
          description: t('settings.errorSavingPreferences'),
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
            {t('settings.voteWeight')}
          </Heading>
          <Text color="primary" fontSize="sm">
            {t('settings.voteWeightDescription')}
          </Text>
        </Box>

        <Box py={4}>
          <Flex alignItems="center" mb={4}>
            <Box width="100%" mr={4}>
              <Slider
                aria-label="vote-weight-slider"
                min={0}
                max={100}
                value={sliderValue}
                onChange={handleSliderChange}
                step={1}
              >
                <SliderTrack
                  bg="gray.700"
                  height="8px"
                  boxShadow="0 0 10px rgba(255, 255, 0, 0.8)"
                >
                  <SliderFilledTrack bgGradient="linear(to-r, success, warning, error)" />
                </SliderTrack>
                <SliderThumb
                  boxSize="30px"
                  bg="transparent"
                  boxShadow={"none"}
                  _focus={{ boxShadow: "none" }}
                  zIndex={1}
                >
                  <Image
                    src="/images/spitfire.png"
                    alt="thumb"
                    w="100%"
                    h="auto"
                    mr={2}
                    mb={1}
                  />
                </SliderThumb>
              </Slider>
            </Box>
            <Text
              color="primary"
              fontSize="lg"
              fontWeight="bold"
              minW="60px"
              textAlign="center"
            >
              {sliderValue}%
            </Text>
          </Flex>

          {/* Disable Slider Checkbox */}
          <HStack spacing={3} mt={4}>
            <Checkbox
              isChecked={disableSliderValue}
              onChange={(e) => handleDisableSliderChange(e.target.checked)}
              size="lg"
              bg="background"
              borderColor="muted"
              _checked={{
                bg: "background",
                borderColor: "primary",
                color: "primary",
              }}
              sx={{
                "& .chakra-checkbox__control": {
                  bg: "background",
                  borderColor: "muted",
                },
                "& .chakra-checkbox__control[data-checked]": {
                  bg: "background",
                  borderColor: "primary",
                  color: "primary",
                },
              }}
            >
              <Text color="primary" fontSize="sm" fontWeight="medium">
                {t('settings.disableSlider')}
              </Text>
            </Checkbox>
          </HStack>
          
          {disableSliderValue && (
            <Text color="accent" fontSize="xs" mt={2} fontStyle="italic">
              {t('settings.disableSliderDescription')}
            </Text>
          )}
        </Box>

        <Button
          onClick={handleSave}
          isLoading={isSaving}
          loadingText={t('settings.saving')}
          disabled={!hasChanges}
          bgGradient="linear(to-r, primary, accent)"
          color="background"
          _hover={{ bg: "accent" }}
          fontWeight="bold"
          size="lg"
        >
          {t('settings.savePreferences')}
        </Button>

        {hasChanges && (
          <Text color="accent" fontSize="sm" textAlign="center">
            Changes detected - click save to update your vote weight preferences
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default VoteWeightSlider; 
