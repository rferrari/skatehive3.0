import React, { useState, useRef } from "react";
import {
  Box,
  Textarea,
  HStack,
  Button,
  Image,
  IconButton,
  Wrap,
  Spinner,
  Progress,
  Input,
  FormControl,
  FormLabel,
  VStack,
} from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { CloseIcon } from "@chakra-ui/icons";
import { FaImage } from "react-icons/fa";
import { Discussion } from "@hiveio/dhive";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";
import { getLastSnapsContainer } from "@/lib/hive/client-functions";
import ImageCompressor, { ImageCompressorRef } from "@/lib/utils/ImageCompressor";
import MatrixOverlay from "../graphics/MatrixOverlay";
import imageCompression from "browser-image-compression";
import * as exifr from 'exifr';

interface SpotSnapComposerProps {
  onNewComment: (newComment: Partial<Discussion>) => void;
  onClose: () => void;
}

export default function SpotSnapComposer({
  onNewComment,
  onClose,
}: SpotSnapComposerProps) {
  const { user, aioha } = useAioha();
  const postBodyRef = useRef<HTMLTextAreaElement>(null);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const [compressedImages, setCompressedImages] = useState<
    { url: string; fileName: string; caption: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [spotName, setSpotName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [address, setAddress] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const buttonText = "Post Spot";

  const handleCompressedImageUpload = async (
    url: string | null,
    fileName?: string,
    originalFile?: File
  ) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const blob = await fetch(url).then((res) => res.blob());
      const file = new File([blob], fileName || "compressed.jpg", {
        type: blob.type,
      });
      
      // Extract GPS from original file if available
      if (originalFile) {
        await extractGPS(originalFile);
      }
      
      const signature = await getFileSignature(file);
      const uploadUrl = await uploadImage(
        file,
        signature,
        compressedImages.length,
        setUploadProgress
      );
      if (uploadUrl) {
        setCompressedImages((prev) => [
          ...prev,
          { url: uploadUrl, fileName: file.name, caption: "" },
        ]);
      }
    } catch (error) {
      console.error("Error uploading compressed image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleComment() {
    let description = postBodyRef.current?.value || "";
    // Require either GPS coordinates (from photos) or address
    const hasCoords = lat.trim() && lon.trim();
    const hasAddress = address.trim();
    if (!spotName.trim() || (!hasCoords && !hasAddress)) {
      alert("Please enter a spot name and either upload a photo with GPS data or enter an address.");
      return;
    }
    if (!description.trim() && compressedImages.length === 0) {
      alert("Please enter a description or upload an image before posting.");
      return;
    }
    setIsLoading(true);
    setUploadProgress([]);
    const permlink = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    let validUrls: string[] = compressedImages.map((img) => img.url);
    // Compose the post body
    let locationLine = "";
    if (hasCoords && hasAddress) {
      locationLine = `Location: ${lat}, ${lon} (${address})`;
    } else if (hasCoords) {
      locationLine = `Location: ${lat}, ${lon}`;
    } else if (hasAddress) {
      locationLine = `Location: ${address}`;
    }
    let commentBody = `Spot Name: ${spotName}\n${locationLine}\n`;
    if (description) commentBody += `\n${description}`;
    if (validUrls.length > 0) {
      const imageMarkup = validUrls
        .map(
          (url: string | null, idx: number) =>
            `![${compressedImages[idx]?.caption || spotName}](${url?.toString() || ""
            })`
        )
        .join("\n");
      commentBody += `\n\n${imageMarkup}`;
    }
    try {
      // Get the current main snaps container
      const container = await getLastSnapsContainer();
      const parentAuthor = container.author;
      const parentPermlink = container.permlink;
      const commentResponse = await aioha.comment(
        parentAuthor,
        parentPermlink,
        permlink,
        "",
        commentBody,
        { app: "Skatehive App 3.0", tags: ["hive-173115", "skatespot"] }
      );
      if (commentResponse.success) {
        postBodyRef.current!.value = "";
        setCompressedImages([]);
        setSpotName("");
        setLat("");
        setLon("");
        setAddress("");
        // Set created to "just now" for optimistic update
        const newComment: Partial<Discussion> = {
          author: user,
          permlink: permlink,
          body: commentBody,
          created: "just now",
          pending_payout_value: "0.000 HBD",
        };
        onNewComment(newComment);
        onClose();
      }
    } finally {
      setIsLoading(false);
      setUploadProgress([]);
    }
  }

  // Detect Ctrl+Enter and submit
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey && event.key === "Enter") {
      handleComment();
    }
  }

  // Helper function to translate Spanish coordinate directions
  const translateCoordinateDirection = (coord: string): string => {
    if (!coord) return coord;
    // Replace Spanish "O" (Oeste/West) with "W"
    return coord.replace(/^O\s*/, 'W').replace(/\s*O$/, ' W');
  };

  // Add this function to extract GPS from image files
  const extractGPS = async (file: File) => {
    try {
      const gps = await exifr.gps(file);
      if (gps && gps.latitude && gps.longitude) {
        const latStr = translateCoordinateDirection(gps.latitude.toString());
        const lonStr = translateCoordinateDirection(gps.longitude.toString());
        setLat(latStr);
        setLon(lonStr);
        // Auto-fill the address field with GPS coordinates
        setAddress(`${latStr}, ${lonStr}`);
        return true; // Return true if GPS data was found
      }
    } catch (e) {
      // No GPS data or error reading EXIF
    }
    return false; // Return false if no GPS data found
  };

  // Drag and drop handlers (reuse SnapComposer style)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        // Extract GPS from EXIF if available
        const hasGPS = await extractGPS(file);
        // For dropped images, compress and upload
        try {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
                  const url = URL.createObjectURL(compressedFile);
        await handleCompressedImageUpload(url, compressedFile.name, file);
        URL.revokeObjectURL(url);
        } catch (err) {
          alert(
            "Error compressing image: " +
            (err instanceof Error ? err.message : err)
          );
        }
      } else {
        alert("Only image files are supported for drag-and-drop here.");
      }
    }
  };

  return (
    <Box
      p={4}
      mb={1}
      borderRadius="base"
      borderBottom={"1px"}
      borderColor="muted"
      position="relative"
      maxHeight="600px"
      overflowY="auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragOver
          ? "2px dashed var(--chakra-colors-primary)"
          : undefined,
        background: isDragOver ? "rgba(0,0,0,0.04)" : undefined,
        transition: "border 0.2s, background 0.2s",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      sx={{
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* Optionally, overlay a message when dragging */}
      {isDragOver && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={10}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(0,0,0,0.08)"
          borderRadius="base"
          pointerEvents="none"
        >
          <Box color="primary" fontWeight="bold" fontSize="xl">
            Drop images to upload
          </Box>
        </Box>
      )}
      <VStack spacing={3} align="stretch">
        <FormControl isRequired>
          <FormLabel>Spot Name</FormLabel>
          <Input
            id="spot-name-field"
            placeholder="Enter spot name"
            value={spotName}
            onChange={(e) => setSpotName(e.target.value)}
            isDisabled={isLoading}
            borderColor="muted"
            _focus={{ borderColor: "primary" }}
          />
        </FormControl>
        {lat && lon && (
          <FormControl>
            <FormLabel color="green.500" fontWeight="bold">
              📍 GPS Coordinates (extracted from photo)
            </FormLabel>
            <HStack spacing={2}>
              <Input
                placeholder="Latitude"
                value={lat}
                isReadOnly
                isDisabled={isLoading}
                size="sm"
                bg="green.50"
                borderColor="green.200"
                _focus={{ borderColor: "green.400" }}
              />
              <Input
                placeholder="Longitude"
                value={lon}
                isReadOnly
                isDisabled={isLoading}
                size="sm"
                bg="green.50"
                borderColor="green.200"
                _focus={{ borderColor: "green.400" }}
              />
            </HStack>
          </FormControl>
        )}
        <FormControl>
          <FormLabel>
            Address {!lat && !lon && compressedImages.length > 0 && (
              <Box as="span" color="orange.500" fontSize="sm">
                (No GPS data found in photos - please enter address)
              </Box>
            )}
          </FormLabel>
          <Input
            placeholder="e.g. 123 Skate St, New York, NY"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            isDisabled={isLoading}
            borderColor="muted"
            _focus={{ borderColor: "primary" }}
          />
        </FormControl>
        <FormControl>
          <Textarea
            placeholder="Describe the spot"
            bg="background"
            borderRadius={"base"}
            mb={3}
            ref={postBodyRef}
            _placeholder={{ color: "text" }}
            isDisabled={isLoading}
            onKeyDown={handleKeyDown}
            borderColor="muted"
            _focus={{ borderColor: "primary" }}
            _focusVisible={{ border: "tb1" }}
          />
        </FormControl>
        <HStack spacing={4} width="100%">
          <Button
            variant="ghost"
            size="lg"
            flex="1"
            isDisabled={isLoading}
            onClick={() => imageCompressorRef.current?.trigger()}
            border="2px solid"
            borderColor="muted"
            _hover={{
              borderColor: "primary",
              boxShadow: "0 0 0 2px var(--chakra-colors-primary)",
            }}
            _active={{ borderColor: "accent" }}
            flexDirection="column"
            height="auto"
            py={3}
          >
            <FaImage size={28} />
            <Box fontSize="sm" mt={1}>
              Upload <Box as="span" color="red.500">*</Box>
            </Box>
          </Button>
          <Button
            bg="primary"
            color="background"
            size="lg"
            flex="1"
            _hover={{ bg: "accent", color: "text" }}
            onClick={handleComment}
            isDisabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : buttonText}
          </Button>
        </HStack>
        <ImageCompressor
          ref={imageCompressorRef}
          onUpload={handleCompressedImageUpload}
          isProcessing={isLoading}
          hideStatus={true}
        />
        <Wrap spacing={4}>
          {compressedImages.map((imgObj, index) => (
            <Box key={index} position="relative" mb={4}>
              <Image
                alt={imgObj.fileName}
                src={imgObj.url}
                boxSize="100px"
                borderRadius="base"
              />
              <Input
                mt={2}
                placeholder="Enter caption"
                value={imgObj.caption}
                onChange={(e) => {
                  const newImages = [...compressedImages];
                  newImages[index].caption = e.target.value;
                  setCompressedImages(newImages);
                }}
                size="sm"
              />
              <IconButton
                aria-label="Remove image"
                icon={<CloseIcon />}
                size="xs"
                position="absolute"
                top="0"
                right="0"
                onClick={() =>
                  setCompressedImages((prevImages) =>
                    prevImages.filter((_, i) => i !== index)
                  )
                }
                isDisabled={isLoading}
              />
              <Progress
                value={uploadProgress[index]}
                size="xs"
                colorScheme="green"
                mt={2}
              />
            </Box>
          ))}
        </Wrap>
      </VStack>
      {/* Matrix Overlay and login prompt if not logged in */}
      {!user && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={20}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(255,255,255,0.85)"
          borderRadius="base"
          pointerEvents="all"
        >
          <Box color="primary" fontWeight="bold" fontSize="xl" textAlign="center">
            Please log in to post a spot.
          </Box>
        </Box>
      )}
    </Box>
  );
} 