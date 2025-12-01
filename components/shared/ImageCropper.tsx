"use client";
import { useState, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
} from "@chakra-ui/react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: File) => Promise<void>;
  aspectRatio?: number; // Magazine cover ratio: ~0.77 (1000x1300)
  title?: string;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set canvas size to desired output size
  canvas.width = 1000;
  canvas.height = 1300;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    1000,
    1300
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95
    );
  });
}

export default function ImageCropper({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1000 / 1300, // Default to flipbook cover dimensions
  title = "Crop Magazine Cover",
}: ImageCropperProps) {
  const toast = useToast();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (croppedBlob) {
        const file = new File([croppedBlob], "magazine-cover.jpg", {
          type: "image/jpeg",
        });
        await onCropComplete(file);
        onClose();
      } else {
        toast({
          title: "Cropping failed",
          description: "Unable to process the image. Please try again.",
          status: "error",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while processing the image.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose, toast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="background">
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.500">
              Recommended dimensions: 1000x1300px (magazine cover aspect ratio)
            </Text>
            <Box width="100%" height="500px" position="relative">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteCallback}
              />
            </Box>
            <Box width="100%">
              <Text fontSize="sm" mb={2}>
                Zoom
              </Text>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={setZoom}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={isProcessing}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleCrop}
            isLoading={isProcessing}
            loadingText="Uploading to IPFS..."
          >
            Crop & Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
