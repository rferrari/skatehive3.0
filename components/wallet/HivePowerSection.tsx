import {
  Box,
  Stack,
  Text,
  Image,
  HStack,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { FaArrowDown } from "react-icons/fa";
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

  return (
    <Box mb={3}>
      <Box pl={{ base: 0, md: 0 }} borderLeft="none" borderColor="none" mb={4}>
        <Stack direction={{ base: "column", md: "row" }} mb={1} align="center">
          <Image
            src="/images/hp_logo.png"
            alt="Hive Power Logo"
            width="6"
            height="6"
            style={{ marginTop: 4 }}
          />
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
            HIVE POWER (HP)
          </Text>
          <Box flex={1} display={{ base: "none", md: "block" }} />
          <Text
            fontSize={{ base: "xl", md: "3xl" }}
            fontWeight="extrabold"
            color="lime"
          >
            {hivePower !== undefined ? hivePower : "Loading..."}
          </Text>
          <HStack spacing={1} wrap="wrap">
            <Tooltip label="Power Down" hasArrow>
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
                    "Power Down",
                    "Create a Hive Power unstake request. The request is fulfilled once a week over the next 13 weeks."
                  )
                }
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
        <Text color="gray.400">
          your upvote (curation) power. Exchanging Hive for Hive Power is called
          &quot;Powering Up&quot; or &quot;Staking&quot;.
        </Text>
        <Text color="gray.400">
          Increases the more effectively you vote on posts
        </Text>
      </Box>
    </Box>
  );
}
