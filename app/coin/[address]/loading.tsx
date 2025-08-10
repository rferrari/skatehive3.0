import { Container, VStack, Skeleton, SkeletonText } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6}>
        {/* Header skeleton */}
        <Skeleton height="300px" width="100%" borderRadius="lg" />

        {/* Text content skeleton */}
        <SkeletonText noOfLines={3} spacing="4" width="100%" />

        {/* Stats skeleton */}
        <VStack spacing={4} width="100%">
          <Skeleton height="20px" width="60%" />
          <Skeleton height="20px" width="40%" />
          <Skeleton height="20px" width="80%" />
        </VStack>
      </VStack>
    </Container>
  );
}
