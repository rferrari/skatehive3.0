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
    useDisclosure,
} from "@chakra-ui/react";
import { FaImage } from "react-icons/fa";
import useUserSnaps from "@/hooks/useUserSnaps";
import VideoPreview from "./VideoPreview";
import SnapModal, { type SnapWithMedia } from "./SnapModal";

interface SnapsGridProps {
    username: string;
}

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
    const [selectedSnapIndex, setSelectedSnapIndex] = useState<number>(0);

    const handleSnapClick = (snapIndex: number) => {
        setSelectedSnapIndex(snapIndex);
        onOpen();
    };

    const handleSnapChange = (newSnapIndex: number) => {
        setSelectedSnapIndex(newSnapIndex);
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
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                }}
                gap={1}
                p={0}
            >
                {snaps.map((snap, index) => (
                    <SnapGridItem
                        key={snap.permlink}
                        snap={snap}
                        onClick={() => handleSnapClick(index)}
                    />
                ))}
            </Grid>

            {isLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                    <Spinner color="primary" />
                </Box>
            )}

            {snaps.length > 0 && (
                <SnapModal
                    snap={snaps[selectedSnapIndex]}
                    snaps={snaps}
                    currentSnapIndex={selectedSnapIndex}
                    isOpen={isOpen}
                    onClose={onClose}
                    onSnapChange={handleSnapChange}
                />
            )}
        </>
    );
}
