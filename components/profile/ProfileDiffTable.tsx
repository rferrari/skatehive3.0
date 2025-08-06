import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  VStack,
  HStack,
  Icon,
  Code,
  Divider
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaMinus, FaCheck } from 'react-icons/fa';
import { ProfileDiff, ProfileDiffItem } from '@/lib/utils/profileDiff';

interface ProfileDiffTableProps {
  diff: ProfileDiff;
}

const ProfileDiffTable: React.FC<ProfileDiffTableProps> = ({ diff }) => {
  const getChangeIcon = (type: ProfileDiffItem['type']) => {
    switch (type) {
      case 'added':
        return <Icon as={FaPlus} color="green.500" />;
      case 'modified':
        return <Icon as={FaEdit} color="yellow.500" />;
      case 'unchanged':
        return <Icon as={FaCheck} color="gray.500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (type: ProfileDiffItem['type']) => {
    switch (type) {
      case 'added':
        return 'green';
      case 'modified':
        return 'yellow';
      case 'unchanged':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const renderValue = (value: string | null, isAfter: boolean = false) => {
    if (!value) {
      return (
        <Text color="gray.500" fontStyle="italic" fontSize="sm">
          {isAfter ? 'No change' : 'Not set'}
        </Text>
      );
    }

    // Check if it's a video parts count
    if (value.includes('video part')) {
      return (
        <Badge colorScheme="blue" fontSize="xs" p={1}>
          {value}
        </Badge>
      );
    }

    // Check if it's a wallet count
    if (value.includes('wallet') && !value.startsWith('0x')) {
      return (
        <Badge colorScheme="purple" fontSize="xs" p={1}>
          {value}
        </Badge>
      );
    }

    // Check if it's vote settings
    if (value.includes('Weight:') && value.includes('Slider:')) {
      return (
        <VStack align="start" spacing={1}>
          {value.split(', ').map((setting, index) => (
            <Text key={index} fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }}>
              {setting}
            </Text>
          ))}
        </VStack>
      );
    }

    // Check if value looks like JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      return (
        <Code 
          fontSize="xs" 
          p={2} 
          borderRadius="md" 
          maxW="250px" 
          maxH="100px"
          overflow="auto"
          whiteSpace="pre-wrap"
        >
          {value}
        </Code>
      );
    }

    // Check if it's a wallet address
    if (value.startsWith('0x') && value.length === 42) {
      return (
        <Code fontSize="xs" p={1} borderRadius="md">
          {`${value.slice(0, 6)}...${value.slice(-4)}`}
        </Code>
      );
    }

    return (
      <Text fontSize="sm" maxW="250px" wordBreak="break-word">
        {value}
      </Text>
    );
  };

  if (!diff.hasChanges) {
    return (
      <Box p={4} borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
        <HStack>
          <Icon as={FaCheck} color="blue.500" />
          <Text color="blue.700" _dark={{ color: "blue.300" }}>
            No changes will be made to your profile metadata.
          </Text>
        </HStack>
      </Box>
    );
  }

  // Separate changes by type
  const addedChanges = diff.changes.filter(change => change.type === 'added');
  const modifiedChanges = diff.changes.filter(change => change.type === 'modified');
  const unchangedChanges = diff.changes.filter(change => change.type === 'unchanged');

  const totalChanges = addedChanges.length + modifiedChanges.length;
  const showScrollHint = totalChanges > 5;

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontWeight="bold" mb={2} fontSize="lg">
          Profile Changes Preview
        </Text>
        <Text color="gray.600" _dark={{ color: "gray.400" }} fontSize="sm">
          Review the changes that will be made to your profile:
        </Text>
        {showScrollHint && (
          <Text color="blue.600" _dark={{ color: "blue.400" }} fontSize="xs" mt={1} fontStyle="italic">
            💡 Scroll within the table to see all changes
          </Text>
        )}
      </Box>

      {/* Changes Table */}
      <Box 
        borderRadius="md" 
        overflow="hidden" 
        border="1px" 
        borderColor="border"
        maxH="400px"
        overflowY="auto"
      >
        <Table size="sm" variant="simple">
          <Thead bg="gray.50" _dark={{ bg: "gray.700" }} position="sticky" top={0} zIndex={1}>
            <Tr>
              <Th width="20px"></Th>
              <Th minW="120px">Field</Th>
              <Th minW="150px">Before</Th>
              <Th minW="150px">After</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* Added fields */}
            {addedChanges.map((change, index) => (
              <Tr key={`added-${index}`} bg="green.50" _dark={{ bg: "green.900" }}>
                <Td>{getChangeIcon(change.type)}</Td>
                <Td verticalAlign="top">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {change.label}
                    </Text>
                    <Badge colorScheme={getChangeColor(change.type)} size="sm">
                      Added
                    </Badge>
                  </VStack>
                </Td>
                <Td verticalAlign="top">{renderValue(change.before)}</Td>
                <Td bg="green.100" _dark={{ bg: "green.800" }} verticalAlign="top">
                  {renderValue(change.after, true)}
                </Td>
              </Tr>
            ))}

            {/* Modified fields */}
            {modifiedChanges.map((change, index) => (
              <Tr key={`modified-${index}`} bg="yellow.50" _dark={{ bg: "yellow.900" }}>
                <Td>{getChangeIcon(change.type)}</Td>
                <Td verticalAlign="top">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {change.label}
                    </Text>
                    <Badge colorScheme={getChangeColor(change.type)} size="sm">
                      Modified
                    </Badge>
                  </VStack>
                </Td>
                <Td bg="red.100" _dark={{ bg: "red.800" }} verticalAlign="top">
                  {renderValue(change.before)}
                </Td>
                <Td bg="green.100" _dark={{ bg: "green.800" }} verticalAlign="top">
                  {renderValue(change.after, true)}
                </Td>
              </Tr>
            ))}

            {/* Unchanged fields (show first 3 to not overwhelm) */}
            {unchangedChanges.slice(0, 3).map((change, index) => (
              <Tr key={`unchanged-${index}`} opacity={0.7}>
                <Td>{getChangeIcon(change.type)}</Td>
                <Td verticalAlign="top">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {change.label}
                    </Text>
                    <Badge colorScheme={getChangeColor(change.type)} size="sm">
                      Unchanged
                    </Badge>
                  </VStack>
                </Td>
                <Td verticalAlign="top">{renderValue(change.before)}</Td>
                <Td verticalAlign="top">{renderValue(change.after, true)}</Td>
              </Tr>
            ))}

            {unchangedChanges.length > 3 && (
              <Tr>
                <Td colSpan={4} textAlign="center" color="gray.500" fontSize="sm" py={2}>
                  ... and {unchangedChanges.length - 3} more unchanged fields
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Summary */}
      <Box p={3} borderRadius="md" bg="gray.50" _dark={{ bg: "gray.700" }}>
        <HStack spacing={4} justify="center">
          {addedChanges.length > 0 && (
            <HStack>
              <Icon as={FaPlus} color="green.500" />
              <Text fontSize="sm" color="green.600" _dark={{ color: "green.400" }}>
                {addedChanges.length} added
              </Text>
            </HStack>
          )}
          {modifiedChanges.length > 0 && (
            <HStack>
              <Icon as={FaEdit} color="yellow.500" />
              <Text fontSize="sm" color="yellow.600" _dark={{ color: "yellow.400" }}>
                {modifiedChanges.length} modified
              </Text>
            </HStack>
          )}
          {unchangedChanges.length > 0 && (
            <HStack>
              <Icon as={FaCheck} color="gray.500" />
              <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                {unchangedChanges.length} unchanged
              </Text>
            </HStack>
          )}
        </HStack>
      </Box>
    </VStack>
  );
};

export default ProfileDiffTable;
