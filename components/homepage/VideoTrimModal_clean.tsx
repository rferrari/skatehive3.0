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

  // Set up video URL when file changes
  useEffect(() => {
    console.log("🎬 VideoTrimModal: videoFile changed", {
      hasFile: !!videoFile,
      fileName: videoFile?.name,
      fileSize: videoFile?.size,
      fileType: videoFile?.type,
    });

    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      console.log("🔗 Created blob URL:", url);
      setVideoUrl(url);

      return () => {
        console.log("🧹 Cleaning up blob URL:", url);
        URL.revokeObjectURL(url);
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
      setDuration(videoDuration);
      setEndTime(Math.min(videoDuration, maxDuration));
      setCurrentTime(0);
      console.log("🎯 Set endTime to:", Math.min(videoDuration, maxDuration));
    }
  };

  // Handle time updates during playback
  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging && !isSeeking) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);

      // Auto-pause when reaching end of selection during playback
      if (isPlaying && newTime >= endTime) {
        console.log("⏸️ Auto-pausing at end of selection");
        videoRef.current.pause();
        setIsPlaying(false);
        seekTo(startTime);
      }
    }
  };

  // Play/pause controls
  const togglePlayPause = () => {
    console.log("🎮 Toggle play/pause, currently playing:", isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => {
            console.log("▶️ Video started playing");
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("❌ Failed to play video:", error);
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
      console.log(
        "⚠️ Video not ready for seeking, readyState:",
        video.readyState
      );
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
          console.log("🎯 Delayed seek to:", time);
          videoRef.current.currentTime = time;
          setCurrentTime(time);
          lastSeekTime.current = Date.now();
        }
        seekTimeoutRef.current = null;
      }, 50);
      return;
    }

    console.log("🎯 Seeking to:", time);
    setIsSeeking(true);
    video.currentTime = time;
    setCurrentTime(time);
    lastSeekTime.current = now;

    const handleSeeked = () => {
      console.log("✅ Seek completed");
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

  // Play the selected segment for preview
  const playSelection = () => {
    console.log("🎬 Playing selection from", startTime, "to", endTime);
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
    if (!videoRef.current) {
      console.log("❌ No video ref for thumbnail generation");
      return null;
    }

    console.log("📸 Starting thumbnail generation...");
    setIsGeneratingThumbnail(true);

    try {
      const video = videoRef.current;
      console.log(
        "🎥 Video dimensions:",
        video.videoWidth,
        "x",
        video.videoHeight
      );
      console.log("🕐 Current video time:", video.currentTime);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("❌ Could not get canvas context");
        setIsGeneratingThumbnail(false);
        return null;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            console.log("🖼️ Canvas blob created, size:", blob?.size);
            resolve(blob!);
          },
          "image/jpeg",
          0.9
        );
      });

      setThumbnailBlob(blob);
      console.log("💾 Thumbnail blob set");

      const thumbnailFile = new File([blob], "thumbnail.jpg", {
        type: "image/jpeg",
      });
      console.log(
        "📁 Thumbnail file created:",
        thumbnailFile.name,
        thumbnailFile.size
      );

      console.log("🔐 Getting file signature...");
      const signature = await getFileSignature(thumbnailFile);
      console.log("✅ Got signature:", signature);

      console.log("☁️ Uploading to Hive images...");
      const hiveUrl = await uploadImage(thumbnailFile, signature);
      console.log("🎉 Thumbnail uploaded successfully:", hiveUrl);

      setThumbnailUrl(hiveUrl);
      setIsGeneratingThumbnail(false);
      return hiveUrl;
    } catch (error) {
      console.error("❌ Error generating/uploading thumbnail:", error);
      setIsGeneratingThumbnail(false);
      return null;
    }
  };

  // Handle thumbnail capture
  const handleCaptureFrame = async () => {
    console.log("🖱️ User clicked capture frame");
    await generateThumbnail();
  };

  // Handle slider interaction end
  const handleSliderChangeEnd = () => {
    console.log("🔚 Slider interaction ended");
    setIsPreviewingSlider(false);
    setIsDragging(false);
  };

  // Create trimmed video blob - SIMPLIFIED APPROACH
  const createTrimmedVideo = async (
    file: File,
    start: number,
    end: number
  ): Promise<Blob> => {
    console.log("✂️ Creating trimmed video (SIMPLE):", {
      start,
      end,
      duration: end - start,
      fileName: file.name,
    });

    return new Promise((resolve, reject) => {
      // Create video element
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "metadata";

      const fileUrl = URL.createObjectURL(file);
      video.src = fileUrl;

      console.log("🔗 Video created with URL:", fileUrl);

      video.onloadedmetadata = async () => {
        try {
          console.log(
            "📊 Video loaded, dimensions:",
            video.videoWidth,
            "x",
            video.videoHeight
          );
          console.log("📊 Video duration:", video.duration);

          // Create canvas for recording
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          console.log("🎨 Canvas ready:", canvas.width, "x", canvas.height);

          // Create MediaRecorder from canvas stream
          const stream = canvas.captureStream(30); // 30 FPS
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp9",
            videoBitsPerSecond: 2500000, // 2.5 Mbps
          });

          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
              console.log("📦 Chunk recorded:", event.data.size, "bytes");
            }
          };

          mediaRecorder.onstop = () => {
            console.log("🛑 Recording complete, chunks:", chunks.length);
            const blob = new Blob(chunks, { type: "video/webm" });
            console.log("🎥 Final blob size:", blob.size);
            URL.revokeObjectURL(fileUrl);
            resolve(blob);
          };

          // **THE SIMPLE SOLUTION**
          // Seek to start, record frames at natural video speed
          video.currentTime = start;

          video.onseeked = () => {
            console.log("🎯 Seeked to start:", start);

            // Start recording
            mediaRecorder.start();
            console.log("� Recording started");

            // Set playback rate to 1.0 (normal speed)
            video.playbackRate = 1.0;

            // Play the video segment
            video
              .play()
              .then(() => {
                console.log("▶️ Video playing at normal speed");

                // Draw frames continuously
                const renderFrame = () => {
                  if (video.currentTime >= end) {
                    console.log("⏹️ Reached end time, stopping");
                    video.pause();
                    mediaRecorder.stop();
                    return;
                  }

                  if (!video.paused && !video.ended) {
                    // Draw current frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(renderFrame);
                  }
                };

                // Start rendering frames
                requestAnimationFrame(renderFrame);
              })
              .catch((error) => {
                console.error("❌ Play failed:", error);
                reject(error);
              });
          };

          // Backup stop mechanism
          video.ontimeupdate = () => {
            if (video.currentTime >= end) {
              console.log("🛑 Time update stop triggered");
              video.pause();
              mediaRecorder.stop();
            }
          };
        } catch (error) {
          console.error("❌ Setup error:", error);
          URL.revokeObjectURL(fileUrl);
          reject(error);
        }
      };

      video.onerror = (error) => {
        console.error("❌ Video load error:", error);
        URL.revokeObjectURL(fileUrl);
        reject(new Error("Failed to load video"));
      };
    });
  };

  // Handle trimming
  const handleTrim = async () => {
    if (!videoFile || !videoRef.current) {
      console.log("❌ Cannot trim: missing videoFile or videoRef");
      return;
    }

    console.log("✂️ Starting trim process...");
    setIsProcessing(true);

    try {
      console.log("🎬 Creating trimmed video...");
      const trimmedBlob = await createTrimmedVideo(
        videoFile,
        startTime,
        endTime
      );
      console.log("✅ Trimmed video created, size:", trimmedBlob.size);

      let finalThumbnailUrl = thumbnailUrl;
      if (!finalThumbnailUrl) {
        console.log("📸 No thumbnail exists, generating one...");
        const middleTime = startTime + (endTime - startTime) / 2;
        videoRef.current.currentTime = middleTime;
        await new Promise((resolve) => setTimeout(resolve, 100));
        finalThumbnailUrl = await generateThumbnail();
      } else {
        console.log("✅ Using existing thumbnail:", finalThumbnailUrl);
      }

      const trimmedFile = new File([trimmedBlob], `trimmed_${videoFile.name}`, {
        type: videoFile.type,
      });
      console.log("📁 Trimmed file created:", {
        name: trimmedFile.name,
        size: trimmedFile.size,
        type: trimmedFile.type,
      });

      // Attach thumbnail URL to file
      (trimmedFile as any).thumbnailUrl = finalThumbnailUrl;
      console.log("🔗 Attached thumbnail URL to file:", finalThumbnailUrl);

      console.log("🚀 Calling onTrimComplete with trimmed file");
      onTrimComplete(trimmedFile);
      onClose();
    } catch (error) {
      console.error("❌ Error trimming video:", error);
      alert("Failed to trim video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bypass (skip trimming)
  const handleBypass = async () => {
    if (videoFile) {
      console.log("⏭️ Bypassing trim, using original file:", videoFile.name);
      try {
        let finalThumbnailUrl = thumbnailUrl;
        if (!finalThumbnailUrl) {
          console.log("📸 No thumbnail exists, generating one for bypass...");
          if (videoRef.current) {
            videoRef.current.currentTime = duration / 2;
            await new Promise((resolve) => setTimeout(resolve, 100));
            finalThumbnailUrl = await generateThumbnail();
          }
        } else {
          console.log(
            "✅ Using existing thumbnail for bypass:",
            finalThumbnailUrl
          );
        }

        // Attach thumbnail URL to original file
        (videoFile as any).thumbnailUrl = finalThumbnailUrl;
        console.log(
          "🔗 Attached thumbnail URL to original file:",
          finalThumbnailUrl
        );

        console.log("🚀 Calling onTrimComplete with original file");
        onTrimComplete(videoFile);
        onClose();
      } catch (error) {
        console.error("❌ Error generating thumbnail for bypass:", error);
        console.log("⚠️ Proceeding without thumbnail");
        onTrimComplete(videoFile);
        onClose();
      }
    }
  };

  const isValidSelection =
    endTime - startTime <= maxDuration && endTime - startTime > 0;
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
        console.log("🧹 Modal close complete, cleaning up state");
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
            {/* Video Player - Always at the top */}
            {videoUrl && (
              <VideoPlayer
                videoRef={videoRef}
                videoUrl={videoUrl}
                isPlaying={isPlaying}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onTogglePlayPause={togglePlayPause}
              />
            )}

            {/* Duration Info */}
            <Alert status={isValidSelection ? "success" : "warning"} size="sm">
              <AlertIcon />
              <Text fontSize="sm">
                Original: {formatTime(duration)} | Selected:{" "}
                {formatTime(selectedDuration)}
                {isValidSelection ? " ✓" : ` ⚠️ Exceeds ${maxDuration}s`}
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
                    onSeek={seekTo}
                    onStartTimeChange={setStartTime}
                    onEndTimeChange={setEndTime}
                    onDragStart={() => {
                      console.log("🔄 Drag started");
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
