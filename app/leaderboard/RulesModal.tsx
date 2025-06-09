import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay />
      <ModalContent
        bg="background"
        color="primary"
        maxH="80vh"
        overflowY="auto"
      >
        <ModalHeader color="primary">Leaderboard Guide & Rules</ModalHeader>
        <ModalCloseButton color="primary" />
        <ModalBody>
          <Box>
            <Text fontWeight="bold" mb={2} color="primary">
              🛹 What is the Skatehive Leaderboard?
            </Text>
            <Text fontSize="sm" color="primary" mb={4}>
              The leaderboard ranks top Skatehive contributors using data from
              Hive and Ethereum. It rewards transparency, recognition, and
              engagement.
            </Text>
            <Text fontWeight="bold" mb={2} color="primary">
              🌟 How You Earn Points
            </Text>
            <Box
              as="table"
              width="100%"
              mb={4}
              fontSize="sm"
              color="primary"
              borderRadius="md"
              overflow="hidden"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--chakra-colors-accent)",
                  }}
                >
                  <th align="left" style={{ padding: 8, color: "var(--chakra-colors-background)" }}>
                    Category
                  </th>
                  <th align="left" style={{ padding: 8, color: "var(--chakra-colors-background)" }}>
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 6 }}>Hive Balance</td>
                  <td style={{ padding: 6 }}>+0.1/Hive (max 100)</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Hive Power (HP)</td>
                  <td style={{ padding: 6 }}>+0.5/HP (max 6,000)</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Gnars Votes</td>
                  <td style={{ padding: 6 }}>+30/vote</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Skatehive NFTs</td>
                  <td style={{ padding: 6 }}>+50/NFT</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Witness Vote</td>
                  <td style={{ padding: 6 }}>+1,000</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>HBD Savings</td>
                  <td style={{ padding: 6 }}>+0.2/HBD (max 200)</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Posts</td>
                  <td style={{ padding: 6 }}>+0.1/post (max 300)</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Voting Power</td>
                  <td style={{ padding: 6 }}>+1,000/USD</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Giveth Donations</td>
                  <td style={{ padding: 6 }}>+5/USD (max 5,000)</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Last Post Activity</td>
                  <td style={{ padding: 6 }}>
                    -0 to -100 (inactivity penalty)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Ethereum Wallet</td>
                  <td style={{ padding: 6 }}>+5,000 (bonus)</td>
                </tr>
              </tbody>
            </Box>
            <Text fontWeight="bold" mb={2} color="primary">
              🧮 Total Points Formula
            </Text>
            <Box
              bg="primary"
              color="primary"
              borderRadius="md"
              p={3}
              fontSize="sm"
              fontFamily="mono"
              mb={4}
              textAlign="center"
            >
              <Text>
                <b>Total Points</b> = All category points added together
                <br />
                <span style={{ fontSize: "0.95em" }}>
                  (see table above) <br />
                  <b>minus inactivity penalty</b> <br />
                  <b>plus Ethereum wallet bonus</b>
                </span>
              </Text>
            </Box>
            <Text fontWeight="bold" mb={2} color="primary">
              📋 Quick Rules
            </Text>
            <ul
              style={{
                marginLeft: 18,
                marginBottom: 16,
                color: "var(--chakra-colors-text)",
                fontSize: "0.95em",
              }}
            >
              <li>Top 50 skaters are shown.</li>
              <li>Sort by any stat using the selector.</li>
              <li>Rules and scoring may change to improve fairness.</li>
            </ul>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="primary" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
