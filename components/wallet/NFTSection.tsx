import {
    Box,
    Text,
    HStack,
    VStack,
    Spinner,
    Alert,
    AlertIcon,
    Image,
    Flex,
    Switch,
    FormControl,
    FormLabel,
    Badge,
    Button,
    useDisclosure,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    useBreakpointValue,
    IconButton,
    Tooltip,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { FaEye, FaEyeSlash, FaExternalLinkAlt } from "react-icons/fa";
import { usePortfolio } from "../../hooks/usePortfolio";
import { NFT, blockchainDictionary } from "../../types/portfolio";
import useIsMobile from "@/hooks/useIsMobile";

export default function NFTSection() {
    const { isConnected, address } = useAccount();
    const { portfolio, isLoading, error } = usePortfolio(address);
    const [showNFTs, setShowNFTs] = useState(false);
    const [hideFloorless, setHideFloorless] = useState(true);
    const isMobile = useIsMobile();

    // Console log the portfolio to understand the structure
    console.log("Portfolio object:", portfolio);
    console.log("Portfolio NFTs:", portfolio?.nfts);

    // Memoize filtered NFTs
    const filteredNFTs = useMemo(() => {
        if (!portfolio?.nfts) return [];

        let nfts = portfolio.nfts;

        // Filter for only Gnars and SkateHive NFTs
        nfts = nfts.filter((nft: any) => {
            const collectionName = nft.token?.collection?.name?.toLowerCase() || "";
            const collectionAddress = nft.token?.collection?.address?.toLowerCase() || "";
            const network = nft.token?.collection?.network?.toLowerCase() || "";

            // Log each NFT for debugging
            console.log("NFT Collection:", {
                name: nft.token?.collection?.name,
                address: nft.token?.collection?.address,
                network: nft.token?.collection?.network,
                fullNFT: nft
            });

            // Check for Gnars NFTs (Gnars contract on Base network)
            const isGnars = (collectionName.includes("gnars") || collectionName.includes("gnar")) ||
                (collectionAddress === "0x880fb3cf5c6cc2d7dfc13a993e839a9411200c17" && network === "base");

            // Check for SkateHive NFTs (multiple possible variations)
            const isSkateHive = collectionName.includes("skatehive") ||
                collectionName.includes("skate hive") ||
                collectionName.includes("skthv") ||
                collectionAddress === "0xfe10d3ce1b0f090935670368ec6de00d8d965523"; // SkateHive contract address

            return isGnars || isSkateHive;
        });

        // Filter out NFTs without floor price if hideFloorless is enabled
        if (hideFloorless) {
            nfts = nfts.filter((nft: any) => {
                const floorPrice = parseFloat(nft.token?.collection?.floorPriceEth || "0");
                return floorPrice > 0;
            });
        }

        // Sort by estimated value (highest first)
        return nfts.sort((a: any, b: any) => {
            const aValue = parseFloat(a.token?.estimatedValueEth || "0");
            const bValue = parseFloat(b.token?.estimatedValueEth || "0");
            return bValue - aValue;
        });
    }, [portfolio?.nfts, hideFloorless]);

    const formatEthValue = (ethString: string) => {
        const value = parseFloat(ethString);
        if (value === 0) return "—";
        if (value < 0.001) return "< 0.001 ETH";
        return `${value.toFixed(3)} ETH`;
    };

    const formatUSDValue = (ethString: string, ethPrice: number = 3000) => {
        const value = parseFloat(ethString);
        if (value === 0) return "—";
        const usdValue = value * ethPrice;
        if (usdValue < 1) return "< $1";
        return `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    // Mobile NFT Card Component
    const MobileNFTCard = ({ nft }: { nft: any }) => {
        const imageUrl = nft.token?.medias?.[0]?.url || "/skatehive_logo.png";
        const collectionName = nft.token?.collection?.name || "Unknown Collection";
        const tokenName = nft.token?.name || "";
        const floorPrice = nft.token?.collection?.floorPriceEth || "0";
        const estimatedValue = nft.token?.estimatedValueEth || "0";
        const rarityRank = nft.rarityRank;

        return (
            <Box
                p={4}
                bg="background"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.700"
                mb={3}
                _hover={{ bg: "gray.800" }}
            >
                <HStack spacing={3} align="start">
                    {/* NFT Image */}
                    <Box flexShrink={0}>
                        <Image
                            src={imageUrl}
                            alt={collectionName}
                            w="80px"
                            h="80px"
                            borderRadius="md"
                            objectFit="cover"
                            fallback={
                                <Box
                                    w="80px"
                                    h="80px"
                                    borderRadius="md"
                                    bg="gray.600"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Text fontSize="xs" color="gray.400" textAlign="center">
                                        No Image
                                    </Text>
                                </Box>
                            }
                        />
                    </Box>

                    {/* NFT Info */}
                    <VStack spacing={1} align="start" flex={1} minW={0}>
                        <Text
                            fontWeight="medium"
                            color="white"
                            fontSize="sm"
                            noOfLines={1}
                        >
                            {collectionName} {tokenName}
                        </Text>

                        {rarityRank && (
                            <Badge colorScheme="purple" fontSize="xs" variant="solid">
                                Rank #{rarityRank}
                            </Badge>
                        )}

                        <HStack spacing={2} align="center" flexWrap="wrap">
                            <VStack spacing={0} align="start">
                                <Text fontSize="xs" color="gray.400">
                                    Floor Price
                                </Text>
                                <Text fontSize="xs" color="white">
                                    {formatEthValue(floorPrice)}
                                </Text>
                            </VStack>

                            <VStack spacing={0} align="start">
                                <Text fontSize="xs" color="gray.400">
                                    Est. Value
                                </Text>
                                <Text fontSize="xs" color="green.400">
                                    {formatEthValue(estimatedValue)}
                                </Text>
                            </VStack>
                        </HStack>

                        <Button
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            leftIcon={<FaExternalLinkAlt />}
                            fontSize="xs"
                            onClick={() => {
                                // Open on OpenSea or similar marketplace
                                const address = nft.token?.collection?.address;
                                const network = nft.token?.collection?.network || "ethereum";
                                if (address) {
                                    // Use appropriate OpenSea URL based on network
                                    const baseUrl = network === "base"
                                        ? `https://opensea.io/assets/base/${address}`
                                        : `https://opensea.io/assets/ethereum/${address}`;
                                    window.open(baseUrl, '_blank');
                                }
                            }}
                        >
                            View
                        </Button>
                    </VStack>
                </HStack>
            </Box>
        );
    };

    return (
        <Box
            mt={8}
            p={2}
            borderRadius="base"
            bg="muted"
            w={"100wh"}
            textAlign="left"
        >
            <HStack
                p={4}
                bg="background"
                borderRadius="md"
                mb={4}
                border="2px solid"
                borderColor="purple.200"
                textAlign="center"
                justify="center"
                position="relative"
            >
                {/* Absolutely centered text */}
                <Box position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)" zIndex={1}>
                    <Text fontSize="sm" color="purple.200" mb={1}>
                        Gnars & SkateHive NFTs
                    </Text>
                </Box>
                {/* IconButton on the right */}
                <Box position="absolute" right={4} top="50%" transform="translateY(-50%)" zIndex={2}>
                    <IconButton
                        aria-label={showNFTs ? "Hide NFTs" : "Show NFTs"}
                        icon={showNFTs ? <FaEyeSlash /> : <FaEye />}
                        onClick={() => setShowNFTs(!showNFTs)}
                        variant="ghost"
                        colorScheme="purple"
                        size="sm"
                    />
                </Box>
            </HStack>

            {isConnected && address && (
                <Box>
                    {/* NFT Section - only display if showNFTs is true */}
                    {showNFTs && (
                        <>
                            <HStack spacing={2} m={2} flexWrap="wrap" justifyContent={"space-between"}>
                                <Text fontSize="xs" color="gray.400">
                                    {filteredNFTs.length} Gnars & SkateHive NFTs found
                                </Text>
                                <FormControl display="flex" alignItems="center" w="auto">
                                    <FormLabel htmlFor="hide-floorless" mb="0" fontSize="sm" whiteSpace="nowrap">
                                        Hide Floorless
                                    </FormLabel>
                                    <Switch
                                        id="hide-floorless"
                                        isChecked={hideFloorless}
                                        onChange={(e) => setHideFloorless(e.target.checked)}
                                        colorScheme="purple"
                                    />
                                </FormControl>
                            </HStack>

                            {isLoading && (
                                <Flex justify="center" align="center" py={4}>
                                    <Spinner color="primary" />
                                </Flex>
                            )}

                            {error && (
                                <Alert status="error" mb={4}>
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            {portfolio && (
                                <>
                                    {isMobile ? (
                                        // Mobile Card Layout
                                        <VStack spacing={0} align="stretch">
                                            {filteredNFTs.length > 0 ? (
                                                filteredNFTs.map((nft: any, index: number) => (
                                                    <MobileNFTCard
                                                        key={`${nft.token?.collection?.address}-${index}`}
                                                        nft={nft}
                                                    />
                                                ))
                                            ) : (
                                                <Box py={8} textAlign="center">
                                                    <Text color="muted">
                                                        {hideFloorless ? "No Gnars or SkateHive NFTs with floor price found" : "No Gnars or SkateHive NFTs found in portfolio"}
                                                    </Text>
                                                </Box>
                                            )}
                                        </VStack>
                                    ) : (
                                        // Desktop Table Layout
                                        <TableContainer>
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase">
                                                            Collection
                                                        </Th>
                                                        <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase" isNumeric>
                                                            Floor Price
                                                        </Th>
                                                        <Th color="gray.400" fontSize="xs" fontWeight="normal" textTransform="uppercase" isNumeric>
                                                            Est. Value
                                                        </Th>

                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {filteredNFTs.length > 0 ? (
                                                        filteredNFTs.map((nft: any, index: number) => {
                                                            const imageUrl = nft.token?.medias?.[0]?.url || "/skatehive_logo.png";
                                                            const collectionName = nft.token?.collection?.name || "Unknown Collection";
                                                            const tokenName = nft.token?.name || "";
                                                            const floorPrice = nft.token?.collection?.floorPriceEth || "0";
                                                            const estimatedValue = nft.token?.estimatedValueEth || "0";
                                                            const rarityRank = nft.rarityRank;
                                                            const collectionAddress = nft.token?.collection?.address;
                                                            const network = nft.token?.collection?.network || "ethereum";

                                                            return (
                                                                <Tr
                                                                    key={`${collectionAddress}-${index}`}
                                                                    _hover={{ bg: "gray.800" }}
                                                                    borderBottom="1px solid"
                                                                    borderColor="gray.700"
                                                                >
                                                                    {/* Collection Column */}
                                                                    <Td py={3}>
                                                                        <HStack spacing={3}>
                                                                            <Image
                                                                                src={imageUrl}
                                                                                alt={collectionName}
                                                                                w="40px"
                                                                                h="40px"
                                                                                borderRadius="md"
                                                                                objectFit="cover"
                                                                                fallback={
                                                                                    <Box
                                                                                        w="40px"
                                                                                        h="40px"
                                                                                        borderRadius="md"
                                                                                        bg="gray.600"
                                                                                        display="flex"
                                                                                        alignItems="center"
                                                                                        justifyContent="center"
                                                                                    >
                                                                                        <Text fontSize="xs" color="gray.400">
                                                                                            NFT
                                                                                        </Text>
                                                                                    </Box>
                                                                                }
                                                                            />
                                                                            <VStack spacing={0} align="start">
                                                                                <Text
                                                                                    fontWeight="medium"
                                                                                    color="white"
                                                                                    fontSize="sm"
                                                                                    noOfLines={1}
                                                                                >
                                                                                    {collectionName} {tokenName}
                                                                                </Text>
                                                                                <Text fontSize="xs" color="gray.400">
                                                                                    {network.charAt(0).toUpperCase() + network.slice(1)}
                                                                                </Text>
                                                                            </VStack>
                                                                        </HStack>
                                                                    </Td>

                                                                    {/* Floor Price Column */}
                                                                    <Td py={3} isNumeric>
                                                                        <VStack spacing={0} align="end">
                                                                            <Text fontSize="sm" color="white">
                                                                                {formatEthValue(floorPrice)}
                                                                            </Text>
                                                                            <Text fontSize="xs" color="gray.400">
                                                                                {formatUSDValue(floorPrice)}
                                                                            </Text>
                                                                        </VStack>
                                                                    </Td>

                                                                    {/* Est. Value Column */}
                                                                    <Td py={3} isNumeric>
                                                                        <VStack spacing={0} align="end">
                                                                            <Text fontSize="sm" color="green.400" fontWeight="medium">
                                                                                {formatEthValue(estimatedValue)}
                                                                            </Text>
                                                                            <Text fontSize="xs" color="gray.400">
                                                                                {formatUSDValue(estimatedValue)}
                                                                            </Text>
                                                                        </VStack>
                                                                    </Td>
                                                                </Tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <Tr>
                                                            <Td colSpan={3} textAlign="center" py={8}>
                                                                <Text color="muted">
                                                                    {hideFloorless ? "No Gnars or SkateHive NFTs with floor price found" : "No Gnars or SkateHive NFTs found in portfolio"}
                                                                </Text>
                                                            </Td>
                                                        </Tr>
                                                    )}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
}
