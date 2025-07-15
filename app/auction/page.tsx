'use client';

import AuctionCard from '@/components/AuctionCard';
import { DAO_ADDRESSES } from '@/lib/utils/constants';
import { 
  Box, 
  Container, 
  VStack, 
  HStack,
  Text, 
  Heading,
  Grid,
  GridItem,
  List,
  ListItem,
  ListIcon,
  Badge,
  Flex
} from '@chakra-ui/react';
import { CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';

export default function AuctionPage() {
  return (
    <Box bg="background" minH="100vh" py={8}>
      <Container maxW="6xl">
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              color="primary" 
              fontFamily="heading"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Skatehive Auction
            </Heading>
            <Text 
              fontSize="lg" 
              color="text" 
              maxW="2xl"
              lineHeight="tall"
            >
              Participate in our daily auctions to collect unique skateboarding NFTs. 
              Each auction runs for 24 hours and features exclusive digital collectibles.
            </Text>
          </VStack>

          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8} w="full">
            {/* Main Auction Card */}
            <GridItem>
              <AuctionCard tokenAddress={DAO_ADDRESSES.token} />
            </GridItem>

            {/* Auction Info Sidebar */}
            <GridItem>
              <VStack spacing={6}>
                <Box 
                  bg="secondary" 
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="border" 
                  p={6}
                  w="full"
                >
                  <Heading size="md" color="text" mb={4}>
                    How it works
                  </Heading>
                  <List spacing={3}>
                    <ListItem display="flex" alignItems="start">
                      <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                      <Text fontSize="sm" color="text">
                        Connect your wallet to participate in the auction
                      </Text>
                    </ListItem>
                    <ListItem display="flex" alignItems="start">
                      <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                      <Text fontSize="sm" color="text">
                        Place a bid higher than the current highest bid
                      </Text>
                    </ListItem>
                    <ListItem display="flex" alignItems="start">
                      <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                      <Text fontSize="sm" color="text">
                        If you&apos;re the highest bidder when the auction ends, you win!
                      </Text>
                    </ListItem>
                    <ListItem display="flex" alignItems="start">
                      <ListIcon as={CheckCircleIcon} color="primary" mt={1} />
                      <Text fontSize="sm" color="text">
                        Settle the auction to claim your NFT and start the next one
                      </Text>
                    </ListItem>
                  </List>
                </Box>

                <Box 
                  bg="secondary" 
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="border" 
                  p={6}
                  w="full"
                >
                  <Heading size="md" color="text" mb={4}>
                    Auction Rules
                  </Heading>
                  <VStack spacing={3}>
                    <Flex justify="space-between" w="full">
                      <Text fontSize="sm" color="text">Auction Duration:</Text>
                      <Badge colorScheme="green" variant="outline">24 hours</Badge>
                    </Flex>
                    <Flex justify="space-between" w="full">
                      <Text fontSize="sm" color="text">Minimum Increment:</Text>
                      <Badge colorScheme="green" variant="outline">2%</Badge>
                    </Flex>
                    <Flex justify="space-between" w="full">
                      <Text fontSize="sm" color="text">Settlement:</Text>
                      <Badge colorScheme="green" variant="outline">Manual</Badge>
                    </Flex>
                  </VStack>
                </Box>

                <Box 
                  bg="rgba(168, 255, 96, 0.1)" 
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="primary" 
                  p={6}
                  w="full"
                >
                  <HStack spacing={2} mb={2}>
                    <InfoIcon color="primary" />
                    <Heading size="md" color="primary">
                      Pro Tips
                    </Heading>
                  </HStack>
                  <List spacing={2}>
                    <ListItem>
                      <Text fontSize="sm" color="text">
                        • Bids in the last 10 minutes extend the auction
                      </Text>
                    </ListItem>
                    <ListItem>
                      <Text fontSize="sm" color="text">
                        • Higher gas fees = faster transaction confirmation
                      </Text>
                    </ListItem>
                    <ListItem>
                      <Text fontSize="sm" color="text">
                        • Check the transaction on Basescan for updates
                      </Text>
                    </ListItem>
                    <ListItem>
                      <Text fontSize="sm" color="text">
                        • Join our Discord for auction notifications
                      </Text>
                    </ListItem>
                  </List>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}
