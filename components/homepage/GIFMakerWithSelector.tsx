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
    const [scrubTime, setScrubTime] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [canConvert, setCanConvert] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (inputRef.current && !isProcessing) {
          inputRef.current.value = "";
          inputRef.current.click();
        }
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
        setScrubTime(0);
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
        setScrubTime(0);
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
      setScrubTime(0);
      setStartTime(null);
      setEndTime(null);
      setCanConvert(false);
      setStatus("");
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setScrubTime(value);
      if (videoRef.current) {
        videoRef.current.currentTime = value;
      }
    };

    const handleSetStart = () => {
      setStartTime(scrubTime);
      // If endTime is set and now invalid, reset it
      if (endTime !== null && (scrubTime >= endTime || endTime - scrubTime > 4)) {
        setEndTime(null);
      }
    };

    const handleSetEnd = () => {
      // Only allow if startTime is set and end > start and <= 4s segment
      if (startTime === null) return;
      if (scrubTime <= startTime) {
        setStatus("End time must be after start time.");
        return;
      }
      if (scrubTime - startTime > 4) {
        setStatus("Segment cannot be longer than 4 seconds.");
        return;
      }
      setEndTime(scrubTime);
      setStatus("");
    };

    useEffect(() => {
      // Enable convert if both start and end are set and valid
      if (
        startTime !== null &&
        endTime !== null &&
        endTime > startTime &&
        endTime - startTime <= 4
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

    return (
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" }}>
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
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.currentTime = scrubTime;
              }}
            />
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Scrub to select segment:
              </label>
              <input
                type="range"
                min={0}
                max={videoDuration}
                step={0.01}
                value={scrubTime}
                onChange={handleSliderChange}
                style={{ width: "100%" }}
                disabled={isProcessing}
              />
              <div style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
                Current: {scrubTime.toFixed(2)}s / {videoDuration.toFixed(2)}s
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
                <button
                  onClick={handleSetStart}
                  disabled={isProcessing}
                  style={{
                    padding: "6px 16px",
                    fontSize: 15,
                    borderRadius: 6,
                    background: isProcessing ? "#ccc" : "#0070f3",
                    color: "#fff",
                    border: "none",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Set Start
                </button>
                <button
                  onClick={handleSetEnd}
                  disabled={isProcessing || startTime === null}
                  style={{
                    padding: "6px 16px",
                    fontSize: 15,
                    borderRadius: 6,
                    background: isProcessing ? "#ccc" : "#222",
                    color: "#fff",
                    border: "none",
                    cursor: isProcessing || startTime === null ? "not-allowed" : "pointer",
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
                ) : (
                  <>No segment selected.</>
                )}
              </div>
            </div>
            <button
              onClick={handleConvert}
              disabled={isProcessing || !canConvert}
              style={{
                padding: "10px 24px",
                fontSize: 16,
                borderRadius: 6,
                background: isProcessing || !canConvert ? "#ccc" : "#222",
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
          <div style={{ marginTop: 8, color: status.startsWith("Error") ? "red" : "#333" }}>{status}</div>
        )}
      </div>
    );
  }
);

GIFMakerWithSelector.displayName = "GIFMakerWithSelector";

export default GIFMakerWithSelector; 