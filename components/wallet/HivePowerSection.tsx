import {
  Box,
  Text,
  Image,
  HStack,
  Tooltip,
  IconButton,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaArrowDown, FaArrowUp, FaQuestionCircle } from "react-icons/fa";
import { useState, useCallback, useMemo, memo } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { PowerUpModal, PowerDownModal } from "./modals";

interface HivePowerSectionProps {
  hivePower: string | undefined;
  hivePrice: number | null;
  hiveBalance: string; // Need this for PowerUpModal
}

const HivePowerSection = memo(function HivePowerSection({
  hivePower,
  hivePrice,
  hiveBalance,
}: HivePowerSectionProps) {
  const [showInfo, setShowInfo] = useState(false);
  const isMobile = useIsMobile();

  const { isOpen: isPowerUpOpen, onOpen: onPowerUpOpen, onClose: onPowerUpClose } = useDisclosure();
  const { isOpen: isPowerDownOpen, onOpen: onPowerDownOpen, onClose: onPowerDownClose } = useDisclosure();

  // Memoize USD value calculation
  const usdValue = useMemo(() => {
    if (hivePower === undefined || !hivePrice || parseFloat(hivePower) <= 0) {
      return null;
    }
    return (parseFloat(hivePower) * hivePrice).toFixed(2);
  }, [hivePower, hivePrice]);

  // Memoize event handlers
  const handleInfoToggle = useCallback(() => {
    setShowInfo((prev) => !prev);
  }, []);

  return (
    <>
      <Box
        p={4}
        bg="transparent"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Image
              src="/images/hp_logo.png"
              alt="Hive Power Logo"
              width="26px"
              height="26px"
              borderRadius="full"
            />
            <Box>
              <HStack spacing={2} align="center">
                <Text fontSize="lg" fontWeight="bold" color="primary">
                  HIVE POWER
                </Text>
              </HStack>
            </Box>
          </HStack>

          <HStack spacing={3} align="center">
            <Box textAlign="right">
              <Text fontSize="2xl" fontWeight="bold" color="primary">
                {hivePower !== undefined ? hivePower : "Loading..."}
              </Text>
              {usdValue && (
                <Text fontSize="sm" color="gray.400">
                  (${usdValue})
                </Text>
              )}
            </Box>
          </HStack>


        </HStack>

        <Box mt={3} p={3} bg="muted" borderRadius="md">
          <Text color="gray.400" fontSize="sm">
            • More Hive Power you can create more posts and comment more
            • Increate the value of your vote on posts and comments.
            • Earns you 3% interest.
            • Actively voting on posts can earn up to 10% APR.
          </Text>
        </Box>

        {/* Investment Actions */}
        <VStack spacing={3} align="stretch">
          <HStack spacing={2}>
            <Tooltip label="Power UP" hasArrow>
              <Box
                as="button"
                px={4}
                py={2}
                fontSize="sm"
                bg="primary"
                color="background"
                borderRadius="none"
                fontWeight="bold"
                _hover={{ bg: "accent" }}
                onClick={onPowerUpOpen}
                flex={1}
              >
                💰 Power UP
              </Box>
            </Tooltip>
            <Tooltip label="Power Down" hasArrow>
              <Box
                as="button"
                px={4}
                py={2}
                fontSize="sm"
                bg="muted"
                color="text"
                borderRadius="none"
                fontWeight="bold"
                _hover={{ bg: "accent", color: "background" }}
                onClick={onPowerDownOpen}
                flex={1}
              >
                📤 Power Down
              </Box>
            </Tooltip>
          </HStack>
        </VStack>

      </Box>

      <PowerUpModal
        isOpen={isPowerUpOpen}
        onClose={onPowerUpClose}
        balance={hiveBalance}
      />

      <PowerDownModal
        isOpen={isPowerDownOpen}
        onClose={onPowerDownClose}
        hivePower={hivePower || "0"}
      />
    </>
  );
});

export default HivePowerSection;
