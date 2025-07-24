import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  useClipboard,
  useToast,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { useAccount } from "wagmi";
import { useAioha } from "@aioha/react-ui";
import QRCode from "qrcode";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { isConnected, address } = useAccount();
  const { user } = useAioha();
  const toast = useToast();

  const [ethereumQR, setEthereumQR] = useState<string>("");
  const [hiveQR, setHiveQR] = useState<string>("");

  const { hasCopied: hasEthCopied, onCopy: onEthCopy } = useClipboard(
    address || ""
  );

  const { hasCopied: hasHiveCopied, onCopy: onHiveCopy } = useClipboard(
    user || ""
  );

  // Generate QR codes when modal opens
  useEffect(() => {
    if (isOpen) {
      // Generate Ethereum QR code
      if (address) {
        QRCode.toDataURL(address, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
          .then((url: string) => setEthereumQR(url))
          .catch((err: any) =>
            console.error("Error generating Ethereum QR:", err)
          );
      }

      // Generate Hive QR code
      if (user) {
        QRCode.toDataURL(user, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
          .then((url: string) => setHiveQR(url))
          .catch((err: any) => console.error("Error generating Hive QR:", err));
      }
    }
  }, [isOpen, address, user]);

  const handleCopyAddress = (type: "ethereum" | "hive") => {
    if (type === "ethereum") {
      onEthCopy();
      toast({
        title: "Address copied!",
        description: "Ethereum address copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      onHiveCopy();
      toast({
        title: "Username copied!",
        description: "Hive username copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="background" border="1px solid" borderColor="muted">
        <ModalHeader color="primary" fontFamily="Joystix">
          💰 Receive Crypto
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="textSecondary" textAlign="center">
              Share your wallet address or scan QR code to receive payments
            </Text>

            <Tabs variant="soft-rounded" colorScheme="blue">
              <TabList bg="muted" p={1} borderRadius="lg">
                <Tab
                  _selected={{ bg: "primary", color: "background" }}
                  _hover={{ bg: "primary", opacity: 0.8 }}
                  fontWeight="bold"
                  fontSize="sm"
                  flex={1}
                  isDisabled={!isConnected}
                >
                  ⚡ Ethereum
                  {!isConnected && (
                    <Badge ml={2} size="sm" colorScheme="red">
                      Not Connected
                    </Badge>
                  )}
                </Tab>
                <Tab
                  _selected={{ bg: "primary", color: "background" }}
                  _hover={{ bg: "primary", opacity: 0.8 }}
                  fontWeight="bold"
                  fontSize="sm"
                  flex={1}
                  isDisabled={!user}
                >
                  🚀 Hive
                  {!user && (
                    <Badge ml={2} size="sm" colorScheme="red">
                      Not Connected
                    </Badge>
                  )}
                </Tab>
              </TabList>

              <TabPanels>
                {/* Ethereum Tab */}
                <TabPanel p={4}>
                  {isConnected && address ? (
                    <VStack spacing={4} align="center">
                      {/* QR Code */}
                      <Box
                        p={4}
                        bg="white"
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="border"
                      >
                        {ethereumQR ? (
                          <Image
                            src={ethereumQR}
                            alt="Ethereum Address QR Code"
                            w="200px"
                            h="200px"
                          />
                        ) : (
                          <Flex
                            w="200px"
                            h="200px"
                            align="center"
                            justify="center"
                            bg="gray.100"
                            borderRadius="md"
                          >
                            <Text color="gray.500">Generating QR...</Text>
                          </Flex>
                        )}
                      </Box>

                      {/* Address Display */}
                      <VStack spacing={2} w="100%">
                        <Text fontSize="sm" color="textSecondary">
                          Ethereum Address:
                        </Text>
                        <HStack
                          w="100%"
                          p={3}
                          bg="muted"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="border"
                          justify="space-between"
                        >
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="xs" color="textSecondary">
                              {shortenAddress(address)}
                            </Text>
                            <Text
                              fontSize="xs"
                              color="textSecondary"
                              opacity={0.7}
                            >
                              {address}
                            </Text>
                          </VStack>
                          <Button
                            size="sm"
                            leftIcon={hasEthCopied ? <FaCheck /> : <FaCopy />}
                            colorScheme={hasEthCopied ? "green" : "blue"}
                            onClick={() => handleCopyAddress("ethereum")}
                          >
                            {hasEthCopied ? "Copied!" : "Copy"}
                          </Button>
                        </HStack>
                      </VStack>

                      {/* Network Info */}
                      <Box
                        w="100%"
                        p={3}
                        bg="rgba(96, 165, 250, 0.1)"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="rgba(96, 165, 250, 0.3)"
                      >
                        <Text fontSize="sm" color="primary" fontWeight="bold">
                          ⚠️ Important:
                        </Text>
                        <Text fontSize="xs" color="textSecondary" mt={1}>
                          This address supports Ethereum and ERC-20 tokens only.
                          Make sure the sender uses the correct network.
                        </Text>
                      </Box>
                    </VStack>
                  ) : (
                    <VStack spacing={4} align="center" py={8}>
                      <Box fontSize="48px">🔗</Box>
                      <Text color="textSecondary" textAlign="center">
                        Connect your Ethereum wallet to receive crypto payments
                      </Text>
                      <Text
                        fontSize="sm"
                        color="textSecondary"
                        textAlign="center"
                      >
                        Click "Connect Wallet" to get started
                      </Text>
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
                        ) : (
                          <Flex
                            w="200px"
                            h="200px"
                            align="center"
                            justify="center"
                            bg="gray.100"
                            borderRadius="md"
                          >
                            <Text color="gray.500">Generating QR...</Text>
                          </Flex>
                        )}
                      </Box>

                      {/* Username Display */}
                      <VStack spacing={2} w="100%">
                        <Text fontSize="sm" color="textSecondary">
                          Hive Username:
                        </Text>
                        <HStack
                          w="100%"
                          p={3}
                          bg="muted"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="border"
                          justify="space-between"
                        >
                          <HStack spacing={2} flex={1}>
                            <Image
                              src="/logos/hive-logo.png"
                              alt="Hive"
                              w="20px"
                              h="20px"
                              fallbackSrc="/logos/default-token.png"
                            />
                            <Text fontSize="md" fontWeight="bold" color="text">
                              @{user}
                            </Text>
                          </HStack>
                          <Button
                            size="sm"
                            leftIcon={hasHiveCopied ? <FaCheck /> : <FaCopy />}
                            colorScheme={hasHiveCopied ? "green" : "blue"}
                            onClick={() => handleCopyAddress("hive")}
                          >
                            {hasHiveCopied ? "Copied!" : "Copy"}
                          </Button>
                        </HStack>
                      </VStack>

                      {/* Supported Tokens */}
                      <Box
                        w="100%"
                        p={3}
                        bg="rgba(34, 197, 94, 0.1)"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="rgba(34, 197, 94, 0.3)"
                      >
                        <Text fontSize="sm" color="green.400" fontWeight="bold">
                          💚 Supported Tokens:
                        </Text>
                        <HStack spacing={2} mt={2} flexWrap="wrap">
                          <Badge colorScheme="green" size="sm">
                            HIVE
                          </Badge>
                          <Badge colorScheme="green" size="sm">
                            HBD
                          </Badge>
                          <Badge colorScheme="green" size="sm">
                            Hive Engine Tokens
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="textSecondary" mt={2}>
                          Send HIVE, HBD, or any Hive Engine token to this
                          username
                        </Text>
                      </Box>
                    </VStack>
                  ) : (
                    <VStack spacing={4} align="center" py={8}>
                      <Box fontSize="48px">🚀</Box>
                      <Text color="textSecondary" textAlign="center">
                        Connect your Hive account to receive HIVE and HBD
                      </Text>
                      <Text
                        fontSize="sm"
                        color="textSecondary"
                        textAlign="center"
                      >
                        Click "Connect Hive" to get started
                      </Text>
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
}
