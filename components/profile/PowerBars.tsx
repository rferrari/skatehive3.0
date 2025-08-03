"use client";
import React from "react";
import { Box, Text, Flex, Tooltip } from "@chakra-ui/react";

interface PowerBarsProps {
  vpPercent: string;
  rcPercent: string;
  height?: number;
  width?: number;
}

export default function PowerBars({ 
  vpPercent, 
  rcPercent, 
  height = 100, 
  width = 10 
}: PowerBarsProps) {
  // Parse percentage strings to numbers
  const parsePercentage = (percentStr: string): number => {
    const cleaned = percentStr.replace('%', '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
  };

  const vpValue = parsePercentage(vpPercent);
  const rcValue = parsePercentage(rcPercent);

  // Calculate fill heights
  const vpFillHeight = (vpValue / 100) * height;
  const rcFillHeight = (rcValue / 100) * height;

  return (
    <Flex direction="column" align="center" gap={2}>
      {/* Bars Container */}
      <Flex gap={3} align="flex-end">
        {/* Voting Power Bar */}
        <Tooltip label={`Voting Power: ${vpPercent}`} placement="top">
          <Box position="relative" cursor="pointer">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* Background track */}
              <rect
                x="0"
                y="0"
                width={width}
                height={height}
                rx="4"
                fill="var(--chakra-colors-muted)"
                opacity="0.3"
              />
              {/* Fill */}
              <rect
                x="0"
                y={height - vpFillHeight}
                width={width}
                height={vpFillHeight}
                rx="4"
                fill="var(--chakra-colors-primary)"
                opacity="0.8"
              />
            </svg>
            <Text
              fontSize="xs"
              color="text"
              textAlign="center"
              mt={1}
              fontWeight="medium"
            >
              VP
            </Text>
          </Box>
        </Tooltip>

        {/* Resource Credits Bar */}
        <Tooltip label={`Resource Credits: ${rcPercent}`} placement="top">
          <Box position="relative" cursor="pointer">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* Background track */}
              <rect
                x="0"
                y="0"
                width={width}
                height={height}
                rx="4"
                fill="var(--chakra-colors-muted)"
                opacity="0.3"
              />
              {/* Fill */}
              <rect
                x="0"
                y={height - rcFillHeight}
                width={width}
                height={rcFillHeight}
                rx="4"
                fill="var(--chakra-colors-accent)"
                opacity="0.8"
              />
            </svg>
            <Text
              fontSize="xs"
              color="text"
              textAlign="center"
              mt={1}
              fontWeight="medium"
            >
              RC
            </Text>
          </Box>
        </Tooltip>
      </Flex>
    </Flex>
  );
} 