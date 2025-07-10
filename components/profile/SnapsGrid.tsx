"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Image,
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

const SnapGridItem = ({
    snap,
    onClick,
}: {
    snap: SnapWithMedia;
    onClick: () => void;
}) => {
    const firstImage = snap.media.images[0];
    const firstVideo = snap.media.videos[0];
    const hasMultipleMedia =
        snap.media.images.length + snap.media.videos.length > 1;

    return (
        <Box
            position="relative"
            cursor="pointer"
            onClick={onClick}
            _hover={{
                transform: "scale(1.02)",
                transition: "transform 0.2s",
            }}
            overflow="hidden"
            bg="muted"
            width="100%"
        >
            {firstImage ? (
                <Image
                    src={firstImage}
                    alt="Snap content"
                    objectFit="cover"
                    width="100%"
                    height="auto"
                    loading="lazy"
                />
            ) : firstVideo ? (
                <Box width="100%" overflow="hidden">
                    <VideoPreview
                        src={firstVideo}
                        onClick={onClick}
                    />
                </Box>
            ) : (
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="200px"
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
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                if (
                    window.innerHeight + document.documentElement.scrollTop >=
                    document.documentElement.offsetHeight - 300
                ) {
                    if (hasMore && !isLoading) {
                        loadMoreSnaps();
                    }
                }
            }, 100);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            clearTimeout(debounceTimer);
            window.removeEventListener("scroll", handleScroll);
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
            <Box
                w="full"
                sx={{
                    columnCount: { base: 2, md: 3, lg: 4 },
                    columnGap: "0px",
                }}
            >
                {snaps.map((snap, index) => (
                    <Box
                        key={snap.permlink}
                        mb="0px"
                        sx={{ breakInside: "avoid" }}
                    >
                        <SnapGridItem
                            snap={snap}
                            onClick={() => handleSnapClick(index)}
                        />
                    </Box>
                ))}
            </Box>

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
