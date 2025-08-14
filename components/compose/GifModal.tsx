import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Image,
  Button,
  Box,
  Text,
} from "@chakra-ui/react";
import { uploadToIpfs } from "@/lib/markdown/composeUtils";
import GIFMakerWithSelector, {
  GIFMakerRef as GIFMakerWithSelectorRef,
} from "../homepage/GIFMakerWithSelector";
import { useTheme } from "@/app/themeProvider";

interface GifModalProps {
  isOpen: boolean;
  onClose: () => void;
  gifMakerWithSelectorRef: React.RefObject<GIFMakerWithSelectorRef | null>;
  handleGifUpload: (url: string | null, caption?: string) => void;
  isProcessingGif: boolean;
  gifUrl: string | null;
  gifSize: number | null;
  isUploadingGif: boolean;
  setIsUploadingGif: (uploading: boolean) => void;
  insertAtCursor: (content: string) => void;
  gifCaption: string;
  setGifUrl: (url: string | null) => void;
  setGifSize: (size: number | null) => void;
  setIsProcessingGif: (processing: boolean) => void;
}

export default function GifModal({
  isOpen,
  onClose,
  gifMakerWithSelectorRef,
  handleGifUpload,
  isProcessingGif,
  gifUrl,
  gifSize,
  isUploadingGif,
  setIsUploadingGif,
  insertAtCursor,
  gifCaption,
  setGifUrl,
  setGifSize,
  setIsProcessingGif,
}: GifModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGifMaker, setShowGifMaker] = useState(false);
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleUploadToIPFS = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUploadingGif || !gifUrl) return;

    setIsUploadingGif(true);
    try {
      const blob = await fetch(gifUrl).then((res) => res.blob());
      const safeCaption = gifCaption
        ? gifCaption.replace(/[^a-zA-Z0-9-_]/g, "-")
        : "skatehive-gif";
      const filename = `${safeCaption}.gif`;

      const ipfsUrl = await uploadToIpfs(blob, filename);

      // Only include caption if it's meaningful (not empty and not just "skatehive-gif")
      const meaningfulCaption = safeCaption && safeCaption.trim() && safeCaption.trim() !== "skatehive-gif" ? safeCaption : "";
      insertAtCursor(`\n![${meaningfulCaption}](${ipfsUrl})\n`);
      gifMakerWithSelectorRef.current?.reset();
      setGifUrl(null);
      setGifSize(null);
      setIsProcessingGif(false);
      setShowGifMaker(false); // Reset to show initial options
      onClose();
    } catch (err) {
      alert("Failed to upload GIF to IPFS.");
    } finally {
      setIsUploadingGif(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!(file.type === "image/gif" || file.type === "image/webp")) {
      alert("Only GIF and WEBP files are allowed.");
      return;
    }

    // Check file size (limit to 5MB - same as compose page)
    if (file.size > 5 * 1024 * 1024) {
      alert("GIF or WEBP file size must be 5MB or less.");
      return;
    }

    setIsUploadingGif(true);
    try {
      const ipfsUrl = await uploadToIpfs(file, file.name);
      // Only include caption if it's meaningful (not empty and not just the file extension)
      const meaningfulCaption = file.name && file.name.trim() && !file.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i) ? file.name : "";
      insertAtCursor(`\n![${meaningfulCaption}](${ipfsUrl})\n`);
      onClose();
    } catch (error) {
      alert("Error uploading GIF/WEBP to IPFS.");
      console.error("Error uploading GIF/WEBP:", error);
    } finally {
      setIsUploadingGif(false);
      event.target.value = ""; // Reset input
    }
  };

  // Reset when modal closes
  const handleClose = () => {
    setShowGifMaker(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{ base: "full", md: "xl" }}
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg="background" color="text">
        <ModalHeader>GIF Maker by web-gnar</ModalHeader>
        <ModalCloseButton onClick={handleClose} />
        <ModalBody>
          <div style={{ maxWidth: "100%", margin: "0 auto", padding: 12 }}>
            {!showGifMaker && (
              <>
                {/* Create GIF from video section */}
                <Box textAlign="center" mb={4}>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Create GIF from Video
                  </Text>
                  <Button
                    onClick={() => {
                      setShowGifMaker(true);
                      // Trigger the file picker after a brief delay to ensure component is rendered
                      setTimeout(() => {
                        gifMakerWithSelectorRef.current?.trigger();
                      }, 100);
                    }}
                    colorScheme="primary"
                    variant="outline"
                    size="lg"
                    mb={2}
                    _hover={{ bg: "primary", color: "background" }}
                  >
                    Select Video
                  </Button>
                  <Text fontSize="sm" color="secondary">
                    Upload a 3-30 sec. video and convert a segment to GIF
                  </Text>
                </Box>

                {/* Divider */}
                <Box
                  borderTop="1px solid"
                  borderColor={colors.border}
                  my={6}
                  position="relative"
                >
                  <Text
                    position="absolute"
                    top="-10px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg={colors.background}
                    px={3}
                    fontSize="sm"
                    color="secondary"
                  >
                    OR
                  </Text>
                </Box>

                {/* Upload GIF from computer section */}
                <Box mb={6} textAlign="center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    colorScheme="primary"
                    variant="outline"
                    size="lg"
                    mb={2}
                    isDisabled={isUploadingGif}
                    _hover={{ bg: "primary", color: "background" }}
                  >
                    {isUploadingGif ? "Uploading..." : "Upload Existing GIF"}
                  </Button>
                  <Text fontSize="sm" color="secondary">
                    Select a GIF or WEBP file from your computer (max 5MB)
                  </Text>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".gif,.webp"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </Box>
              </>
            )}

            {showGifMaker && (
              <Box>
                <Box textAlign="center" mb={4}>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Create GIF from Video
                  </Text>
                </Box>
                <Box
                  display={{ base: "block", md: "flex" }}
                  gap={6}
                  alignItems="flex-start"
                >
                  {/* Left side - Video controls */}
                  <Box flex={{ base: "none", md: "1" }}>
                    <GIFMakerWithSelector
                      ref={gifMakerWithSelectorRef}
                      onUpload={handleGifUpload}
                      isProcessing={isProcessingGif}
                    />
                  </Box>

                  {/* Right side - GIF preview */}
                  {gifUrl && (
                    <Box
                      flex={{ base: "none", md: "1" }}
                      minW={{ base: "auto", md: "320px" }}
                      mt={{ base: 6, md: 0 }}
                    >
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        mb={3}
                        textAlign="center"
                      >
                        GIF Preview
                      </Text>
                      <Box display="flex" justifyContent="center" mb={2}>
                        <Image src={gifUrl} alt="Generated GIF" maxW="100%" />
                      </Box>
                      {gifSize !== null && (
                        <Text
                          fontSize="sm"
                          color="secondary"
                          textAlign="center"
                          mb={3}
                        >
                          File size: {Math.round(gifSize / 1024)} KB
                        </Text>
                      )}
                      <Button
                        onClick={handleUploadToIPFS}
                        colorScheme="primary"
                        size="md"
                        w="100%"
                        isDisabled={isUploadingGif}
                      >
                        {isUploadingGif ? "Uploading..." : "Add to blog"}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
