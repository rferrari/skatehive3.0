"use client";

import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  Kbd,
  Icon,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdFullscreen, MdClose } from "react-icons/md";

export default function GameClientPage() {
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);

  const toggleModalFullscreen = () => {
    setIsModalFullscreen(!isModalFullscreen);
  };

  const bgColor = useColorModeValue("gray.900", "gray.900");
  const textColor = useColorModeValue("white", "white");

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // F key for fullscreen toggle
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        event.stopPropagation();
        toggleModalFullscreen();
      }
      // Escape key to exit fullscreen
      if (event.key === "Escape" && isModalFullscreen) {
        event.preventDefault();
        event.stopPropagation();
        setIsModalFullscreen(false);
      }
    };

    // Add listeners to both document and window to catch events even from iframe
    document.addEventListener("keydown", handleKeyPress, true);
    window.addEventListener("keydown", handleKeyPress, true);

    // Also add a message listener for iframe communication
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "toggleFullscreen") {
        toggleModalFullscreen();
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("keydown", handleKeyPress, true);
      window.removeEventListener("keydown", handleKeyPress, true);
      window.removeEventListener("message", handleMessage);
    };
  }, [isModalFullscreen]);

  return (
    <>
      <Box minH="100vh" bg={bgColor} display="flex" flexDirection="column">
        <Box flex={1} p={4}>
          <Box maxW="7xl" mx="auto">
            <Heading
              as="h1"
              size="xl"
              color={textColor}
              mb={6}
              textAlign="center"
            >
              Quest for Skateboard
            </Heading>

            <Box
              bg="black"
              borderRadius="lg"
              overflow="hidden"
              shadow="2xl"
              position="relative"
            >
              {/* Fullscreen Button - Chakra UI */}
              <Button
                position="absolute"
                top={2}
                right={2}
                zIndex={9999}
                colorScheme="yellow"
                variant="solid"
                size="lg"
                onClick={toggleModalFullscreen}
                leftIcon={<Icon as={MdFullscreen} boxSize={6} />}
                animation="pulse 2s infinite"
                border="4px solid"
                borderColor="yellow.300"
                shadow="2xl"
                fontWeight="bold"
                fontSize="lg"
                px={6}
                py={3}
                borderRadius="xl"
                _hover={{
                  bg: "yellow.400",
                  transform: "scale(1.05)",
                }}
                title="Click for Fullscreen!"
              >
                FULLSCREEN
              </Button>

              <Box
                as="iframe"
                src="https://html5-game-skatehive.vercel.app/QFShive/index.html"
                w="full"
                h="800px"
                border="none"
                title="SkateHive Game"
                allow="fullscreen; autoplay; encrypted-media"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              />
            </Box>

            <VStack mt={4} spacing={2}>
              <Text color="gray.400" fontSize="sm" textAlign="center">
                Use arrow keys or WASD to control your skater.
              </Text>
              <HStack spacing={2} align="center">
                <Text color="yellow.400" fontWeight="bold" fontSize="sm">
                  Click the yellow
                </Text>
                <Button size="xs" colorScheme="yellow" variant="solid">
                  FULLSCREEN
                </Button>
                <Text color="yellow.400" fontWeight="bold" fontSize="sm">
                  button above for the best experience!
                </Text>
              </HStack>
            </VStack>
          </Box>
        </Box>
      </Box>

      {/* Modal Fullscreen - Chakra UI Modal */}
      <Modal
        isOpen={isModalFullscreen}
        onClose={() => setIsModalFullscreen(false)}
        size="full"
        motionPreset="slideInBottom"
        closeOnOverlayClick={false}
        closeOnEsc={true}
      >
        <ModalOverlay bg="black" />
        <ModalContent
          bg="background"
          m={0}
          borderRadius={0}
          maxW="100vw"
          maxH="100vh"
          overflow="hidden"
        >
          {/* Close Button - Chakra UI */}
          <Button
            position="fixed"
            top={4}
            left={4}
            zIndex={10000}
            colorScheme="red"
            variant="solid"
            leftIcon={<Icon as={MdClose} boxSize={5} />}
            onClick={() => setIsModalFullscreen(false)}
            shadow="xl"
            fontWeight="bold"
            fontSize="sm"
            border="2px solid"
            borderColor="red.400"
            _hover={{
              bg: "red.500",
              transform: "scale(1.05)",
            }}
            title="Exit Fullscreen (ESC)"
          >
            CLOSE
          </Button>

          {/* Fullscreen Game */}
          <Box
            as="iframe"
            src="https://html5-game-skatehive.vercel.app/QFShive/index.html"
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            border="none"
            title="SkateHive Game - Fullscreen"
            allow="fullscreen; autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        </ModalContent>
      </Modal>
    </>
  );
}
