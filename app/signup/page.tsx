"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  Spinner,
  Icon,
  Checkbox,
} from "@chakra-ui/react";
import { FaCheck, FaTimes, FaCopy, FaEnvelope } from "react-icons/fa";
import {
  generatePassword,
  getPrivateKeys,
  validateAccountName,
  checkAccountExists,
} from "@/lib/invite/helpers";

// Hook to check signer status
const useSignerStatus = () => {
  const [status, setStatus] = useState<
    "checking" | "online" | "offline" | "auth-error" | "rc-error"
  >("checking");
  const [rcInfo, setRcInfo] = useState<string>("");
  const [authStatus, setAuthStatus] = useState<
    "valid" | "invalid" | "not-provided" | "unknown"
  >("unknown");

  React.useEffect(() => {
    const checkSignerHealth = async () => {
      const signerUrl =
        process.env.NEXT_PUBLIC_SIGNER_URL ||
        "https://aimed-evolution-collectibles-through.trycloudflare.com";
      const signerToken =
        process.env.NEXT_PUBLIC_SIGNER_TOKEN ||
        "d1fa4884f3c12b49b922c96ad93413416e19a5dcde50499ee473c448622c54d9";

      try {
        // First check basic health and authentication using /healthz
        const healthResponse = await fetch(`${signerUrl}/healthz`, {
          method: "GET",
          headers: {
            "x-signer-token": signerToken,
          },
        });

        if (!healthResponse.ok) {
          setStatus("offline");
          setRcInfo("Signer service unavailable");
          setAuthStatus("unknown");
          return;
        }

        const healthData = await healthResponse.json();
        setAuthStatus(healthData.auth || "unknown");

        // If service is up but auth failed, show auth error
        if (healthData.auth === "invalid") {
          setStatus("auth-error");
          setRcInfo("Invalid authentication token");
          return;
        }

        // If no token provided
        if (healthData.auth === "not-provided") {
          setStatus("auth-error");
          setRcInfo("Authentication token not configured");
          return;
        }

        // If service is up and auth is good, check RC by attempting a test call
        if (healthData.status === "ok" && healthData.auth === "valid") {
          try {
            const testResponse = await fetch(`${signerUrl}/claim-account`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-signer-token": signerToken,
              },
              body: JSON.stringify({
                username: "healthcheck-test-" + Date.now(),
              }),
            });

            const testData = await testResponse.json();

            if (
              testData.error &&
              testData.error.includes("Insufficient Resources")
            ) {
              setStatus("rc-error");
              // Parse RC info from error message
              const match = testData.hive_error?.match(
                /has (\d+) RC, needs (\d+) RC/
              );
              if (match) {
                const current = (parseInt(match[1]) / 1e12).toFixed(1);
                const needed = (parseInt(match[2]) / 1e12).toFixed(1);
                setRcInfo(`RC: ${current}T / ${needed}T needed`);
              } else {
                setRcInfo("Insufficient Resource Credits");
              }
            } else {
              setStatus("online");
              setRcInfo("Ready for account creation");
            }
          } catch (testError) {
            // If we can't test RC, but health check passed, assume online
            setStatus("online");
            setRcInfo("Service online (RC status unknown)");
          }
        } else {
          setStatus("online");
          setRcInfo("Service running, auth not verified");
        }
      } catch (error) {
        console.error("Signer health check failed:", error);
        setStatus("offline");
        setRcInfo("Connection failed - check network");
        setAuthStatus("unknown");
      }
    };

    checkSignerHealth();
    // Check every 30 seconds
    const interval = setInterval(checkSignerHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, rcInfo, authStatus };
};

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [vipCode, setVipCode] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<any>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [keysConfirmed, setKeysConfirmed] = useState(false);
  const [step, setStep] = useState<"form" | "keys" | "creating" | "success">(
    "form"
  );

  // Individual key states
  const [ownerKey, setOwnerKey] = useState("");
  const [activeKey, setActiveKey] = useState("");
  const [postingKey, setPostingKey] = useState("");
  const [memoKey, setMemoKey] = useState("");
  const [masterPassword, setMasterPassword] = useState("");

  // Use signer status hook
  const { status: signerStatus, rcInfo, authStatus } = useSignerStatus();

  const handleCheckUsername = async () => {
    setError("");
    setIsAvailable(false);
    if (!username) return setError("Please enter a username.");
    const invalid = validateAccountName(username);
    if (invalid) return setError(invalid);
    setLoading(true);
    const available = await checkAccountExists(username);
    setIsAvailable(available);
    setLoading(false);
    if (!available) setError("Username is already taken on Hive.");
  };

  const handleStartSignup = async () => {
    try {
      setError("");
      setStatusMsg("Validating VIP code...");
      setLoading(true);

      const initRes = await fetch("/api/signup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, vip_code: vipCode }),
      });

      const initData = await initRes.json();
      if (!initRes.ok)
        throw new Error(initData.error || "Failed to init signup.");

      setSignupToken(initData.signup_token);

      // generate Hive keys
      setStatusMsg("Generating Hive keys...");
      const password = generatePassword();
      const generatedKeys = getPrivateKeys(username, password);
      setKeys({ ...generatedKeys, masterPassword: password });

      // Set individual key states for display
      setOwnerKey(generatedKeys.owner);
      setActiveKey(generatedKeys.active);
      setPostingKey(generatedKeys.posting);
      setMemoKey(generatedKeys.memo);
      setMasterPassword(password);

      // Show keys for confirmation instead of immediately creating account
      setStep("keys");
      setStatusMsg("Please save your keys before proceeding!");
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Unknown error during signup preparation.");
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!keysConfirmed) {
      setError("Please confirm you have saved your keys before proceeding.");
      return;
    }

    try {
      setError("");
      setStep("creating");
      setLoading(true);

      // submit to backend
      setStatusMsg("Creating account on Hive...");
      const submitRes = await fetch("/api/signup/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signup_token: signupToken,
          pubkeys: {
            owner: keys.ownerPubkey,
            active: keys.activePubkey,
            posting: keys.postingPubkey,
            memo: keys.memoPubkey,
          },
          backup_blob: {
            version: 1,
            cipher: "plaintext",
            data: keys,
          },
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || "Signup failed.");

      setStatusMsg("Finalizing signup...");

      // Only try OTT authentication if we received an OTT token
      if (submitData.ott) {
        const authRes = await fetch(`/api/auth/ott?ott=${submitData.ott}`);
        if (!authRes.ok) {
          console.warn(
            "OTT authentication failed, but account was created successfully"
          );
        }
      }

      setStep("success");
      setSuccess(true);
      setStatusMsg("Account created successfully! Check your email for keys.");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Unknown error during account creation.");
      setStep("keys"); // Go back to keys step to try again
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const copyAllKeys = () => {
    const allKeysText = `
🔑 HIVE ACCOUNT KEYS for @${username}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 Owner Key (Master key - keep EXTREMELY safe):
${ownerKey}

⚡ Active Key (For transfers and wallet operations):
${activeKey}

📝 Posting Key (For posting and social interactions):
${postingKey}

💌 Memo Key (For encrypted messages):
${memoKey}

🔐 Master Password (Can derive all keys):
${masterPassword}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 SECURITY REMINDERS:
• Store these keys in a secure password manager
• Never share your private keys with anyone
• The Owner key should be kept offline and only used for account recovery
• Use the Posting key for daily interactions on Hive apps
• We cannot recover these keys if you lose them

SkateHive Team 🛹
    `.trim();

    navigator.clipboard.writeText(allKeysText);
    alert("All keys copied to clipboard with security information!");
  };

  const sendTestEmail = async () => {
    if (!email || !username || !signupToken) {
      setError("Missing email, username, or signup token for test email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStatusMsg("Sending test email...");

      const keys = {
        owner: ownerKey,
        active: activeKey,
        posting: postingKey,
        memo: memoKey,
        master: masterPassword,
      };

      const response = await fetch("/api/signup/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          keys,
          signup_token: signupToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg(`✅ Test email sent successfully to ${email}!`);
        alert(
          `Test email sent successfully to ${email}!\nCheck your inbox (and spam folder).`
        );
      } else {
        setError(`❌ Failed to send test email: ${data.error}`);
        console.error("Test email error:", data);
      }
    } catch (error: any) {
      setError(`❌ Test email error: ${error.message}`);
      console.error("Test email exception:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateVipCode = async () => {
    if (!vipCode.trim()) {
      setError("Please enter a VIP code to validate");
      return;
    }

    try {
      setError("");
      setLoading(true);
      setStatusMsg("Validating VIP code...");

      const response = await fetch("/api/signup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username || "testuser123", // Use test username if not provided
          email: email || "test@example.com", // Use test email if not provided
          vip_code: vipCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg(`✅ VIP code valid! Token: ${data.signup_token}`);
        setSignupToken(data.signup_token);
        console.log("VIP validation response:", data);
      } else {
        setError(`❌ VIP validation failed: ${data.error}`);
        console.error("VIP validation error:", data);
      }
    } catch (error: any) {
      setError(`❌ VIP validation error: ${error.message}`);
      console.error("VIP validation exception:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBurnVipCode = async () => {
    if (!vipCode.trim()) {
      setError("Please enter a VIP code to burn");
      return;
    }

    const confirmed = window.confirm(
      `🔥 WARNING: This will permanently consume VIP code "${vipCode}"!\n\n` +
        "This action cannot be undone. The code will be marked as used and cannot be used for actual signups.\n\n" +
        "Are you sure you want to proceed?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setLoading(true);
      setStatusMsg("🔥 Burning VIP code (testing database writes)...");

      // First validate and create session
      const initResponse = await fetch("/api/signup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `burntest${Date.now()}`, // Unique test username
          email: "burn-test@skatehive.com",
          vip_code: vipCode,
        }),
      });

      const initData = await initResponse.json();

      if (!initResponse.ok) {
        setError(`❌ Init failed: ${initData.error}`);
        return;
      }

      setStatusMsg("🔥 Session created, now burning VIP code...");

      // Now manually consume the VIP code to test database writes
      const burnResponse = await fetch("/api/signup/burn-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signup_token: initData.signup_token,
          test_mode: true,
        }),
      });

      const burnData = await burnResponse.json();

      if (burnResponse.ok) {
        setStatusMsg(
          `🔥✅ VIP code burned successfully! Database writes working.`
        );
        console.log("Burn response:", burnData);

        // Clear the VIP code field since it's now consumed
        setVipCode("");
      } else {
        setError(`❌ Burn failed: ${burnData.error}`);
        console.error("Burn error:", burnData);
      }
    } catch (error: any) {
      setError(`❌ Burn error: ${error.message}`);
      console.error("Burn exception:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "form":
        return (
          <>
            <FormControl>
              <FormLabel color="text">Username</FormLabel>
              <Input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Desired Hive username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                bg="background"
                color="text"
                spellCheck={false}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="text">Email</FormLabel>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg="background"
                color="text"
              />
            </FormControl>

            <FormControl>
              <FormLabel color="text">VIP Code</FormLabel>
              <Input
                type="text"
                name="vip-code"
                autoComplete="off"
                placeholder="XXXXXX-XXXXXXXX"
                value={vipCode}
                onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                bg="background"
                color="text"
                spellCheck={false}
                fontFamily="mono"
              />
            </FormControl>

            <Flex gap={2} flexWrap="wrap">
              <Button
                colorScheme="accent"
                onClick={handleCheckUsername}
                isLoading={loading}
                isDisabled={!username}
                flex={1}
                minW="120px"
              >
                Check Username
              </Button>

              <Button
                colorScheme="purple"
                onClick={handleValidateVipCode}
                isLoading={loading}
                isDisabled={!vipCode}
                flex={1}
                minW="120px"
              >
                Validate VIP Code
              </Button>

              <Button
                colorScheme="red"
                onClick={handleBurnVipCode}
                isLoading={loading}
                isDisabled={!vipCode}
                flex={1}
                minW="120px"
                variant="outline"
              >
                🔥 Burn Code (Test DB)
              </Button>
            </Flex>

            {isAvailable && (
              <Flex align="center">
                <Icon as={FaCheck} color="green.400" mr={2} />
                <Text color="green.400">Username is available</Text>
              </Flex>
            )}
            {!isAvailable && error && (
              <Flex align="center">
                <Icon as={FaTimes} color="red.400" mr={2} />
                <Text color="red.400">{error}</Text>
              </Flex>
            )}

            {statusMsg && (
              <Box
                bg="blue.900"
                p={3}
                borderRadius="md"
                border="1px solid"
                borderColor="blue.400"
              >
                <Text color="blue.300" fontSize="sm">
                  <strong>Debug Info:</strong> {statusMsg}
                </Text>
                {signupToken && (
                  <Text color="blue.300" fontSize="xs" fontFamily="mono" mt={2}>
                    Token: {signupToken}
                  </Text>
                )}
              </Box>
            )}

            <Button
              colorScheme="success"
              onClick={handleStartSignup}
              isDisabled={!isAvailable || !email || !vipCode}
              isLoading={loading}
            >
              Generate Keys & Continue
            </Button>
          </>
        );

      case "keys":
        return (
          <>
            <Text
              color="yellow.400"
              fontSize="lg"
              fontWeight="bold"
              textAlign="center"
            >
              ⚠️ IMPORTANT: Save these keys before proceeding!
            </Text>

            <Box
              bg="gray.800"
              p={4}
              borderRadius="md"
              border="2px solid"
              borderColor="yellow.400"
            >
              <Text color="yellow.400" fontWeight="bold" mb={2}>
                Your Account Keys:
              </Text>

              <VStack spacing={3} align="stretch">
                <Box>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text color="text" fontSize="sm" fontWeight="bold">
                      Owner Key:
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(ownerKey, "Owner Key")}
                    >
                      Copy
                    </Button>
                  </Flex>
                  <Text
                    color="gray.300"
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                  >
                    {ownerKey}
                  </Text>
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text color="text" fontSize="sm" fontWeight="bold">
                      Active Key:
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(activeKey, "Active Key")}
                    >
                      Copy
                    </Button>
                  </Flex>
                  <Text
                    color="gray.300"
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                  >
                    {activeKey}
                  </Text>
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text color="text" fontSize="sm" fontWeight="bold">
                      Posting Key:
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(postingKey, "Posting Key")}
                    >
                      Copy
                    </Button>
                  </Flex>
                  <Text
                    color="gray.300"
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                  >
                    {postingKey}
                  </Text>
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text color="text" fontSize="sm" fontWeight="bold">
                      Memo Key:
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(memoKey, "Memo Key")}
                    >
                      Copy
                    </Button>
                  </Flex>
                  <Text
                    color="gray.300"
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                  >
                    {memoKey}
                  </Text>
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text color="text" fontSize="sm" fontWeight="bold">
                      Master Password:
                    </Text>
                    <Button
                      size="sm"
                      onClick={() =>
                        copyToClipboard(masterPassword, "Master Password")
                      }
                    >
                      Copy
                    </Button>
                  </Flex>
                  <Text
                    color="gray.300"
                    fontSize="xs"
                    fontFamily="mono"
                    wordBreak="break-all"
                  >
                    {masterPassword}
                  </Text>
                </Box>
              </VStack>
            </Box>

            <Box
              bg="red.900"
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor="red.400"
            >
              <Text color="red.300" fontSize="sm">
                <strong>Security Warning:</strong> Store these keys safely! We
                will NOT be able to recover them if lost. Save them in a
                password manager or write them down securely before proceeding.
              </Text>
            </Box>

            {/* Quick Action Buttons */}
            <Flex gap={3} wrap="wrap" justify="center">
              <Button
                colorScheme="blue"
                onClick={copyAllKeys}
                leftIcon={<FaCopy />}
                size="sm"
                flex={1}
                minW="140px"
              >
                Copy All Keys
              </Button>
              <Button
                colorScheme="purple"
                onClick={sendTestEmail}
                isLoading={loading && statusMsg?.includes("test email")}
                leftIcon={<FaEnvelope />}
                size="sm"
                flex={1}
                minW="140px"
              >
                Send Test Email
              </Button>
            </Flex>

            {/* Status Message for Keys Section */}
            {statusMsg && step === "keys" && (
              <Box
                bg={statusMsg.includes("✅") ? "green.900" : "blue.900"}
                p={3}
                borderRadius="md"
                border="1px solid"
                borderColor={
                  statusMsg.includes("✅") ? "green.400" : "blue.400"
                }
              >
                <Text
                  color={statusMsg.includes("✅") ? "green.300" : "blue.300"}
                  fontSize="sm"
                >
                  {statusMsg}
                </Text>
              </Box>
            )}

            <Checkbox
              isChecked={keysConfirmed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setKeysConfirmed(e.target.checked)
              }
              colorScheme="green"
            >
              <Text color="text">
                I have safely stored all my keys and understand they cannot be
                recovered
              </Text>
            </Checkbox>

            <Button
              colorScheme="green"
              onClick={handleCreateAccount}
              isDisabled={!keysConfirmed}
              isLoading={loading}
              loadingText="Creating Account..."
            >
              Create Account Now
            </Button>

            <Button variant="outline" onClick={() => setStep("form")}>
              Back to Form
            </Button>
          </>
        );

      case "creating":
        return (
          <>
            <Flex justify="center">
              <Spinner size="xl" color="accent" />
            </Flex>
            <Text color="accent" textAlign="center" fontSize="lg">
              Creating your Hive account...
            </Text>
            <Text color="text" textAlign="center" fontSize="sm">
              This may take a few moments. Please don't close this window.
            </Text>
            {statusMsg && (
              <Text color="accent" textAlign="center" fontSize="sm">
                {statusMsg}
              </Text>
            )}
          </>
        );

      case "success":
        return (
          <>
            <Flex justify="center">
              <Icon as={FaCheck} color="green.400" boxSize={16} />
            </Flex>
            <Text
              color="green.300"
              textAlign="center"
              fontWeight="bold"
              fontSize="xl"
            >
              Account created successfully! 🎉
            </Text>
            <Text color="text" textAlign="center">
              Welcome to Skatehive, @{username}!
            </Text>
            <Text color="yellow.400" textAlign="center" fontSize="sm">
              Check your email for login instructions.
            </Text>
            <Button
              colorScheme="accent"
              onClick={() => (window.location.href = "/")}
            >
              Go to Homepage
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (signerStatus) {
      case "online":
        return "green";
      case "offline":
        return "red";
      case "auth-error":
        return "red";
      case "rc-error":
        return "orange";
      default:
        return "gray";
    }
  };

  const getStatusIcon = () => {
    switch (signerStatus) {
      case "online":
        return "🟢";
      case "offline":
        return "🔴";
      case "auth-error":
        return "🔐";
      case "rc-error":
        return "🟠";
      default:
        return "⏳";
    }
  };

  return (
    <Box maxW="600px" mx="auto" mt={10} p={6} bg="secondary" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="accent"
          textAlign="center"
        >
          Skatehive VIP Signup - Step{" "}
          {step === "form"
            ? "1"
            : step === "keys"
            ? "2"
            : step === "creating"
            ? "3"
            : "4"}{" "}
          of 4
        </Text>

        {/* Signer Status Badge */}
        <Box
          bg={`${getStatusColor()}.900`}
          border="1px solid"
          borderColor={`${getStatusColor()}.400`}
          p={3}
          borderRadius="md"
        >
          <Flex align="center" justify="space-between">
            <Text
              color={`${getStatusColor()}.300`}
              fontSize="sm"
              fontWeight="bold"
            >
              {getStatusIcon()} Signer Service Status
            </Text>
            <Text color={`${getStatusColor()}.300`} fontSize="xs">
              {signerStatus === "checking"
                ? "Checking..."
                : signerStatus === "online"
                ? "Online"
                : signerStatus === "offline"
                ? "Offline"
                : signerStatus === "auth-error"
                ? "Auth Failed"
                : signerStatus === "rc-error"
                ? "RC Issue"
                : "Unknown"}
            </Text>
          </Flex>
          <Text color={`${getStatusColor()}.300`} fontSize="xs" mt={1}>
            {rcInfo}
          </Text>
          {authStatus !== "unknown" && (
            <Text
              color={authStatus === "valid" ? "green.400" : "yellow.400"}
              fontSize="xs"
              mt={0.5}
            >
              🔐 Auth: {authStatus}
            </Text>
          )}
          {(signerStatus === "rc-error" || signerStatus === "auth-error") && (
            <Text
              color={signerStatus === "rc-error" ? "orange.400" : "red.400"}
              fontSize="xs"
              mt={1}
            >
              {signerStatus === "rc-error"
                ? "⚠️ Account creation will fail until Resource Credits are restored"
                : "🔐 Authentication failed - check signer token configuration"}
            </Text>
          )}
        </Box>

        {error && step !== "form" && (
          <Box
            bg="red.900"
            p={3}
            borderRadius="md"
            border="1px solid"
            borderColor="red.400"
          >
            <Text color="red.300">{error}</Text>
          </Box>
        )}

        {renderStepContent()}
      </VStack>
    </Box>
  );
}
