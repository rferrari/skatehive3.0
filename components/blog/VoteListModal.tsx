import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  useColorModeValue,
  Link,
  Button,
} from "@chakra-ui/react";
import { getPayoutValue } from "@/lib/hive/client-functions";
import React from "react";

interface Vote {
  voter: string;
  weight?: number;
  rshares?: number;
}

interface VoteListPopoverProps {
  trigger: React.ReactNode;
  votes: Vote[];
  post: any;
}

const VoteListPopover = ({ trigger, votes, post }: VoteListPopoverProps) => {
  // Deduplicate votes by voter (keep the last occurrence)
  const uniqueVotesMap = new Map();
  votes.forEach((vote) => {
    uniqueVotesMap.set(vote.voter, vote);
  });
  const uniqueVotes = Array.from(uniqueVotesMap.values());

  // Sort by rshares (raw value) descending, fallback to weight if rshares is missing
  const sortedVotes = [...uniqueVotes].sort((a, b) => {
    const aValue = typeof a.rshares === "number" ? a.rshares : a.weight || 0;
    const bValue = typeof b.rshares === "number" ? b.rshares : b.weight || 0;
    return bValue - aValue;
  });

  // Calculate total rshares for the post
  const totalRshares = uniqueVotes.reduce((sum, v) => sum + (typeof v.rshares === "number" ? v.rshares : 0), 0);
  // Get payout value for the post
  const payout = parseFloat(getPayoutValue(post));

  // Use theme colors
  const bg = useColorModeValue("white", "gray.900");
  const hoverBg = useColorModeValue("gray.100", "gray.800");
  const valueColor = useColorModeValue("green.600", "green.300");
  const emptyColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Popover placement="auto" isLazy>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent w="320px" maxH="300px" overflowY="auto" bg={bg}>
        <PopoverHeader fontWeight="bold">Voters</PopoverHeader>
        <PopoverBody>
          <VStack
            align="stretch"
            spacing={1}
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
                <HStack key={vote.voter + idx} spacing={1} p={0.5} borderRadius="md" _hover={{ bg: hoverBg }} minH="32px">
                  <Link
                    href={`/user/${vote.voter}`}
                    display="flex"
                    alignItems="center"
                    flex={1}
                    minW={0}
                    _hover={{ textDecoration: "underline" }}
                  >
                    <Avatar size="sm" name={vote.voter} src={`https://images.hive.blog/u/${vote.voter}/avatar/sm`} mr={1} />
                    <Text fontWeight="medium" fontSize="sm" isTruncated>{vote.voter}</Text>
                  </Link>
                  <Text fontFamily="mono" color={valueColor} fontSize="sm">
                    ${dollarValue.toFixed(4)}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default VoteListPopover; 