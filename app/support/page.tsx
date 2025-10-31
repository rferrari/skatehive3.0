"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaEnvelope,
  FaQuestionCircle,
  FaBug,
  FaLightbulb,
  FaExternalLinkAlt,
  FaCheckCircle,
} from "react-icons/fa";

interface FormData {
  email: string;
  message: string;
  subject: string;
}

interface FormErrors {
  email?: string;
  message?: string;
  general?: string;
}

export default function SupportPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    message: "",
    subject: "General Support Request",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Message validation
    if (!formData.message) {
      newErrors.message = "Please describe how we can help you";
    } else if (formData.message.length < 10) {
      newErrors.message =
        "Please provide more details (at least 10 characters)";
    } else if (formData.message.length > 2000) {
      newErrors.message = "Message is too long (maximum 2000 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setFormData({
          email: "",
          message: "",
          subject: "General Support Request",
        });
      } else {
        setErrors({
          general:
            result.error || "Failed to send your message. Please try again.",
        });
      }
    } catch (error) {
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Common support topics
  const supportTopics = [
    {
      icon: FaQuestionCircle,
      title: "Account & Login",
      description:
        "Issues with your SkateHive account, password reset, or login problems",
      color: "blue.500",
    },
    {
      icon: FaBug,
      title: "Technical Issues",
      description: "App crashes, loading problems, or unexpected behavior",
      color: "red.500",
    },
    {
      icon: FaLightbulb,
      title: "Feature Requests",
      description: "Suggestions for new features or improvements to the app",
      color: "yellow.500",
    },
    {
      icon: FaEnvelope,
      title: "General Questions",
      description:
        "Community guidelines, content policies, or general inquiries",
      color: "green.500",
    },
  ];

  if (isSubmitted) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} textAlign="center">
          <Icon as={FaCheckCircle} boxSize={16} color="green.500" />
          <Heading size="lg" color="green.500">
            Message Sent Successfully!
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Thank you for contacting SkateHive Support. We've received your
            message and will respond within 24-48 hours.
          </Text>
          <Text fontSize="sm" color="gray.500">
            Please check your email for a confirmation message with your request
            details.
          </Text>
          <Button
            colorScheme="green"
            onClick={() => setIsSubmitted(false)}
            size="lg"
          >
            Send Another Message
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={"background"}>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="xl" mb={4} color="primary">
              SkateHive Support
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
              Need help? We're here to assist you with any questions or issues
              you may have with the SkateHive app.
            </Text>
          </Box>

          {/* Support Topics */}
          <Box>
            <Heading size="md" mb={4} textAlign="center">
              What can we help you with?
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={8}>
              {supportTopics.map((topic, index) => (
                <Card
                  key={index}
                  bg={"background"}
                  borderColor={"primary"}
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                    borderColor: topic.color,
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => handleInputChange("subject", topic.title)}
                >
                  <CardBody>
                    <Flex align="center" mb={3}>
                      <Icon
                        as={topic.icon}
                        color={topic.color}
                        boxSize={6}
                        mr={3}
                      />
                      <Text fontWeight="bold" fontSize="lg">
                        {topic.title}
                      </Text>
                    </Flex>
                    <Text color="primary" fontSize="sm">
                      {topic.description}
                    </Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          <Divider />

          {/* Contact Form */}
          <Box>
            <Heading size="md" mb={6} textAlign="center">
              Send us a message
            </Heading>

            {errors.general && (
              <Alert status="error" mb={6} borderRadius="md">
                <AlertIcon />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <Card bg={"background"} borderColor={"primary"}>
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6} align="stretch">
                    <FormControl isRequired isInvalid={!!errors.email}>
                      <FormLabel fontWeight="medium">Email Address</FormLabel>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        size="lg"
                        bg={"background"}
                        borderColor={errors.email ? "red.300" : "gray.300"}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                      />
                      {errors.email && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.email}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        We'll use this to respond to your message
                      </Text>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="medium">Subject</FormLabel>
                      <Input
                        placeholder="What is this regarding?"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        size="lg"
                        bg={"background"}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                      />
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.message}>
                      <FormLabel fontWeight="medium">
                        How can we help you?
                      </FormLabel>
                      <Textarea
                        placeholder="Please describe your issue or question in detail. Include any error messages, steps you've tried, or specific information that might help us assist you better."
                        value={formData.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        rows={6}
                        resize="vertical"
                        bg={"background"}
                        borderColor={errors.message ? "red.300" : "gray.300"}
                        _focus={{
                          borderColor: "primary",
                          boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
                        }}
                      />
                      {errors.message && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.message}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {formData.message.length}/2000 characters
                      </Text>
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="green"
                      size="lg"
                      isLoading={isSubmitting}
                      loadingText="Sending..."
                      disabled={!formData.email || !formData.message}
                      width="full"
                    >
                      Send Message
                    </Button>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </Box>

          {/* Additional Resources */}
          <Box textAlign="center" pt={4}>
            <Text color="gray.600" mb={4}>
              Looking for immediate answers? Check out our resources:
            </Text>
            <Flex justify="center" wrap="wrap" gap={4}>
              <Link
                href="https://docs.skatehive.app"
                isExternal
                color="primary"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Documentation <Icon as={FaExternalLinkAlt} ml={1} boxSize={3} />
              </Link>
              <Link
                href="https://discord.gg/skatehive"
                isExternal
                color="primary"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Community Discord{" "}
                <Icon as={FaExternalLinkAlt} ml={1} boxSize={3} />
              </Link>
              <Link
                href="https://skatehive.app/blog"
                isExternal
                color="primary"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Latest Updates{" "}
                <Icon as={FaExternalLinkAlt} ml={1} boxSize={3} />
              </Link>
            </Flex>
          </Box>

          {/* Response Time Notice */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Response Time</AlertTitle>
              <AlertDescription>
                We typically respond to support requests within 24-48 hours
                during business days. For urgent issues affecting app
                functionality, please include detailed steps to reproduce the
                problem.
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
}
