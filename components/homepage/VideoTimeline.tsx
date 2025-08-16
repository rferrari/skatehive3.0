import React from "react";
import { Box, VStack, Text, Flex } from "@chakra-ui/react";
import { formatTime } from "@/lib/utils/timeUtils";

interface VideoTimelineProps {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  isValidSelection: boolean;
  maxDuration: number;
  canBypass?: boolean;
  onSeek: (time: number) => void;
  onSeekDuringDrag?: (time: number) => void;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const VideoTimeline: React.FC<VideoTimelineProps> = ({
  duration,
  currentTime,
  startTime,
  endTime,
  isValidSelection,
  maxDuration,
  canBypass = false,
  onSeek,
  onSeekDuringDrag,
  onStartTimeChange,
  onEndTimeChange,
  onDragStart,
  onDragEnd,
}) => {
  const selectedDuration = endTime - startTime;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timePosition = (clickX / rect.width) * duration;
    onSeek(timePosition);
  };

  const createDragHandler = (
    isStartHandle: boolean,
    onChange: (time: number) => void
  ) => {
    return (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStart();

      // Get the timeline track element
      const timelineElement = e.currentTarget.parentElement;
      if (!timelineElement) {
        console.error("Timeline element not found");
        return;
      }

      // Helper function to get X coordinate from mouse or touch event
      const getEventX = (event: MouseEvent | TouchEvent): number => {
        if ("touches" in event) {
          return (
            event.touches[0]?.clientX || event.changedTouches[0]?.clientX || 0
          );
        }
        return event.clientX;
      };

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        // Prevent default behavior for touch events to avoid scrolling
        if ("touches" in moveEvent) {
          moveEvent.preventDefault();
        }

        const rect = timelineElement.getBoundingClientRect();
        const newX = getEventX(moveEvent) - rect.left;
        let newTime = (newX / rect.width) * duration;

        // Clamp the values
        if (isStartHandle) {
          newTime = Math.max(0, Math.min(newTime, endTime - 0.5));
        } else {
          newTime = Math.min(duration, Math.max(newTime, startTime + 0.5));
        }

        onChange(newTime);

        // Seek video to the new position during dragging
        if (onSeekDuringDrag) {
          onSeekDuringDrag(newTime);
        }
      };

      const handleEnd = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleEnd);
        onDragEnd();
      };

      // Add both mouse and touch event listeners
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd, { passive: false });
    };
  };

  return (
    <VStack spacing={{ base: 3, md: 4 }}>
      {/* Timeline Trimmer with Play Button */}
      <Box width="100%" px={2}>
        <Text fontSize="xs" mb={3} textAlign="center" color="gray.400">
          Drag the yellow handles to trim your video
        </Text>
        {/* Timeline Track */}
        <Box
          width="100%"
          height="50px"
          bg="gray.700"
          borderRadius="8px"
          position="relative"
          cursor="pointer"
          border="1px solid"
          borderColor="gray.600"
          onClick={handleTimelineClick}
        >
          {/* Current Time Indicator */}
          <Box
            position="absolute"
            left={`${(currentTime / duration) * 100}%`}
            top="0"
            bottom="0"
            width="3px"
            bg="blue.400"
            zIndex={4}
            transition="left 0.1s ease"
            borderRadius="1px"
          />

          {/* Selected Region */}
          <Box
            position="absolute"
            left={`${(startTime / duration) * 100}%`}
            width={`${((endTime - startTime) / duration) * 100}%`}
            height="100%"
            bg="yellow.400"
            opacity={0.8}
            borderRadius="6px"
            border="2px solid"
            borderColor="yellow.300"
            zIndex={1}
          />

          {/* Start Handle */}
          <Box
            position="absolute"
            left={`${(startTime / duration) * 100}%`}
            top="50%"
            transform="translate(-50%, -50%)"
            width="24px"
            height="40px"
            bg="yellow.400"
            borderRadius="6px"
            border="3px solid white"
            cursor="ew-resize"
            zIndex={5}
            boxShadow="0 3px 6px rgba(0,0,0,0.4)"
            _hover={{
              bg: "yellow.300",
              transform: "translate(-50%, -50%) scale(1.1)",
            }}
            _active={{ bg: "yellow.500" }}
            transition="all 0.1s ease"
            onMouseDown={createDragHandler(true, onStartTimeChange)}
            onTouchStart={createDragHandler(true, onStartTimeChange)}
            // Touch-friendly styles
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            {/* Handle Visual Indicator */}
            <Flex align="center" justify="center" height="100%">
              <VStack spacing="2px">
                <Box width="2px" height="6px" bg="white" borderRadius="1px" />
                <Box width="2px" height="6px" bg="white" borderRadius="1px" />
                <Box width="2px" height="6px" bg="white" borderRadius="1px" />
              </VStack>
            </Flex>
          </Box>

          {/* End Handle */}
          <Box
            position="absolute"
            left={`${(endTime / duration) * 100}%`}
            top="50%"
            transform="translate(-50%, -50%)"
            width="24px"
            height="40px"
            bg="yellow.400"
            borderRadius="6px"
            border="3px solid white"
            cursor="ew-resize"
            zIndex={5}
            boxShadow="0 3px 6px rgba(0,0,0,0.4)"
            _hover={{
              bg: "yellow.300",
              transform: "translate(-50%, -50%) scale(1.1)",
            }}
            _active={{ bg: "yellow.500" }}
            transition="all 0.1s ease"
            onMouseDown={createDragHandler(false, onEndTimeChange)}
            onTouchStart={createDragHandler(false, onEndTimeChange)}
            // Touch-friendly styles
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            {/* Handle Visual Indicator */}
            <Flex align="center" justify="center" height="100%">
              <VStack spacing="2px">
                <Box width="2px" height="6px" bg="white" borderRadius="1px" />
                <Box width="2px" height="6px" bg="white" borderRadius="1px" />
                <Box width="2px" height="6px" bg="white" borderRadius="1px" />
              </VStack>
            </Flex>
          </Box>
        </Box>
        {/* Time Labels */}
        <Flex
          justify="space-between"
          width="100%"
          fontSize="xs"
          color="gray.400"
          mt={2}
        >
          <Text>{formatTime(startTime)}</Text>
          <Text color="blue.400">{formatTime(currentTime)}</Text>
          <Text>{formatTime(endTime)}</Text>
        </Flex>{" "}
      </Box>
    </VStack>
  );
};

export default VideoTimeline;
