"use client";
import React, { memo } from "react";
import { Box, Text, Flex, Tooltip, useToken } from "@chakra-ui/react";

interface PowerBarsProps {
  vpPercent: string;
  rcPercent: string;
  barHeight?: number; // bar thickness
  barWidth?: number;  // bar length
  totalHeight?: number; // match avatar size (component height)
}

const PowerBars = memo(function PowerBars({
  vpPercent,
  rcPercent,
  barHeight = 10,
  barWidth = 100,
  totalHeight = 100 // match Avatar boxSize
}: PowerBarsProps) {
  const [primary, accent, error] = useToken("colors", ["primary", "accent", "error"]);

  const parsePercentage = (percentStr: string): number => {
    const cleaned = percentStr.replace("%", "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
  };

  const vpValue = parsePercentage(vpPercent);
  const rcValue = parsePercentage(rcPercent);

  return (
    <Flex
      direction="column"
      justify="center"
      h={`${totalHeight}px`}
      gap={8} // space between VP and RC rows
    >
      {/* VP Row */}
      <Flex align="center" gap={6} w={`${barWidth + 40}px`}>
        <Text fontSize="xs" color="primary" fontWeight="bold" w="24px" textAlign="right">
          VP
        </Text>
        <Tooltip label={`Voting Power: ${vpPercent}`} placement="top">
          <Box
            position="relative"
            flex="1"
            h={`${barHeight}px`}
            borderRadius="full"
            bg={`${error}33`}
            overflow="hidden"
          >
            <Box
              position="absolute"
              left="0"
              top="0"
              h="100%"
              w={`${vpValue}%`}
              bg={primary}
              borderRadius="full"
              transition="width 0.4s ease"
            />
          </Box>
        </Tooltip>
      </Flex>

      {/* RC Row */}
      <Flex align="center" gap={6} w={`${barWidth + 40}px`}>
        <Text fontSize="xs" color="accent" fontWeight="bold" w="24px" textAlign="right">
          RC
        </Text>
        <Tooltip label={`Resource Credits: ${rcPercent}`} placement="top">
          <Box
            position="relative"
            flex="1"
            h={`${barHeight}px`}
            borderRadius="full"
            bg={`${error}33`}
            overflow="hidden"
          >
            <Box
              position="absolute"
              left="0"
              top="0"
              h="100%"
              w={`${rcValue}%`}
              bg={accent}
              borderRadius="full"
              transition="width 0.4s ease"
            />
          </Box>
        </Tooltip>
      </Flex>
    </Flex>
  );
});

export default PowerBars;
