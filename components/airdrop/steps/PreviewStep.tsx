"use client";

import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Image,
  ButtonGroup,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useState, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  ConnectionLineType,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { SortOption } from "@/types/airdrop";
import useIsMobile from "@/hooks/useIsMobile";
import { useAioha } from "@aioha/react-ui";
import { useAccount } from "wagmi";
import { Avatar, Name } from "@coinbase/onchainkit/identity";

interface PreviewStepProps {
  selectedToken: string;
  totalAmount: string;
  sortOption: SortOption;
  airdropUsers: any[];
  isHiveToken: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function PreviewStep({
  selectedToken,
  totalAmount,
  sortOption,
  airdropUsers,
  isHiveToken,
  onBack,
  onNext,
}: PreviewStepProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"table" | "flow">("table");

  // Get user connection status
  const { user } = useAioha();
  const { isConnected: isEthereumConnected, address: ethereumAddress } =
    useAccount();

  // Create React Flow nodes and edges for neural network visualization
  const { nodes, edges } = useMemo(() => {
    const centerX = 400;
    const centerY = 300;
    const radius = 250;

    // Central node (airdropper/sender)
    const centralNode: Node = {
      id: "sender",
      type: "default",
      position: { x: centerX - 40, y: centerY - 40 },
      data: {
        label: (
          <Box
            w="80px"
            h="80px"
            borderRadius="full"
            overflow="hidden"
            border="4px solid #667eea"
            boxShadow="0 8px 32px rgba(102, 126, 234, 0.4)"
          >
            {/* Show Hive user avatar if connected */}
            {user ? (
              <Image
                src={`https://images.hive.blog/u/${user}/avatar`}
                alt={user}
                w="100%"
                h="100%"
                objectFit="cover"
                fallback={
                  <Box
                    w="100%"
                    h="100%"
                    bg="#667eea"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="2xl"
                    fontWeight="bold"
                  >
                    {user.charAt(0).toUpperCase()}
                  </Box>
                }
              />
            ) : isEthereumConnected && ethereumAddress ? (
              /* Show Ethereum avatar if connected */
              <Box
                w="100%"
                h="100%"
                borderRadius="full"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Avatar
                  address={ethereumAddress as `0x${string}`}
                  className="w-full h-full rounded-full"
                />
              </Box>
            ) : (
              /* Fallback to skateboard logo */
              <Image
                src="/logo.png"
                alt="Sender"
                w="100%"
                h="100%"
                objectFit="cover"
                fallback={
                  <Box
                    w="100%"
                    h="100%"
                    bg="#667eea"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="2xl"
                    fontWeight="bold"
                  >
                    🛹
                  </Box>
                }
              />
            )}
          </Box>
        ),
      },
      style: {
        background: "transparent",
        border: "none",
        width: 80,
        height: 80,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };

    // Recipient nodes in a circular pattern with avatars only
    const recipientNodes: Node[] = airdropUsers
      .slice(0, 20)
      .map((user, index) => {
        const angle = (index / Math.min(airdropUsers.length, 20)) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        return {
          id: `user-${index}`,
          type: "default",
          position: { x: x - 30, y: y - 30 },
          data: {
            label: (
              <Box
                w="60px"
                h="60px"
                borderRadius="full"
                overflow="hidden"
                border={`3px solid ${
                  index < 3 ? "#ffd700" : index < 10 ? "#4a90e2" : "#cd7f32"
                }`}
                boxShadow={`0 4px 20px ${
                  index < 3
                    ? "rgba(255, 215, 0, 0.4)"
                    : index < 10
                    ? "rgba(74, 144, 226, 0.4)"
                    : "rgba(205, 127, 50, 0.4)"
                }`}
              >
                <Image
                  src={`https://images.hive.blog/u/${user.hive_author}/avatar/small`}
                  alt={user.hive_author}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  fallback={
                    <Box
                      w="100%"
                      h="100%"
                      bg={
                        index < 3
                          ? "#ffd700"
                          : index < 10
                          ? "#4a90e2"
                          : "#cd7f32"
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="lg"
                      fontWeight="bold"
                    >
                      {user.hive_author.charAt(0).toUpperCase()}
                    </Box>
                  }
                />
              </Box>
            ),
          },
          style: {
            background: "transparent",
            border: "none",
            width: 60,
            height: 60,
          },
          sourcePosition: Position.Left,
          targetPosition: Position.Right,
        };
      });

    // Create edges from sender to all recipients
    const amountPerRecipient = (
      parseFloat(totalAmount) / airdropUsers.length
    ).toFixed(2);
    const nodeEdges: Edge[] = airdropUsers.slice(0, 20).map((_, index) => {
      const getColor = (idx: number) => {
        if (idx < 3) return "#ffd700"; // Gold for top 3
        if (idx < 10) return "#4a90e2"; // Blue for top 10
        return "#cd7f32"; // Bronze for others
      };
      
      const edgeColor = getColor(index);
      
      return {
        id: `edge-${index}`,
        source: "sender",
        target: `user-${index}`,
        type: "smoothstep",
        animated: true,
        label: `${amountPerRecipient} ${selectedToken}`,
        labelStyle: {
          fill: edgeColor,
          fontWeight: 600,
          fontSize: 12,
        },
        labelBgStyle: {
          fill: "rgba(255, 255, 255, 0.95)",
          fillOpacity: 0.95,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: index < 3 ? 10 : index < 10 ? 7 : 4,
          opacity: 1,
          strokeDasharray: "8,4",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 30,
          height: 30,
        },
      };
    });

    return {
      nodes: [centralNode, ...recipientNodes],
      edges: nodeEdges,
    };
  }, [
    airdropUsers,
    selectedToken,
    totalAmount,
    user,
    isEthereumConnected,
    ethereumAddress,
  ]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  return (
    <>
      <VStack spacing={4} align="stretch">
        {/* View Toggle and Summary Card */}
        <VStack spacing={4} align="stretch">
          {/* View Toggle Buttons */}
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold" color="primary">
              Recipients Preview
            </Text>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="Table View" hasArrow>
                <IconButton
                  aria-label="Table view"
                  icon={<ViewIcon />}
                  onClick={() => setViewMode("table")}
                  colorScheme={viewMode === "table" ? "blue" : "gray"}
                  variant={viewMode === "table" ? "solid" : "outline"}
                />
              </Tooltip>
              <Tooltip label="Network View" hasArrow>
                <IconButton
                  aria-label="Network view"
                  icon={<ViewOffIcon />}
                  onClick={() => setViewMode("flow")}
                  colorScheme={viewMode === "flow" ? "blue" : "gray"}
                  variant={viewMode === "flow" ? "solid" : "outline"}
                />
              </Tooltip>
            </ButtonGroup>
          </HStack>
        </VStack>

        {/* Content Views */}
        {viewMode === "table" ? (
          // Table View (existing implementation)
          airdropUsers.length <= 20 ? (
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th color="textSecondary">Rank</Th>
                    <Th color="textSecondary">User</Th>
                    <Th color="textSecondary">Points</Th>
                    <Th color="textSecondary">Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {airdropUsers.map((user, index) => (
                    <Tr key={user.hive_author + index}>
                      <Td>
                        <Badge colorScheme="blue" fontSize="xs">
                          #{index + 1}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack>
                          <Image
                            src={`https://images.hive.blog/u/${user.hive_author}/avatar/small`}
                            alt={user.hive_author}
                            borderRadius="full"
                            boxSize="24px"
                            objectFit="cover"
                          />
                          <Text fontSize="sm" color="text" fontWeight="medium">
                            {user.hive_author}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="textSecondary">
                          {user.points?.toFixed(0) || 0}
                        </Text>
                      </Td>
                      <Td>
                        <Text
                          fontSize="sm"
                          color="primary"
                          fontWeight="semibold"
                        >
                          {(
                            parseFloat(totalAmount) / airdropUsers.length
                          ).toFixed(2)}{" "}
                          {selectedToken}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
              {airdropUsers.map((user, index) => (
                <HStack
                  key={user.hive_author + index}
                  p={3}
                  bg="cardBg"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="border"
                  justify="space-between"
                >
                  <HStack spacing={3}>
                    <Badge colorScheme="blue" fontSize="xs">
                      #{index + 1}
                    </Badge>
                    <Image
                      src={`https://images.hive.blog/u/${user.hive_author}/avatar/small`}
                      alt={user.hive_author}
                      borderRadius="full"
                      boxSize="32px"
                      objectFit="cover"
                      fallback={
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          bg="primary"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="background"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {user.hive_author.charAt(0).toUpperCase()}
                        </Box>
                      }
                    />
                    <VStack spacing={0} align="start">
                      <Text fontSize="sm" color="text" fontWeight="medium">
                        {user.hive_author}
                      </Text>
                      <Text fontSize="xs" color="textSecondary">
                        {user.points?.toFixed(0) || 0} points
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm" color="primary" fontWeight="semibold">
                    {(parseFloat(totalAmount) / airdropUsers.length).toFixed(2)}{" "}
                    {selectedToken}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )
        ) : (
          // React Flow Network View
          <Box
            h="500px"
            w="100%"
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            overflow="hidden"
            bg="transparent"
            position="relative"
            sx={{
              "& .react-flow": {
                "--xy-edge-stroke-default": "#4a90e2",
                "--xy-edge-stroke-width-default": "4",
                "--xy-connectionline-stroke-default": "#667eea",
                "--xy-connectionline-stroke-width-default": "3",
              },
              "& .react-flow__handle": {
                display: "none !important",
              },
              "& .react-flow__edge": {
                zIndex: 1000,
              },
              "& .react-flow__edge-path": {
                strokeWidth: "inherit !important",
              },
              "& .react-flow__connectionline": {
                stroke: "#667eea !important",
                strokeWidth: "3px !important",
              },
            }}
          >
            <Box
              position="absolute"
              inset={0}
              zIndex={0}
              pointerEvents="none"
              bgImage="url('/ogimage.png')"
              bgSize="cover"
              bgPosition="center"
              opacity={0.15}
            />
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              attributionPosition="bottom-left"
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnDoubleClick={false}
              panOnDrag={true}
              zoomOnPinch={true}
              zoomOnScroll={true}
              preventScrolling={false}
              minZoom={0.5}
              maxZoom={2}
              defaultEdgeOptions={{
                style: { strokeWidth: 4, stroke: '#4a90e2' },
                type: 'smoothstep',
                animated: true,
              }}
              style={{
                background: "transparent",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Background 
                color="rgba(235, 35, 208, 0.3)" 
                gap={30} 
                size={0.8}
              />

              <Controls
                position="top-right"
                showInteractive={false}
                showZoom={true}
                showFitView={true}
              />
            </ReactFlow>
          </Box>
        )}

        {/* Legend for Network View */}
        {viewMode === "flow" && (
          <Box
            bg="cardBg"
            p={3}
            borderRadius="md"
            border="1px solid"
            borderColor="border"
          >
            <Text fontSize="sm" fontWeight="bold" mb={2} color="primary">
              Airdrop Flow Legend
            </Text>
            <HStack spacing={4} flexWrap="wrap">
              <HStack spacing={2}>
                <Box w={3} h={3} bg="#667eea" borderRadius="full" />
                <Text fontSize="xs">Sender (You)</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w={3} h={3} bg="#ffd700" borderRadius="full" />
                <Text fontSize="xs">Top 3 Recipients</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w={3} h={3} bg="#4a90e2" borderRadius="full" />
                <Text fontSize="xs">Top 10 Recipients</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w={3} h={3} bg="#cd7f32" borderRadius="full" />
                <Text fontSize="xs">Other Recipients</Text>
              </HStack>
            </HStack>
            {airdropUsers.length > 20 && (
              <Text fontSize="xs" color="textSecondary" mt={2}>
                * Showing top 20 recipients in network view
              </Text>
            )}
          </Box>
        )}
      </VStack>
    </>
  );
}
