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
              Hive and Ethereum. Points are determined by skatehive-centric
              blockchain metrics. Your hive power, Skatehive NFTs and supporting
              the Skatehive witness (hive node operator) are all factors in your
              score.
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
                  <th
                    align="left"
                    style={{
                      padding: 8,
                      color: "var(--chakra-colors-background)",
                    }}
                  >
                    Category
                  </th>
                  <th
                    align="left"
                    style={{
                      padding: 8,
                      color: "var(--chakra-colors-background)",
                    }}
                  >
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 6 }}>Hive Power (HP)</td>
                  <td style={{ padding: 6 }}>
                    0.5 points per HP, capped at 12,000 HP (max 6,000 points)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Number of Posts</td>
                  <td style={{ padding: 6 }}>
                    0.1 points per post, capped at 3,000 posts (max 300 points)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Skatehive NFTs</td>
                  <td style={{ padding: 6 }}>50 points per Skatehive NFT</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Gnars NFTs</td>
                  <td style={{ padding: 6 }}>25 points per Gnars NFT</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Gnars Votes</td>
                  <td style={{ padding: 6 }}>30 points per Gnars Vote</td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>HBD Savings</td>
                  <td style={{ padding: 6 }}>
                    0.2 points per HBD in savings, capped at 1,000 HBD (max 200
                    points)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Hive Balance</td>
                  <td style={{ padding: 6 }}>
                    0.1 points per Hive, capped at 1,000 Hive (max 100 points)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Giveth Donations</td>
                  <td style={{ padding: 6 }}>
                    5 points per USD donated, capped at 1,000 USD (max 5,000
                    points)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Witness Vote</td>
                  <td style={{ padding: 6 }}>
                    1000 points for voting for the Skatehive witness
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Voting Mana</td>
                  <td style={{ padding: 6 }}>
                    1000 points per USD of voting power
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Last Post Activity</td>
                  <td style={{ padding: 6 }}>
                    0 points deducted if last post within 7 days, up to 100
                    points deducted
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Ethereum Wallet Bonus</td>
                  <td style={{ padding: 6 }}>
                    5000 points for having a valid Ethereum wallet
                  </td>
                </tr>
              </tbody>
            </Box>
            <Text fontWeight="bold" mb={2} color="primary">
              🧮 Total Points Formula
            </Text>
            <Box
              bg="accent"
              color="background"
              borderRadius="md"
              p={3}
              fontSize="sm"
              fontFamily="mono"
              mb={4}
              textAlign="center"
            >
              <Text color="inherit">
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
