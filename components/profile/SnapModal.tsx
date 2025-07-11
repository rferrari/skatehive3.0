"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Box,
    Image,
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
    Button,
    useBreakpointValue,
    Avatar,
    Link,
} from "@chakra-ui/react";
import { FaChevronLeft, FaChevronRight, FaDownload, FaReply, FaComments } from "react-icons/fa";
import { Discussion } from "@hiveio/dhive";
import VideoRenderer from "../layout/VideoRenderer";
import SnapComposer from "../homepage/SnapComposer";
import Snap from "../homepage/Snap";
import { useComments } from "@/hooks/useComments";
import HiveMarkdown from "../shared/HiveMarkdown";


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

const SnapModal = ({
    snap,
    snaps,
    currentSnapIndex,
    isOpen,
    onClose,
    onSnapChange,
}: SnapModalProps) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const modalSize = useBreakpointValue({ base: "full", md: "5xl" });

    // Use the useComments hook to fetch comments for the current snap
    const { comments, isLoading: commentsLoading, error: commentsError } = useComments(
        snap.author,
        snap.permlink,
        false // Set to true if you want nested replies
    );

    // State for optimistic updates when new comments are added
    const [optimisticComments, setOptimisticComments] = useState<Discussion[]>([]);

    const allMedia = useMemo(
        () => [...snap.media.images, ...snap.media.videos],
        [snap]
    );
    const currentMedia = allMedia[currentMediaIndex];
    const isVideo = snap.media.videos.includes(currentMedia);

    const nextMedia = () => {
        setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
    };

    const prevMedia = () => {
        setCurrentMediaIndex((prev) =>
            (prev - 1 + allMedia.length) % allMedia.length
        );
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
        setOptimisticComments((prev) => [newComment as Discussion, ...prev]);
    };

    const cleanBodyText = (body: string) => {
        if (!body) return "";
        let cleaned = body.replace(/!\[.*?\]\(.*?\)/g, "");
        cleaned = cleaned.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");
        cleaned = cleaned.replace(/\n\s*\n/g, "\n").trim();
        return cleaned;
    };

    // Helper function to get profile image URL
    const getProfileImageUrl = (username: string) => {
        return `https://images.hive.blog/u/${username}/avatar/small`;
    };

    // Function to redirect to the snap's dedicated page for deeper discussion
    const goToSnapPage = () => {
        const snapUrl = `/post/${snap.author}/${snap.permlink}`;
        window.open(snapUrl, '_blank');
    };

    // Function to redirect to a specific comment's page
    const goToCommentPage = (comment: Discussion) => {
        const commentUrl = `/post/${comment.author}/${comment.permlink}`;
        window.open(commentUrl, '_blank');
    };

    useEffect(() => {
        setCurrentMediaIndex(0);
        setOptimisticComments([]);
    }, [snap]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            switch (event.key) {
                case "ArrowLeft":
                    if (event.shiftKey) prevSnap();
                    else if (allMedia.length > 1 && currentMediaIndex > 0) prevMedia();
                    break;
                case "ArrowRight":
                    if (event.shiftKey) nextSnap();
                    else if (
                        allMedia.length > 1 &&
                        currentMediaIndex < allMedia.length - 1
                    )
                        nextMedia();
                    break;
                case "ArrowUp":
                    prevSnap();
                    break;
                case "ArrowDown":
                    nextSnap();
                    break;
                case "Escape":
                    onClose();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentMediaIndex, allMedia.length, currentSnapIndex, snaps.length]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size={modalSize} isCentered>
            <ModalOverlay bg="blackAlpha.900" />
            <ModalContent
                bg="rgb(24, 24, 24)"
                color="white"
                h={{ base: "100vh", md: "85vh" }}
                borderRadius={{ base: 0, md: "lg" }}
            >
                <ModalCloseButton />

                <ModalBody
                    p={0}
                    display="flex"
                    flexDirection={{ base: "column", md: "row" }}
                >
                    {/* Left: Media */}
                    <Box
                        flex="1"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bg="black"
                        h={{ base: "60vh", md: "85vh" }}
                        position="relative"
                        overflow="hidden"
                    >
                        {isVideo ? (
                            <Box
                                w="100%"
                                h="100%"
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                    "& > div": {
                                        width: "100%",
                                        height: "100%",
                                        paddingTop: "0 !important",
                                        minWidth: "auto !important",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center"
                                    },
                                    "& video": {
                                        width: { base: "100%", md: "auto" },
                                        height: { base: "100%", md: "auto" },
                                        maxWidth: { base: "none", md: "100%" },
                                        maxHeight: { base: "none", md: "calc(100% - 60px)" },
                                        objectFit: { base: "cover", md: "contain" },
                                        marginBottom: "0 !important"
                                    },
                                    "& picture": {
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center"
                                    }
                                }}
                            >
                                <VideoRenderer
                                    src={currentMedia}
                                    loop
                                />
                            </Box>
                        ) : (
                            <Image
                                src={currentMedia}
                                alt="Snap content"
                                w={{ base: "100%", md: "auto" }}
                                h={{ base: "100%", md: "auto" }}
                                maxW={{ base: "none", md: "100%" }}
                                maxH={{ base: "none", md: "85vh" }}
                                objectFit={{ base: "cover", md: "contain" }}
                            />
                        )}

                        {/* Optional Download Button */}
                        {!isVideo && (
                            <a
                                href={currentMedia}
                                download={currentMedia.split("/").pop() || "media"}
                                style={{
                                    position: "absolute",
                                    bottom: "16px",
                                    right: "16px",
                                }}
                            >
                                <Button
                                    colorScheme="green"
                                    size="sm"
                                    leftIcon={<FaDownload />}
                                    opacity={0}
                                    transition="opacity 0.2s"
                                    _hover={{ opacity: 1 }}
                                >
                                    Download
                                </Button>
                            </a>
                        )}

                        {/* Media Navigation Arrows */}
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
                                    opacity={
                                        currentMediaIndex === allMedia.length - 1 ? 0.5 : 1
                                    }
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
                    </Box>

                    {/* Right: Comments & Info */}
                    <Box
                        flex="1"
                        p={4}
                        maxW={{ base: "100%", md: "40%" }}
                        display="flex"
                        flexDirection="column"
                        h={{ base: "40vh", md: "85vh" }}
                        overflow="hidden"
                    >
                        {/* Snap Info */}
                        <Box mb={4}>
                            <HStack spacing={3} align="start">
                                <Avatar
                                    src={getProfileImageUrl(snap.author)}
                                    name={snap.author}
                                    size="md"
                                />
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
                                <Box color="text" fontSize="sm" mt={2} lineHeight="1.5">
                                    <HiveMarkdown
                                        markdown={cleanBodyText(snap.body)}
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            color: 'inherit'
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>

                        {/* Comments Section */}
                        <Box flex="1" overflow="hidden" minH="0">
                            {/* Comments Header */}
                            <Flex justify="space-between" align="center" mb={3}>
                                <Text fontSize="md" fontWeight="bold" color="primary">
                                    Comments
                                </Text>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<FaComments />}
                                    onClick={goToSnapPage}
                                    color="primary"
                                    _hover={{ bg: "blackAlpha.300" }}
                                >
                                    View Full Discussion
                                </Button>
                            </Flex>

                            <Box
                                h="calc(100% - 50px)"
                                overflowY="auto"
                                css={{
                                    "&::-webkit-scrollbar": {
                                        width: "4px",
                                    },
                                    "&::-webkit-scrollbar-track": {
                                        width: "6px",
                                    },
                                    "&::-webkit-scrollbar-thumb": {
                                        background: "rgba(255, 255, 255, 0.3)",
                                        borderRadius: "24px",
                                    },
                                }}
                            >
                                <VStack spacing={3} align="stretch">
                                    {commentsLoading ? (
                                        <Text color="muted" textAlign="center" py={8}>
                                            Loading comments...
                                        </Text>
                                    ) : commentsError ? (
                                        <Text color="red.400" textAlign="center" py={8}>
                                            Error loading comments: {commentsError}
                                        </Text>
                                    ) : optimisticComments.length === 0 && comments.length === 0 ? (
                                        <Text color="muted" textAlign="center" py={8}>
                                            No comments yet. Be the first to comment!
                                        </Text>
                                    ) : (
                                        <>
                                            {/* Show optimistic comments first (newest) */}
                                            {optimisticComments.map((comment, index) => (
                                                <Box
                                                    key={`optimistic-${index}`}
                                                    p={2}
                                                    borderRadius="md"
                                                    bg="muted"
                                                    opacity={0.8}
                                                    borderLeft="3px solid"
                                                    borderColor="primary"
                                                >
                                                    <Snap
                                                        discussion={comment}
                                                        onOpen={() => { }}
                                                        setReply={() => { }}
                                                    />
                                                </Box>
                                            ))}
                                            {/* Show real comments using Snap component */}
                                            {comments.map((comment, index) => (
                                                <Box
                                                    key={comment.permlink || index}
                                                    p={2}
                                                    borderRadius="md"
                                                    bg="muted"
                                                >
                                                    <Snap
                                                        discussion={comment}
                                                        onOpen={() => { }}
                                                        setReply={() => { }}
                                                    />
                                                </Box>
                                            ))}
                                        </>
                                    )}
                                </VStack>
                            </Box>
                        </Box>

                        {/* Divider */}
                        <Divider my={4} />

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
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default SnapModal;
export type { SnapWithMedia };
