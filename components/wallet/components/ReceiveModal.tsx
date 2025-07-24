import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Box,
  Text,
  Image,
  Button,
  useClipboard,
  useToast,
  Spinner,
  Badge,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { FiCopy, FiDownload, FiShare2 } from "react-icons/fi";
import { useAccount } from "wagmi";
import { useHiveUser } from "@/contexts/UserContext";
import * as QRCode from "qrcode";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose }) => {
  const { isConnected, address } = useAccount();
  const { hiveUser: user } = useHiveUser();
  const [ethereumQR, setEthereumQR] = useState<string>("");
  const [hiveQR, setHiveQR] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const toast = useToast();

  const { hasCopied: hasEthCopied, onCopy: onEthCopy } = useClipboard(
    address || ""
  );
  const { hasCopied: hasHiveCopied, onCopy: onHiveCopy } = useClipboard(
    user?.name || ""
  );

  const generateQRCode = async (text: string, type: "ethereum" | "hive") => {
    try {
      setIsGeneratingQR(true);
      const qrDataURL = await QRCode.toDataURL(text, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      if (type === "ethereum") {
        setEthereumQR(qrDataURL);
      } else {
        setHiveQR(qrDataURL);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  useEffect(() => {
    if (isOpen && address) {
      generateQRCode(address, "ethereum");
    }
  }, [isOpen, address]);

  useEffect(() => {
    if (isOpen && user?.name) {
      generateQRCode(user.name, "hive");
    }
  }, [isOpen, user?.name]);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const downloadQR = (qrCode: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = qrCode;
    link.click();
  };

  const shareAddress = async (addr: string, type: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${type} Address`,
          text: `Here's my ${type} address: ${addr}`,
        });
      } catch (error) {
        console.log("Share canceled");
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(addr);
      toast({
        title: "Copied to clipboard",
        description: `${type} address copied`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        bg="cardBg"
        borderRadius="2xl"
        border="1px solid"
        borderColor="border"
        boxShadow="0 25px 50px rgba(0, 0, 0, 0.25)"
        mx={4}
      >
        <ModalHeader
          pb={2}
          borderBottom="1px solid"
          borderColor="border"
          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))"
          borderTopRadius="2xl"
        >
          <HStack spacing={3}>
            <Box
              w={8}
              h={8}
              bg="linear-gradient(135deg, #3b82f6, #9333ea)"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontWeight="bold" fontSize="sm">
                R
              </Text>
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg" color="text">
                Receive Crypto
              </Text>
              <Text fontSize="sm" color="textSecondary">
                Share your addresses to receive payments
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={0}>
          <VStack spacing={0} w="100%">
            <Tabs variant="soft-rounded" colorScheme="blue" w="100%">
              <TabList p={4} bg="rgba(0, 0, 0, 0.02)">
                <Tab flex={1} _selected={{ bg: "primary", color: "white" }}>
                  <HStack spacing={2}>
                    <Avatar src="/logos/ethereum-logo.png" size="xs" />
                    <Text>Ethereum</Text>
                    {isConnected && (
                      <Badge colorScheme="green" size="sm" borderRadius="full">
                        Connected
                      </Badge>
                    )}
                  </HStack>
                </Tab>
                <Tab flex={1} _selected={{ bg: "primary", color: "white" }}>
                  <HStack spacing={2}>
                    <Avatar src="/logos/hive-logo.png" size="xs" />
                    <Text>Hive</Text>
                    {user && (
                      <Badge colorScheme="green" size="sm" borderRadius="full">
                        Connected
                      </Badge>
                    )}
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Ethereum Tab */}
                <TabPanel px={6} py={8}>
                  {isConnected && address ? (
                    <VStack spacing={6} align="center">
                      {/* Header */}
                      <VStack spacing={2}>
                        <HStack spacing={3}>
                          <Avatar src="/logos/ethereum-logo.png" size="md" />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="lg" color="text">
                              Ethereum Wallet
                            </Text>
                            <Text fontSize="sm" color="textSecondary">
                              ERC-20 tokens supported
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>

                      <Divider />

                      {/* QR Code */}
                      <VStack spacing={4}>
                        <Box
                          p={6}
                          bg="white"
                          borderRadius="2xl"
                          border="3px solid"
                          borderColor="primary"
                          boxShadow="0 10px 30px rgba(0, 0, 0, 0.1)"
                          position="relative"
                          _hover={{
                            transform: "scale(1.02)",
                            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)",
                          }}
                          transition="all 0.3s ease"
                        >
                          {isGeneratingQR ? (
                            <Box
                              w="200px"
                              h="200px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Spinner
                                size="xl"
                                color="primary"
                                thickness="4px"
                              />
                            </Box>
                          ) : ethereumQR ? (
                            <Image
                              src={ethereumQR}
                              alt="Ethereum Address QR Code"
                              w="200px"
                              h="200px"
                            />
                          ) : (
                            <Box
                              w="200px"
                              h="200px"
                              bg="gray.100"
                              borderRadius="lg"
                            />
                          )}

                          {ethereumQR && !isGeneratingQR && (
                            <HStack
                              position="absolute"
                              top={2}
                              right={2}
                              spacing={1}
                            >
                              <Tooltip label="Download QR Code">
                                <IconButton
                                  aria-label="Download QR"
                                  icon={<Icon as={FiDownload} />}
                                  size="sm"
                                  variant="ghost"
                                  bg="white"
                                  color="primary"
                                  _hover={{ bg: "gray.50" }}
                                  onClick={() =>
                                    downloadQR(
                                      ethereumQR,
                                      "ethereum-address-qr.png"
                                    )
                                  }
                                />
                              </Tooltip>
                              <Tooltip label="Share Address">
                                <IconButton
                                  aria-label="Share Address"
                                  icon={<Icon as={FiShare2} />}
                                  size="sm"
                                  variant="ghost"
                                  bg="white"
                                  color="primary"
                                  _hover={{ bg: "gray.50" }}
                                  onClick={() =>
                                    shareAddress(address, "ethereum")
                                  }
                                />
                              </Tooltip>
                            </HStack>
                          )}
                        </Box>
                      </VStack>

                      {/* Address Display */}
                      <VStack spacing={4} w="100%">
                        <VStack spacing={3} w="100%">
                          <HStack spacing={2}>
                            <Text
                              fontSize="md"
                              color="text"
                              fontWeight="medium"
                            >
                              Wallet Address
                            </Text>
                            <Badge colorScheme="green" borderRadius="full">
                              Connected
                            </Badge>
                          </HStack>

                          <Box
                            w="100%"
                            p={4}
                            bg="rgba(59, 130, 246, 0.05)"
                            border="2px solid"
                            borderColor="rgba(59, 130, 246, 0.2)"
                            borderRadius="xl"
                            _hover={{
                              borderColor: "primary",
                              transform: "scale(1.01)",
                            }}
                            transition="all 0.2s ease"
                            cursor="pointer"
                            onClick={onEthCopy}
                          >
                            <HStack justify="space-between" w="100%">
                              <VStack align="start" spacing={1} flex={1}>
                                <Text
                                  fontSize="sm"
                                  fontFamily="mono"
                                  color="text"
                                  fontWeight="medium"
                                  wordBreak="break-all"
                                  display={{ base: "none", md: "block" }}
                                >
                                  {address}
                                </Text>
                                <Text
                                  fontSize="sm"
                                  fontFamily="mono"
                                  color="text"
                                  fontWeight="medium"
                                  display={{ base: "block", md: "none" }}
                                >
                                  {shortenAddress(address)}
                                </Text>
                              </VStack>
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<Icon as={FiCopy} />}
                                colorScheme={hasEthCopied ? "green" : "blue"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEthCopy();
                                }}
                              >
                                {hasEthCopied ? "Copied!" : "Copy"}
                              </Button>
                            </HStack>
                          </Box>
                        </VStack>

                        <VStack spacing={3} w="100%">
                          <Text
                            fontSize="sm"
                            color="textSecondary"
                            textAlign="center"
                            fontWeight="medium"
                          >
                            Supported Networks
                          </Text>
                          <HStack spacing={2} flexWrap="wrap" justify="center">
                            <Badge colorScheme="blue" borderRadius="full">
                              Ethereum
                            </Badge>
                            <Badge colorScheme="purple" borderRadius="full">
                              Polygon
                            </Badge>
                            <Badge colorScheme="orange" borderRadius="full">
                              BSC
                            </Badge>
                            <Badge colorScheme="green" borderRadius="full">
                              Arbitrum
                            </Badge>
                          </HStack>
                          <Text
                            fontSize="sm"
                            color="textSecondary"
                            lineHeight="1.4"
                            textAlign="center"
                          >
                            This address supports Ethereum and ERC-20 tokens
                            across multiple networks. Always verify the network
                            before sending.
                          </Text>
                        </VStack>
                      </VStack>
                    </VStack>
                  ) : (
                    <VStack spacing={6} align="center" py={12}>
                      <Box
                        fontSize="64px"
                        opacity={0.5}
                        filter="grayscale(100%)"
                      >
                        🔗
                      </Box>
                      <VStack spacing={2}>
                        <Text fontSize="lg" fontWeight="semibold" color="text">
                          Wallet Not Connected
                        </Text>
                        <Text
                          fontSize="sm"
                          color="textSecondary"
                          textAlign="center"
                        >
                          Connect your Ethereum wallet to generate a receive
                          address and QR code
                        </Text>
                      </VStack>
                      <Button
                        size="lg"
                        colorScheme="blue"
                        borderRadius="xl"
                        px={8}
                        py={6}
                        fontSize="md"
                        fontWeight="semibold"
                        bg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
                        }}
                        transition="all 0.3s ease"
                      >
                        Connect Wallet
                      </Button>
                    </VStack>
                  )}
                </TabPanel>

                {/* Hive Tab */}
                <TabPanel p={4}>
                  {user ? (
                    <VStack spacing={4} align="center">
                      {/* QR Code */}
                      <Box
                        p={4}
                        bg="white"
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="border"
                      >
                        {hiveQR ? (
                          <Image
                            src={hiveQR}
                            alt="Hive Username QR Code"
                            w="200px"
                            h="200px"
                          />
                        ) : isGeneratingQR ? (
                          <Box
                            w="200px"
                            h="200px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Spinner size="xl" />
                          </Box>
                        ) : (
                          <Box
                            w="200px"
                            h="200px"
                            bg="gray.100"
                            borderRadius="lg"
                          />
                        )}
                      </Box>

                      {/* Username Display */}
                      <VStack spacing={2} w="100%">
                        <Text fontSize="sm" color="textSecondary">
                          Hive Username
                        </Text>
                        <Box
                          w="100%"
                          p={3}
                          bg="rgba(0, 0, 0, 0.05)"
                          borderRadius="lg"
                          border="1px solid"
                          borderColor="border"
                        >
                          <HStack justify="space-between">
                            <Text fontFamily="mono" fontSize="md" color="text">
                              @{user.name}
                            </Text>
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<Icon as={FiCopy} />}
                              colorScheme={hasHiveCopied ? "green" : "gray"}
                              onClick={onHiveCopy}
                            >
                              {hasHiveCopied ? "Copied!" : "Copy"}
                            </Button>
                          </HStack>
                        </Box>
                      </VStack>

                      {/* Info */}
                      <VStack spacing={2} w="100%">
                        <Text
                          fontSize="sm"
                          color="textSecondary"
                          textAlign="center"
                        >
                          Send HIVE, HBD, and other Hive tokens to this username
                        </Text>
                      </VStack>
                    </VStack>
                  ) : (
                    <VStack spacing={4} align="center" py={8}>
                      <Text fontSize="lg" fontWeight="semibold" color="text">
                        Not Connected to Hive
                      </Text>
                      <Text
                        fontSize="sm"
                        color="textSecondary"
                        textAlign="center"
                      >
                        Connect your Hive account to generate a receive QR code
                      </Text>
                      <Button size="lg" colorScheme="red">
                        Connect Hive Account
                      </Button>
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ReceiveModal;
