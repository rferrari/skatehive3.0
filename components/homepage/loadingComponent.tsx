import { Box, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
// fonts are at lib/utils/fonts.css

import "../../lib/utils/fonts.css";

const matrixCharacters =
  "FUCKアイウエオカキクケコサシスセソタチツテトナニFUCKヌネノSK8GRINDOLLIEΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ180360KICKFLIPNOSENDBOARD";
const randomSentences = [
  "skate or dont",
  "F-u-c-k instagram",
  "off the wall is on chain?",
  "Praise skatevideosite",
  "Loading Stokenomics",
  "Initiating Proof of Stoke",
  "We will load as fast as Daryl Rolls",
  "who was gnartoshi shredamoto?",
  "take back the internet",
  "get $higher",
  "Never lose your bros clips",
  "support your local skateshops",
  "The Peoples Thrasher",
  "when hive is low buy with HBD",
  "follow the steemskate curation trail?",
  "Connecting with Uganda Nodes",
  "If it takes to long, your connection sucks",
  "Macba Lives",
  "Skate till you tired, then skate more",
  "hive power = vote power",
  "try to get 1000 HIVE Power",
  "lipslide to the moon",
];

function getRandomChar() {
  return matrixCharacters[Math.floor(Math.random() * matrixCharacters.length)];
}

function generateColumnLines(lines = 30) {
  let column = [];
  for (let i = 0; i < lines; i++) {
    column.push(getRandomChar());
  }
  return column.join("\n");
}

const LoadingComponent = () => {
  const [randomSentence, setRandomSentence] = useState(randomSentences[0]);
  const [columns, setColumns] = useState<string[]>([]);
  const [messageVisible, setMessageVisible] = useState(true);

  useEffect(() => {
    const newSentence =
      randomSentences[Math.floor(Math.random() * randomSentences.length)];
    const newColumns = Array.from({ length: 25 }, () =>
      generateColumnLines(50)
    );
    setRandomSentence(newSentence);
    setColumns(newColumns);

    // Periodically flip characters in columns
    const interval = setInterval(() => {
      setColumns((prev) =>
        prev.map(() => generateColumnLines(50))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Switch the random message every 4 seconds with fade in/out
  useEffect(() => {
    const switchMessage = setInterval(() => {
      setMessageVisible(false);
      setTimeout(() => {
        setRandomSentence(prev => {
          let next;
          do {
            next = randomSentences[Math.floor(Math.random() * randomSentences.length)];
          } while (next === prev && randomSentences.length > 1);
          return next;
        });
        setMessageVisible(true);
      }, 400); // fade out for 400ms, then switch and fade in
    }, 4000);
    return () => clearInterval(switchMessage);
  }, []);

  return (
    <div lang="en">
      <VStack
        bg="transparent"
        overflow="hidden"
        css={{ "&::-webkit-scrollbar": { display: "none" } }}
        width="100%"
        height="100vh"
        justify="center"
        align="center"
        position="relative"
      >
        {columns.map((columnText, i) => {
          const duration = 6 + Math.random() * 6; // 6-12 seconds
          const fontSize = 10 + Math.random() * 12; // 10-22px
          const delay = -Math.random() * 5;

          return (
            <Box
              key={i}
              position="absolute"
              top="-150vh"
              left={`${(100 / 25) * i}%`}
              w="4%"
              fontFamily="monospace"
              fontSize={`${fontSize}px`}
              lineHeight="1.2"
              whiteSpace="pre"
              style={{
                animation: `matrixFall ${duration}s linear ${delay}s infinite`,
                background: `linear-gradient(to bottom, var(--chakra-colors-primary, #00FF00) 0%, var(--chakra-colors-secondary, #00FFFF) 50%, var(--chakra-colors-accent, #FF00FF) 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 5px var(--chakra-colors-primary, #00FF00))`,
              }}
            >
              {columnText}
            </Box>
          );
        })}
        <Text
          position="relative"
          zIndex={2}
          fontSize={{ base: "24px", md: "40px" }}
          textAlign="center"
          fontFamily="Joystix"
          p={4}
          borderRadius="md"
          color="primary"
          opacity={messageVisible ? 1 : 0}
          transition="opacity 0.4s"
          _before={{
            content: `"${randomSentence}"`,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            background: `linear-gradient(to right, var(--chakra-colors-primary, #00FF00), var(--chakra-colors-secondary, #00FFFF))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "ghost-glitch 1.5s infinite, ghost-flicker 1.1s infinite, ghost-stretch 2.5s infinite",
            clipPath: "inset(2px 0)",
            opacity: 0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            transformOrigin: "center center"
          }}
        >
          {randomSentence}
        </Text>
        <style jsx global>{`
          @keyframes matrixFall {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              transform: translateY(350vh);
              opacity: 0;
            }
          }
          @keyframes ghost-glitch {
            0%, 100% {
              transform: translate(-50%, -50%) skew(0deg);
            }
            10%, 90% {
              transform: translate(-50%, -50%) skew(0deg);
            }
            15% {
              transform: translate(-53%, -48%) skew(25deg);
            }
            25% {
              transform: translate(-47%, -51%) skew(-15deg);
            }
            35% {
              transform: translate(-52%, -53%) skew(5deg);
            }
            45% {
              transform: translate(-48%, -47%) skew(-25deg);
            }
            55% {
              transform: translate(-51%, -52%) skew(15deg);
            }
            65% {
              transform: translate(-47%, -48%) skew(-5deg);
            }
            75% {
              transform: translate(-53%, -51%) skew(20deg);
            }
          }
          @keyframes ghost-flicker {
            0% { opacity: 0.2; }
            7% { opacity: 0; }
            13% { opacity: 0.3; }
            19% { opacity: 0.1; }
            27% { opacity: 0.4; }
            33% { opacity: 0; }
            41% { opacity: 0.2; }
            52% { opacity: 0.05; }
            60% { opacity: 0.3; }
            68% { opacity: 0; }
            75% { opacity: 0.25; }
            82% { opacity: 0.1; }
            90% { opacity: 0.3; }
            100% { opacity: 0.2; }
          }
          @keyframes ghost-stretch {
            0%, 100% {
              transform: translate(-50%, -50%) scaleY(1);
            }
            25% {
              transform: translate(-50%, -50%) scaleY(1.4);
            }
            35% {
              transform: translate(-50%, -50%) scaleY(0.8);
            }
            45% {
              transform: translate(-50%, -50%) scaleY(1.2);
            }
            55% {
              transform: translate(-50%, -50%) scaleY(0.9);
            }
            65% {
              transform: translate(-50%, -50%) scaleY(1.1);
            }
            75% {
              transform: translate(-50%, -50%) scaleY(1);
            }
          }
        `}</style>
      </VStack>
    </div>
  );
};

export default LoadingComponent;
