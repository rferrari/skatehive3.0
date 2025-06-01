"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Global } from "@emotion/react";
import SpotSnapComposer from "@/components/homepage/SpotSnapComposer";
import SpotList from "@/components/homepage/SpotList";
import { Discussion } from "@hiveio/dhive";

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

  const handleNewComment = (comment: Partial<Discussion>) => {
    setNewSpot(comment as Discussion);
  };

  const handleClose = () => {
    setComposerKey((k: number) => k + 1); // force reset by changing key
  };

  return (
    <>
      <Global
        styles={`
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(5px); }
            100% { transform: translateY(0); }
          }
          @keyframes glow {
            0% { text-shadow: 0 0 5px black, 0 0 10px black, 0 0 15px black, 0 0 20px black, 0 0 25px black; color: lime; }
            50% { text-shadow: 0 0 10px lime, 0 0 20px lime, 0 0 30px lime, 0 0 40px lime, 0 0 50px lime; color: black; }
            100% { text-shadow: 0 0 5px black, 0 0 10px black, 0 0 15px black, 0 0 20px black, 0 0 25px black; color: lime; }
          }
        `}
      />
      <Box
        maxH="100vh"
        overflowY="auto"
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        <Flex
          flexDirection={{ base: "column", md: "row" }}
          align="flex-start"
          justifyContent="center"
          p={4}
          w="100%"
          mx="auto"
          gap={{ base: 0, md: 8 }}
        >
          {/* Main content: Map and instructions */}
          <Box
            flex="2"
            minW={0}
            w={{ base: "100%", md: "65%" }}
            height={{ base: "auto", md: "auto" }}
            overflowY={{ base: "visible", md: "visible" }}
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
            borderRadius="10px"
            p={{ base: 2, md: 4 }}
            width="100%"
            mx="auto"
            mb={6}
          >
            <Heading
              as="h1"
              fontSize="4xl"
              fontWeight="bold"
              mb={2}
              textAlign="center"
              fontFamily="Joystix"
              textShadow="2px 2px 4px rgba(0, 0, 0, 1)"
              animation="glow 5s ease-in-out infinite"
            >
              Skatespots Map
            </Heading>
            <Text
              fontSize="20px"
              fontWeight="bold"
              color="white"
              mb={2}
              textAlign="center"
              paddingBottom={5}
              textShadow="2px 2px 4px rgba(0, 0, 0, 1)"
              animation="float 5s ease-in-out infinite"
            >
              A Global Skatespot Database
            </Text>
            <Box textAlign="center" mb={4}>
              <Button
                style={{
                  background: "#00FFAA",
                  color: "#222",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  transition: "background 0.2s",
                }}
                onClick={() => {
                  const el = document.getElementById("spot-name-field");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    el.focus();
                  }
                }}
              >
                Add A Spot
              </Button>
            </Box>
            <Box
              mb={4}
              textAlign="center"
              width="100%"
              sx={{ aspectRatio: { base: "3 / 4.8", md: "3 / 2.4" } }}
            >
              <iframe
                src={mapSrc}
                style={{
                  border: "5px solid black",
                  width: "100%",
                  height: "100%",
                  padding: 0,
                  margin: "auto",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
                  display: "block",
                  aspectRatio: window.innerWidth < 768 ? "3 / 4.8" : "3 / 2.4",
                }}
                allowFullScreen
              ></iframe>
            </Box>
            <Box
              p={paddingX}
              borderRadius="md"
              marginTop={{ base: "8px", md: "0" }}
              textAlign="left"
              width="100%"
              minW={0}
            >
              <Flex
                flexDirection="column"
                align="flex-start"
                justifyContent="flex-start"
                p={4}
                textAlign="left"
                maxW="800px"
                mx="auto"
              >
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  color="white"
                  mb={3}
                  style={{ textShadow: "8px 8px 24px #000, 0 0 10px #000" }}
                >
                  Welcome to the skatehive Spotbook. The{" "}
                  <Box
                    as="span"
                    color="blue.600"
                    style={{
                      background: "#061a40",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    dark blue
                  </Box>{" "}
                  pins are street spots. The{" "}
                  <Box
                    as="span"
                    color="teal.300"
                    style={{
                      background: "#061a40",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    light blue
                  </Box>{" "}
                  pins are skateparks. When a mod approves your spot, it will be
                  added to the spotbook.
                </Text>
              </Flex>
            </Box>
          </Box>
          {/* Right sidebar: Spot submission and feed (desktop only) */}
          <Box
            flex="1"
            minW={{ md: "340px" }}
            maxW={{ md: "420px" }}
            w={{ base: "100%", md: "35%" }}
            mt={{ base: 12, md: 0 }}
            mb={8}
            mx={{ base: "auto", md: 0 }}
            display={{ base: "block", md: "block" }}
            height={{ base: "auto", md: "100vh" }}
            overflowY={{ base: "visible", md: "auto" }}
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <SpotSnapComposer
              onNewComment={handleNewComment}
              onClose={handleClose}
            />
            <SpotList newSpot={newSpot} />
          </Box>
        </Flex>
      </Box>
    </>
  );
}
