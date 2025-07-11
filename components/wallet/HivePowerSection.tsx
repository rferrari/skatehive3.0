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
  onModalOpen: (title: string, description?: string) => void;
}

export default function HivePowerSection({
  hivePower,
  onModalOpen,
}: HivePowerSectionProps) {
  const { theme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Box mb={3}>
      <HStack align="center" mb={2} spacing={2} width="100%">
        <Image
          src="/images/hp_logo.png"
          alt="Hive Power Logo"
          width="6"
          height="6"
        />
        <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
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
        <Box flex={1} />
        <Text
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="bold"
          color="primary"
        >
          {hivePower !== undefined ? hivePower : "Loading..."}
        </Text>
        <Tooltip label="Power Down" hasArrow>
          <IconButton
            aria-label="Power Down"
            icon={<FaArrowDown />}
            size="sm"
            bg="primary"
            color="background"
            _hover={{ bg: "accent" }}
            onClick={() =>
              onModalOpen(
                "Power Down",
                "Create a Hive Power unstake request. The request is fulfilled once a week over the next 13 weeks."
              )
            }
          />
        </Tooltip>
      </HStack>

      {showInfo && (
        <Text color="gray.400" fontSize="sm" mb={2} pl={8}>
          Staked Hive is the power you have to vote on posts. Earns you 3% interest. Actively voting on posts can earn up to 10% APR.
        </Text>
      )}
    </Box>
  );
}
