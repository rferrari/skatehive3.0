import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Alert,
  AlertIcon,
  Flex,
} from "@chakra-ui/react";
import { FaPlay, FaPause, FaCut } from "react-icons/fa";

interface VideoTrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File | null;
  onTrimComplete: (trimmedFile: File) => void;
  maxDuration: number; // in seconds
  canBypass: boolean; // if user has >100 HP
}

const VideoTrimModal: React.FC<VideoTrimModalProps> = ({
  isOpen,
  onClose,
  videoFile,
  onTrimComplete,
  maxDuration,
  canBypass,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPreviewingSlider, setIsPreviewingSlider] = useState(false);
  const [lastSeekTime, setLastSeekTime] = useState(0); // For throttling seeks on mobile
  const [isDragging, setIsDragging] = useState(false); // Track active dragging
  const [isSeeking, setIsSeeking] = useState(false); // Track if seek is in progress

  // Initialize video when file changes
  useEffect(() => {
    if (videoFile && isOpen) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile, isOpen]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setStartTime(0);
      setEndTime(Math.min(videoDuration, maxDuration));
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current && !isPreviewingSlider && !isDragging && !isSeeking) {
      const newTime = videoRef.current.currentTime;

      // Constrain the cursor to stay within selection boundaries
      if (newTime < startTime || newTime > endTime) {
        // If video is playing outside selection, pause and reset to start
        if (isPlaying && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
          seekTo(startTime);
          return;
        }
        // If not playing, just constrain the display (no seeking)
        const constrainedTime = Math.max(startTime, Math.min(newTime, endTime));
        setCurrentTime(constrainedTime);
      } else {
        setCurrentTime(newTime);
      }

      // Auto-pause when reaching end of selection during playback
      if (isPlaying && newTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        seekTo(startTime);
      }
    }
  };

  // Play/pause controls (respects selection boundaries)
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Ensure we're within selection boundaries before playing
        const currentVideoTime = videoRef.current.currentTime;
        if (currentVideoTime < startTime || currentVideoTime >= endTime) {
          seekTo(startTime);
          
          // Play after seek completes
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch((error) => {
                  console.error("Failed to play video:", error);
                  setIsPlaying(false);
                });
            }
          }, 50);
        } else {
          videoRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Failed to play video:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  // Seek to specific time (mobile-optimized and throttled)
  const seekTo = (time: number) => {
    // Skip if already seeking or dragging
    if (isSeeking || isDragging) {
      return;
    }

    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;

    // Ensure video is ready for seeking
    if (video.readyState < 2) {
      return;
    }

    // Avoid unnecessary seeks - if we're already close to the target time, don't seek
    const currentTime = video.currentTime;
    if (Math.abs(currentTime - time) < 0.1) {
      return;
    }

    // Throttle seeks - minimum 100ms between seeks
    const now = Date.now();
    if (now - lastSeekTime < 100) {
      // Cancel any pending seek
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      // Schedule a delayed seek
      seekTimeoutRef.current = setTimeout(() => {
        if (!isSeeking && !isDragging) {
          seekTo(time);
        }
      }, 100);
      return;
    }

    try {
      setIsSeeking(true);
      setLastSeekTime(now);

      // Clamp time to valid range
      const clampedTime = Math.max(0, Math.min(time, video.duration - 0.1));

      video.currentTime = clampedTime;
      setCurrentTime(clampedTime);

      // Clear seeking state after a short delay
      setTimeout(() => {
        setIsSeeking(false);
      }, 50);

    } catch (error) {
      console.error("Error seeking video:", error);
      setIsSeeking(false);
    }
  };

  // Handle start time change with preview (throttled for mobile) - used by preview buttons
  const handleStartTimeChange = (value: number) => {
    // Don't process if we're already dragging
    if (isDragging) return;

    setStartTime(value);
    if (value >= endTime) {
      setEndTime(Math.min(value + 1, duration));
    }

    // Throttle seeking on mobile to improve performance
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const now = Date.now();

    if (!isMobile || now - lastSeekTime > 200) {
      // Increased throttle to 200ms
      setLastSeekTime(now);

      // Pause video and seek to start time for preview
      if (videoRef.current) {
        console.log("Seeking video to start time:", value);
        videoRef.current.pause();
        setIsPlaying(false);
        seekTo(value);
        setIsPreviewingSlider(true);
      } else {
        console.warn("Video ref not available for seeking");
      }
    }
  };

  // Handle end time change with preview (throttled for mobile) - used by preview buttons
  const handleEndTimeChange = (value: number) => {
    // Don't process if we're already dragging
    if (isDragging) return;

    setEndTime(value);
    if (value <= startTime) {
      setStartTime(Math.max(value - 1, 0));
    }

    // Throttle seeking on mobile to improve performance
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const now = Date.now();

    if (!isMobile || now - lastSeekTime > 200) {
      // Increased throttle to 200ms
      setLastSeekTime(now);

      // Pause video and seek to end time for preview
      if (videoRef.current) {
        console.log("Seeking video to end time:", value);
        videoRef.current.pause();
        setIsPlaying(false);
        seekTo(value);
        setIsPreviewingSlider(true);
      } else {
        console.warn("Video ref not available for seeking");
      }
    }
  };

  // Play the selected segment for preview
  const playSelection = () => {
    if (videoRef.current && isValidSelection) {
      seekTo(startTime);

      // Play the video after a short delay to allow seek to complete
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Failed to play video:", error);
              setIsPlaying(false);
            });
        }
      }, 50);
    }
  };

  // Handle slider interaction end
  const handleSliderChangeEnd = () => {
    setIsPreviewingSlider(false);
    setIsDragging(false);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate selected duration
  const selectedDuration = endTime - startTime;

  // Handle trimming using Web APIs (no FFmpeg needed for basic trimming)
  const handleTrim = async () => {
    if (!videoFile || !videoRef.current) return;

    setIsProcessing(true);

    try {
      // For now, we'll create a simple trimmed file by adjusting metadata
      // In a real implementation, you'd use FFmpeg or a similar library
      // This is a simplified approach that works with the video element

      const trimmedBlob = await createTrimmedVideo(
        videoFile,
        startTime,
        endTime
      );
      const trimmedFile = new File([trimmedBlob], `trimmed_${videoFile.name}`, {
        type: videoFile.type,
      });

      onTrimComplete(trimmedFile);
      onClose();
    } catch (error) {
      console.error("Error trimming video:", error);
      alert("Failed to trim video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple video trimming using Canvas and MediaRecorder
  const createTrimmedVideo = async (
    file: File,
    start: number,
    end: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      video.src = URL.createObjectURL(file);
      video.muted = true;

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Create MediaRecorder to capture canvas stream
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp8",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: "video/webm" });
          URL.revokeObjectURL(video.src);
          resolve(trimmedBlob);
        };

        // Start recording and seek to start time
        video.currentTime = start;

        video.onseeked = () => {
          mediaRecorder.start();
          video.play();

          // Draw frames to canvas during playback
          const drawFrame = () => {
            if (video.currentTime <= end && !video.paused) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawFrame);
            } else {
              video.pause();
              mediaRecorder.stop();
            }
          };

          drawFrame();
        };

        // Stop recording when we reach end time or video ends
        video.ontimeupdate = () => {
          if (video.currentTime >= end) {
            video.pause();
            mediaRecorder.stop();
          }
        };
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video for trimming"));
      };
    });
  };

  // Handle bypass (skip trimming)
  const handleBypass = () => {
    if (videoFile) {
      onTrimComplete(videoFile);
      onClose();
    }
  };

  const isValidSelection =
    selectedDuration <= maxDuration && selectedDuration > 0;

  // Constrain current time when selection boundaries change
  useEffect(() => {
    if (videoRef.current && duration > 0 && !isDragging && !isSeeking) {
      const currentVideoTime = videoRef.current.currentTime;

      // If current time is outside new boundaries, reset to start of selection
      if (currentVideoTime < startTime || currentVideoTime > endTime) {
        seekTo(startTime);

        // If video was playing outside boundaries, pause it
        if (isPlaying && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  }, [startTime, endTime, duration, isPlaying, isDragging, isSeeking]);

  // Cleanup effect for seek timeouts
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "xl" }} // Full screen on mobile, xl on desktop
      onCloseComplete={() => {
        setVideoUrl(null);
        setIsPlaying(false);
      }}
      closeOnOverlayClick={false}
      motionPreset="slideInBottom" // Better for mobile
      trapFocus={true} // Ensure focus trapping works on mobile
      autoFocus={false} // Prevent auto-focus issues on mobile
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg={"background"}
        maxH={{ base: "100vh", md: "90vh" }}
        overflowY="auto"
        mx={{ base: 0, md: 4 }}
        my={{ base: 0, md: 4 }}
      >
        <ModalHeader pb={{ base: 2, md: 4 }}>
          <VStack align="start" spacing={2}>
            <Text fontSize={{ base: "lg", md: "xl" }}>
              Trim Video - Max {maxDuration} seconds
            </Text>
            {canBypass ? (
              <Text fontSize="sm" color="primary">
                ✨ You have {">"}100 HP - You can bypass this limit
              </Text>
            ) : (
              <Text fontSize="sm" color="accent">
                📹 Videos are limited to {maxDuration} seconds in the feed. Get{" "}
                {">"}100 HP to bypass this limit.
              </Text>
            )}
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody px={{ base: 3, md: 6 }} py={{ base: 3, md: 4 }}>
          <VStack spacing={{ base: 3, md: 4 }}>
            {/* Video Player */}
            {videoUrl && (
              <Box
                width="100%"
                borderRadius="md"
                overflow="hidden"
                bg="black"
                position="relative"
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={{
                    width: "100%",
                    height: window.innerWidth < 768 ? "200px" : "300px", // Smaller on mobile
                    objectFit: "contain",
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => console.error("Video error:", e)}
                  playsInline // Important for mobile
                  controls={false}
                  preload="metadata" // Better for mobile
                />

                {/* Play/Pause Button Overlay */}
                <Button
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  colorScheme="whiteAlpha"
                  variant="solid"
                  size={{ base: "md", md: "lg" }}
                  borderRadius="full"
                  onClick={togglePlayPause}
                  fontSize={{ base: "16px", md: "20px" }}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </Button>
              </Box>
            )}

            {/* Duration Info */}
            <Alert status={isValidSelection ? "success" : "warning"}>
              <AlertIcon />
              <Text>
                Original: {formatTime(duration)} | Selected:{" "}
                {formatTime(selectedDuration)} |
                {isValidSelection
                  ? " ✓ Valid selection"
                  : ` ⚠️ Exceeds ${maxDuration}s limit`}
              </Text>
            </Alert>

            {/* iPhone-style Timeline and Controls */}
            <VStack width="100%" spacing={{ base: 3, md: 4 }}>
              {/* Current Time Display */}
              <Text fontSize="sm" textAlign="center">
                Current Position: {formatTime(currentTime)}
              </Text>

              {/* iPhone-style Timeline Trimmer with Play Button */}
              <Box width="100%" px={2}>
                <Text fontSize="xs" mb={3} textAlign="center" color="gray.400">
                  Drag the yellow handles to trim your video
                </Text>

                {/* Play Button + Timeline Row */}
                <HStack spacing={3} width="100%" align="center">
                  {/* Play Button */}
                  <Button
                    colorScheme="blue"
                    variant="ghost"
                    size="lg"
                    onClick={playSelection}
                    borderRadius="full"
                    width="60px"
                    height="60px"
                    minW="60px"
                    p={0}
                    bg="rgba(0, 123, 255, 0.1)"
                    border="2px solid"
                    borderColor="blue.400"
                    isDisabled={!isValidSelection}
                    _hover={{
                      bg: isValidSelection
                        ? "rgba(0, 123, 255, 0.2)"
                        : "rgba(0, 123, 255, 0.1)",
                      borderColor: isValidSelection ? "blue.300" : "blue.400",
                      transform: isValidSelection ? "scale(1.05)" : "none",
                    }}
                    _active={{
                      bg: "rgba(0, 123, 255, 0.3)",
                      transform: "scale(0.95)",
                    }}
                    _disabled={{
                      opacity: 0.4,
                      cursor: "not-allowed",
                    }}
                    transition="all 0.1s ease"
                    title={
                      isValidSelection
                        ? "Play selected segment"
                        : "Selection too long - adjust handles"
                    }
                  >
                    <FaPlay size={20} color="var(--chakra-colors-blue-400)" />
                  </Button>

                  {/* Timeline Track */}
                  <Box
                    flex={1}
                    height="50px"
                    bg="gray.700"
                    borderRadius="8px"
                    position="relative"
                    cursor="pointer"
                    border="1px solid"
                    borderColor="gray.600"
                    onClick={(e) => {
                      // Allow seeking by clicking on timeline
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const timePosition = (clickX / rect.width) * duration;
                      seekTo(timePosition);
                    }}
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsPreviewingSlider(true);
                        setIsDragging(true);

                        // Capture the timeline element reference
                        const timelineElement = e.currentTarget.parentElement;
                        if (!timelineElement) return;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const rect = timelineElement.getBoundingClientRect();
                          const newX = moveEvent.clientX - rect.left;
                          const newTime = Math.max(
                            0,
                            Math.min(
                              (newX / rect.width) * duration,
                              endTime - 0.5
                            )
                          );

                          // Just update state during drag, don't seek constantly
                          setStartTime(newTime);
                          if (newTime >= endTime) {
                            setEndTime(Math.min(newTime + 1, duration));
                          }
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp
                          );

                          // Only seek once when dragging ends
                          if (videoRef.current) {
                            seekTo(startTime);
                          }
                          handleSliderChangeEnd();
                        };

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsPreviewingSlider(true);
                        setIsDragging(true);

                        // Capture the timeline element reference
                        const timelineElement = e.currentTarget.parentElement;
                        if (!timelineElement) return;

                        const handleTouchMove = (moveEvent: TouchEvent) => {
                          const rect = timelineElement.getBoundingClientRect();
                          const newX = moveEvent.touches[0].clientX - rect.left;
                          const newTime = Math.max(
                            0,
                            Math.min(
                              (newX / rect.width) * duration,
                              endTime - 0.5
                            )
                          );

                          // Just update state during drag, don't seek constantly
                          setStartTime(newTime);
                          if (newTime >= endTime) {
                            setEndTime(Math.min(newTime + 1, duration));
                          }
                        };

                        const handleTouchEnd = () => {
                          document.removeEventListener(
                            "touchmove",
                            handleTouchMove
                          );
                          document.removeEventListener(
                            "touchend",
                            handleTouchEnd
                          );

                          // Only seek once when dragging ends
                          if (videoRef.current) {
                            seekTo(startTime);
                          }
                          handleSliderChangeEnd();
                        };

                        document.addEventListener("touchmove", handleTouchMove);
                        document.addEventListener("touchend", handleTouchEnd);
                      }}
                    >
                      {/* Handle Visual Indicator */}
                      <Flex align="center" justify="center" height="100%">
                        <VStack spacing="2px">
                          <Box
                            width="2px"
                            height="6px"
                            bg="white"
                            borderRadius="1px"
                          />
                          <Box
                            width="2px"
                            height="6px"
                            bg="white"
                            borderRadius="1px"
                          />
                          <Box
                            width="2px"
                            height="6px"
                            bg="white"
                            borderRadius="1px"
                          />
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsPreviewingSlider(true);
                        setIsDragging(true);

                        // Capture the timeline element reference
                        const timelineElement = e.currentTarget.parentElement;
                        if (!timelineElement) return;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const rect = timelineElement.getBoundingClientRect();
                          const newX = moveEvent.clientX - rect.left;
                          const newTime = Math.min(
                            duration,
                            Math.max(
                              (newX / rect.width) * duration,
                              startTime + 0.5
                            )
                          );

                          // Just update state during drag, don't seek constantly
                          setEndTime(newTime);
                          if (newTime <= startTime) {
                            setStartTime(Math.max(newTime - 1, 0));
                          }
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp
                          );

                          // Only seek once when dragging ends
                          if (videoRef.current) {
                            seekTo(endTime);
                          }
                          handleSliderChangeEnd();
                        };

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsPreviewingSlider(true);
                        setIsDragging(true);

                        // Capture the timeline element reference
                        const timelineElement = e.currentTarget.parentElement;
                        if (!timelineElement) return;

                        const handleTouchMove = (moveEvent: TouchEvent) => {
                          const rect = timelineElement.getBoundingClientRect();
                          const newX = moveEvent.touches[0].clientX - rect.left;
                          const newTime = Math.min(
                            duration,
                            Math.max(
                              (newX / rect.width) * duration,
                              startTime + 0.5
                            )
                          );

                          // Just update state during drag, don't seek constantly
                          setEndTime(newTime);
                          if (newTime <= startTime) {
                            setStartTime(Math.max(newTime - 1, 0));
                          }
                        };

                        const handleTouchEnd = () => {
                          document.removeEventListener(
                            "touchmove",
                            handleTouchMove
                          );
                          document.removeEventListener(
                            "touchend",
                            handleTouchEnd
                          );

                          // Only seek once when dragging ends
                          if (videoRef.current) {
                            seekTo(endTime);
                          }
                          handleSliderChangeEnd();
                        };

                        document.addEventListener("touchmove", handleTouchMove);
                        document.addEventListener("touchend", handleTouchEnd);
                      }}
                    >
                      {/* Handle Visual Indicator */}
                      <Flex align="center" justify="center" height="100%">
                        <VStack spacing="2px">
                          <Box
                            width="2px"
                            height="6px"
                            bg="white"
                            borderRadius="1px"
                          />
                          <Box
                            width="2px"
                            height="6px"
                            bg="white"
                            borderRadius="1px"
                          />
                          <Box
                            width="2px"
                            height="6px"
                            bg="white"
                            borderRadius="1px"
                          />
                        </VStack>
                      </Flex>
                    </Box>
                  </Box>
                </HStack>

                {/* Time Labels - Aligned with timeline */}
                <HStack spacing={3} width="100%" align="center">
                  {/* Spacer for play button */}
                  <Box width="60px" minW="60px" />

                  {/* Time labels aligned with timeline */}
                  <Flex
                    justify="space-between"
                    flex={1}
                    fontSize="xs"
                    color="gray.400"
                  >
                    <Text>{formatTime(startTime)}</Text>
                    <Text color="blue.400">{formatTime(currentTime)}</Text>
                    <Text>{formatTime(endTime)}</Text>
                  </Flex>
                </HStack>

                {/* Duration Info */}
                <Text
                  fontSize="sm"
                  textAlign="center"
                  mt={2}
                  color={isValidSelection ? "green.400" : "red.400"}
                >
                  Selected: {formatTime(selectedDuration)} /{" "}
                  {formatTime(maxDuration)}
                  {!isValidSelection && " ⚠️ Too long!"}
                </Text>
              </Box>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter pt={{ base: 2, md: 4 }}>
          <VStack spacing={3} width="100%">
            <HStack
              spacing={3}
              width="100%"
              flexDirection={{ base: "column", md: "row" }}
              align="stretch"
            >
              <Button
                variant="ghost"
                onClick={onClose}
                size={{ base: "md", md: "md" }}
                flex={{ base: 1, md: "none" }}
              >
                Cancel
              </Button>

              {canBypass && (
                <Button
                  colorScheme="green"
                  onClick={handleBypass}
                  size={{ base: "md", md: "md" }}
                  flex={{ base: 1, md: "none" }}
                >
                  Skip Trimming ({">"}100 HP)
                </Button>
              )}

              <Button
                colorScheme="blue"
                onClick={handleTrim}
                isLoading={isProcessing}
                loadingText="Trimming..."
                isDisabled={!isValidSelection}
                leftIcon={<FaCut />}
                size={{ base: "md", md: "md" }}
                flex={{ base: 1, md: "none" }}
              >
                Trim & Use Video
              </Button>
            </HStack>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VideoTrimModal;
