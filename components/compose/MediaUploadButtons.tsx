import React, { useState, useEffect } from "react";
import { Button, Flex, Tooltip, Box } from "@chakra-ui/react";
import { FaImage, FaVideo } from "react-icons/fa";
import { MdGif, MdMovieCreation } from "react-icons/md";
import MatrixOverlay from "../graphics/MatrixOverlay";

interface MediaUploadButtonsProps {
    user: any;
    handleImageTrigger: () => void;
    handleVideoTrigger: () => void;
    setGifModalOpen: (open: boolean) => void;
    isUploading: boolean;
    isGifModalOpen?: boolean;
}

export default function MediaUploadButtons({
    user,
    handleImageTrigger,
    handleVideoTrigger,
    setGifModalOpen,
    isUploading,
    isGifModalOpen = false,
}: MediaUploadButtonsProps) {
    const [imageTooltipOpen, setImageTooltipOpen] = useState(false);
    const [videoTooltipOpen, setVideoTooltipOpen] = useState(false);
    const [gifTooltipOpen, setGifTooltipOpen] = useState(false);

    // Reset tooltips when modals close
    useEffect(() => {
        if (!isGifModalOpen) {
            setGifTooltipOpen(false);
        }
    }, [isGifModalOpen]);
    return (
        <Flex
            justify={{ base: "center", md: "flex-end" }}
            gap={2}
            mt={{ base: 2, md: 0 }}
            mb={{ base: 2, md: 0 }}
            flexShrink={0}
            position="relative"
        >
            {/* Overlay for non-logged-in users */}
            {!user && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    w="100%"
                    h="100%"
                    zIndex={21}
                    pointerEvents="all"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <MatrixOverlay />
                </Box>
            )}

            {/* Media upload buttons */}
            <Tooltip 
                label="Upload Image" 
                placement="bottom"
                isOpen={imageTooltipOpen}
                onOpen={() => setImageTooltipOpen(true)}
                onClose={() => setImageTooltipOpen(false)}
            >
                <Button
                    variant="unstyled"
                    size="lg"
                    borderRadius="full"
                    p={2}
                    _hover={{ color: "primary", bg: "muted" }}
                    style={{
                        height: 64,
                        width: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={() => {
                        setImageTooltipOpen(false);
                        handleImageTrigger();
                    }}
                >
                    <FaImage color="var(--chakra-colors-primary)" size={48} />
                </Button>
            </Tooltip>

            <Tooltip 
                label="Upload Video" 
                placement="bottom"
                isOpen={videoTooltipOpen}
                onOpen={() => setVideoTooltipOpen(true)}
                onClose={() => setVideoTooltipOpen(false)}
            >
                <Button
                    variant="unstyled"
                    size="lg"
                    borderRadius="full"
                    p={2}
                    _hover={{ color: "primary", bg: "muted" }}
                    style={{
                        height: 64,
                        width: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={() => {
                        setVideoTooltipOpen(false);
                        handleVideoTrigger();
                    }}
                >
                    <FaVideo color="var(--chakra-colors-primary)" size={48} />
                </Button>
            </Tooltip>

            <Tooltip 
                label="GIF Maker" 
                placement="bottom"
                isOpen={gifTooltipOpen}
                onOpen={() => setGifTooltipOpen(true)}
                onClose={() => setGifTooltipOpen(false)}
            >
                <Button
                    variant="unstyled"
                    size="lg"
                    borderRadius="full"
                    p={2}
                    _hover={{ color: "primary", bg: "muted" }}
                    style={{
                        height: 64,
                        width: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={() => {
                        setGifTooltipOpen(false);
                        setGifModalOpen(true);
                    }}
                >
                    <MdGif color="var(--chakra-colors-primary)" size={48} />
                </Button>
            </Tooltip>
        </Flex>
    );
}
