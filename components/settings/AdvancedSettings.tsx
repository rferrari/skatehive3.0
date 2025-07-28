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

interface AdvancedSettingsProps {
  userData: {
    hiveUsername: string | undefined;
    postingKey: string | undefined;
  };
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ userData }) => {
  const toast = useToast();

  const handleRestoreProfile = async () => {
    if (!userData.hiveUsername) {
      toast({
        title: "Missing Credentials",
        description: "Please log in to your Hive account",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const accountResp = await fetch("https://api.hive.blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_accounts",
          params: [[userData.hiveUsername]],
          id: 1,
        }),
      }).then((res) => res.json());

      if (!accountResp.result || accountResp.result.length === 0) {
        throw new Error("Account not found");
      }

      let postingMetadata: any = {};
      let jsonMetadata: any = {};
      try {
        if (accountResp.result[0].posting_json_metadata) {
          postingMetadata = JSON.parse(
            accountResp.result[0].posting_json_metadata
          );
        }
      } catch {
        postingMetadata = {};
      }

      try {
        if (accountResp.result[0].json_metadata) {
          jsonMetadata = JSON.parse(accountResp.result[0].json_metadata);
        }
      } catch {
        jsonMetadata = {};
      }

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

      toast({ title: "Profile Restored", status: "success", duration: 3000 });
    } catch (err: any) {
      toast({
        title: "Restore Failed",
        description: err?.message || "Unable to restore profile",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (!userData.hiveUsername) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="primary" fontSize="lg">
          Please log in to access advanced settings
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
                  🔐 Security Settings (BETA)
                </Heading>
                <Text color="primary" fontSize="sm">
                  Manage your private keys and account security
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
              ⚠️ Danger Zone
            </Heading>
            <Text color="primary" fontSize="sm">
              These actions are irreversible and may affect your account
              permanently
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
                Profile Restore Warning
              </AlertTitle>
              <AlertDescription color="orange.700" fontSize="sm">
                This action will remove SkateHive-specific metadata from your
                profile. Only use this if you want to clean your Hive account
                profile.
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
            🔄 Restore Profile to Original State
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

export default AdvancedSettings;
