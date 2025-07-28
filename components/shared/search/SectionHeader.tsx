"use client";

import React from "react";
import { Box, HStack, Text, Icon } from "@chakra-ui/react";

interface SectionHeaderProps {
  icon: any;
  title: string;
}

export default function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <Box px={4} py={2} borderTop="1px solid" borderColor="secondary">
      <HStack spacing={2}>
        <Icon as={icon} color="secondary" boxSize={3} />
        <Text
          fontSize="xs"
          color="secondary"
          fontWeight="semibold"
          textTransform="uppercase"
        >
          {title}
        </Text>
      </HStack>
    </Box>
  );
}
