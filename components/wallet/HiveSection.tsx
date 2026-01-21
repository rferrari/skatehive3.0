import { Box, Text, HStack, Tooltip, Icon, IconButton, useDisclosure } from "@chakra-ui/react";
import { FaPaperPlane, FaQuestionCircle } from "react-icons/fa";
import { useState, useCallback, useMemo, memo } from "react";
import { CustomHiveIcon } from "./CustomHiveIcon";
import { useTheme } from "@/app/themeProvider";
import { SendHiveModal } from "./modals";

interface HiveSectionProps {
  balance: string;
  hivePrice: number | null;
}

const HiveSection = memo(function HiveSection({
  balance,
  hivePrice,
}: HiveSectionProps) {
  const { theme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);
  const { isOpen: isSendOpen, onOpen: onSendOpen, onClose: onSendClose } = useDisclosure();

  // Memoize USD value calculation
  const usdValue = useMemo(() => {
    if (balance === "N/A" || !hivePrice || parseFloat(balance) <= 0) {
      return null;
    }
    return (parseFloat(balance) * hivePrice).toFixed(2);
  }, [balance, hivePrice]);

  // Memoize event handlers
  const handleInfoToggle = useCallback(() => {
    setShowInfo((prev) => !prev);
  }, []);

  return (
    <Box
      p={4}
      bg="transparent"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <CustomHiveIcon color={"red"} />
          <Box>
            <HStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="bold" color="red">
                HIVE
              </Text>
              <IconButton
                aria-label="Info about Hive"
                icon={<FaQuestionCircle />}
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={handleInfoToggle}
              />
            </HStack>
            {/* {!isMobile && (
              <Text fontSize="sm" color="gray.400">
                The primary token of the Hive Blockchain
              </Text>
            )} */}
          </Box>
        </HStack>

          <HStack spacing={3} align="center">
            <HStack spacing={1}>
              <Tooltip label="Send HIVE" hasArrow>
                <IconButton
                  aria-label="Send HIVE"
                  icon={<FaPaperPlane />}
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  onClick={onSendOpen}
                />
              </Tooltip>
            </HStack>
            <Box textAlign="right">
              <Text fontSize="2xl" fontWeight="bold" color="primary">
                {balance}
              </Text>
              {usdValue && (
                <Text fontSize="sm" color="gray.400">
                  (${usdValue})
                </Text>
              )}
            </Box>
          </HStack>
        </HStack>

        {showInfo && (
          <Box mt={3} p={3} bg="muted" borderRadius="md">
            <Text color="gray.400" fontSize="sm">
              The primary token of the Hive Blockchain. Liquid and transferable.
              Can be powered up to Hive Power for governance and curation rewards.
            </Text>
          </Box>
        )}
      </Box>

      <SendHiveModal
        isOpen={isSendOpen}
        onClose={onSendClose}
        balance={balance}
      />
    </>
  );
});

export default HiveSection;
