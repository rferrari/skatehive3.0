import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} textAlign="center">
        <VStack spacing={4}>
          <Heading size="2xl" color="gray.600">
            404
          </Heading>
          <Heading size="lg">Coin Not Found</Heading>
        </VStack>

        <Alert status="warning" maxW="md">
          <AlertIcon />
          <VStack spacing={2} textAlign="left">
            <Text fontWeight="bold">This coin could not be found</Text>
            <Text fontSize="sm">
              Please check that the contract address is correct and that the
              coin exists on the Base network.
            </Text>
          </VStack>
        </Alert>

        <VStack spacing={4}>
          <Text color="gray.600">
            The coin you&apos;re looking for might have been removed or the
            address might be incorrect.
          </Text>

          <Button as={Link} href="/" colorScheme="blue" size="lg">
            Go Back Home
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}
