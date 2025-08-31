"use client";

import { Box, Container, Heading, VStack } from "@chakra-ui/react";
import DualBalanceDemo from "@/components/demo/DualBalanceDemo";

export default function DualBalanceTestPage() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={4}>
            Dual Balance System Test
          </Heading>
          <p>
            Test the new dual balance system that shows both external wallet
            balances and Zora internal balances for ETH and USDC.
          </p>
        </Box>

        <DualBalanceDemo />
      </VStack>
    </Container>
  );
}
