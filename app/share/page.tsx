"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Text, VStack, Spinner } from "@chakra-ui/react";

export default function SharePage() {
  const searchParams = useSearchParams();
  const [castData, setCastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get cast data from URL parameters
    const castHash = searchParams.get("castHash");
    const castFid = searchParams.get("castFid");
    const viewerFid = searchParams.get("viewerFid");

    if (castHash && castFid) {
      setCastData({
        hash: castHash,
        authorFid: castFid,
        viewerFid: viewerFid,
      });
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6} maxW="600px" mx="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          Shared Cast
        </Text>

        {castData ? (
          <VStack spacing={2} align="stretch">
            <Text>
              <strong>Cast Hash:</strong> {castData.hash}
            </Text>
            <Text>
              <strong>Author FID:</strong> {castData.authorFid}
            </Text>
            {castData.viewerFid && (
              <Text>
                <strong>Shared by FID:</strong> {castData.viewerFid}
              </Text>
            )}

            {/* Add your cast display logic here */}
            <Text color="gray.500" mt={4}>
              Cast content would be displayed here based on the hash and FID.
            </Text>
          </VStack>
        ) : (
          <Text color="red.500">
            No cast data found. This page is meant to be accessed via cast
            sharing.
          </Text>
        )}
      </VStack>
    </Box>
  );
}
