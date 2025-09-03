"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Input,
  Text,
  VStack,
  Icon,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { FaCheck, FaTimes, FaPiggyBank } from "react-icons/fa";
import { MdPublic, MdOutlinePsychology } from "react-icons/md";
import { validateAccountName, checkAccountExists } from "@/lib/invite/helpers";
import { useTheme } from "@/app/themeProvider";

export default function JoinPage() {
  const [desiredUsername, setDesiredUsername] = useState("");
  const [desiredEmail, setDesiredEmail] = useState("");
  const [accountAvailable, setAccountAvailable] = useState<boolean | null>(
    null
  );
  const [accountInvalid, setAccountInvalid] = useState<string | null>(null);
  const [isCheckedOnce, setIsCheckedOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const textColor = "text";

  const handleCreateAccount = async () => {
    setError("");
    setSuccess("");
    setAccountAvailable(null);
    setAccountInvalid(null);

    if (!desiredEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!desiredUsername) {
      setError("Please enter a username.");
      return;
    }

    setLoading(true);

    try {
      // First, validate the username format
      const isValidAccountName = validateAccountName(desiredUsername);
      if (isValidAccountName !== null) {
        setAccountInvalid(String(isValidAccountName));
        setAccountAvailable(false);
        setLoading(false);
        setError(`Invalid username: ${isValidAccountName}`);
        return;
      }

      // Check if username is available
      const isAvailable = await checkAccountExists(desiredUsername);
      if (!isAvailable) {
        setAccountAvailable(false);
        setLoading(false);
        setError("Username is not available. Please choose another username.");
        return;
      }

      // Username is valid and available, submit the request
      const response = await fetch('/api/join-requests-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: desiredEmail,
          username_1: desiredUsername,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Join request submitted successfully! We'll review it and get back to you soon. Please check your spam folder for account information.");
        setAccountAvailable(true);
        // Reset form
        setDesiredUsername("");
        setDesiredEmail("");
      } else {
        setError(data.error || 'Failed to submit join request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg="background"
      py={0}
      position="relative"
      overflow="hidden"
    >
      {/* Background Video */}
      <Box
        as="video"
        autoPlay
        loop
        muted
        playsInline
        src="/images/spash_big.mp4"
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        objectFit="cover"
        zIndex={0}
        style={{
          objectFit: "cover",
          objectPosition: "center 30%",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          filter: "brightness(0.5)",
        }}
        aria-hidden="true"
      />
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100vh"
        px={4}
        position="relative"
        zIndex={1}
        mt={0}
        overflow="auto"
      >
        {/* Hero Section */}
        <Box textAlign="center" mt={2} mb={2}>
          <Image
            src="/images/treflipgog%20crop.gif"
            alt="Skateboarder Treflip"
            maxW="64px"
            height="64px"
            objectFit="contain"
            mb={4}
            mx="auto"
          />
          <Heading
            size="2xl"
            color={textColor}
            mb={2}
            textShadow="0 4px 24px rgba(0,0,0,0.95)"
          >
            Welcome to Skatehive
          </Heading>
          <Box
            maxW="2xl"
            mx="auto"
            px={4}
            py={2}
            borderRadius="md"
            background="rgba(0,0,0,0.4)"
            display="inline-block"
          >
            <Text
              fontSize="lg"
              color={textColor}
              textAlign="center"
              textShadow="0 4px 24px rgba(0,0,0,0.95)"
            >
              Your Hive username is your blockchain wallet account! Choose carefully - 
              this will be your permanent identity on the Hive network.
            </Text>
            <Box mt={4} p={4} bg="rgba(0,0,0,0.3)" borderRadius="md">
              <Text
                fontSize="md"
                color={textColor}
                textAlign="left"
                textShadow="0 4px 24px rgba(0,0,0,0.95)"
                fontWeight="bold"
                mb={2}
              >
                Hive Username Rules:
              </Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text>• 3-16 characters long</Text>
                <Text>• Must start with a lowercase letter</Text>
                <Text>• Can contain: a-z, 0-9, hyphens (-), periods (.)</Text>
                <Text>• Must end with a letter or number</Text>
                <Text>• No consecutive dots or hyphens</Text>
                <Text>• Each segment (if using periods) must be 3+ characters</Text>
              </VStack>
            </Box>
          </Box>
        </Box>
        {/* Form Card */}
        <Box
          position="relative"
          boxShadow="2xl"
          borderRadius="lg"
          p={{ base: 6, md: 10 }}
          maxW="md"
          w="full"
          bg="unset"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            backgroundImage="url('/images/griptape.jpg')"
            backgroundSize="cover"
            backgroundPosition="center"
            opacity={0.3}
            zIndex={0}
            pointerEvents="none"
          />
          <Box position="relative" zIndex={1}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <Text
                  fontWeight="bold"
                  color={textColor}
                  textShadow="0 4px 24px rgba(0,0,0,0.95)"
                >
                  Choose your Hive Username
                </Text>
                <Input
                  type="text"
                  placeholder="Desired Hive Username"
                  value={desiredUsername}
                  onChange={(e) => setDesiredUsername(e.target.value)}
                  maxLength={16}
                  maxW="375px"
                  bg="background"
                  color="text"
                  mb={2}
                  _placeholder={{ color: "text" }}
                />
              </FormControl>
              <FormControl>
                <Text
                  fontWeight="bold"
                  color={textColor}
                  textShadow="0 4px 24px rgba(0,0,0,0.95)"
                >
                  Your Email Address
                </Text>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={desiredEmail}
                  onChange={(e) => setDesiredEmail(e.target.value)}
                  maxW="375px"
                  bg="background"
                  color="text"
                  mb={2}
                  _placeholder={{ color: "text" }}
                />
              </FormControl>
              <Button
                colorScheme="primary"
                onClick={handleCreateAccount}
                isLoading={loading}
                isDisabled={!desiredUsername || !desiredEmail}
                w="full"
                fontWeight="bold"
                fontSize={{ base: "sm", md: "md" }}
                px={2}
                whiteSpace="normal"
                h="auto"
                py={3}
                lineHeight="1.2"
              >
                {desiredUsername ? (
                  <>
                    Create Account<br />
                    @{desiredUsername}
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              {success && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Box>
                </Alert>
              )}
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Error!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </Box>
        </Box>
        {/* Features Section */}
        <Box mt={10} w="full" maxW="3xl">
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={6}
            justify="center"
          >
            <FeatureCard
              icon={MdPublic}
              title="Global Community"
              desc="Connect with skaters from all over the world and share your passion."
            />
            <FeatureCard
              icon={MdOutlinePsychology}
              title="Learn Web3"
              desc="Explore how decentralized tech connects skaters to shred limits in the digital realm."
            />
            <FeatureCard
              icon={FaPiggyBank}
              title="Earn Rewards"
              desc="Get rewarded for your content and engagement. Skate, share, and earn on Hive!"
            />
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  const { themeName } = useTheme();
  const textColor = "text";
  const iconColor = "accent";

  return (
    <Flex
      position="relative"
      direction="column"
      align="center"
      bg="unset"
      borderRadius="md"
      p={6}
      boxShadow="md"
      flex="1"
      minW="220px"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        backgroundImage="url('/images/griptape.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        opacity={0.3}
        zIndex={0}
        pointerEvents="none"
      />
      <Box position="relative" zIndex={1} width="100%" textAlign="center">
        <Icon as={icon} boxSize={10} color={iconColor} mb={2} />
        <Text
          fontWeight="bold"
          color={textColor}
          fontSize="lg"
          mb={1}
          textShadow="0 4px 24px rgba(0,0,0,0.95)"
        >
          {title}
        </Text>
        <Text
          color={textColor}
          fontSize="md"
          textAlign="center"
          textShadow="0 4px 24px rgba(0,0,0,0.95)"
        >
          {desc}
        </Text>
      </Box>
    </Flex>
  );
}
