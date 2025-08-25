"use client";
import React, { memo, useState, useEffect } from "react";
import { Box, Text, Flex, Tooltip } from "@chakra-ui/react";
import useHivePower from "@/hooks/useHivePower";

interface PowerBarsProps {
  vpPercent: string;
  rcPercent: string;
  username?: string;
  height?: number;
  width?: number;
}

const PowerBars = memo(function PowerBars({
  vpPercent,
  rcPercent,
  username,
  height = 100,
  width = 6,
}: PowerBarsProps) {
  const [voteValue, setVoteValue] = useState<number | null>(null);
  const { estimateVoteValue, isLoading: isHivePowerLoading } = useHivePower(
    username || ""
  );

  // Parse percentage strings to numbers
  const parsePercentage = (percentStr: string): number => {
    const cleaned = percentStr.replace("%", "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
  };

  const vpValue = parsePercentage(vpPercent);
  const rcValue = parsePercentage(rcPercent);

  // Calculate vote value when component mounts or voting power changes
  useEffect(() => {
    if (username && estimateVoteValue && !isHivePowerLoading) {
      // Calculate vote value at 100% voting power
      estimateVoteValue(100)
        .then((value) => setVoteValue(value))
        .catch(() => setVoteValue(null));
    }
  }, [username, estimateVoteValue, isHivePowerLoading, vpValue]);

  // Calculate fill widths (rotated 90 degrees)
  const vpFillWidth = (vpValue / 100) * height;
  const rcFillWidth = (rcValue / 100) * height;

  return (
    <Flex direction="column" align="flex-start" w="100%">
      {/* Voting Power Bar */}
      <Tooltip label={`Voting Power: ${vpPercent}`} placement="top">
        <Box position="relative" cursor="pointer" w="100%" maxW={`${height}px`}>
          <svg
            width="100%"
            height={width}
            viewBox={`0 0 ${height} ${width}`}
            style={{ maxWidth: `${height}px` }}
          >
            {/* Background track */}
            <rect
              x="0"
              y="0"
              width={height}
              height={width}
              rx="4"
              fill="var(--chakra-colors-error)"
              opacity="0.2"
            />
            {/* Fill */}
            <rect
              x="0"
              y="0"
              width={vpFillWidth}
              height={width}
              rx="4"
              fill="var(--chakra-colors-primary)"
              opacity="0.9"
            />
            {/* Vote Value Text */}
            {voteValue !== null && (
              <text
                x={height / 2}
                y={width / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill="white"
                style={{
                  textShadow: "2px 2px 4px rgba(0,0,0,1)",
                  filter: "drop-shadow(2px 2px 3px rgba(0,0,0,1))",
                }}
              >
                {`${voteValue.toFixed(3)}`} USD
              </text>
            )}
          </svg>
        </Box>
      </Tooltip>

      {/* Resource Credits Bar - Commented Out */}
      {/* <Tooltip label={`Resource Credits: ${rcPercent}`} placement="top">
          <Box position="relative" cursor="pointer" minW={`${height}px`} maxW={`${height}px`} w={`${height}px`}>
            <svg width={height} height={width} viewBox={`0 0 ${height} ${width}`}>
              <rect
                x="0"
                y="0"
                width={height}
                height={width}
                rx="4"
                fill="var(--chakra-colors-error)"
                opacity="0.3"
              />
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
        </Tooltip> */}
    </Flex>
  );
});

export default PowerBars;
