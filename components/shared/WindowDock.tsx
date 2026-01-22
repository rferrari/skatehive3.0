"use client";

import React from "react";
import { Box, VStack, HStack, Text, IconButton } from "@chakra-ui/react";
import { FiMaximize2 } from "react-icons/fi";
import { useWindow } from "@/contexts/WindowContext";

export default function WindowDock() {
  const { windows, restoreWindow } = useWindow();

  const minimizedWindows = windows.filter((w) => w.isMinimized);

  if (minimizedWindows.length === 0) return null;

  return (
    <VStack
      position="fixed"
      bottom={4}
      right={4}
      zIndex={9999}
      spacing={2}
      align="stretch"
    >
      {minimizedWindows.map((window) => (
        <HStack
          key={window.id}
          bg="panel"
          borderRadius="md"
          border="1px solid"
          borderColor="border"
          px={3}
          py={1.5}
          boxShadow="lg"
          cursor="pointer"
          onClick={() => restoreWindow(window.id)}
          _hover={{ bg: "muted", borderColor: "primary" }}
          transition="all 0.2s"
          minW="200px"
          maxW="300px"
        >
          <HStack spacing={1} flex={1}>
            <Box w={2} h={2} borderRadius="full" bg="yellow.500" />
            <Box w={2} h={2} borderRadius="full" bg="green.500" />
            <Text
              fontSize="xs"
              fontFamily="mono"
              color="text"
              noOfLines={1}
              flex={1}
            >
              {window.title}
            </Text>
          </HStack>
          <IconButton
            aria-label="Restore"
            icon={<FiMaximize2 />}
            size="xs"
            variant="ghost"
            minW="auto"
            h="auto"
            p={1}
            color="text"
            _hover={{ color: "primary" }}
            onClick={(e) => {
              e.stopPropagation();
              restoreWindow(window.id);
            }}
          />
        </HStack>
      ))}
    </VStack>
  );
}
