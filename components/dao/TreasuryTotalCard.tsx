"use client";

import { VStack, Text, Card, CardBody } from "@chakra-ui/react";
import { formatCurrency } from "@/lib/utils/daoUtils";

interface TreasuryTotalCardProps {
  totalValue: number;
}

export const TreasuryTotalCard = ({ totalValue }: TreasuryTotalCardProps) => {
  return (
    <Card
      bg={"background"}
      borderColor={"primary"}
      w="full"
      maxW="lg"
      borderWidth={2}
      boxShadow="0 0 20px rgba(255, 165, 0, 0.3)"
      _hover={{
        boxShadow: "0 0 30px rgba(255, 165, 0, 0.5)",
        transform: "translateY(-2px)",
      }}
      transition="all 0.3s ease"
    >
      <CardBody py={8} px={8}>
        <VStack spacing={4}>
          <Text
            color={"accent"}
            fontSize="md"
            textTransform="uppercase"
            letterSpacing="widest"
            fontWeight="medium"
          >
            Total Treasury Value
          </Text>
          <Text
            color={"primary"}
            fontSize="42px"
            fontWeight="bold"
            lineHeight="1"
            bgGradient="linear(to-r, #FFA500, #FF6B35)"
            bgClip="text"
            textShadow="0 0 10px rgba(255, 165, 0, 0.3)"
          >
            {formatCurrency(totalValue)}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
};
