import {
  Box,
  Text,
  HStack,
  Tooltip,
  Icon,
  IconButton
} from "@chakra-ui/react";
import { FaPaperPlane, FaArrowUp, FaQuestionCircle } from "react-icons/fa";
import { useState } from "react";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { useTheme } from "@/app/themeProvider";
import useIsMobile from "@/hooks/useIsMobile";

interface HiveSectionProps {
  balance: string;
  hivePrice: number | null;
  onModalOpen: (
    title: string,
    description?: string,
    showMemoField?: boolean,
    showUsernameField?: boolean
  ) => void;
}

export default function HiveSection({
  balance,
  hivePrice,
  onModalOpen,
}: HiveSectionProps) {
  const { theme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);
  const isMobile = useIsMobile();

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
          <CustomHiveIcon color={theme.colors.primary} />
          <Box>
            <HStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="bold" color="primary">
                HIVE
              </Text>
              <IconButton
                aria-label="Info about Hive"
                icon={<FaQuestionCircle />}
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={() => setShowInfo(!showInfo)}
              />
            </HStack>
            {!isMobile && (
              <Text fontSize="sm" color="gray.400">
                The primary token of the Hive Blockchain
              </Text>
            )}
          </Box>
        </HStack>

        <HStack spacing={3} align="center">
          <Box textAlign="right">
            <Text fontSize="2xl" fontWeight="bold" color="primary">
              {balance}
            </Text>
            {balance !== "N/A" && hivePrice && parseFloat(balance) > 0 && (
              <Text fontSize="sm" color="gray.400">
                (${(parseFloat(balance) * hivePrice).toFixed(2)})
              </Text>
            )}
          </Box>
          <HStack spacing={1}>
            <Tooltip label="Send HIVE" hasArrow>
              <IconButton
                aria-label="Send HIVE"
                icon={<FaPaperPlane />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() =>
                  onModalOpen(
                    "Send HIVE",
                    "Send Hive to another account",
                    true,
                    true
                  )
                }
              />
            </Tooltip>
            <Tooltip label="Power Up" hasArrow>
              <IconButton
                aria-label="Power Up"
                icon={<FaArrowUp />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() =>
                  onModalOpen("Power Up", "Power Up your HIVE to HP")
                }
              />
            </Tooltip>
          </HStack>
        </HStack>
      </HStack>

      {showInfo && (
        <Box mt={3} p={3} bg="muted" borderRadius="md">
          <Text color="gray.400" fontSize="sm">
            The primary token of the Hive Blockchain. Liquid and transferable. Can be powered up to Hive Power for governance and curation rewards.
          </Text>
        </Box>
      )}
    </Box>
  );
}
