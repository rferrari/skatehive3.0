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
              The Skatehive Leaderboard ranks top contributors based on their
              activity and holdings across Hive and Ethereum blockchains. Your
              score is calculated using Skatehive-centric metrics, including
              Hive Power, Skatehive NFTs, witness votes, posts, snaps, and more.
              Show off your contributions and skate your way to the top!
            </Text>
            <Text fontWeight="bold" mb={2} color="primary">
              🌟 How You Earn Points
            </Text>
            <Text fontSize="sm" color="primary" mb={3}>
              Points are calculated based on the following metrics, with caps
              and penalties applied to ensure fairness:
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
                    Points Calculation
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 6 }}>Hive Power (HP)</td>
                  <td style={{ padding: 6 }}>
                    0.5 points per HP, capped at 12,000 HP (max 6,000 points).{" "}
                    <strong>Zero HP</strong>: -5,000 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Posts and Snaps Score</td>
                  <td style={{ padding: 6 }}>
                    Posts score × 27 + Snaps score × 10 × (weekly snaps / total
                    snaps, capped at 20 snaps). <strong>Zero score</strong>:
                    -2,000 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Skatehive NFTs</td>
                  <td style={{ padding: 6 }}>
                    50 points per Skatehive NFT. <strong>Zero NFTs</strong>:
                    -900 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Gnars Votes</td>
                  <td style={{ padding: 6 }}>
                    30 points per Gnars Vote. <strong>Zero votes</strong>: -300
                    points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>HBD Savings</td>
                  <td style={{ padding: 6 }}>
                    0.2 points per HBD in savings, capped at 1,000 HBD (max 200
                    points). <strong>Zero HBD</strong>: -200 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Hive Balance</td>
                  <td style={{ padding: 6 }}>
                    0.1 points per Hive, capped at 1,000 Hive (max 100 points).{" "}
                    <strong>Zero Hive</strong>: -1,000 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Giveth Donations</td>
                  <td style={{ padding: 6 }}>
                    5 points per USD donated, capped at 1,000 USD (max 5,000
                    points).
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Witness Vote</td>
                  <td style={{ padding: 6 }}>
                    1,000 points for voting for the Skatehive witness.{" "}
                    <strong>No vote</strong>: -3,500 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Voting Mana</td>
                  <td style={{ padding: 6 }}>
                    1,000 points per USD of voting power.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Last Post Activity</td>
                  <td style={{ padding: 6 }}>
                    Deduct 1 point per day since last post, up to 100 points.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6 }}>Ethereum Wallet Bonus</td>
                  <td style={{ padding: 6 }}>
                    5,000 points for a valid Ethereum wallet (non-zero, not
                    starting with &quot;donator&quot;).{" "}
                    <strong>No valid wallet</strong>: -2,000 points.
                  </td>
                </tr>
              </tbody>
            </Box>

            <Text fontWeight="bold" mb={2} color="primary">
              📊 Posts and Snaps Score Details
            </Text>
            <Box
              bg="muted"
              color="primary"
              borderRadius="md"
              p={3}
              fontSize="sm"
              mb={4}
            >
              <Text mb={2}>
                <strong>Posts Score</strong>: Multiplied by 27 to calculate
                contribution to total points.
              </Text>
              <Text mb={2}>
                <strong>Snaps Score</strong>: Multiplied by 10, adjusted by the
                ratio of weekly snaps (capped at 20) to total snaps. If total
                snaps is 0, the ratio is treated as 1 to avoid division by zero.
              </Text>
              <Text mb={2}>
                <strong>Formula</strong>:
              </Text>
              <Box
                bg="accent"
                color="background"
                borderRadius="md"
                p={2}
                fontSize="xs"
                fontFamily="mono"
                textAlign="center"
              >
                Posts and Snaps Score = (Posts Score × 27) + (Snaps Score × 10 ×
                (Weekly Snaps / Total Snaps, capped at 20))
              </Box>
              <Text mt={2} fontSize="xs">
                <strong>Zero Score Penalty</strong>: If both posts and snaps
                scores are 0, a -2,000-point penalty is applied.
              </Text>
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
                <b>Total Points</b> = (Hive Power × 0.5, capped at 12,000) +
                <br />
                (Posts Score × 27 + Snaps Score × 10 × (Weekly Snaps / Total
                Snaps, capped at 20)) +<br />
                (Skatehive NFTs × 50) + (Gnars Votes × 30) +<br />
                (HBD Savings × 0.2, capped at 1,000) + (Hive Balance × 0.1,
                capped at 1,000) +<br />
                (Giveth Donations USD × 5, capped at 1,000) +<br />
                (Witness Vote ? 1,000 : -3,500) + (Voting Mana USD × 1,000) +
                <br />
                Ethereum Wallet Bonus (5,000 or -2,000) -<br />
                Inactivity Penalty (min(days since last post, 100)) +<br />
                Zero-Value Penalties (if applicable)
              </Text>
            </Box>

            <Text fontSize="xs" color="primary" mb={4} textAlign="center">
              <strong>Note</strong>: Total points are capped at a minimum of 0.
            </Text>

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
              <li>
                <strong>Penalties for Zero Values</strong>: Significant
                penalties apply for zero balances or activity in key metrics.
              </li>
              <li>
                <strong>Inactivity</strong>: Posting regularly (within 7 days)
                avoids the inactivity penalty, which increases daily up to 100
                points.
              </li>
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
