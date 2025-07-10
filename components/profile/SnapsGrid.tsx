"use client";
import React, { useState, useEffect } from "react";
import {
    Grid,
    Box,
    Image,
    AspectRatio,
    Text,
    Icon,
    Spinner,
    VStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    useDisclosure,
    IconButton,
    HStack,
} from "@chakra-ui/react";
import { FaPlay, FaImage, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Discussion } from "@hiveio/dhive";
import useUserSnaps from "@/hooks/useUserSnaps";
import VideoPreview from "./VideoPreview";
import VideoRenderer from "../layout/VideoRenderer";

interface SnapsGridProps {
    username: string;
}

interface SnapWithMedia extends Discussion {
    media: {
        images: string[];
        videos: string[];
        hasMedia: boolean;
    };
}

interface SnapModalProps {
    snap: SnapWithMedia;
    isOpen: boolean;
    onClose: () => void;
}

const SnapModal = ({ snap, isOpen, onClose }: SnapModalProps) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const allMedia = [...snap.media.images, ...snap.media.videos];
    const currentMedia = allMedia[currentMediaIndex];
    const isVideo = snap.media.videos.includes(currentMedia);

    const nextMedia = () => {
        setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
    };

    const prevMedia = () => {
        setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    };

    useEffect(() => {
        setCurrentMediaIndex(0);
    }, [snap]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
            <ModalOverlay bg="blackAlpha.800" />
            <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
                <ModalCloseButton color="white" size="lg" top={4} right={4} zIndex={10} />
                <ModalBody p={0} position="relative">
                    <VStack spacing={4} align="stretch" h="full">
                        {/* Media Display */}
                        <Box position="relative" borderRadius="lg" overflow="hidden" bg="black">
                            <AspectRatio ratio={1} maxH="70vh">
                                {isVideo ? (
                                    <VideoRenderer
                                        src={currentMedia}
                                        loop={true}
                                    />
                                ) : (
                                    <Image
                                        src={currentMedia}
                                        alt="Snap content"
                                        objectFit="cover"
                                        w="100%"
                                        h="100%"
                                    />
                                )}
                            </AspectRatio>

                            {/* Navigation Arrows */}
                            {allMedia.length > 1 && (
                                <>
                                    <IconButton
                                        aria-label="Previous media"
                                        icon={<FaChevronLeft />}
                                        position="absolute"
                                        left={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        bg="blackAlpha.600"
                                        color="white"
                                        _hover={{ bg: "blackAlpha.800" }}
                                        onClick={prevMedia}
                                    />
                                    <IconButton
                                        aria-label="Next media"
                                        icon={<FaChevronRight />}
                                        position="absolute"
                                        right={2}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        bg="blackAlpha.600"
                                        color="white"
                                        _hover={{ bg: "blackAlpha.800" }}
                                        onClick={nextMedia}
                                    />
                                </>
                            )}

                            {/* Media Counter */}
                            {allMedia.length > 1 && (
                                <Box
                                    position="absolute"
                                    top={4}
                                    left="50%"
                                    transform="translateX(-50%)"
                                    bg="blackAlpha.700"
                                    color="white"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    fontSize="sm"
                                >
                                    {currentMediaIndex + 1} / {allMedia.length}
                                </Box>
                            )}
                        </Box>

                        {/* Snap Info */}
                        <Box bg="background" p={4} borderRadius="lg">
                            <VStack align="start" spacing={2}>
                                <HStack>
                                    <Text fontWeight="bold" color="primary">
                                        @{snap.author}
                                    </Text>
                                    <Text fontSize="sm" color="muted">
                                        {new Date(snap.created).toLocaleDateString()}
                                    </Text>
                                </HStack>
                                {snap.body && (
                                    <Text color="text" fontSize="sm">
                                        {snap.body}
                                    </Text>
                                )}
                            </VStack>
                        </Box>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

const SnapGridItem = ({ snap, onClick }: { snap: SnapWithMedia; onClick: () => void }) => {
    const firstImage = snap.media.images[0];
    const firstVideo = snap.media.videos[0];
    const hasMultipleMedia = snap.media.images.length + snap.media.videos.length > 1;

    return (
        <AspectRatio ratio={1}>
            <Box
                position="relative"
                cursor="pointer"
                onClick={onClick}
                _hover={{
                    transform: "scale(1.02)",
                    transition: "transform 0.2s",
                }}
                borderRadius="md"
                overflow="hidden"
                bg="muted"
            >
                {firstImage ? (
                    <Image
                        src={firstImage}
                        alt="Snap content"
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        loading="lazy"
                    />
                ) : firstVideo ? (
                    <VideoPreview
                        src={firstVideo}
                        onClick={onClick}
                    />
                ) : (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        h="100%"
                        bg="muted"
                    >
                        <Icon as={FaImage} boxSize={8} color="text" />
                    </Box>
                )}

                {/* Multiple media indicator */}
                {hasMultipleMedia && (
                    <Box
                        position="absolute"
                        top={2}
                        right={2}
                        bg="blackAlpha.700"
                        borderRadius="full"
                        p={1}
                    >
                        <Icon as={FaImage} color="white" boxSize={3} />
                    </Box>
                )}
            </Box>
        </AspectRatio>
    );
};

export default function SnapsGrid({ username }: SnapsGridProps) {
    const { snaps, isLoading, hasMore, loadMoreSnaps } = useUserSnaps(username);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedSnap, setSelectedSnap] = useState<SnapWithMedia | null>(null);

    const handleSnapClick = (snap: SnapWithMedia) => {
        setSelectedSnap(snap);
        onOpen();
    };

    // Infinite scroll effect with debouncing
    useEffect(() => {
        let debounceTimer: NodeJS.Timeout;

        const handleScroll = () => {
            // Clear previous timer
            clearTimeout(debounceTimer);

            // Debounce the scroll event
            debounceTimer = setTimeout(() => {
                if (
                    window.innerHeight + document.documentElement.scrollTop
                    >= document.documentElement.offsetHeight - 300 // Reduced threshold for quicker loading
                ) {
                    if (hasMore && !isLoading) {
                        loadMoreSnaps();
                    }
                }
            }, 100); // 100ms debounce delay
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            // Clear debounce timer to prevent memory leaks
            clearTimeout(debounceTimer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [hasMore, isLoading, loadMoreSnaps]);

    if (snaps.length === 0 && !isLoading) {
        return (
            <VStack spacing={4} py={8}>
                <Icon as={FaImage} boxSize={12} color="muted" />
                <Text color="muted" textAlign="center">
                    No snaps with media found for @{username}
                </Text>
            </VStack>
        );
    }

    return (
        <>
            <Grid
                templateColumns={{
                    base: "repeat(3, 1fr)",
                    md: "repeat(4, 1fr)",
                    lg: "repeat(5, 1fr)",
                }}
                gap={1}
                p={0}
            >
                {snaps.map((snap) => (
                    <SnapGridItem
                        key={snap.permlink}
                        snap={snap}
                        onClick={() => handleSnapClick(snap)}
                    />
                ))}
            </Grid>

            {isLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                    <Spinner color="primary" />
                </Box>
            )}

            {selectedSnap && (
                <SnapModal
                    snap={selectedSnap}
                    isOpen={isOpen}
                    onClose={onClose}
                />
            )}
        </>
    );
}
