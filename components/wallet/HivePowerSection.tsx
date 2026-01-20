import {
  Box,
  Text,
  Image,
  HStack,
  Tooltip,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { FaArrowDown, FaArrowUp, FaQuestionCircle } from "react-icons/fa";
import { useState, useCallback, useMemo, memo } from "react";
import useIsMobile from "@/hooks/useIsMobile";

interface HivePowerSectionProps {
  hivePower: string | undefined;
  hivePrice: number | null;
  onModalOpen: (title: string, description?: string) => void;
}

const HivePowerSection = memo(function HivePowerSection({
  hivePower,
  hivePrice,
  onModalOpen,
}: HivePowerSectionProps) {
  const [showInfo, setShowInfo] = useState(false);
  const isMobile = useIsMobile();

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

  const handlePowerDown = useCallback(() => {
    onModalOpen(
      "Power Down",
      "Create a Hive Power unstake request. The request is fulfilled once a week over the next 13 weeks."
    );
  }, [onModalOpen]);

  const handlePowerUpClick = useCallback(() => {
    onModalOpen("Power Up", "Power Up your HIVE to HP");
  }, [onModalOpen]);

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
              {/* <IconButton
                aria-label="Info about Hive Power"
                icon={<FaQuestionCircle />}
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={handleInfoToggle}
              /> */}
            </HStack>
            {/* {!isMobile && (
              <Text fontSize="sm" color="gray.400">
                Staked Hive for governance and curation
              </Text>
            )} */}
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

      {/* {showInfo && ( */}
      <Box mt={3} p={3} bg="muted" borderRadius="md">
        <Text color="gray.400" fontSize="sm">
          • More Hive Power you can create more posts and comment more
          • Increate the value of your vote on posts and comments.
          • Earns you 3% interest.
          • Actively voting on posts can earn up to 10% APR.
        </Text>
      </Box>
      {/* )} */}

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
              onClick={handlePowerUpClick}
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
              onClick={handlePowerDown}
              flex={1}
            >
              📤 Power Down
            </Box>
          </Tooltip>
        </HStack>
      </VStack>
      
      {/* 
      <Tooltip label="Power Down" hasArrow>
        <IconButton
          aria-label="Power Down"
          icon={<FaArrowDown />}
          size="sm"
          colorScheme="blue"
          variant="outline"
          onClick={handlePowerDown}
        />
        <Tooltip label="Power Up" hasArrow>
          <IconButton
            aria-label="Power Up"
            icon={<FaArrowUp />}
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={handlePowerUpClick}
          />
        </Tooltip>
      </Tooltip> */}

    </Box>
  );
});

export default HivePowerSection;
