"use client";

import {
  VStack,
  HStack,
  Text,
  Box,
  Image,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useColorModeValue,
  Textarea,
  Link,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useState } from "react";

interface AnnouncementPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  announcementContent: string;
  imageUrl?: string;
  token: string;
  recipients: any[];
  totalAmount: number;
  creator?: {
    hiveUsername?: string;
    ethereumAddress?: string;
  };
  isAnonymous?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isPosting?: boolean;
}

export function AnnouncementPreview({
  isOpen,
  onClose,
  announcementContent,
  imageUrl,
  token,
  recipients,
  totalAmount,
  creator,
  isAnonymous,
  onConfirm,
  onCancel,
  isPosting = false,
}: AnnouncementPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          <HStack spacing={3}>
            <Text>📢 Announcement Preview</Text>
            <Badge colorScheme="blue" variant="subtle">
              {token} Airdrop
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Announcement Summary */}
            <Box
              p={4}
              bg="blue.50"
              _dark={{ bg: "blue.900" }}
              borderRadius="md"
              border="1px solid"
              borderColor="blue.200"
            >
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="blue.600"
                _dark={{ color: "blue.200" }}
                mb={2}
              >
                📊 Announcement Summary
              </Text>
              <VStack spacing={2} align="start">
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Token:</Text>
                  <Badge colorScheme="purple">{token}</Badge>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Recipients:</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {recipients.length} users
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Total Amount:</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {totalAmount.toFixed(3)} {token}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Creator:</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {isAnonymous
                      ? "Anonymous"
                      : creator?.hiveUsername
                      ? `@${creator.hiveUsername}`
                      : creator?.ethereumAddress
                      ? `${creator.ethereumAddress.slice(
                          0,
                          6
                        )}...${creator.ethereumAddress.slice(-4)}`
                      : "Unknown"}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Network Image:</Text>
                  <Badge colorScheme={imageUrl ? "green" : "orange"}>
                    {imageUrl ? "✅ Included" : "⚠️ Not captured"}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            {/* Network Screenshot Preview */}
            {imageUrl && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={3} color="primary">
                  🖼️ Network Visualization
                </Text>
                <Box
                  border="2px solid"
                  borderColor={borderColor}
                  borderRadius="lg"
                  overflow="hidden"
                  bg={bgColor}
                  maxW="400px"
                  mx="auto"
                >
                  <Image
                    src={imageUrl}
                    alt="Airdrop Network Visualization"
                    w="100%"
                    objectFit="contain"
                    fallback={
                      <Box
                        w="400px"
                        h="300px"
                        bg="gray.100"
                        _dark={{ bg: "gray.700" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="gray.500">Image loading...</Text>
                      </Box>
                    }
                  />
                </Box>
                <HStack justify="center" mt={2}>
                  <Link
                    href={imageUrl}
                    isExternal
                    fontSize="xs"
                    color="blue.500"
                  >
                    View full size <ExternalLinkIcon mx="2px" />
                  </Link>
                </HStack>
              </Box>
            )}

            {/* Announcement Content Preview */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={3} color="primary">
                📝 Snap Content
              </Text>
              <Box
                p={4}
                bg={bgColor}
                border="2px solid"
                borderColor={borderColor}
                borderRadius="md"
                position="relative"
              >
                <Text
                  fontSize="sm"
                  whiteSpace="pre-line"
                  lineHeight="1.6"
                  color="text"
                  noOfLines={isExpanded ? undefined : 10}
                >
                  {announcementContent}
                </Text>

                {announcementContent.split("\n").length > 10 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    mt={2}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Show less" : "Show more..."}
                  </Button>
                )}
              </Box>
            </Box>

            {/* Publication Details */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                This announcement will be posted as <strong>@skatedev</strong>{" "}
                on the Hive blockchain. It will be visible on PeakD, Ecency, and
                other Hive frontends.
              </AlertDescription>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full" justify="space-between">
            <Button
              variant="ghost"
              colorScheme="red"
              leftIcon={<CloseIcon />}
              onClick={handleCancel}
              disabled={isPosting}
              size="md"
            >
              Cancel Announcement
            </Button>

            <Button
              colorScheme="green"
              leftIcon={<CheckIcon />}
              onClick={handleConfirm}
              isLoading={isPosting}
              loadingText="Posting to Hive..."
              size="md"
              fontWeight="bold"
            >
              Post Announcement
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
