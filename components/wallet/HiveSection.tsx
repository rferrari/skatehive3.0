import { Box, Stack, Text, HStack, Tooltip, Icon } from "@chakra-ui/react";
import { FaPaperPlane, FaArrowUp } from "react-icons/fa";
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

  return (
    <Box mb={3}>
      <Stack
        direction={{ base: "column", md: "row" }}
        align="flex-start"
        mb={1}
        spacing={{ base: 2, md: 4 }}
      >
        <HStack align="center" mb={1} spacing={2} width="100%">
          <CustomHiveIcon color="rgb(233, 66, 95)" style={{ marginTop: 4 }} />
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
            HIVE
          </Text>
          <Box flex={1} />
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
            {balance}
          </Text>
        </HStack>
        <HStack spacing={1} wrap={{ base: "wrap", md: "nowrap" }} mb={2}>
          <Tooltip label="Send HIVE" hasArrow>
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
                  "Send HIVE",
                  "Send Hive to another account",
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
          <Tooltip label="Power Up" hasArrow>
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
                onModalOpen("Power Up", "Power Up your HIVE to HP")
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
      <Text color="gray.400" mb={4}>
        The primary token of the Hive Blockchain and often a reward on posts.
      </Text>
    </Box>
  );
}
