"use client";

import { Box, Flex, Heading, Image, Text, useBreakpointValue } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import Head from "next/head";
import React, { useState } from 'react';
import SpotSnapComposer from "@/components/homepage/SpotSnapComposer";
import SpotList from "@/components/homepage/SpotList";
import { Discussion } from "@hiveio/dhive";

const mapSrc = "https://www.google.com/maps/d/u/1/embed?mid=1iiXzotKL-uJ3l7USddpTDvadGII&hl=en&ll=29.208380630280647%2C-100.5437214508988&z=4";

export default function SkatespotsPage() {
  const boxWidth = useBreakpointValue({ base: "90%", sm: "80%", md: "75%", lg: "100%" });
  const paddingX = useBreakpointValue({ base: 2, sm: 4, md: 6 });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [newSpot, setNewSpot] = useState<Discussion | null>(null);
  const [composerKey, setComposerKey] = useState(0);

  const handleNewComment = (comment: Partial<Discussion>) => {
    setNewSpot(comment as Discussion);
  };

  const handleClose = () => {
    setComposerKey((k) => k + 1); // force reset by changing key
  };

  return (
    <>
      <Global
        styles={`
          @property --a {
            syntax: "<angle>";
            inherits: false;
            initial-value: 0deg;
          }
          @property --hue {
            syntax: "<number>";
            inherits: false;
            initial-value: 0;
          }
          @keyframes gradientShift {
            0% { --hue: 0; }
            50% { --hue: 180; }
            100% { --hue: 360; }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }
          @keyframes pulsePepe {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
          }
          #animatedBox {
            position: relative;
            background: radial-gradient(circle at 30% 30%, hsl(var(--hue), 70%, 50%), hsl(var(--hue), 50%, 20%) 50%, #1a1a1a 100%);
            animation: gradientShift 20s linear infinite;
            overflow: hidden;
          }
          #animatedBox::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100" height="100" filter="url(%23noise)" opacity="0.2"/></svg>') repeat;
            opacity: 0.15;
            pointer-events: none;
          }
          #animatedBox2 {
            position: relative;
            background: linear-gradient(45deg, #0a0a0a, #1a1a1a);
            box-shadow: 0 0 20px rgba(0, 255, 163, 0.3);
          }
          #animatedBox2::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(0, 255, 163, 0.2), transparent 70%);
            opacity: 0.5;
            pointer-events: none;
          }
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
          .pepe-pulse {
            animation: pulsePepe 6s ease-in-out infinite;
          }
        `}
      />
      <Flex
        flexDirection="column"
        align="center"
        justifyContent="center"
        p={4}
        w="100%"
        mx="auto"
      >
        <Box
          id="animatedBox"
          borderRadius="10px"
          p={{ base: 2, md: 4 }}
          width="100%"
          mx="auto"
          mb={6}
          boxShadow="xl"
        >
          <Head>
            <title>Skatehive Spot Map - A Global Skatespot Database</title>
            <meta name="description" content="Discover the Skatehive Spot Map, a global database for finding and sharing skate spots. Join the community today!" />
            <meta name="keywords" content="skateboarding, skate spots, skate map, global skate spots, skatehive" />
            <meta property="og:image" content="https://www.skatehive.app/pepe_map.png" />
            <meta name="twitter:image" content="https://www.skatehive.app/pepe_map.png" />
          </Head>
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
            <button
              style={{
                background: '#00FFAA',
                color: '#222',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 24px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'background 0.2s',
              }}
              onClick={() => {
                const el = document.getElementById('spot-name-field');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  el.focus();
                }
              }}
            >
              Add A Spot
            </button>
          </Box>
          <Box mb={4} textAlign="center" width="100%" style={{ aspectRatio: '3 / 2' }}>
            <iframe
              src={mapSrc}
              style={{
                border: "5px solid black",
                width: "100%",
                height: "100%",
                padding: 0,
                margin: "auto",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
                display: 'block',
                aspectRatio: '3 / 2',
              }}
              allowFullScreen
            ></iframe>
          </Box>
          <Box
            p={paddingX}
            bg="black"
            borderRadius="md"
            id="animatedBox2"
            marginTop={{ base: "20px", md: "0" }}
            textAlign="center"
            width="100%"
            minW={0}
            style={{
              backgroundImage: 'url(/images/sidewalk.png)',
              backgroundSize: 'auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          >
            <Flex
              flexDirection="column"
              align="center"
              justifyContent="center"
              p={4}
              textAlign="center"
              maxW="800px"
              mx="auto"
            >
              <Text fontSize={{ base: "md", md: "lg" }} color="white" mb={3} style={{ textShadow: '8px 8px 24px #000, 0 0 10px #000' }}>
                This skatespot database started in 2012. The <Box as="span" color="blue.600" style={{ background: '#061a40', padding: '2px 6px', borderRadius: '4px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>dark blue</Box> pins are street spots. The <Box as="span" color="teal.300" style={{ background: '#061a40', padding: '2px 6px', borderRadius: '4px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>light blue</Box> pins are skateparks.
              </Text>
              <Text fontSize={{ base: "md", md: "lg" }} color="white" mb={3} style={{ textShadow: '8px 8px 24px #000, 0 0 10px #000' }}>
                If you would like to add a spot, upload a photo of the spot below. When a mod approves your photo, it will be added to the spotbook. Some tips on submitting a spot:
              </Text>
              <Text fontSize={{ base: "md", md: "lg" }} color="white" mb={3} style={{ textShadow: '8px 8px 24px #000, 0 0 10px #000' }}>
                Take a photo of the spot. Try not to include people in the photo.
                Find the coordinates of the spot. Latitude, then Longitude. Bake the GPS coordinates into the photo by turning location services on with Photos on your phone.
                Login and submit the spot.
              </Text>
            </Flex>
          </Box>
        </Box>
      </Flex>
      {/* Spot upload form below all existing content */}
      <Box mt={12} mb={8} maxW="600px" mx="auto">
        <SpotSnapComposer key={composerKey} onNewComment={handleNewComment} onClose={handleClose} />
        <SpotList newSpot={newSpot} />
      </Box>
    </>
  );
} 