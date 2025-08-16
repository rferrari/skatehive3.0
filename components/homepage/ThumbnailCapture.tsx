import React from "react";
import { VStack, HStack, Text, Button, Box, Image } from "@chakra-ui/react";

interface ThumbnailCaptureProps {
  thumbnailUrl: string | null;
  isGeneratingThumbnail: boolean;
  onCaptureFrame: () => void;
}

const ThumbnailCapture: React.FC<ThumbnailCaptureProps> = ({
  thumbnailUrl,
  isGeneratingThumbnail,
  onCaptureFrame,
}) => {
  return (
    <VStack width="100%" spacing={4}>
      <Button
        size="sm"
        variant="outline"
        onClick={onCaptureFrame}
        colorScheme="green"
        isLoading={isGeneratingThumbnail}
        loadingText="Capturing..."
      >
        {thumbnailUrl ? "Update Frame" : "Capture Frame"}
      </Button>

      {/* Thumbnail Preview */}
      {thumbnailUrl ? (
        <Box
          width="200px"
          height="112px"
          borderRadius="md"
          overflow="hidden"
          border="2px solid"
          borderColor="green.500"
          position="relative"
          mx="auto"
        >
          <Image
            src={thumbnailUrl}
            alt="Video thumbnail"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      ) : (
        <Box
          width="200px"
          height="112px"
          borderRadius="md"
          border="2px dashed"
          borderColor="gray.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          bg="gray.700"
        >
          <Text fontSize="sm" color="gray.400" textAlign="center">
            No thumbnail captured
            <br />
            Auto-generated on upload
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default ThumbnailCapture;
