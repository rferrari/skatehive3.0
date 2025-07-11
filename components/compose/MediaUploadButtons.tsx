import React from "react";
import { Button, Flex, Tooltip, Box } from "@chakra-ui/react";
import { FaImage, FaVideo } from "react-icons/fa";
import { MdGif, MdMovieCreation } from "react-icons/md";
import MatrixOverlay from "../graphics/MatrixOverlay";

interface MediaUploadButtonsProps {
    user: any;
    handleImageTrigger: () => void;
    handleVideoTrigger: () => void;
    gifWebpInputRef: React.RefObject<HTMLInputElement | null>;
    handleGifWebpUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setGifModalOpen: (open: boolean) => void;
    isUploading: boolean;
}

export default function MediaUploadButtons({
    user,
    handleImageTrigger,
    handleVideoTrigger,
    gifWebpInputRef,
    handleGifWebpUpload,
    setGifModalOpen,
    isUploading,
}: MediaUploadButtonsProps) {
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
            <Tooltip label="Upload Image" placement="bottom">
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
                    onClick={handleImageTrigger}
                >
                    <FaImage color="var(--chakra-colors-primary)" size={48} />
                </Button>
            </Tooltip>

            <Tooltip label="Upload Video" placement="bottom">
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
                    onClick={handleVideoTrigger}
                >
                    <FaVideo color="var(--chakra-colors-primary)" size={48} />
                </Button>
            </Tooltip>

            <Tooltip label="Upload GIF or WEBP (max 5MB)" placement="bottom">
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
                    onClick={() => gifWebpInputRef.current?.click()}
                    isDisabled={isUploading}
                >
                    <MdGif color="var(--chakra-colors-primary)" size={48} />
                    <input
                        type="file"
                        accept=".gif,.webp"
                        style={{ display: "none" }}
                        ref={gifWebpInputRef}
                        onChange={handleGifWebpUpload}
                    />
                </Button>
            </Tooltip>

            <Tooltip label="Create GIF From Video" placement="bottom">
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
                    onClick={() => setGifModalOpen(true)}
                >
                    <MdMovieCreation color="var(--chakra-colors-primary)" size={48} />
                </Button>
            </Tooltip>
        </Flex>
    );
}
