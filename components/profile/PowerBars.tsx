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
  width = 6 
}: PowerBarsProps) {
  // Parse percentage strings to numbers
  const parsePercentage = (percentStr: string): number => {
    const cleaned = percentStr.replace('%', '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
  };

  const vpValue = parsePercentage(vpPercent);
  const rcValue = parsePercentage(rcPercent);

  // Calculate fill widths (rotated 90 degrees)
  const vpFillWidth = (vpValue / 100) * height;
  const rcFillWidth = (rcValue / 100) * height;

  return (
    <Flex direction="column" align="center" gap={3} minW="fit-content" maxW="fit-content">
      {/* Bars Container */}
      <Flex direction="column" gap={3} align="center" minW="fit-content" maxW="fit-content">
        {/* Voting Power Bar */}
        <Tooltip label={`Voting Power: ${vpPercent}`} placement="top">
          <Box position="relative" cursor="pointer" minW={`${height}px`} maxW={`${height}px`} w={`${height}px`}>
            <svg width={height} height={width} viewBox={`0 0 ${height} ${width}`}>
              {/* Background track */}
              <rect
                x="0"
                y="0"
                width={height}
                height={width}
                rx="4"
                fill="var(--chakra-colors-error)"
                opacity="0.3"
              />
              {/* Fill */}
              <rect
                x="0"
                y="0"
                width={vpFillWidth}
                height={width}
                rx="4"
                fill="var(--chakra-colors-primary)"
                opacity="0.8"
              />
            </svg>

          </Box>
        </Tooltip>

        {/* Resource Credits Bar */}
        <Tooltip label={`Resource Credits: ${rcPercent}`} placement="top">
          <Box position="relative" cursor="pointer" minW={`${height}px`} maxW={`${height}px`} w={`${height}px`}>
            <svg width={height} height={width} viewBox={`0 0 ${height} ${width}`}>
              {/* Background track */}
              <rect
                x="0"
                y="0"
                width={height}
                height={width}
                rx="4"
                fill="var(--chakra-colors-error)"
                opacity="0.3"
              />
              {/* Fill */}
              <rect
                x="0"
                y="0"
                width={rcFillWidth}
                height={width}
                rx="4"
                fill="var(--chakra-colors-accent)"
                opacity="0.8"
              />
            </svg>

          </Box>
        </Tooltip>
      </Flex>
    </Flex>
  );
} 