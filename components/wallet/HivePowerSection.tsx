import {
  Box,
  Text,
  Image,
  HStack,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import { FaArrowDown, FaQuestionCircle } from "react-icons/fa";
import { useState } from "react";
import { useTheme } from "@/app/themeProvider";

interface HivePowerSectionProps {
  hivePower: string | undefined;
  hivePrice: number | null;
  onModalOpen: (title: string, description?: string) => void;
}

export default function HivePowerSection({
  hivePower,
  hivePrice,
  onModalOpen,
}: HivePowerSectionProps) {
  const { theme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Box
      p={4}
      bg="background"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <Image
            src="/images/hp_logo.png"
            alt="Hive Power Logo"
            width="32px"
            height="32px"
            borderRadius="full"
          />
          <Box>
            <HStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="bold" color="primary">
                HIVE POWER
              </Text>
              <IconButton
                aria-label="Info about Hive Power"
                icon={<FaQuestionCircle />}
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={() => setShowInfo(!showInfo)}
              />
            </HStack>
            <Text fontSize="sm" color="gray.400">
              Staked Hive for governance and curation
            </Text>
          </Box>
        </HStack>

        <HStack spacing={3} align="center">
          <Box textAlign="right">
            <Text fontSize="2xl" fontWeight="bold" color="primary">
              {hivePower !== undefined ? hivePower : "Loading..."}
            </Text>
            {hivePower !== undefined && hivePrice && parseFloat(hivePower) > 0 && (
              <Text fontSize="sm" color="gray.400">
                (${(parseFloat(hivePower) * hivePrice).toFixed(2)})
              </Text>
            )}
          </Box>
          <Tooltip label="Power Down" hasArrow>
            <IconButton
              aria-label="Power Down"
              icon={<FaArrowDown />}
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() =>
                onModalOpen(
                  "Power Down",
                  "Create a Hive Power unstake request. The request is fulfilled once a week over the next 13 weeks."
                )
              }
            />
          </Tooltip>
        </HStack>
      </HStack>

      {showInfo && (
        <Box mt={3} p={3} bg="muted" borderRadius="md">
          <Text color="gray.400" fontSize="sm">
            Staked Hive is the power you have to vote on posts. Earns you 3% interest. Actively voting on posts can earn up to 10% APR.
          </Text>
        </Box>
      )}
    </Box>
  );
}
