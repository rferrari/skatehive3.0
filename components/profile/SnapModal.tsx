"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Image,
    AspectRatio,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    IconButton,
    HStack,
    VStack,
    Flex,
    Divider,
} from "@chakra-ui/react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Discussion } from "@hiveio/dhive";
import VideoRenderer from "../layout/VideoRenderer";
import SnapComposer from "../homepage/SnapComposer";

interface SnapWithMedia extends Discussion {
    media: {
        images: string[];
        videos: string[];
        hasMedia: boolean;
    };
}

interface SnapModalProps {
    snap: SnapWithMedia;
    snaps: SnapWithMedia[];
    currentSnapIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onSnapChange: (snapIndex: number) => void;
}

const SnapModal = ({ snap, snaps, currentSnapIndex, isOpen, onClose, onSnapChange }: SnapModalProps) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [comments, setComments] = useState<Partial<Discussion>[]>([]);
    const allMedia = [...snap.media.images, ...snap.media.videos];
    const currentMedia = allMedia[currentMediaIndex];
    const isVideo = snap.media.videos.includes(currentMedia);

    const nextMedia = () => {
        setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
    };

    const prevMedia = () => {
        setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    };

    const nextSnap = () => {
        if (currentSnapIndex < snaps.length - 1) {
            onSnapChange(currentSnapIndex + 1);
        }
    };

    const prevSnap = () => {
        if (currentSnapIndex > 0) {
            onSnapChange(currentSnapIndex - 1);
        }
    };

    const handleNewComment = (newComment: Partial<Discussion>) => {
        setComments(prev => [newComment, ...prev]);
    };

    // Function to clean body text by removing image and video markdown
    const cleanBodyText = (body: string) => {
        if (!body) return '';

        // Remove image markdown: ![alt](url)
        let cleaned = body.replace(/!\[.*?\]\(.*?\)/g, '');

        // Remove video iframes: <iframe...></iframe>
        cleaned = cleaned.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

        // Remove extra whitespace and newlines
        cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();

        return cleaned;
    };

    useEffect(() => {
        setCurrentMediaIndex(0);
        setComments([]); // Reset comments when snap changes
    }, [snap]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            switch (event.key) {
                case 'ArrowLeft':
                    if (event.shiftKey) {
                        // Shift + Left = Previous snap
                        prevSnap();
                    } else if (allMedia.length > 1 && currentMediaIndex > 0) {
                        // Left = Previous media
                        prevMedia();
                    }
                    break;
                case 'ArrowRight':
                    if (event.shiftKey) {
                        // Shift + Right = Next snap
                        nextSnap();
                    } else if (allMedia.length > 1 && currentMediaIndex < allMedia.length - 1) {
                        // Right = Next media
                        nextMedia();
                    }
                    break;
                case 'ArrowUp':
                    // Up = Previous snap
                    prevSnap();
                    break;
                case 'ArrowDown':
                    // Down = Next snap
                    nextSnap();
                    break;
                case 'Escape':
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentMediaIndex, allMedia.length, currentSnapIndex, snaps.length]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "4xl" }} isCentered>
            <ModalOverlay bg="blackAlpha.900" />
            <ModalContent
                bg="background"
                maxW={{ base: "100vw", md: "80vw" }}
                maxH={{ base: "100vh", md: "90vh" }}
                borderRadius={{ base: "0", md: "lg" }}
                h={{ base: "100vh", md: "auto" }}
            >
                <ModalCloseButton
                    color="white"
                    size="lg"
                    top={{ base: 2, md: 4 }}
                    right={{ base: 2, md: 4 }}
                    zIndex={20}
                    bg="blackAlpha.600"
                    _hover={{ bg: "blackAlpha.800" }}
                    borderRadius="full"
                />
                <ModalBody p={0} position="relative">
                    <Flex
                        h={{ base: "100vh", md: "80vh" }}
                        direction={{ base: "column", md: "row" }}
                    >
                        {/* Left side - Media Display */}
                        <Box
                            position="relative"
                            flex={{ base: "none", md: "1" }}
                            h={{ base: "60vh", md: "100%" }}
                            bg="black"
                            borderRadius={{ base: "0", md: "lg" }}
                            overflow="hidden"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            userSelect="none"
                        >
                            {isVideo ? (
                                <Box
                                    w="100%"
                                    h="100%"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <VideoRenderer
                                        src={currentMedia}
                                        loop={true}
                                    />
                                </Box>
                            ) : (
                                <AspectRatio ratio={1} h="100%" w="100%">
                                    <Image
                                        src={currentMedia}
                                        alt="Snap content"
                                        objectFit="cover"
                                        w="100%"
                                        h="100%"
                                    />
                                </AspectRatio>
                            )}

                            {/* Navigation Arrows - Visible on all devices */}
                            {allMedia.length > 1 && (
                                <>
                                    <IconButton
                                        aria-label="Previous media"
                                        icon={<FaChevronLeft />}
                                        position="absolute"
                                        left={{ base: 1, md: 2 }}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        bg="blackAlpha.600"
                                        color="white"
                                        _hover={{ bg: "blackAlpha.800" }}
                                        onClick={prevMedia}
                                        zIndex={15}
                                        size={{ base: "sm", md: "md" }}
                                        isDisabled={currentMediaIndex === 0}
                                        opacity={currentMediaIndex === 0 ? 0.5 : 1}
                                    />
                                    <IconButton
                                        aria-label="Next media"
                                        icon={<FaChevronRight />}
                                        position="absolute"
                                        right={{ base: 1, md: 2 }}
                                        top="50%"
                                        transform="translateY(-50%)"
                                        bg="blackAlpha.600"
                                        color="white"
                                        _hover={{ bg: "blackAlpha.800" }}
                                        onClick={nextMedia}
                                        zIndex={15}
                                        size={{ base: "sm", md: "md" }}
                                        isDisabled={currentMediaIndex === allMedia.length - 1}
                                        opacity={currentMediaIndex === allMedia.length - 1 ? 0.5 : 1}
                                    />
                                </>
                            )}

                            {/* Media Counter */}
                            {allMedia.length > 1 && (
                                <Box
                                    position="absolute"
                                    top={{ base: 2, md: 4 }}
                                    left="50%"
                                    transform="translateX(-50%)"
                                    bg="blackAlpha.700"
                                    color="white"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    fontSize="sm"
                                    zIndex={10}
                                >
                                    {currentMediaIndex + 1} / {allMedia.length}
                                </Box>
                            )}

                            {/* Snap Navigation Arrows */}
                            {snaps.length > 1 && (
                                <>
                                    <IconButton
                                        aria-label="Previous snap"
                                        icon={<FaChevronLeft />}
                                        position="absolute"
                                        left={{ base: 1, md: 2 }}
                                        bottom={{ base: 20, md: 10 }}
                                        bg="primary"
                                        color="white"
                                        _hover={{ bg: "primary" }}
                                        onClick={prevSnap}
                                        zIndex={15}
                                        size={{ base: "sm", md: "md" }}
                                        isDisabled={currentSnapIndex === 0}
                                        opacity={currentSnapIndex === 0 ? 0.5 : 1}
                                    />
                                    <IconButton
                                        aria-label="Next snap"
                                        icon={<FaChevronRight />}
                                        position="absolute"
                                        right={{ base: 1, md: 2 }}
                                        bottom={{ base: 20, md: 10 }}
                                        bg="primary"
                                        color="white"
                                        _hover={{ bg: "primary" }}
                                        onClick={nextSnap}
                                        zIndex={15}
                                        size={{ base: "sm", md: "md" }}
                                        isDisabled={currentSnapIndex === snaps.length - 1}
                                        opacity={currentSnapIndex === snaps.length - 1 ? 0.5 : 1}
                                    />
                                </>
                            )}

                            {/* Snap Counter */}
                            {snaps.length > 1 && (
                                <Box
                                    position="absolute"
                                    bottom={{ base: 2, md: 4 }}
                                    left="50%"
                                    transform="translateX(-50%)"
                                    bg="primary"
                                    color="white"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    fontSize="sm"
                                    zIndex={10}
                                >
                                    Snap {currentSnapIndex + 1} / {snaps.length}
                                </Box>
                            )}

                            {/* Mobile swipe indicator dots */}
                            {allMedia.length > 1 && allMedia.length <= 5 && (
                                <Box
                                    position="absolute"
                                    bottom={4}
                                    left="50%"
                                    transform="translateX(-50%)"
                                    display={{ base: "flex", md: "none" }}
                                    gap={2}
                                    zIndex={10}
                                >
                                    {allMedia.map((_, index) => (
                                        <Box
                                            key={index}
                                            w={3}
                                            h={3}
                                            borderRadius="full"
                                            bg={index === currentMediaIndex ? "white" : "whiteAlpha.500"}
                                            transition="all 0.2s"
                                            cursor="pointer"
                                            onClick={() => setCurrentMediaIndex(index)}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* Right side - Comments and Composer */}
                        <VStack
                            w={{ base: "100%", md: "400px" }}
                            h={{ base: "40vh", md: "100%" }}
                            spacing={0}
                            align="stretch"
                            bg="background"
                        >
                            {/* Snap Info Header */}
                            <Box p={4} borderBottom="1px" borderColor="muted">
                                <HStack spacing={3} align="start">
                                    <Box>
                                        <Text fontWeight="bold" color="primary">
                                            @{snap.author}
                                        </Text>
                                        <Text fontSize="sm" color="muted">
                                            {new Date(snap.created).toLocaleDateString()}
                                        </Text>
                                    </Box>
                                </HStack>
                                {cleanBodyText(snap.body) && (
                                    <Text color="text" fontSize="sm" mt={2} lineHeight="1.5">
                                        {cleanBodyText(snap.body)}
                                    </Text>
                                )}
                            </Box>

                            {/* Comments Section */}
                            <Box flex="1" overflow="hidden">
                                <Box
                                    h="100%"
                                    p={4}
                                    overflowY="auto"
                                    css={{
                                        '&::-webkit-scrollbar': {
                                            width: '4px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            width: '6px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: 'rgba(255, 255, 255, 0.3)',
                                            borderRadius: '24px',
                                        },
                                    }}
                                >
                                    <VStack spacing={3} align="stretch">
                                        {comments.length === 0 ? (
                                            <Text color="muted" textAlign="center" py={8}>
                                                No comments yet. Be the first to comment!
                                            </Text>
                                        ) : (
                                            comments.map((comment, index) => (
                                                <Box key={index} p={3} borderRadius="md" bg="muted">
                                                    <HStack spacing={2} mb={1}>
                                                        <Text fontWeight="bold" fontSize="sm" color="primary">
                                                            @{comment.author}
                                                        </Text>
                                                        <Text fontSize="xs" color="muted">
                                                            {comment.created}
                                                        </Text>
                                                    </HStack>
                                                    <Text fontSize="sm" color="text">
                                                        {comment.body}
                                                    </Text>
                                                </Box>
                                            ))
                                        )}
                                    </VStack>
                                </Box>
                            </Box>

                            {/* Divider */}
                            <Divider />

                            {/* Comment Composer */}
                            <Box>
                                <SnapComposer
                                    pa={snap.author}
                                    pp={snap.permlink}
                                    onNewComment={handleNewComment}
                                    post={false}
                                    onClose={() => { }}
                                    submitLabel="Reply"
                                    buttonSize="sm"
                                />
                            </Box>
                        </VStack>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default SnapModal;
export type { SnapWithMedia };
