import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
} from "@chakra-ui/react";
import { getFileSignature, uploadImage } from "@/lib/hive/client-functions";
import { formatTime } from "@/lib/utils/timeUtils";
import VideoPlayer from "./VideoPlayer";
import VideoTimeline from "./VideoTimeline";
import ThumbnailCapture from "./ThumbnailCapture";
import VideoTrimModalFooter from "./VideoTrimModalFooter";

interface VideoTrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File | null;
  onTrimComplete: (trimmedFile: File) => void;
  maxDuration?: number;
  canBypass?: boolean;
}

const VideoTrimModal: React.FC<VideoTrimModalProps> = ({
  isOpen,
  onClose,
  videoFile,
  onTrimComplete,
  maxDuration = 15,
  canBypass = false,
}) => {
  // Video refs and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Trimming state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPreviewingSlider, setIsPreviewingSlider] = useState(false);

  // Refs for throttling seeks
  const lastSeekTime = useRef(0);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Thumbnail selection states
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Reset state when modal opens with a new video
  useEffect(() => {
    if (isOpen && videoFile) {
      console.log("🎭 Modal opened with video file - resetting state");
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setThumbnailBlob(null);
      setThumbnailUrl(null);
      setIsGeneratingThumbnail(false);
    }
  }, [isOpen, videoFile]);

  // Set up video URL when file changes
  useEffect(() => {
    console.log("🎬 VideoTrimModal: videoFile changed", {
      hasFile: !!videoFile,
      fileName: videoFile?.name,
      fileSize: videoFile?.size,
      fileType: videoFile?.type,
    });

    if (videoFile) {
      // Reset state when new video file is loaded
      console.log("🔄 Resetting video state for new file");
      setDuration(0);
      setStartTime(0);
      setEndTime(0);
      setCurrentTime(0);
      setIsPlaying(false);

      const url = URL.createObjectURL(videoFile);
      console.log("🔗 Created blob URL:", url);
      setVideoUrl(url);

      // Force metadata check after a short delay
      setTimeout(() => {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          console.log("🔄 Force checking video metadata after delay");
          console.log("🔄 Video readyState:", videoRef.current.readyState);
          console.log("🔄 Video duration:", videoRef.current.duration);
          if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
            console.log("🔄 Manually triggering handleLoadedMetadata");
            handleLoadedMetadata();
          }
        }
      }, 500);

      // Don't immediately cleanup the URL - let it persist until component unmounts
      // This prevents ERR_FILE_NOT_FOUND errors when the modal processes the video
      return () => {
        console.log("🧹 Cleaning up blob URL after delay:", url);
        // Delay cleanup to allow any pending operations to complete
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } else {
      console.log("❌ No video file, clearing URL");
      setVideoUrl(null);
    }
  }, [videoFile]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    console.log("📊 Video metadata loaded");
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      console.log("⏱️ Video duration:", videoDuration);
      console.log("📏 maxDuration prop:", maxDuration);
      console.log(
        "🔢 Math.min calculation:",
        Math.min(videoDuration, maxDuration)
      );

      setDuration(videoDuration);
      const calculatedEndTime = Math.min(videoDuration, maxDuration);
      setEndTime(calculatedEndTime);
      setCurrentTime(0);

      console.log("🎯 Set endTime to:", calculatedEndTime);
      console.log(
        "✅ Final state - duration:",
        videoDuration,
        "endTime:",
        calculatedEndTime
      );
    }
  };

  // Handle time updates during playback
  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging && !isSeeking) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);

      // Auto-pause when reaching end of selection during playback
      if (isPlaying && newTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        seekTo(startTime);
      }
    }
  };

  // Play/pause controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
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
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    if (isSeeking || isDragging || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      return;
    }

    const currentTime = video.currentTime;
    if (Math.abs(currentTime - time) < 0.1) {
      return;
    }

    const now = Date.now();
    if (now - lastSeekTime.current < 100) {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      seekTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
          lastSeekTime.current = Date.now();
        }
        seekTimeoutRef.current = null;
      }, 50);
      return;
    }

    setIsSeeking(true);
    video.currentTime = time;
    setCurrentTime(time);
    lastSeekTime.current = now;

    const handleSeeked = () => {
      setIsSeeking(false);
      video.removeEventListener("seeked", handleSeeked);
    };

    video.addEventListener("seeked", handleSeeked);

    setTimeout(() => {
      if (video.readyState >= 2) {
        setIsSeeking(false);
        video.removeEventListener("seeked", handleSeeked);
      }
    }, 1000);
  };

  // Seek during handle dragging (bypasses dragging check)
  const seekDuringDrag = (time: number) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  // Play the selected segment for preview
  const playSelection = () => {
    if (videoRef.current) {
      seekTo(startTime);

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

  // Generate thumbnail from current video position and upload to Hive.blog
  const generateThumbnail = async () => {
    if (!videoRef.current) return null;

    setIsGeneratingThumbnail(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsGeneratingThumbnail(false);
        return null;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          "image/jpeg",
          0.9
        );
      });

      setThumbnailBlob(blob);

      const thumbnailFile = new File([blob], "thumbnail.jpg", {
        type: "image/jpeg",
      });
      const signature = await getFileSignature(thumbnailFile);
      const hiveUrl = await uploadImage(thumbnailFile, signature);

      setThumbnailUrl(hiveUrl);
      setIsGeneratingThumbnail(false);
      return hiveUrl;
    } catch (error) {
      console.error("Error generating/uploading thumbnail:", error);
      setIsGeneratingThumbnail(false);
      return null;
    }
  };

  // Handle thumbnail capture
  const handleCaptureFrame = async () => {
    await generateThumbnail();
  };

  // Handle slider interaction end
  const handleSliderChangeEnd = () => {
    setIsPreviewingSlider(false);
    setIsDragging(false);
  };

  // Create trimmed video blob
  // Simple video trimming that preserves timing by using real-time capture
  const createTrimmedVideo = async (
    file: File,
    start: number,
    end: number
  ): Promise<Blob> => {
    console.log(`Creating trimmed video: ${start}s to ${end}s`);

    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const duration = end - start;
        console.log(
          `Video duration: ${video.duration}s, trim duration: ${duration}s`
        );

        if (duration <= 0 || start >= video.duration) {
          URL.revokeObjectURL(videoUrl);
          reject(new Error("Invalid trim range"));
          return;
        }

        // Create canvas for recording
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Create MediaRecorder that will capture in real-time
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          URL.revokeObjectURL(videoUrl);
          console.log(`Trimmed video created: ${blob.size} bytes`);
          resolve(blob);
        };

        // Position video at start time
        video.currentTime = start;

        video.onseeked = () => {
          console.log(
            `Video positioned at ${video.currentTime}s, starting recording`
          );

          // Start recording
          mediaRecorder.start();

          // Play video at normal speed
          video.play();

          // Set up timer to stop at exact duration
          setTimeout(() => {
            console.log(`Stopping recording after ${duration}s`);
            video.pause();
            mediaRecorder.stop();
          }, duration * 1000);
        };

        // Continuously draw video frames to canvas
        const drawFrame = () => {
          if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          }
        };

        video.onplay = () => {
          drawFrame();
        };

        video.onerror = () => {
          URL.revokeObjectURL(videoUrl);
          reject(new Error("Video playback error"));
        };
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Failed to load video"));
      };
    });
  };

  // Handle trimming
  const handleTrim = async () => {
    if (!videoFile || !videoRef.current) return;

    setIsProcessing(true);

    try {
      const trimmedBlob = await createTrimmedVideo(
        videoFile,
        startTime,
        endTime
      );

      let finalThumbnailUrl = thumbnailUrl;
      if (!finalThumbnailUrl) {
        const middleTime = startTime + (endTime - startTime) / 2;
        videoRef.current.currentTime = middleTime;
        await new Promise((resolve) => setTimeout(resolve, 100));
        finalThumbnailUrl = await generateThumbnail();
      }

      const trimmedFile = new File([trimmedBlob], `trimmed_${videoFile.name}`, {
        type: "video/webm", // Explicitly set as WebM since that's what we create
      });

      // Mark this file as already processed to skip compression
      (trimmedFile as any).thumbnailUrl = finalThumbnailUrl;
      (trimmedFile as any).fromTrimModal = true;

      onTrimComplete(trimmedFile);
      onClose();
    } catch (error) {
      console.error("Error trimming video:", error);
      alert("Failed to trim video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bypass (skip trimming)
  const handleBypass = async () => {
    if (videoFile) {
      try {
        let finalThumbnailUrl = thumbnailUrl;
        if (!finalThumbnailUrl) {
          if (videoRef.current) {
            videoRef.current.currentTime = duration / 2;
            await new Promise((resolve) => setTimeout(resolve, 100));
            finalThumbnailUrl = await generateThumbnail();
          }
        }

        (videoFile as any).thumbnailUrl = finalThumbnailUrl;
        (videoFile as any).fromTrimModal = true; // Mark as processed even for bypass

        onTrimComplete(videoFile);
        onClose();
      } catch (error) {
        console.error("Error generating thumbnail for bypass:", error);
        (videoFile as any).fromTrimModal = true; // Mark even on error
        onTrimComplete(videoFile);
        onClose();
      }
    }
  };

  const isValidSelection = canBypass
    ? endTime - startTime > 0
    : endTime - startTime <= maxDuration && endTime - startTime > 0;
  const selectedDuration = endTime - startTime;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }
    };
  }, []);

  // Debug modal state
  useEffect(() => {
    console.log("🎭 VideoTrimModal state:", {
      isOpen,
      hasVideoFile: !!videoFile,
      hasVideoUrl: !!videoUrl,
      videoUrlValue: videoUrl,
      duration,
      startTime,
      endTime,
      isValidSelection,
      canBypass,
      isProcessing,
    });
  }, [
    isOpen,
    videoFile,
    videoUrl,
    duration,
    startTime,
    endTime,
    isValidSelection,
    canBypass,
    isProcessing,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "xl" }}
      onCloseComplete={() => {
        setVideoUrl(null);
        setIsPlaying(false);
        setThumbnailBlob(null);
        setThumbnailUrl(null);
        setIsGeneratingThumbnail(false);
      }}
      closeOnOverlayClick={false}
      motionPreset="slideInBottom"
      trapFocus={true}
      autoFocus={false}
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
              {canBypass
                ? "Video Editor"
                : `Trim Video - Max ${maxDuration} seconds`}
            </Text>
            {canBypass ? (
              <Text fontSize="sm" color="primary">
                ✨ You have {">"}100 HP - You can use the full video or trim it
                as needed
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
            {/* Video Player - Always at the top */}
            {videoUrl ? (
              <>
                {console.log(
                  "🎮 Rendering VideoPlayer with videoUrl:",
                  videoUrl
                )}
                <VideoPlayer
                  videoRef={videoRef}
                  videoUrl={videoUrl}
                  isPlaying={isPlaying}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onTogglePlayPause={togglePlayPause}
                />
              </>
            ) : (
              <>
                <Box
                  width="100%"
                  height="200px"
                  bg="red.100"
                  border="2px solid red"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="red.600" fontWeight="bold">
                    DEBUG: No videoUrl - videoFile:{" "}
                    {videoFile ? "exists" : "missing"}
                  </Text>
                </Box>
              </>
            )}

            {/* Duration Info */}
            <Alert
              status={
                canBypass
                  ? isValidSelection
                    ? "success"
                    : "info"
                  : isValidSelection
                  ? "success"
                  : "warning"
              }
              size="sm"
            >
              <AlertIcon />
              <Text fontSize="sm">
                Original: {formatTime(duration)} | Selected:{" "}
                {formatTime(selectedDuration)}
                {canBypass
                  ? isValidSelection
                    ? " ✓"
                    : " (You can use the full video)"
                  : isValidSelection
                  ? " ✓"
                  : ` ⚠️ Exceeds ${maxDuration}s`}
              </Text>
            </Alert>

            {/* Tabs for Trim and Thumbnail functionality */}
            <Tabs width="100%" variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>✂️ Trim Video</Tab>
                <Tab>📸 Thumbnail</Tab>
              </TabList>

              <TabPanels>
                {/* Trim Tab */}
                <TabPanel px={0}>
                  <VideoTimeline
                    duration={duration}
                    currentTime={currentTime}
                    startTime={startTime}
                    endTime={endTime}
                    isValidSelection={isValidSelection}
                    maxDuration={maxDuration}
                    canBypass={canBypass}
                    onSeek={seekTo}
                    onSeekDuringDrag={seekDuringDrag}
                    onStartTimeChange={setStartTime}
                    onEndTimeChange={setEndTime}
                    onDragStart={() => {
                      setIsPreviewingSlider(true);
                      setIsDragging(true);
                    }}
                    onDragEnd={handleSliderChangeEnd}
                  />
                </TabPanel>

                {/* Thumbnail Tab */}
                <TabPanel px={0}>
                  <ThumbnailCapture
                    thumbnailUrl={thumbnailUrl}
                    isGeneratingThumbnail={isGeneratingThumbnail}
                    onCaptureFrame={handleCaptureFrame}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>

        <VideoTrimModalFooter
          isValidSelection={isValidSelection}
          maxDuration={maxDuration}
          canBypass={canBypass}
          isProcessing={isProcessing}
          onClose={onClose}
          onBypass={handleBypass}
          onTrim={handleTrim}
        />
      </ModalContent>
    </Modal>
  );
};

export default VideoTrimModal;
