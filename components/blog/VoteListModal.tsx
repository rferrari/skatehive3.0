import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { getPayoutValue } from "@/lib/hive/client-functions";

interface Vote {
  voter: string;
  weight?: number;
  rshares?: number;
}

interface VoteListModalProps {
  isOpen: boolean;
  onClose: () => void;
  votes: Vote[];
  post: any;
}

const VoteListModal = ({ isOpen, onClose, votes, post }: VoteListModalProps) => {
  // Sort by rshares (raw value) descending, fallback to weight if rshares is missing
  const sortedVotes = [...votes].sort((a, b) => {
    const aValue = typeof a.rshares === "number" ? a.rshares : a.weight || 0;
    const bValue = typeof b.rshares === "number" ? b.rshares : b.weight || 0;
    return bValue - aValue;
  });

  // Calculate total rshares for the post
  const totalRshares = votes.reduce((sum, v) => sum + (typeof v.rshares === "number" ? v.rshares : 0), 0);
  // Get payout value for the post
  const payout = parseFloat(getPayoutValue(post));

  // Use theme colors
  const bg = useColorModeValue("white", "gray.900");
  const hoverBg = useColorModeValue("gray.100", "gray.800");
  const valueColor = useColorModeValue("green.600", "green.300");
  const emptyColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg={bg}>
        <ModalHeader>Voters</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack
            align="stretch"
            spacing={2}
            maxH="400px"
            overflowY="auto"
            sx={{
              scrollbarWidth: 'none', // Firefox
              '::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari
            }}
          >
            {sortedVotes.length === 0 && (
              <Text color={emptyColor}>No votes yet.</Text>
            )}
            {sortedVotes.map((vote, idx) => {
              const rshares = typeof vote.rshares === "number" ? vote.rshares : vote.weight || 0;
              // Estimate dollar value
              const dollarValue = totalRshares > 0 ? (rshares / totalRshares) * payout : 0;
              return (
                <HStack key={vote.voter + idx} spacing={2} p={1} borderRadius="md" _hover={{ bg: hoverBg }}>
                  <Link
                    href={`/@${vote.voter}`}
                    display="flex"
                    alignItems="center"
                    flex={1}
                    minW={0}
                    _hover={{ textDecoration: "underline" }}
                  >
                    <Avatar size="md" name={vote.voter} src={`https://images.hive.blog/u/${vote.voter}/avatar/sm`} mr={2} />
                    <Text fontWeight="bold" fontSize="lg" isTruncated>{vote.voter}</Text>
                  </Link>
                  <Text fontFamily="mono" color={valueColor} fontSize="md">
                    ${dollarValue.toFixed(4)}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VoteListModal; 