"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
  Switch,
  Text,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";
import {
  generatePassword,
  getPrivateKeys,
  validateAccountName,
  checkAccountExists,
} from "@/lib/invite/helpers";
import { useAioha } from "@aioha/react-ui";
import * as dhive from "@hiveio/dhive";
import useHiveAccount from "@/hooks/useHiveAccount";
import { useKeychainSDK } from "@/hooks/useKeychainSDK";

const randomLanguages = [
  { code: "EN", label: "English" },
  { code: "PT-BR", label: "Português (Brasil)" },
  { code: "ES", label: "Español" },
];

export default function InvitePage() {
  const { user } = useAioha();
  const { hiveAccount, isLoading: isAccountLoading } = useHiveAccount(
    user || ""
  );
  const { KeychainSDK, KeychainRequestTypes, KeychainKeyTypes, isLoaded } =
    useKeychainSDK();
  const [desiredUsername, setDesiredUsername] = useState("");
  const [desiredEmail, setDesiredEmail] = useState("");
  const [accountAvailable, setAccountAvailable] = useState(false);
  const [accountInvalid, setAccountInvalid] = useState<string | null>(null);
  const [isCheckedOnce, setIsCheckedOnce] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [keys, setKeys] = useState<any>(null);
  const [areKeysDownloaded, setAreKeysDownloaded] = useState(false);
  const [useAccountToken, setUseAccountToken] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [loading, setLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Email validation helper
  const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounced auto-check for username availability
  useEffect(() => {
    if (!isMounted) return;
    const checkUsername = async () => {
      if (!desiredUsername) {
        setIsCheckedOnce(false);
        setAccountAvailable(false);
        setAccountInvalid(null);
        setKeys(null);
        setMasterPassword("");
        setAreKeysDownloaded(false);
        return;
      }

      const isValidAccountName = validateAccountName(desiredUsername);
      if (isValidAccountName !== null) {
        setAccountInvalid(String(isValidAccountName));
        setIsCheckedOnce(true);
        setAccountAvailable(false);
        setAreKeysDownloaded(false);
        return;
      }

      setAccountInvalid("");
      setIsCheckingUsername(true);
      const isAvailable = await checkAccountExists(desiredUsername);
      setIsCheckedOnce(true);
      setAccountAvailable(isAvailable);
      setIsCheckingUsername(false);

      if (isAvailable) {
        // Generate keys
        const password = generatePassword();
        setMasterPassword(password);
        const generatedKeys = getPrivateKeys(desiredUsername, password);
        setKeys(generatedKeys);
        setAreKeysDownloaded(true);
      } else {
        setAccountAvailable(false);
        setAreKeysDownloaded(false);
        setAccountInvalid("Account is not available. Please choose another nickname.");
      }
    };

    const debounceTimer = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [desiredUsername, isMounted]);

  // Validate email on change
  useEffect(() => {
    if (!isMounted) return;
    if (desiredEmail) {
      const error = validateEmail(desiredEmail);
      setEmailError(error);
    } else {
      setEmailError(null);
    }
  }, [desiredEmail, isMounted]);

  const handleCheck = async () => {
    setBroadcastSuccess(false);
    setBroadcastError("");
    setBroadcastMessage("");
    setIsCheckedOnce(false);
    setAccountAvailable(false);
    setAccountInvalid(null);
    setAreKeysDownloaded(false);
    setKeys(null);
    setMasterPassword("");

    if (!desiredEmail) {
      setBroadcastError("You forgot to fill in the email");
      return;
    }
    if (!desiredUsername) {
      setBroadcastError("You forgot to fill in the username");
      return;
    }
    const isValidAccountName = validateAccountName(desiredUsername);
    if (isValidAccountName !== null) {
      setAccountInvalid(String(isValidAccountName));
      setIsCheckedOnce(true);
      setAccountAvailable(false);
      return;
    }
    setAccountInvalid("");
    setLoading(true);
    const isAvailable = await checkAccountExists(desiredUsername);
    setIsCheckedOnce(true);
    setAccountAvailable(isAvailable);
    setLoading(false);
    if (isAvailable) {
      // Generate keys
      const password = generatePassword();
      setMasterPassword(password);
      const generatedKeys = getPrivateKeys(desiredUsername, password);
      setKeys(generatedKeys);
      setAreKeysDownloaded(true);
    } else {
      setAccountAvailable(false);
      setBroadcastError(
        "Account is not available. Please choose another nickname."
      );
    }
  };

  const handleCreateAccount = async () => {
    setBroadcastSuccess(false);
    setBroadcastError("");
    setBroadcastMessage("");

    // Validate email
    const emailValidationError = validateEmail(desiredEmail);
    if (emailValidationError) {
      setBroadcastError(emailValidationError);
      setEmailError(emailValidationError);
      return;
    }

    // Validate username availability
    if (!accountAvailable || !areKeysDownloaded) {
      setBroadcastError("Please wait for username validation to complete.");
      return;
    }

    if (
      !isLoaded ||
      !KeychainSDK ||
      !KeychainRequestTypes ||
      !KeychainKeyTypes
    ) {
      setBroadcastError("Keychain SDK is not loaded yet. Please try again.");
      return;
    }

    setLoading(true);
    try {
      // Use Hive Keychain to broadcast account creation
      const keychain = new KeychainSDK(window);
      let ops: dhive.Operation[] = [];
      let createAccountOperation: dhive.Operation;
      if (useAccountToken) {
        createAccountOperation = [
          "create_claimed_account",
          {
            creator: String(user),
            new_account_name: desiredUsername,
            owner: dhive.Authority.from(keys.ownerPubkey),
            active: dhive.Authority.from(keys.activePubkey),
            posting: dhive.Authority.from(keys.postingPubkey),
            memo_key: keys.memoPubkey,
            json_metadata: "",
            extensions: [],
          },
        ];
      } else {
        createAccountOperation = [
          "account_create",
          {
            fee: "3.000 HIVE",
            creator: String(user),
            new_account_name: desiredUsername,
            owner: dhive.Authority.from(keys.ownerPubkey),
            active: dhive.Authority.from(keys.activePubkey),
            posting: dhive.Authority.from(keys.postingPubkey),
            memo_key: keys.memoPubkey,
            json_metadata: "",
            extensions: [],
          },
        ];
      }
      ops.push(createAccountOperation);
      const formParamsAsObject = {
        type: KeychainRequestTypes.broadcast,
        username: user || "",
        operations: ops,
        method: KeychainKeyTypes.active,
      };
      const broadcast = await keychain.broadcast(formParamsAsObject);
      if (broadcast.success) {
        setBroadcastSuccess(true);
        setBroadcastMessage("Account created on Hive! Sending invite email...");
        // Now send the invite email
        const payload = {
          to: desiredEmail,
          subject: `Welcome to Skatehive @${desiredUsername}`,
          createdby: user,
          desiredUsername,
          masterPassword,
          keys,
          language: selectedLanguage,
        };
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setBroadcastMessage("Invite sent successfully!");
        } else {
          setBroadcastError(
            data.error || "Failed to send invite. Try again or contact support."
          );
        }
      } else {
        setBroadcastError(broadcast.error + ": " + broadcast.message);
      }
    } catch (error: any) {
      setBroadcastError(error.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Flex align="center" justify="center" h="100vh" direction="column">
        <Heading color="red.400" mb={4}>
          You need to be logged in to invite!
        </Heading>
        <Text color="gray.400">Please log in and try again.</Text>
      </Flex>
    );
  }

  return (
    <Box p={8} maxW="container.md" mx="auto" bg="background">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="primary">
          Invite a Shredder to Skatehive
        </Heading>

        {/* Account Creation Method Toggle - MOVED UP */}
        <Box p={4} bg="panel" border="1px solid" borderColor="border">
          <Text fontWeight="bold" color="text" mb={3}>
            Choose Account Creation Method
          </Text>
          <Flex align="center" gap={3}>
            <Switch
              isChecked={useAccountToken}
              onChange={() => setUseAccountToken(!useAccountToken)}
              colorScheme="green"
            />
            <Text fontSize="md" color="primary" fontWeight="bold">
              {useAccountToken ? "Using Account Creation Token" : "Paying 3 HIVE"}
            </Text>
          </Flex>
        </Box>

        {/* ACT Balance Display - Only shown when using ACT */}
        {useAccountToken && (
          <>
            {isAccountLoading ? (
              <Flex align="center" p={4} bg="panel" border="1px solid" borderColor="border">
                <Spinner size="sm" mr={2} color="primary" /> 
                <Text color="text">Loading ACT balance...</Text>
              </Flex>
            ) : (
              <Box p={4} bg="panel" border="1px solid" borderColor="border">
                <Text fontWeight="bold" color="primary" fontSize="lg">
                  Account Creation Tokens (ACT):{" "}
                  {hiveAccount?.pending_claimed_accounts ?? 0}
                </Text>
                {Number(hiveAccount?.pending_claimed_accounts ?? 0) === 0 && (
                  <Text color="error" fontSize="sm" mt={2}>
                    You have no ACTs. You must pay 3 HIVE to create an account.
                  </Text>
                )}
              </Box>
            )}

            {/* Info Box */}
            <Box bg="panel" p={4} border="1px solid" borderColor="border">
              <Text fontSize="sm" color="text" mb={3}>
                <b>What are Account Creation Tokens (ACTs)?</b>
                <br />
                ACTs let you create new Hive accounts for free. You earn ACTs
                automatically by holding Hive Power (staked HIVE). Each ACT can be
                used to create one new account. If you have no ACTs, you&apos;ll need
                to pay a 3 HIVE fee to create an account.
              </Text>
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton px={0} _hover={{ bg: "panelHover" }}>
                    <Box
                      as="span"
                      flex="1"
                      textAlign="left"
                      color="secondary"
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      More info about earning ACTs
                    </Box>
                    <AccordionIcon color="secondary" />
                  </AccordionButton>
                  <AccordionPanel pb={2} color="text" fontSize="sm">
                    <b>Rule of thumb:</b> You need at least 5000 HP to start
                    generating ACTs, and each ACT requires 100 billion Resource
                    Credits (RC). The more HP you have, the faster you&apos;ll earn
                    ACTs.
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </>
        )}


        {/* Form Inputs */}
        <Box p={4} bg="panel" border="1px solid" borderColor="border">
          <VStack spacing={4} align="stretch">
            <FormControl>
              <Text fontWeight="bold" color="text" mb={2}>
                Friend&apos;s desired Hive Wallet Name
              </Text>
              <InputGroup>
                <Input
                  type="text"
                  placeholder="Friend's desired Hive Wallet Name"
                  value={desiredUsername}
                  onChange={(e) => setDesiredUsername(e.target.value)}
                  bg="inputBg"
                  color="inputText"
                  borderColor={isCheckedOnce ? (accountAvailable ? "success" : "error") : "inputBorder"}
                  _placeholder={{ color: "inputPlaceholder" }}
                  _hover={{ borderColor: "primary" }}
                  _focus={{ borderColor: "primary", boxShadow: "none" }}
                />
                <InputRightElement>
                  {isCheckingUsername ? (
                    <Spinner size="sm" color="primary" />
                  ) : isCheckedOnce && desiredUsername ? (
                    accountAvailable ? (
                      <Icon as={FaCheck} color="success" boxSize={5} />
                    ) : (
                      <Icon as={FaTimes} color="error" boxSize={5} />
                    )
                  ) : null}
                </InputRightElement>
              </InputGroup>
              {isCheckedOnce && !accountAvailable && accountInvalid && (
                <Text color="error" fontSize="sm" mt={1}>
                  {accountInvalid}
                </Text>
              )}
              {isCheckedOnce && accountAvailable && (
                <Text color="success" fontSize="sm" mt={1}>
                  ✓ Username available!
                </Text>
              )}
            </FormControl>

            <FormControl isInvalid={emailError !== null && desiredEmail !== ""}>
              <Text fontWeight="bold" color="text" mb={2}>
                Friend&apos;s Email
              </Text>
              <InputGroup>
                <Input
                  type="email"
                  placeholder="Friend's email"
                  value={desiredEmail}
                  onChange={(e) => setDesiredEmail(e.target.value)}
                  bg="inputBg"
                  color="inputText"
                  borderColor={emailError && desiredEmail ? "error" : "inputBorder"}
                  _placeholder={{ color: "inputPlaceholder" }}
                  _hover={{ borderColor: "primary" }}
                  _focus={{ borderColor: "primary", boxShadow: "none" }}
                />
                <InputRightElement>
                  {desiredEmail && !emailError && (
                    <Icon as={FaCheck} color="success" boxSize={5} />
                  )}
                  {desiredEmail && emailError && (
                    <Icon as={FaTimes} color="error" boxSize={5} />
                  )}
                </InputRightElement>
              </InputGroup>
              {emailError && desiredEmail && (
                <Text color="error" fontSize="sm" mt={1}>
                  {emailError}
                </Text>
              )}
              {desiredEmail && !emailError && (
                <Text color="success" fontSize="sm" mt={1}>
                  ✓ Valid email
                </Text>
              )}
            </FormControl>

            <FormControl>
              <Text fontWeight="bold" color="text" mb={2}>
                Choose Email Language
              </Text>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                bg="inputBg"
                color="inputText"
                borderColor="inputBorder"
                _hover={{ borderColor: "primary" }}
                _focus={{ borderColor: "primary", boxShadow: "none" }}
              >
                {randomLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </Box>

        {/* Create Account Button */}
        <Button
          bg="success"
          color="background"
          _hover={{ bg: "primary" }}
          onClick={handleCreateAccount}
          isLoading={loading}
          isDisabled={!areKeysDownloaded || !desiredEmail || emailError !== null || !accountAvailable}
          size="lg"
        >
          Looks Good, Let&apos;s Go For It!
        </Button>

        {/* Success Message */}
        {broadcastSuccess && (
          <Box
            border="2px solid"
            borderColor="success"
            p={5}
            bg="panel"
          >
            <Text
              fontSize="14px"
              whiteSpace="pre"
              color="success"
              textAlign="center"
            >
              {broadcastMessage}
            </Text>
          </Box>
        )}

        {/* Error Message */}
        {broadcastError && (
          <Box
            border="2px solid"
            borderColor="error"
            p={5}
            bg="panel"
          >
            <Text
              fontSize="14px"
              whiteSpace="pre"
              color="error"
              textAlign="center"
            >
              {broadcastError}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
