import { Box, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
// fonts are at lib/utils/fonts.css

import "../../lib/utils/fonts.css";

const matrixCharacters =
  "FUCKアイウエオカキクケコサシスセソタチツテトナニFUCKヌネノ";
const randomSentences = [
  "skate or don't",
  "F-u-c-k instagram lets build something skater-made",
  "when doing something off-the-chain is actually on-chain",
  "Praise skatevideosite",
  "Loading Stokenomics",
  "Initiating Proof of Stoke",
  "We will load as fast as Daryl Rolls",
  "gnartoshi shredamoto is approving your request",
  "take back the internet",
  "Never lose your bros clips",
  "support your local skateshops",
  "The Peoples Thrasher",
  "Stack HP when HIVE is low! buy with HBD ;)",
  "follow the steemskate curation trail if you want to automatically upvote stuff for rewards",
  "why let zuckerburg get rich off your skating? everyone shares the profit on hive...",
  "Connecting with Uganda Nodes",
  "If it takes to long, your connection sucks",
  "Macba Lives",
  "Skate till you tired, then skate more",
  "Power up (stake) your HIVE into HIVE POWER (HP) to increase your vote strength",
  "climb the ranks in the skatehive leaderboard - defeat web-gnar",
  "HBD is a stablecoin- it is always worth $1 worth of HIVE",
  "stake your HBD in savings to earn 15% APY",
  "your vote mana depleates over time, give it a day or two to recharge",
  "try to get 1000 HIVE Power",
  "dont cash out your HIVE, forget about it and HODL, you will thank us later",
  "registering skatespots on the map can earn you rewards",
  "half of the rewards a post makes goes back to the people who voted for it",
  "when you vote on stuff, you are not giving your HIVE away, you are telling HIVE.io to reward the content",
  "HIVE is a public blockchain with lots of different people using it, not just skateboarders",
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

  useEffect(() => {
    // Generate consistent random content on the client
    const newSentence =
      randomSentences[Math.floor(Math.random() * randomSentences.length)];
    const newColumns = Array.from({ length: 20 }, () =>
      generateColumnLines(50)
    );
    setRandomSentence(newSentence);
    setColumns(newColumns);
  }, []);

  return (
    <div lang="en">
      <VStack
        bg="transparent"
        blur={5}
        overflow="hidden"
        css={{ "&::-webkit-scrollbar": { display: "none" } }}
        width="100%"
        height="100vh"
        justify="center"
        align="center"
        position="relative"
      >
        {columns.map((columnText, i) => (
          <Box
            key={i}
            position="absolute"
            top="-100%"
            left={`${(100 / 20) * i}%`}
            w="5%"
            color="limegreen"
            fontFamily="monospace"
            fontSize="14px"
            lineHeight="1.2"
            whiteSpace="pre"
            style={{
              animation: `matrixFall ${5 + Math.random() * 2}s linear ${
                -Math.random() * 2
              }s infinite`,
            }}
          >
            {columnText}
          </Box>
        ))}
        <Text
          position="relative"
          zIndex={1}
          color="#00FF00"
          fontSize="40px"
          textAlign="center"
          fontFamily="Joystix"
          p={4}
          borderRadius="md"
        >
          {randomSentence}
        </Text>
        <style jsx global>{`
          @keyframes matrixFall {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(200%);
            }
          }
        `}</style>
      </VStack>
    </div>
  );
};

export default LoadingComponent;
