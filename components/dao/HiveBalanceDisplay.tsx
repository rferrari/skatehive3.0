"use client";

import { Box, VStack, HStack, Text, Divider } from "@chakra-ui/react";
import {
  formatCurrency,
  formatLargeNumber,
  parseHiveAmount,
  getHivePowerBreakdown,
} from "@/lib/utils/daoUtils";

interface HiveBalanceDisplayProps {
  account: any;
  hivePrice: number;
  hbdPrice: number;
  globalProps?: any;
}

export const HiveBalanceDisplay = ({
  account,
  hivePrice,
  hbdPrice,
  globalProps,
}: HiveBalanceDisplayProps) => {
  if (!account) {
    return (
      <Text color={"primary"} fontWeight="bold" fontSize="lg">
        No data
      </Text>
    );
  }

  // Liquid HIVE
  const balance = parseHiveAmount(account.balance);

  // HBD balances (liquid + savings)
  const hbd = parseHiveAmount(account.hbd_balance);
  const hbdSavings = parseHiveAmount(account.savings_hbd_balance);

  // Get HP breakdown
  const { ownedHP, receivedHP, delegatedHP, effectiveHP, totalInfluenceHP } =
    getHivePowerBreakdown(account, globalProps);

  const totalHbd = hbd + hbdSavings;

  // Calculate USD value using all owned assets (including delegated HP, since it's still owned)
  const totalUsdValue =
    (balance + ownedHP) * (hivePrice || 0.21) + totalHbd * (hbdPrice || 1.0);

  // Create array of token displays for non-zero balances
  const tokens = [];

  if (balance > 0.001) {
    tokens.push(
      <HStack
        key="hive"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="orange.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HIVE
          </Text>
        </HStack>
        <Text color={"primary"} fontWeight="semibold" fontSize="sm">
          {balance.toFixed(3)}
        </Text>
      </HStack>
    );
  }

  // Show staked HP (total owned before delegations)
  if (ownedHP > 0.001) {
    tokens.push(
      <HStack
        key="hp-staked"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="red.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HP (Staked)
          </Text>
        </HStack>
        <Text color={"primary"} fontWeight="semibold" fontSize="sm">
          {formatLargeNumber(ownedHP)}
        </Text>
      </HStack>
    );
  }

  // Show delegated out HP if any
  if (delegatedHP > 0.001) {
    tokens.push(
      <HStack
        key="hp-delegated"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="orange.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HP (Delegated Out)
          </Text>
        </HStack>
        <Text color={"orange.300"} fontWeight="semibold" fontSize="sm">
          -{formatLargeNumber(delegatedHP)}
        </Text>
      </HStack>
    );
  }

  // Show effective HP (owned - delegated out) only if different from staked
  if (effectiveHP !== ownedHP && effectiveHP > 0.001) {
    tokens.push(
      <HStack
        key="hp-owned"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="cyan.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HP (Usable)
          </Text>
        </HStack>
        <Text color={"cyan.300"} fontWeight="semibold" fontSize="sm">
          {formatLargeNumber(effectiveHP)}
        </Text>
      </HStack>
    );
  }

  // Show received delegations if any
  if (receivedHP > 0.001) {
    tokens.push(
      <HStack
        key="hp-received"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="purple.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HP (Received)
          </Text>
        </HStack>
        <Text color={"purple.300"} fontWeight="semibold" fontSize="sm">
          {formatLargeNumber(receivedHP)}
        </Text>
      </HStack>
    );
  }

  // Show total influence if different from owned
  if (totalInfluenceHP !== effectiveHP && totalInfluenceHP > 0.001) {
    tokens.push(
      <HStack
        key="hp-total"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="yellow.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HP (Total Influence)
          </Text>
        </HStack>
        <Text color={"yellow.300"} fontWeight="semibold" fontSize="sm">
          {formatLargeNumber(totalInfluenceHP)}
        </Text>
      </HStack>
    );
  }

  if (hbd > 0.001) {
    tokens.push(
      <HStack
        key="hbd"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="green.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HBD
          </Text>
        </HStack>
        <Text color={"primary"} fontWeight="semibold" fontSize="sm">
          {hbd.toFixed(3)}
        </Text>
      </HStack>
    );
  }

  if (hbdSavings > 0.001) {
    tokens.push(
      <HStack
        key="savings"
        spacing={2}
        justify="space-between"
        w="full"
        minH="20px"
      >
        <HStack spacing={2}>
          <Box w={1.5} h={1.5} bg="blue.400" borderRadius="full" />
          <Text color={"accent"} fontSize="xs" fontWeight="medium">
            HBD Savings
          </Text>
        </HStack>
        <Text color={"primary"} fontWeight="semibold" fontSize="sm">
          {hbdSavings.toFixed(3)}
        </Text>
      </HStack>
    );
  }

  return (
    <Box w="full" minW="280px" maxW="400px">
      <VStack spacing={1.5} align="stretch">
        {tokens}
      </VStack>
      {tokens.length > 0 && (
        <>
          <Divider borderColor={"accent"} opacity={0.4} my={2} />
          <HStack justify="space-between" w="full">
            <Text color={"accent"} fontSize="md" fontWeight="semibold">
              Total USD
            </Text>
            <Text
              color={"accent"}
              fontSize="xl"
              fontWeight="bold"
              textShadow="0 0 8px rgba(255, 165, 0, 0.3)"
            >
              {formatCurrency(totalUsdValue)}
            </Text>
          </HStack>
        </>
      )}
    </Box>
  );
};
