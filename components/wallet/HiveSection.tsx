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

interface HiveSectionProps {
  balance: string;
  onModalOpen: (
    title: string,
    description?: string,
    showMemoField?: boolean,
    showUsernameField?: boolean
  ) => void;
}

export default function HiveSection({
  balance,
  onModalOpen,
}: HiveSectionProps) {
  const { theme } = useTheme();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Box mb={3}>
      <HStack align="center" mb={2} spacing={2} width="100%">
        <CustomHiveIcon color={theme.colors.primary} />
        <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
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
        <Box flex={1} />
        <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color={"primary"}>
          {balance}
        </Text>
        <HStack spacing={1}>
          <Tooltip label="Send HIVE" hasArrow>
            <IconButton
              aria-label="Send HIVE"
              icon={<FaPaperPlane />}
              size="sm"
              bg="primary"
              color="background"
              _hover={{ bg: "accent" }}
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
              bg="primary"
              color="background"
              _hover={{ bg: "accent" }}
              onClick={() =>
                onModalOpen("Power Up", "Power Up your HIVE to HP")
              }
            />
          </Tooltip>
        </HStack>
      </HStack>

      {showInfo && (
        <Text color="gray.400" fontSize="sm" mb={2} pl={8}>
          The primary token of the Hive Blockchain. Liquid and transferable.
        </Text>
      )}
    </Box>
  );
}
