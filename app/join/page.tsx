"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { FaCheck, FaTimes, FaPiggyBank } from "react-icons/fa";
import { MdSkateboarding, MdPublic, MdOutlinePsychology } from "react-icons/md";
import {
  validateAccountName,
  checkAccountExists,
} from "@/lib/invite/helpers";
import { useTheme } from "@/app/themeProvider";

export default function JoinPage() {
  const [desiredUsername, setDesiredUsername] = useState("");
  const [desiredEmail, setDesiredEmail] = useState("");
  const [accountAvailable, setAccountAvailable] = useState<boolean | null>(null);
  const [accountInvalid, setAccountInvalid] = useState<string | null>(null);
  const [isCheckedOnce, setIsCheckedOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { themeName } = useTheme();
  const textColor = "text";
  const iconColor = "accent";

  const handleCheck = async () => {
    setError("");
    setIsCheckedOnce(false);
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
    if (!isAvailable) {
      setError("Account is not available. Please choose another username.");
    }
  };

  return (
    <Box minH="100vh" bg="background" py={0} position="relative" overflow="hidden">
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
        style={{ objectFit: 'cover', objectPosition: 'center 30%', width: '100%', height: '100%', pointerEvents: 'none', filter: 'brightness(0.5)' }}
        aria-hidden="true"
      />
      <Flex direction="column" align="center" justify="center" minH="100vh" px={4} position="relative" zIndex={1} mt={{ base: -3, md: -6 }}>
        {/* Hero Section */}
        <Box textAlign="center" mt={{ base: 2, md: 4 }} mb={4}>
          <Icon as={MdSkateboarding} boxSize={16} color={iconColor} mb={4} />
          <Heading size="2xl" color={textColor} mb={2}
            textShadow="0 4px 24px rgba(0,0,0,0.95)"
          >
            Welcome to Skatehive
          </Heading>
          <Text fontSize="xl" color={textColor} maxW="lg" mx="auto"
            textShadow="0 4px 24px rgba(0,0,0,0.95)"
          >
            The decentralized skateboarding community. Connect, share, and grow with skaters worldwide. Join us and claim your unique Hive username!
          </Text>
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
                <Text fontWeight="bold" color={textColor}
                  textShadow="0 4px 24px rgba(0,0,0,0.95)"
                >Choose your Hive Username</Text>
                <Input
                  type="text"
                  placeholder="Desired Hive Username"
                  value={desiredUsername}
                  onChange={(e) => setDesiredUsername(e.target.value)}
                  maxW="375px"
                  bg="background"
                  color="text"
                  mb={2}
                  _placeholder={{ color: 'text' }}
                />
              </FormControl>
              <FormControl>
                <Text fontWeight="bold" color={textColor}
                  textShadow="0 4px 24px rgba(0,0,0,0.95)"
                >Your Email Address</Text>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={desiredEmail}
                  onChange={(e) => setDesiredEmail(e.target.value)}
                  maxW="375px"
                  bg="background"
                  color="text"
                  mb={2}
                  _placeholder={{ color: 'text' }}
                />
              </FormControl>
              <Button
                colorScheme="primary"
                onClick={handleCheck}
                isLoading={loading}
                isDisabled={!desiredUsername || !desiredEmail}
                w="full"
                fontWeight="bold"
              >
                Check if @{desiredUsername || "..."} is available!
              </Button>
              {isCheckedOnce && (
                <Flex
                  border="2px solid"
                  borderColor="primary"
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
                  <Text color={textColor} ml={2}
                    textShadow="0 4px 24px rgba(0,0,0,0.95)"
                  >
                    {accountAvailable
                      ? "Username is available!"
                      : "Please choose another username! " + String(accountInvalid).replace(/'/g, "&apos;")}
                  </Text>
                </Flex>
              )}
              {accountAvailable && isCheckedOnce && (
                <Button colorScheme="success" w="full" mt={2} fontWeight="bold">
                  Submit
                </Button>
              )}
              {error && (
                <Text color={textColor} fontSize="sm" textAlign="center"
                  textShadow="0 4px 24px rgba(0,0,0,0.95)"
                >
                  {error}
                </Text>
              )}
            </VStack>
          </Box>
        </Box>
        {/* Features Section */}
        <Box mt={8} w="full" maxW="3xl">
          <Heading size="md" color={textColor} textAlign="center" mb={6}
            textShadow="0 4px 24px rgba(0,0,0,0.95)"
          >
            Why Join Skatehive?
          </Heading>
          <Flex direction={{ base: "column", md: "row" }} gap={6} justify="center">
            <FeatureCard icon={MdPublic} title="Global Community" desc="Connect with skaters from all over the world and share your passion." />
            <FeatureCard icon={MdOutlinePsychology} title="Learn Web3" desc="Explore how decentralized tech connects skaters to shred limits in the digital realm." />
            <FeatureCard icon={FaPiggyBank} title="Earn Rewards" desc="Get rewarded for your content and engagement. Skate, share, and earn on Hive!" />
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
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
        <Text fontWeight="bold" color={textColor} fontSize="lg" mb={1}
          textShadow="0 4px 24px rgba(0,0,0,0.95)"
        >
          {title}
        </Text>
        <Text color={textColor} fontSize="md" textAlign="center"
          textShadow="0 4px 24px rgba(0,0,0,0.95)"
        >
          {desc}
        </Text>
      </Box>
    </Flex>
  );
} 