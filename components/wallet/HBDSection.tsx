import {
  Box,
  Stack,
  Text,
  HStack,
  Tooltip,
  Icon,
  Image,
  Badge,
  Button,
} from "@chakra-ui/react";
import { FaPaperPlane, FaArrowDown, FaArrowUp } from "react-icons/fa";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { useTheme } from "@/app/themeProvider";

interface HBDSectionProps {
  hbdBalance: string;
  hbdSavingsBalance: string;
  estimatedClaimableInterest: number;
  daysUntilClaim: number;
  lastInterestPayment?: string;
  onModalOpen: (
    title: string,
    description?: string,
    showMemoField?: boolean,
    showUsernameField?: boolean
  ) => void;
  onClaimInterest: () => void;
}

function daysAgo(dateString: string) {
  const last = new Date(dateString);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

export default function HBDSection({
  hbdBalance,
  hbdSavingsBalance,
  estimatedClaimableInterest,
  daysUntilClaim,
  lastInterestPayment,
  onModalOpen,
  onClaimInterest,
}: HBDSectionProps) {
  const { theme } = useTheme();

  return (
    <Box mb={3}>
      <Stack
        direction={{ base: "column", md: "row" }}
        align="flex-start"
        mb={1}
        spacing={{ base: 2, md: 4 }}
      >
        <HStack align="center" mb={1} spacing={2} width="100%">
          <CustomHiveIcon color="lime" style={{ marginTop: 4 }} />
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
            HBD
          </Text>
          <Box flex={1} />
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
            {hbdBalance}
          </Text>
        </HStack>
        <HStack spacing={1} wrap={{ base: "wrap", md: "nowrap" }} mb={2}>
          <Tooltip label="Send HBD" hasArrow>
            <Box
              as="button"
              px={2}
              py={1}
              fontSize="sm"
              bg="teal.500"
              color="white"
              borderRadius="md"
              fontWeight="bold"
              _hover={{ bg: "teal.600" }}
              onClick={() =>
                onModalOpen(
                  "Send HBD",
                  "Send HBD to another account",
                  true,
                  true
                )
              }
            >
              <Icon
                as={FaPaperPlane}
                boxSize={4}
                mr={1}
                color={theme.colors.primary}
              />
            </Box>
          </Tooltip>
          <Tooltip label="Send HBD to Savings" hasArrow>
            <Box
              as="button"
              px={2}
              py={1}
              fontSize="sm"
              bg="teal.500"
              color="white"
              borderRadius="md"
              fontWeight="bold"
              _hover={{ bg: "teal.600" }}
              onClick={() => onModalOpen("HBD Savings", "Send HBD to Savings")}
            >
              <Icon
                as={FaArrowDown}
                boxSize={4}
                mr={1}
                color={theme.colors.primary}
              />
            </Box>
          </Tooltip>
        </HStack>
      </Stack>
      <Text color="gray.400" mb={4}>
        A token that is always worth ~1 dollar of hive. It is often rewarded on
        posts along with HIVE.
      </Text>

      {/* HBD SAVINGS */}
      <Box mb={0}>
        <Stack direction={{ base: "column", md: "row" }} mb={1} align="center">
          <Image
            src="/images/hbd_savings.png"
            alt="HBD Savings Logo"
            width="6"
            height="6"
            style={{ marginTop: 4 }}
          />
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
            HBD SAVINGS
          </Text>
          <Box flex={1} display={{ base: "none", md: "block" }} />
          <Text
            fontSize={{ base: "xl", md: "3xl" }}
            fontWeight="extrabold"
            color="lime"
          >
            {hbdSavingsBalance}
          </Text>
          <HStack spacing={1} wrap="wrap">
            <Tooltip label="Unstake HBD" hasArrow>
              <Box
                as="button"
                px={2}
                py={1}
                fontSize="sm"
                bg="teal.500"
                color="white"
                borderRadius="md"
                fontWeight="bold"
                _hover={{ bg: "teal.600" }}
                onClick={() =>
                  onModalOpen(
                    "Withdraw HBD Savings",
                    "HBD savings balance is subject to a 3-day unstake (withdraw) waiting period.",
                    true,
                    false
                  )
                }
              >
                <Icon
                  as={FaArrowUp}
                  boxSize={4}
                  mr={1}
                  color={theme.colors.primary}
                />
              </Box>
            </Tooltip>
          </HStack>
        </Stack>
        <Text color="gray.400">
          Staked HBD generates{" "}
          <Badge colorScheme="green" fontSize="sm" px={1} py={0}>
            15.00% APR
          </Badge>{" "}
          (defined by the{" "}
          <Text
            as="a"
            href="https://peakd.com/me/witnesses"
            target="_blank"
            rel="noopener noreferrer"
            color="blue.300"
            _hover={{ textDecoration: "underline", color: "blue.400" }}
            display="inline"
          >
            witnesses
          </Text>
          ) that is paid out monthly
        </Text>
      </Box>

      {/* Claimable Interest */}
      <Box pl={{ base: 4, md: 12 }} mb={4}>
        <Box
          borderLeft="2px solid #4ade80"
          borderColor="green.400"
          pl={4}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Text fontWeight="bold">Staked HBD - Claimable</Text>
            <Text color="gray.400" fontSize="sm">
              Claimable balance for the HBD staking.
            </Text>
            {lastInterestPayment && (
              <Text color="gray.400" fontSize="sm">
                Last payment: {daysAgo(lastInterestPayment)} days ago
              </Text>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Text fontWeight="bold" fontSize="xl">
              {estimatedClaimableInterest.toFixed(3)}
            </Text>
            <Button
              colorScheme="teal"
              size="sm"
              isDisabled={daysUntilClaim > 0}
              onClick={onClaimInterest}
            >
              {daysUntilClaim > 0 ? `CLAIM IN ${daysUntilClaim} DAYS` : "CLAIM"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
