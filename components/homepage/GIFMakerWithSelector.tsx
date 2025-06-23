import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Box, Input, Button, Text, useBreakpointValue } from "@chakra-ui/react";
import { useTheme } from "@/app/themeProvider";

interface GIFMakerWithSelectorProps {
  onUpload: (url: string | null, caption?: string) => void;
  isProcessing?: boolean;
}

export interface GIFMakerRef {
  trigger: () => void;
  reset: () => void;
}

const GIFMakerWithSelector = forwardRef<GIFMakerRef, GIFMakerWithSelectorProps>(
  ({ onUpload, isProcessing = false }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<string>("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [canConvert, setCanConvert] = useState<boolean>(false);
    // Ref to track if user is seeking
    const isSeekingRef = useRef(false);
    const [caption, setCaption] = useState("");

    // THEME
    const { theme } = useTheme();
    const colors = theme.colors;
    const borderRadius = theme.radii?.md || "12px";
    const boxShadow = theme.shadows?.md || "0 2px 12px rgba(0,0,0,0.08)";
    const fontSizeSm = theme.fontSizes?.sm || "14px";
    const fontSizeMd = theme.fontSizes?.md || "16px";
    const fontSizeLg = theme.fontSizes?.lg || "18px";
    const fontWeightMedium = theme.fontWeights?.medium || 500;
    const fontWeightBold = theme.fontWeights?.bold || 700;

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (inputRef.current && !isProcessing) {
          inputRef.current.value = "";
          inputRef.current.click();
        }
      },
      reset: () => {
        setStatus("");
        setVideoUrl(null);
        setVideoFile(null);
        setVideoDuration(0);
        setStartTime(null);
        setEndTime(null);
        setCanConvert(false);
      },
    }));

    useEffect(() => {
      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
      };
    }, [videoUrl]);

    const validateDuration = (file: File): Promise<{ valid: boolean; duration: number }> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const duration = video.duration;
          resolve({ valid: duration <= 30, duration });
        };
        video.onerror = () => {
          resolve({ valid: false, duration: 0 });
        };
        video.src = URL.createObjectURL(file);
      });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setStatus("");
        setVideoUrl(null);
        setVideoFile(null);
        setVideoDuration(0);
        setStartTime(null);
        setEndTime(null);
        setCanConvert(false);
        onUpload(null, caption);
        return;
      }
      setStatus("Validating video duration...");
      const { valid, duration } = await validateDuration(file);
      if (!valid || duration < 0.1) {
        setStatus("Video must be between 0.1 and 30 seconds long.");
        setVideoUrl(null);
        setVideoFile(null);
        setVideoDuration(0);
        setStartTime(null);
        setEndTime(null);
        setCanConvert(false);
        onUpload(null, caption);
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFile(file);
      setVideoDuration(duration);
      setStartTime(null);
      setEndTime(null);
      setCanConvert(false);
      setStatus("");
    };

    const handleSetStart = () => {
      if (videoRef.current) {
        const current = videoRef.current.currentTime;
        setStartTime(current);
        if (endTime !== null) {
          if (current >= endTime) {
            setStatus("Start time must be before end time.");
          } else if (endTime - current > 6) {
            setStatus("Segment cannot be longer than 6 seconds.");
          } else {
            setStatus("");
          }
        } else {
          setStatus("");
        }
      }
    };

    const handleSetEnd = () => {
      if (videoRef.current) {
        const current = videoRef.current.currentTime;
        setEndTime(current);
        if (startTime !== null) {
          if (current <= startTime) {
            setStatus("End time must be after start time.");
          } else if (current - startTime > 6) {
            setStatus("Segment cannot be longer than 6 seconds.");
          } else {
            setStatus("");
          }
        } else {
          setStatus("");
        }
      }
    };

    useEffect(() => {
      if (
        startTime !== null &&
        endTime !== null &&
        endTime > startTime &&
        endTime - startTime <= 6
      ) {
        setCanConvert(true);
      } else {
        setCanConvert(false);
      }
    }, [startTime, endTime]);

    const handleConvert = async () => {
      if (!videoFile || startTime === null || endTime === null) return;
      const duration = Math.max(0.1, endTime - startTime);
      setStatus("Preparing to convert...");
      try {
        if (!ffmpegRef.current) {
          setStatus("Loading FFmpeg...");
          ffmpegRef.current = new FFmpeg();
          await ffmpegRef.current.load();
        }
        const ffmpeg = ffmpegRef.current;
        setStatus("Converting to GIF...");
        await ffmpeg.writeFile(videoFile.name, await fetchFile(videoFile));
        await ffmpeg.exec([
          "-ss", startTime.toString(),
          "-i", videoFile.name,
          "-t", duration.toString(),
          "-vf", "fps=10,scale=320:-1:flags=lanczos",
          "-f", "gif",
          "output.gif",
        ]);
        const data = await ffmpeg.readFile("output.gif");
        const gifBlob = new Blob([data.buffer], { type: "image/gif" });
        const gifUrl = URL.createObjectURL(gifBlob);
        setStatus("GIF created successfully!");
        onUpload(gifUrl, caption || "skatehive-gif");
      } catch (error) {
        setStatus("Error converting video.");
        console.error("Error during GIF conversion:", error);
        onUpload(null, caption || "skatehive-gif");
      }
    };

    // Estimate GIF size in MB for 320px wide, 10fps GIFs
    const estimateGifSizeMB = (duration: number) => {
      return (0.3 + 0.3 * duration).toFixed(2);
    };

    // Get color for estimated size using theme colors
    const getEstimateColor = (size: number) => {
      if (size < 1.5) return colors.success || "#38A169";
      if (size < 1.7) return colors.warning || "#FFA500";
      if (size < 2.0) return colors.accent || "#B0C4DE";
      return colors.error || "#FF6B6B";
    };

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (startTime === null || endTime === null || endTime <= startTime) return;

      const handleSeeking = () => {
        isSeekingRef.current = true;
      };
      const handleSeeked = () => {
        isSeekingRef.current = false;
      };
      const handleTimeUpdate = () => {
        if (isSeekingRef.current) return;
        if (video.currentTime >= endTime) {
          video.currentTime = startTime;
          if (!isSeekingRef.current) {
            video.play();
          }
        }
      };
      video.addEventListener('seeking', handleSeeking);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        video.removeEventListener('seeking', handleSeeking);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }, [startTime, endTime]);

    return (
      <Box maxW={400} mx="auto" p={6} bg={colors.background} borderRadius={borderRadius} boxShadow={boxShadow} textAlign="center">
        {/* Only show Select Video button if no video is selected */}
        {!videoUrl && !videoFile && (
          <>
            <Button
              onClick={() => inputRef.current && inputRef.current.click()}
              bg={colors.background}
              color={colors.primary}
              borderWidth="2px"
              borderColor={colors.primary}
              fontWeight={fontWeightBold}
              mb={4}
              w="100%"
              borderRadius={borderRadius}
              _hover={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
              _active={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
              isDisabled={isProcessing}
            >
              Select Video (3–30s)
            </Button>
            <Input
              type="file"
              accept="video/*"
              ref={inputRef}
              display="none"
              onChange={handleFileChange}
              isDisabled={isProcessing}
            />
          </>
        )}
        {/* After video is selected, show the rest of the UI */}
        {videoUrl && videoFile && (
          <>
            <Box mb={3}>
              <Input
                type="text"
                placeholder="Enter GIF caption or title (filename)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                width="100%"
                px={3}
                py={2}
                borderRadius={theme.radii?.base || 6}
                borderColor={colors.border}
                fontSize={fontSizeMd}
                mb={1}
                maxLength={64}
                isDisabled={isProcessing}
                _placeholder={{ color: colors.muted, opacity: 1 }}
                bg={colors.muted}
                color={colors.text}
              />
              <Text fontSize={fontSizeSm} color={colors.text} opacity={0.7}>
                This will be used as the GIF filename for Hive frontends.
              </Text>
            </Box>
            <Box as="video"
              ref={videoRef}
              src={videoUrl}
              controls
              maxW="100%"
              borderRadius={theme.radii?.base || 8}
              mb={4}
              mx="auto"
              display="block"
            />
            <Box display="flex" justifyContent="center" gap={3} my={4}>
              {/* Set Start Button */}
              <Button
                onClick={handleSetStart}
                isDisabled={isProcessing}
                px={4}
                py={2}
                fontSize={fontSizeMd}
                borderRadius={theme.radii?.base || 6}
                bg={colors.background}
                color={colors.primary}
                borderWidth="2px"
                borderColor={colors.primary}
                fontWeight={fontWeightBold}
                _hover={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
                _active={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
                cursor={isProcessing ? "not-allowed" : "pointer"}
              >
                Set Start
              </Button>
              {/* Set End Button */}
              <Button
                onClick={handleSetEnd}
                isDisabled={isProcessing}
                px={4}
                py={2}
                fontSize={fontSizeMd}
                borderRadius={theme.radii?.base || 6}
                bg={colors.background}
                color={colors.primary}
                borderWidth="2px"
                borderColor={colors.primary}
                fontWeight={fontWeightBold}
                _hover={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
                _active={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
                cursor={isProcessing ? "not-allowed" : "pointer"}
              >
                Set End
              </Button>
            </Box>
            <Text mt={3} fontSize={fontSizeSm} color={colors.text}>
              {startTime !== null && endTime !== null ? (
                <>
                  Segment: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s ({(endTime - startTime).toFixed(2)}s)
                </>
              ) : startTime !== null ? (
                <>Start: {startTime.toFixed(2)}s</>
              ) : endTime !== null ? (
                <>End: {endTime.toFixed(2)}s</>
              ) : (
                <>No segment selected.</>
              )}
            </Text>
            {startTime !== null && endTime !== null && (
              (() => {
                const est = parseFloat(estimateGifSizeMB(endTime - startTime));
                return (
                  <Text mt={1} fontSize={fontSizeSm} fontWeight={fontWeightMedium}>
                    Estimated GIF size: <Box as="span" color={getEstimateColor(est)} bg={colors.muted} borderRadius={theme.radii?.base || 6} px={2} py={0.5} ml={2} display="inline-block">{est} MB</Box>
                  </Text>
                );
              })()
            )}
            {/* Convert to GIF Button */}
            <Button
              onClick={handleConvert}
              isDisabled={isProcessing || !canConvert}
              px={6}
              py={2.5}
              fontSize={fontSizeLg}
              borderRadius={theme.radii?.base || 6}
              bg={colors.background}
              color={colors.primary}
              borderWidth="2px"
              borderColor={colors.primary}
              fontWeight={fontWeightBold}
              cursor={isProcessing || !canConvert ? "not-allowed" : "pointer"}
              mt={2}
              mb={2}
              _hover={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
              _active={{ bg: colors.primary, color: colors.background, borderColor: colors.primary }}
            >
              {isProcessing ? "Processing..." : "Convert to GIF"}
            </Button>
          </>
        )}
        {/* Status and info text always at the bottom */}
        {!videoUrl && !videoFile && (
          <Text mb={4} color={colors.text} opacity={0.7}>
            Try to only use 2-3 GIFs per post. Often, selecting a GIF as a thumbnail is a fun way to get peoples attention.
          </Text>
        )}
        {status && (
          <Text mt={2} color={status.startsWith("Error") ? colors.error : colors.text}>{status}</Text>
        )}
      </Box>
    );
  }
);

GIFMakerWithSelector.displayName = "GIFMakerWithSelector";

export default GIFMakerWithSelector; 