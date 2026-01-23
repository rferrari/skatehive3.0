"use client";
import React from "react";
import {
  Box,
  Text,
  useToast,
  VStack,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { KeychainSDK, KeychainKeyTypes } from "keychain-sdk";
import fetchAccount from "@/lib/hive/fetchAccount";
import { useTranslations } from "@/contexts/LocaleContext";

interface AdvancedSettingsProps {
  userData: {
    hiveUsername: string | undefined;
    postingKey: string | undefined;
  };
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ userData }) => {
  const t = useTranslations();
  const toast = useToast();

  const handleRestoreProfile = async () => {
    if (!userData.hiveUsername) {
      toast({
        title: t('settings.missingCredentials'),
        description: t('settings.pleaseLogin'),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { postingMetadata, jsonMetadata } = await fetchAccount(
        userData.hiveUsername
      );

      if (postingMetadata.skatehiveuser) delete postingMetadata.skatehiveuser;
      if (postingMetadata.extensions) delete postingMetadata.extensions;
      if (jsonMetadata.skatehiveuser) delete jsonMetadata.skatehiveuser;
      if (jsonMetadata.extensions) delete jsonMetadata.extensions;

      const keychain = new KeychainSDK(window);
      const formParams = {
        data: {
          username: userData.hiveUsername,
          operations: [
            [
              "account_update2",
              {
                account: userData.hiveUsername,
                posting_json_metadata: JSON.stringify(postingMetadata),
                json_metadata: JSON.stringify(jsonMetadata),
                extensions: [],
              },
            ],
          ],
          method: KeychainKeyTypes.active,
        },
      };

      const result = await keychain.broadcast(formParams.data as any);
      if (!result) {
        throw new Error("Profile restore failed");
      }

      toast({ title: t('settings.profileRestored'), status: "success", duration: 3000 });
    } catch (err: any) {
      toast({
        title: t('settings.restoreFailed'),
        description: err?.message || t('settings.restoreError'),
        status: "error",
        duration: 3000,
      });
    }
  };

  if (!userData.hiveUsername) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="primary" fontSize="lg">
          {t('settings.pleaseLogin')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Security Section */}
      <Box bg="background" border="1px solid" borderColor="muted" shadow="sm">
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton p={6} _hover={{ bg: "transparent" }}>
              <VStack align="start" flex="1" spacing={1}>
                <Heading size="md" color="primary">
                  {t('settings.securitySettings')}
                </Heading>
                <Text color="primary" fontSize="sm">
                  {t('settings.securityDescription')}
                </Text>
              </VStack>
              <AccordionIcon color="accent" />
            </AccordionButton>
            <AccordionPanel px={6} pb={6}>
              <Box
                p={6}
                bg="background"
                border="1px solid"
                borderColor="orange.500"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  bg: "orange.500",
                }}
              >
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text
                      color="orange.400"
                      fontWeight="bold"
                      fontSize="sm"
                      mb={2}
                    >
                      ⚠️ SECURITY NOTICE
                    </Text>
                    <Text color="primary" mb={3} lineHeight="tall">
                      When your account was created, the SkateHive team
                      temporarily stored your private keys.
                      <Text as="span" fontWeight="bold" color="orange.400">
                        {" "}
                        This is not secure.
                      </Text>
                    </Text>
                    <Text color="primary" mb={4} lineHeight="tall">
                      We strongly recommend generating new private keys and
                      updating your Hive account. Store your new keys safely -
                      never share them with anyone.
                    </Text>
                  </Box>
                  <Box
                    textAlign="center"
                    py={8}
                    bg="background"
                    border="2px dashed"
                    borderColor="primary"
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="lg"
                      color="primary"
                      opacity={0.7}
                    >
                      🚧 Coming Soon...
                    </Text>
                    <Text color="primary" fontSize="sm" mt={2} opacity={0.6}>
                      Private key generation feature in development
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      {/* Danger Zone */}
      <Box
        bg="background"
        border="2px solid"
        borderColor="red.500"
        p={6}
        shadow="sm"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          bg: "red.500",
        }}
      >
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="md" color="red.400" mb={2}>
              {t('settings.dangerZone')}
            </Heading>
            <Text color="primary" fontSize="sm">
              {t('settings.dangerZoneDescription')}
            </Text>
          </Box>

          <Alert
            status="warning"
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
          >
            <AlertIcon color="orange.500" />
            <Box>
              <AlertTitle color="orange.800" fontSize="sm">
                {t('settings.profileRestoreWarning')}
              </AlertTitle>
              <AlertDescription color="orange.700" fontSize="sm">
                {t('settings.profileRestoreWarningDescription')}
              </AlertDescription>
            </Box>
          </Alert>

          <Button
            onClick={handleRestoreProfile}
            colorScheme="red"
            variant="outline"
            size="lg"
            borderWidth="2px"
            _hover={{
              bg: "red.50",
              borderColor: "red.600",
            }}
          >
            {t('settings.restoreProfileButton')}
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

export default AdvancedSettings;
