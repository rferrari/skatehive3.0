"use client";

import React from "react";
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  VStack,
  HStack,
  Input,
  Text,
  Avatar,
} from "@chakra-ui/react";
import { CoinData } from "@/types/coin";

interface CoinTabsProps {
  coinData: CoinData;
}

export const CoinTabs: React.FC<CoinTabsProps> = ({ coinData }) => {
  return (
    <Box
      w="100%"
      borderTop="1px solid"
      borderColor="gray.700"
      flex={{ base: "none", lg: "1" }}
      maxH={{ base: "400px", lg: "none" }}
      overflowY={{ base: "auto", lg: "visible" }}
    >
      <Tabs
        variant="enclosed"
        colorScheme="gray"
        size={{ base: "md", lg: "sm" }}
      >
        <TabList bg="transparent" borderBottom="none">
          <Tab
            color="gray.400"
            fontSize={{ base: "sm", lg: "xs" }}
            _selected={{ color: "white", borderColor: "gray.600" }}
          >
            Comments
            <Badge ml={2} fontSize="xs" bg="gray.700" color="gray.300">
              1
            </Badge>
          </Tab>
          <Tab
            color="gray.400"
            fontSize={{ base: "sm", lg: "xs" }}
            _selected={{ color: "white", borderColor: "gray.600" }}
          >
            Holders
            <Badge ml={2} fontSize="xs" bg="gray.700" color="gray.300">
              3
            </Badge>
          </Tab>
          <Tab
            color="gray.400"
            fontSize={{ base: "sm", lg: "xs" }}
            _selected={{ color: "white", borderColor: "gray.600" }}
          >
            Details
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={{ base: 3, md: 4 }}>
            <VStack spacing={3} align="stretch">
              <Box>
                <Input
                  placeholder="Add a comment..."
                  bg="gray.800"
                  border="none"
                  color="white"
                  size={{ base: "md", lg: "sm" }}
                  h={{ base: "44px", lg: "36px" }}
                  _placeholder={{ color: "gray.500" }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Become a holder to unlock 🔒
                </Text>
              </Box>

              {/* Sample Comment */}
              <HStack align="start" spacing={3}>
                <Avatar size="sm" name="User" />
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Text fontSize="sm" fontWeight="bold">
                      eyeseeyou47
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      8d
                    </Text>
                  </HStack>
                  <Text fontSize="sm">This is such a great shot</Text>
                  <Text fontSize="xs" color="gray.500" cursor="pointer">
                    Reply
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </TabPanel>

          <TabPanel p={{ base: 3, md: 4 }}>
            <VStack spacing={3} align="stretch">
              {/* Holders List */}
              <HStack
                justify="space-between"
                flexWrap={{ base: "wrap", md: "nowrap" }}
              >
                <HStack minW={{ base: "60%", md: "auto" }}>
                  <Text fontSize={{ base: "md", md: "lg" }}>1</Text>
                  <Avatar size={{ base: "sm", md: "sm" }} name="Market" />
                  <Text fontSize={{ base: "sm", md: "sm" }}>Market</Text>
                </HStack>
                <Badge colorScheme="blue" fontSize={{ base: "xs", md: "sm" }}>
                  98.864%
                </Badge>
              </HStack>

              <HStack
                justify="space-between"
                flexWrap={{ base: "wrap", md: "nowrap" }}
              >
                <HStack minW={{ base: "60%", md: "auto" }}>
                  <Text fontSize={{ base: "md", md: "lg" }}>2</Text>
                  <Avatar size={{ base: "sm", md: "sm" }} name="skatehacker" />
                  <Text fontSize={{ base: "sm", md: "sm" }}>
                    skatehacker (creator)
                  </Text>
                </HStack>
                <Badge colorScheme="blue" fontSize={{ base: "xs", md: "sm" }}>
                  1%
                </Badge>
              </HStack>

              <HStack
                justify="space-between"
                flexWrap={{ base: "wrap", md: "nowrap" }}
              >
                <HStack minW={{ base: "60%", md: "auto" }}>
                  <Text fontSize={{ base: "md", md: "lg" }}>3</Text>
                  <Avatar size={{ base: "sm", md: "sm" }} name="r4to" />
                  <Text fontSize={{ base: "sm", md: "sm" }}>r4to ⚡</Text>
                </HStack>
                <Badge colorScheme="blue" fontSize={{ base: "xs", md: "sm" }}>
                  0.136%
                </Badge>
              </HStack>
            </VStack>
          </TabPanel>

          <TabPanel p={{ base: 3, md: 4 }}>
            <VStack align="start" spacing={3}>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Contract Address
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="blue.400">
                  {coinData.address}
                </Text>
              </Box>

              {coinData.creatorAddress && (
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>
                    Creator
                  </Text>
                  <Text fontSize="xs" fontFamily="mono" color="blue.400">
                    {coinData.creatorAddress}
                  </Text>
                </Box>
              )}

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Chain
                </Text>
                <Badge colorScheme="blue" size="sm">
                  Base
                </Badge>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
