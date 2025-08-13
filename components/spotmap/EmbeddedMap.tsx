"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
// import { Global } from "@emotion/react";
import SpotSnapComposer from "@/components/spotmap/SpotSnapComposer";
import SpotList from "@/components/spotmap/SpotList";
import { useSkatespots } from "@/hooks/useSkatespots";
import { Discussion } from "@hiveio/dhive";
// import { useAioha } from "@aioha/react-ui";

const mapSrc =
  "https://www.google.com/maps/d/u/1/embed?mid=1iiXzotKL-uJ3l7USddpTDvadGII&hl=en&ll=29.208380630280647%2C-100.5437214508988&z=4";

export default function EmbeddedMap() {
  const boxWidth = useBreakpointValue({
    base: "90%",
    sm: "80%",
    md: "75%",
    lg: "100%",
  });
  const paddingX = useBreakpointValue({ base: 2, sm: 4, md: 6 });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [newSpot, setNewSpot] = useState<Discussion | null>(null);
  const [composerKey, setComposerKey] = useState<number>(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  // const { user } = useAioha();


  // Responsive values
  const headerFontSize = useBreakpointValue({
    base: "2xl",
    md: "4xl",
    lg: "6xl",
  });
  const tableHeight = useBreakpointValue({
    base: "calc(100vh - 200px)",
    md: "calc(100vh - 180px)",
  });
  const containerPadding = useBreakpointValue({ base: 2, md: 4 });

  const {
    spots: allSpots,
    isLoading,
    hasMore,
    loadNextPage,
    error,
    refresh,
  } = useSkatespots();

  useEffect(() => {
    if (typeof window !== "undefined") {
    }
  }, [newSpot]);

  const handleNewSpot = (newComment: Partial<Discussion>) => {
    if (typeof window !== "undefined") {
    }
    setNewSpot(newComment as Discussion);
    setTimeout(() => {
      if (typeof window !== "undefined") {
      }
      setNewSpot(null);
    }, 5000);
  };

  const handleClose = () => {
    setComposerKey((k: number) => k + 1);
  };

  const handleMapSideWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (window.innerWidth < 768) return;
      if (
        e.target instanceof HTMLIFrameElement ||
        (e.target as HTMLElement)?.closest("iframe")
      ) {
        return;
      }
      e.preventDefault();
      if (sidebarRef.current) {
        sidebarRef.current.scrollTop += e.deltaY;
      }
    },
    []
  );

  return (
    <>
      <Flex direction={{ base: "column", md: "row" }} h="100vh" w="full" mt={0}>
        <Box
          maxH="calc(100vh - 80px)"
          overflowY="auto"
          overflowX="hidden"
          w={{ base: "100%" }}
          p={{ base: 0, md: 2 }}
          pt={0}
          mt={0}
          boxSizing="border-box"
          ref={sidebarRef}
          id="scrollableDiv"
          sx={{
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {/* Header Section */}
          <Box
            w="full"
            px={containerPadding}
            py={4}
            bg="background"
            borderBottom="1px solid"
            borderColor="border"
          >
            <VStack spacing={3}>
              <Text
                fontSize={headerFontSize}
                fontWeight="extrabold"
                color="primary"
                textAlign="center"
                fontFamily="heading"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Skatespots Map
              </Text>

              <Text
                color="text"
                fontSize={{ base: "xs", md: "sm" }}
                textAlign="center"
              >
                Find and create skate spots. 🛹
              </Text>
            </VStack>
          </Box>


          {/* Main Content Section */}
          <Flex
            height={{ base: "auto", md: "600px" }}
            flexDirection={{ base: "column", md: "row" }}
            align="flex-start"
            justifyContent="center"
            p={4}
            pt={0}
            w="100%"
            mx="auto"
            gap={0}
          >
            <Box
              flex="2"
              // minW={0}
              w={{ base: "100%", md: "65%" }}
              height={{ base: "auto", md: "100%" }}
              aspectRatio={{ base: "1 / 1", md: "auto" }}
              overflow="visible"
              borderRadius="10px"
              width="100%"
              mx="auto"
              mb={{ base: 2, md: 6 }}
              onWheel={isMobile ? undefined : handleMapSideWheel}
            >
              <Box
                p={{ base: 2, md: 4 }}
                pt={0}
                textAlign="center"
                width="100%"
                height="100%"
              >
                <iframe
                  src={mapSrc}
                  style={{
                    border: "5px solid var(--chakra-colors-primary, black)",
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    margin: "auto",
                    boxShadow:
                      "0px 4px 10px var(--chakra-colors-muted, rgba(0, 0, 0, 0.5))",
                    display: "block",
                  }}
                  allowFullScreen
                ></iframe>
              </Box>
            </Box>

            <Box
              flex="1"
              minW={{ md: "340px" }}
              maxW={{ md: "420px" }}
              w={{ base: "100%", md: "35%" }}
              ml={{ base: 0, md: 8 }}
              mt={0}
              mb={{ base: 0, md: 8 }}
              mx={{ base: "auto", md: 0 }}
              display={{ base: "block", md: "block" }}
              height={{ base: "auto", md: "100%" }}
              overflowY="visible"
            >
              <SpotSnapComposer
                onNewComment={handleNewSpot}
                onClose={handleClose}
              />
            </Box>
          </Flex>

          {/* Spot List Section */}
          <Box p={4} pt={0} mt={0}>
            {error && (
              <Box
                textAlign="center"
                my={4}
                p={4}
                bg="red.50"
                borderRadius="md"
                border="1px solid"
                borderColor="red.200"
              >
                <Text color="red.600" fontWeight="bold">
                  Error loading spots:
                </Text>
                <Text color="red.500">{error}</Text>
              </Box>
            )}
            <SpotList
              spots={allSpots}
              newSpot={newSpot}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={loadNextPage}
            />
          </Box>
        </Box>
      </Flex>
    </>
  );
}