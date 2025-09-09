"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { MdFullscreen, MdRefresh } from "react-icons/md";

export default function GameClientPage() {
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const toggleModalFullscreen = useCallback(() => {
    setIsModalFullscreen((prev) => !prev);
  }, [setIsModalFullscreen]);

  const refreshGame = useCallback(() => {
    setGameKey((prev) => prev + 1);
  }, []);

  const bgColor = useColorModeValue("gray.900", "gray.900");

  useEffect(() => {
    // Prevent page scrolling
    document.body.style.overflow = "hidden";

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent arrow keys and WASD from scrolling the page
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          "W",
          "A",
          "S",
          "D",
        ].includes(event.key)
      ) {
        event.preventDefault();
      }

      // F key for fullscreen toggle
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleModalFullscreen();
      }
      // Escape key to exit fullscreen
      if (event.key === "Escape" && isModalFullscreen) {
        event.preventDefault();
        setIsModalFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      // Restore scrolling when component unmounts
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isModalFullscreen, toggleModalFullscreen]);

  return (
    <>
      <style jsx global>{`
        iframe {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        iframe::-webkit-scrollbar {
          display: none !important;
        }
        iframe::-webkit-scrollbar-track {
          display: none !important;
        }
        iframe::-webkit-scrollbar-thumb {
          display: none !important;
        }
      `}</style>
      <Box
        minH="100vh"
        h="100vh"
        bg={bgColor}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        p={0}
      >
        {/* Game Container - Responsive */}
        <Box
          flex="1"
          w="100%"
          h="100%"
          overflow="hidden"
          position="relative"
        >
          {!isModalFullscreen && (
            <Box
              key={gameKey}
              as="iframe"
              src="https://quest-for-stoken.vercel.app/"
              w="100%"
              h="100%"
              border="none"
              title="SkateHive Game"
              allow="fullscreen; autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              objectFit="contain"
              sx={{
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                '&::-webkit-scrollbar-track': {
                  display: 'none'
                },
                '&::-webkit-scrollbar-thumb': {
                  display: 'none'
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                overflow: 'hidden'
              }}
            />
          )}
          {isModalFullscreen && (
            <Box
              w="100%"
              h="100%"
              bg="gray.800"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="gray.400"
              fontSize="lg"
            >
              Game is playing in fullscreen mode
            </Box>
          )}
        </Box>

        {/* Control Panel - Simplified */}
        <Box
          bg="gray.800"
          p={4}
          flexShrink={0}
          borderTop="1px solid"
          borderColor="gray.600"
        >
          <HStack justifyContent="center" alignItems="center" spacing={4}>
            <Button
              colorScheme="blue"
              size="lg"
              leftIcon={<Icon as={MdFullscreen} />}
              onClick={toggleModalFullscreen}
              fontWeight="bold"
            >
              {isModalFullscreen ? "EXIT" : "FULLSCREEN"}
            </Button>
            <Button
              colorScheme="blue"
              size="lg"
              leftIcon={<Icon as={MdRefresh} />}
              onClick={refreshGame}
              fontWeight="bold"
            >
              REFRESH
            </Button>
          </HStack>
        </Box>
      </Box>

      {/* Modal Fullscreen */}
      <Modal
        isOpen={isModalFullscreen}
        onClose={() => setIsModalFullscreen(false)}
        size="full"
        closeOnOverlayClick={false}
        motionPreset="none"
      >
        <ModalOverlay />
        <ModalContent
          bg="background"
          m={0}
          borderRadius={0}
          maxW="100vw"
          maxH="100vh"
          h="100vh"
          w="100vw"
          overflow="hidden"
        >
          <ModalCloseButton
            size="lg"
            color="white"
            bg="red.600"
            _hover={{ bg: "red.500" }}
            _active={{ bg: "red.700" }}
            borderRadius="lg"
            zIndex={10001}
            top={4}
            right={4}
            title="Exit Fullscreen (ESC)"
            boxShadow="xl"
            position="fixed"
          />
          <ModalBody
            p={0}
            h="100vh"
            w="100vw"
            position="relative"
            overflow="hidden"
          >
            <Box
              key={gameKey}
              as="iframe"
              src="https://html5-game-skatehive.vercel.app/QFShive/index.html"
              w="100%"
              h="100%"
              border="none"
              title="SkateHive Game - Fullscreen"
              allow="fullscreen; autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              sx={{
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                '&::-webkit-scrollbar-track': {
                  display: 'none'
                },
                '&::-webkit-scrollbar-thumb': {
                  display: 'none'
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                overflow: 'hidden'
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
