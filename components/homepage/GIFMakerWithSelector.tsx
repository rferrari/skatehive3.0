import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface GIFMakerWithSelectorProps {
  onUpload: (url: string | null) => void;
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

    // Replace hardcoded background and color values with theme variables
    const backgroundDefault = 'var(--chakra-colors-background, #fff)';
    const backgroundProcessing = 'var(--chakra-colors-muted, #ccc)';
    const backgroundAccent = 'var(--chakra-colors-primary, #0070f3)';
    const colorDefault = 'var(--chakra-colors-text, #222)';

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

    // Clean up videoUrl blob when component unmounts or video changes
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
        onUpload(null);
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
        // If endTime is set, validate the segment
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
        // If startTime is set, validate the segment
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
      // Enable convert if both start and end are set and valid
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
        onUpload(gifUrl);
      } catch (error) {
        setStatus("Error converting video.");
        console.error("Error during GIF conversion:", error);
        onUpload(null);
      }
    };

    // Estimate GIF size in MB for 320px wide, 10fps GIFs
    const estimateGifSizeMB = (duration: number) => {
      return (0.3 + 0.3 * duration).toFixed(2);
    };

    // Get color for estimated size
    const getEstimateColor = (size: number) => {
      if (size < 1.5) return '#d4f8e8'; // light green
      if (size < 1.7) return '#fff9c4'; // light yellow
      if (size < 2.0) return '#ffe0b2'; // light orange
      return '#ffd6d6'; // light red
    };

    // Looping preview effect
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
        if (isSeekingRef.current) return; // Don't loop while seeking
        if (video.currentTime >= endTime) {
          video.currentTime = startTime;
          if (!isSeekingRef.current) {
            video.play(); // ensure it keeps looping only if not seeking
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
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 24, background: backgroundDefault, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <input
          type="file"
          accept="video/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        {videoUrl && videoFile ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0" }}>
              <button
                onClick={handleSetStart}
                disabled={isProcessing}
                style={{
                  padding: "6px 16px",
                  fontSize: 15,
                  borderRadius: 6,
                  background: isProcessing ? backgroundProcessing : backgroundAccent,
                  color: "#fff",
                  border: "none",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                }}
              >
                Set Start
              </button>
              <button
                onClick={handleSetEnd}
                disabled={isProcessing}
                style={{
                  padding: "6px 16px",
                  fontSize: 15,
                  borderRadius: 6,
                  background: isProcessing ? backgroundProcessing : colorDefault,
                  color: "#fff",
                  border: "none",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                }}
              >
                Set End
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: "#555" }}>
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
            </div>
            {startTime !== null && endTime !== null && (
              (() => {
                const est = parseFloat(estimateGifSizeMB(endTime - startTime));
                return (
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 500 }}>
                    Estimated GIF size: <span style={{ background: getEstimateColor(est), color: colorDefault, borderRadius: 6, padding: '2px 8px', marginLeft: 4 }}>{est} MB</span>
                  </div>
                );
              })()
            )}
            <button
              onClick={handleConvert}
              disabled={isProcessing || !canConvert}
              style={{
                padding: "10px 24px",
                fontSize: 16,
                borderRadius: 6,
                background: isProcessing || !canConvert ? backgroundProcessing : colorDefault,
                color: "#fff",
                border: "none",
                cursor: isProcessing || !canConvert ? "not-allowed" : "pointer",
                marginTop: 8,
                marginBottom: 8,
              }}
            >
              {isProcessing ? "Processing..." : "Convert to GIF"}
            </button>
          </>
        ) : (
          <div style={{ marginBottom: 16, color: "#555" }}>
            Upload a video (up to 30 seconds) to select a segment and convert to GIF.
          </div>
        )}
        {status && (
          <div style={{ marginTop: 8, color: status.startsWith("Error") ? "red" : colorDefault }}>{status}</div>
        )}
      </div>
    );
  }
);

GIFMakerWithSelector.displayName = "GIFMakerWithSelector";

export default GIFMakerWithSelector; 