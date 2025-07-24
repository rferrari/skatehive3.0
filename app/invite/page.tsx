"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Icon,
  Input,
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
  const [masterPassword, setMasterPassword] = useState("");
  const [keys, setKeys] = useState<any>(null);
  const [areKeysDownloaded, setAreKeysDownloaded] = useState(false);
  const [useAccountToken, setUseAccountToken] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [loading, setLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

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
    <Box p={8} maxW="container.md" mx="auto">
      <Heading size="lg" mb={4}>
        Invite a Shredder to Skatehive
      </Heading>
      <Box bg="secondary" p={3} borderRadius="md" mb={2}>
        <Text fontSize="sm" color="text">
          <b>What are Account Creation Tokens (ACTs)?</b>
          <br />
          ACTs let you create new Hive accounts for free. You earn ACTs
          automatically by holding Hive Power (staked HIVE). Each ACT can be
          used to create one new account. If you have no ACTs, you&apos;ll need
          to pay a 3 HIVE fee to create an account.
        </Text>
        <Accordion allowToggle mt={2}>
          <AccordionItem border="none">
            <AccordionButton px={0} _hover={{ bg: "muted" }}>
              <Box
                as="span"
                flex="1"
                textAlign="left"
                color="accent"
                fontSize="sm"
              >
                More info about earning ACTs
              </Box>
              <AccordionIcon />
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
      {/* ACT Balance Display */}
      {isAccountLoading ? (
        <Flex align="center" mb={2}>
          <Spinner size="sm" mr={2} /> Loading ACT balance...
        </Flex>
      ) : (
        <Box mb={2}>
          <Text fontWeight="bold" color="primary">
            Account Creation Tokens (ACT):{" "}
            {hiveAccount?.pending_claimed_accounts ?? 0}
          </Text>
          {Number(hiveAccount?.pending_claimed_accounts ?? 0) === 0 && (
            <Text color="error" fontSize="sm">
              You have no ACTs. You must pay 3 HIVE to create an account.
            </Text>
          )}
        </Box>
      )}
      <VStack spacing={4} align="stretch">
        <FormControl>
          <Text fontWeight="bold">Friend&apos;s desired Hive Wallet Name</Text>
          <Input
            type="text"
            placeholder="Friend's desired Hive Wallet Name"
            value={desiredUsername}
            onChange={(e) => setDesiredUsername(e.target.value)}
            maxW="375px"
            bg="background"
            color="text"
            mb={2}
          />
        </FormControl>
        <FormControl>
          <Text fontWeight="bold">Friend&apos;s Email</Text>
          <Input
            type="email"
            placeholder="Friend's email"
            value={desiredEmail}
            onChange={(e) => setDesiredEmail(e.target.value)}
            maxW="375px"
            bg="background"
            color="text"
            mb={2}
          />
        </FormControl>
        <FormControl>
          <Text fontWeight="bold">Choose Account Creation Method</Text>
          <Switch
            isChecked={useAccountToken}
            onChange={() => setUseAccountToken(!useAccountToken)}
            mb={2}
          />
          <Text fontSize="sm" color="accent">
            {useAccountToken ? "Using Account Creation Token" : "Paying 3 HIVE"}
          </Text>
        </FormControl>
        <FormControl>
          <Text fontWeight="bold">Choose Email Language</Text>
          <Select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            maxW="375px"
            bg="background"
            color="text"
            mb={2}
          >
            {randomLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button
          colorScheme="accent"
          onClick={handleCheck}
          isLoading={loading}
          isDisabled={!desiredUsername || !desiredEmail}
        >
          Check if @{desiredUsername || "..."} is available!
        </Button>
        {isCheckedOnce && (
          <Flex
            border="2px solid"
            borderColor="accent"
            borderRadius="5px"
            bg="background"
            p="10px"
            align="center"
            mb={2}
          >
            {accountAvailable ? (
              <Icon as={FaCheck} color="success" />
            ) : (
              <Icon as={FaTimes} color="error" />
            )}
            <Text color={accountAvailable ? "accent" : "text"} ml={2}>
              {accountAvailable
                ? "Yeah!! Account available. Drop it!"
                : "Please choose another nickname! " +
                  String(accountInvalid).replace(/'/g, "&apos;")}
            </Text>
          </Flex>
        )}
        <Button
          colorScheme="success"
          onClick={handleCreateAccount}
          isLoading={loading}
          isDisabled={!areKeysDownloaded}
        >
          Looks Good, Let&apos;s Go For It!
        </Button>
        {broadcastSuccess && (
          <Text
            borderRadius="15"
            borderColor="accent"
            p={5}
            background="muted"
            fontSize="14px"
            whiteSpace="pre"
            mb={2}
            color="success"
            textAlign="center"
          >
            {broadcastMessage}
          </Text>
        )}
        {broadcastError && (
          <Text
            borderRadius="15"
            borderColor="error"
            p={5}
            background="muted"
            fontSize="14px"
            whiteSpace="pre"
            mb={2}
            color="error"
            textAlign="center"
          >
            {broadcastError}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
