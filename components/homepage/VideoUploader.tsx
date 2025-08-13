import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
// Capability detection helpers
function detectFFmpegSupport() {
  // SharedArrayBuffer detection
  const hasSharedArrayBuffer =
    typeof window !== "undefined" && "SharedArrayBuffer" in window;
  // Basic FFmpeg.wasm detection
  try {
    // @ts-ignore
    if (!hasSharedArrayBuffer) return false;
    // WebAssembly features
    if (typeof WebAssembly === "undefined") return false;
    // iOS Safari detection (very unreliable for FFmpeg.wasm)
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) return false;
    // Android old browsers
    if (/Android/.test(ua) && !hasSharedArrayBuffer) return false;
    return true;
  } catch {
    return false;
  }
}
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface VideoUploaderProps {
  onUpload: (url: string | null) => void;
  isProcessing?: boolean;
  username?: string; // Add username prop for metadata
  onUploadStart?: () => void;
  onUploadFinish?: () => void;
  skipCompression?: boolean; // Skip compression entirely
  maxDurationSeconds?: number; // Maximum allowed video duration
  onDurationError?: (duration: number) => void; // Callback for duration violations
}

export interface VideoUploaderRef {
  trigger: () => void;
  handleFile: (file: File) => void;
}

const VideoUploader = forwardRef<VideoUploaderRef, VideoUploaderProps>(
  (
    {
      onUpload,
      isProcessing = false,
      username,
      onUploadStart,
      onUploadFinish,
      skipCompression = false,
      maxDurationSeconds,
      onDurationError,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<any>(null);
    const [status, setStatus] = useState<string>("");
    const [compressionProgress, setCompressionProgress] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [fallbackMode, setFallbackMode] = useState<boolean>(false);
    const [retryCount, setRetryCount] = useState<number>(0);

    // Replace hardcoded background and color values with theme variables
    const backgroundMuted = "var(--chakra-colors-muted, #eee)";
    const backgroundPrimary = "var(--chakra-colors-primary, #0070f3)";
    const backgroundAccent = "var(--chakra-colors-accent, #00b894)";

    // Function to get video duration using HTML5 video element
    const getVideoDuration = (file: File): Promise<number> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          const duration = video.duration;
          URL.revokeObjectURL(video.src); // Clean up object URL
          resolve(duration);
        };

        video.onerror = () => {
          URL.revokeObjectURL(video.src); // Clean up object URL
          reject(new Error("Failed to load video metadata"));
        };

        video.src = URL.createObjectURL(file);
      });
    };

    const compressVideo = async (
      file: File,
      shouldResize: boolean
    ): Promise<Blob> => {
      setStatus("Compressing video...");
      setCompressionProgress(0);
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
      }
      const ffmpeg = ffmpegRef.current;
      // Set up progress handler
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        setCompressionProgress(Math.round(progress * 100));
      });
      await ffmpeg.writeFile(file.name, await fetchFile(file));

      // Ultra-fast compression settings optimized for mobile
      const ffmpegArgs = [
        "-i",
        file.name,
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-crf",
        "28", // Higher CRF for faster encoding (slightly lower quality but much faster)
        "-preset",
        "ultrafast", // Fastest preset available
        "-tune",
        "fastdecode", // Optimize for fast decoding
        "-movflags",
        "+faststart", // Web optimization for MP4
        "-threads",
        "0", // Use all available CPU threads
      ];

      if (shouldResize) {
        ffmpegArgs.push("-vf", "scale=854:-2");
      }
      ffmpegArgs.push("output.mp4");

      await ffmpeg.exec(ffmpegArgs);

      const data = await ffmpeg.readFile("output.mp4");
      setCompressionProgress(100);
      return new Blob([data.buffer], { type: "video/mp4" });
    };

    // Function to convert video to MP4 format without compression (for browser compatibility)
    const convertToMp4 = async (file: File): Promise<Blob> => {
      setStatus("Converting to MP4 format...");
      setCompressionProgress(0);
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
      }
      const ffmpeg = ffmpegRef.current;

      // Set up progress handler
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        setCompressionProgress(Math.round(progress * 100));
      });

      await ffmpeg.writeFile(file.name, await fetchFile(file));

      // Fast conversion optimized for iPhone .mov files
      const ffmpegArgs = [
        "-i",
        file.name,
        "-c:v",
        "copy", // Copy video stream without re-encoding when possible
        "-c:a",
        "aac", // Re-encode audio to AAC for compatibility (fast)
        "-movflags",
        "+faststart", // Web optimization
        "-f",
        "mp4", // Force MP4 format
        "output.mp4",
      ];

      await ffmpeg.exec(ffmpegArgs);

      const data = await ffmpeg.readFile("output.mp4");
      setCompressionProgress(100);
      return new Blob([data.buffer], { type: "video/mp4" });
    };

    // Fast HTML5 Canvas thumbnail generation (prioritized over FFmpeg)
    const generateThumbnail = async (
      file: File,
      fallback: boolean
    ): Promise<string | null> => {
      setStatus("Generating thumbnail...");

      // Always try Canvas method first for speed (especially for long videos)
      try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true; // Prevent autoplay issues
        video.crossOrigin = "anonymous";

        // Create object URL and set up video
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;

        // Wait for video metadata with timeout and better error handling
        await Promise.race([
          new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              // Additional validation
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                reject("Invalid video dimensions");
                return;
              }
              if (video.duration === 0 || isNaN(video.duration)) {
                reject("Invalid video duration");
                return;
              }
              resolve(true);
            };
            video.onerror = (error) => {
              console.error("Video element error:", error);
              reject("Video load error");
            };
            // Force load if not already started
            video.load();
          }),
          new Promise(
            (_, reject) =>
              setTimeout(() => reject("Video metadata timeout"), 10000) // Increased timeout
          ),
        ]);

        // Seek to a good thumbnail position (10% into video, max 5 seconds)
        const thumbnailTime = Math.min(Math.max(video.duration * 0.1, 1), 5);
        video.currentTime = thumbnailTime;

        // Wait for seek to complete with timeout
        await Promise.race([
          new Promise((resolve) => {
            video.onseeked = () => resolve(true);
            // Fallback if onseeked doesn't fire
            setTimeout(() => resolve(true), 500);
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject("Video seek timeout"), 3000)
          ),
        ]);

        // Create canvas and draw frame
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Canvas context unavailable");

        // Calculate aspect ratio and draw centered
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;
        if (videoAspect > canvasAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * videoAspect;
          drawHeight = canvas.height;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        }

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        // Clean up video URL
        URL.revokeObjectURL(videoUrl);

        // Convert to blob with quality optimization
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob || new Blob());
            },
            "image/webp",
            0.8
          );
        });

        if (blob.size === 0) throw new Error("Empty thumbnail blob");

        // Upload thumbnail
        const thumbnailFormData = new FormData();
        thumbnailFormData.append("file", blob, "thumbnail.webp");
        if (username) thumbnailFormData.append("creator", username);

        const thumbnailResponse = await fetch("/api/pinata", {
          method: "POST",
          body: thumbnailFormData,
        });

        if (!thumbnailResponse.ok)
          throw new Error("Failed to upload thumbnail");

        const thumbnailResult = await thumbnailResponse.json();
        return `https://ipfs.skatehive.app/ipfs/${thumbnailResult.IpfsHash}`;
      } catch (error) {
        console.error("Fast thumbnail generation failed:", error);

        // Only try FFmpeg as absolute last resort and only for short videos
        if (!fallback && file.size < 50 * 1024 * 1024) {
          // Only for files < 50MB
          try {
            setStatus("Generating thumbnail (fallback)...");

            if (!ffmpegRef.current) {
              ffmpegRef.current = new FFmpeg();
              await ffmpegRef.current.load();
            }
            const ffmpeg = ffmpegRef.current;

            await ffmpeg.writeFile("input_thumb.mp4", await fetchFile(file));

            // Ultra-fast thumbnail generation
            await ffmpeg.exec([
              "-i",
              "input_thumb.mp4",
              "-ss",
              "2", // Seek to 2 seconds
              "-frames:v",
              "1",
              "-vf",
              "scale=320:240:force_original_aspect_ratio=decrease",
              "-f",
              "webp",
              "-preset",
              "ultrafast", // Fastest possible
              "thumbnail.webp",
            ]);

            const thumbnailData = await ffmpeg.readFile("thumbnail.webp");
            const thumbnailBlob = new Blob([thumbnailData.buffer], {
              type: "image/webp",
            });

            const thumbnailFormData = new FormData();
            thumbnailFormData.append("file", thumbnailBlob, "thumbnail.webp");
            if (username) thumbnailFormData.append("creator", username);

            const thumbnailResponse = await fetch("/api/pinata", {
              method: "POST",
              body: thumbnailFormData,
            });

            if (!thumbnailResponse.ok)
              throw new Error("Failed to upload thumbnail");

            const thumbnailResult = await thumbnailResponse.json();

            // Cleanup
            try {
              await ffmpeg.deleteFile("input_thumb.mp4");
              await ffmpeg.deleteFile("thumbnail.webp");
            } catch {}

            return `https://ipfs.skatehive.app/ipfs/${thumbnailResult.IpfsHash}`;
          } catch (ffmpegError) {
            console.error("FFmpeg thumbnail also failed:", ffmpegError);
          }
        }

        // If all else fails, continue without thumbnail
        setStatus("Thumbnail generation failed, continuing upload...");
        return null;
      }
    };

    const uploadWithProgress = (formData: FormData): Promise<any> => {
      return new Promise((resolve, reject) => {
        console.log("📱 Starting upload - Device info:", {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          formDataKeys: Array.from(formData.keys()),
          file: formData.get("file"),
          fileSize: formData.get("file") ? (formData.get("file") as File).size : "no file",
          fileName: formData.get("file") ? (formData.get("file") as File).name : "no file"
        });

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("loadstart", () => {
          console.log("📱 Upload started");
        });
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            console.log(`📱 Upload progress: ${progress}% (${event.loaded}/${event.total} bytes)`);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          console.log("📱 Upload completed - Status:", xhr.status, "Response length:", xhr.responseText?.length);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("📱 Upload successful, response:", xhr.responseText.substring(0, 200));
            resolve(xhr.responseText);
          } else {
            console.error("📱 Upload failed with status:", xhr.status, "Response:", xhr.responseText);
            reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
          }
        });

        xhr.addEventListener("error", (event) => {
          console.error("📱 Upload error event:", event, "XHR state:", xhr.readyState, "Status:", xhr.status);
          reject(new Error(`Network error: ${xhr.statusText || "Unknown error"}`));
        });

        xhr.addEventListener("timeout", () => {
          console.error("📱 Upload timeout");
          reject(new Error("Upload timeout"));
        });

        xhr.addEventListener("abort", () => {
          console.error("📱 Upload aborted");
          reject(new Error("Upload aborted"));
        });

        // Set timeout for mobile networks
        xhr.timeout = 120000; // 2 minutes

        try {
          xhr.open("POST", "/api/pinata");
          console.log("📱 XHR opened, sending FormData...");
          xhr.send(formData);
        } catch (error) {
          console.error("📱 Error sending XHR:", error);
          reject(error);
        }
      });
    };

    // Fallback direct upload (no processing)
    const uploadWithoutProcessing = async (
      file: File,
      thumbnailUrl: string | null
    ) => {
      setStatus("Uploading video (no processing)...");
      setCompressionProgress(0);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("file", file);
      if (username) formData.append("creator", username);
      if (thumbnailUrl) formData.append("thumbnailUrl", thumbnailUrl);
      try {
        const responseText = await uploadWithProgress(formData);
        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          setStatus("Failed to parse upload response.");
          onUpload(null);
          if (onUploadFinish) onUploadFinish();
          return;
        }
        if (!result || !result.IpfsHash) {
          setStatus("Failed to upload video.");
          onUpload(null);
          if (onUploadFinish) onUploadFinish();
          return;
        }
        const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
        setStatus("Upload complete!");
        setUploadProgress(100);
        onUpload(videoUrl);
        if (onUploadFinish) onUploadFinish();
      } catch (error) {
        setStatus("Upload failed (network or server error)");
        setCompressionProgress(0);
        setUploadProgress(0);
        console.error("Direct upload failed:", error);
        onUpload(null);
        if (onUploadFinish) onUploadFinish();
      }
    };

    // Main video upload logic with fallback and retry
    const processVideoFile = async (
      file: File,
      attempt: number = 1,
      lastError: string = ""
    ) => {
      if (!file) {
        setStatus("");
        setCompressionProgress(0);
        setUploadProgress(0);
        if (onUploadFinish) onUploadFinish();
        return;
      }
      if (onUploadStart) onUploadStart();
      setRetryCount(attempt - 1);
      let ffmpegSupported = detectFFmpegSupport();
      let fallback = fallbackMode || !ffmpegSupported;
      let errorStep = "";
      try {
        // Duration check
        if (maxDurationSeconds) {
          setStatus("Checking video duration...");
          try {
            const duration = await getVideoDuration(file);
            if (duration > maxDurationSeconds) {
              setStatus("");
              if (onDurationError) onDurationError(duration);
              onUpload(null);
              if (onUploadFinish) onUploadFinish();
              return;
            }
          } catch (err) {
            errorStep = "duration";
            throw new Error("Failed to check video duration");
          }
        }

        // Thumbnail generation
        let thumbnailUrl: string | null = null;

        // Check if thumbnail was already generated by VideoTrimModal
        if ((file as any).thumbnailUrl) {
          thumbnailUrl = (file as any).thumbnailUrl;
          setStatus("Using existing thumbnail...");
        } else {
          try {
            thumbnailUrl = await generateThumbnail(file, fallback);
          } catch (err) {
            errorStep = "thumbnail";
            setStatus("Thumbnail generation failed, continuing upload...");
          }
        }

        // Video processing
        let processedFile: File = file;
        if (!fallback && !skipCompression) {
          try {
            // Smart detection for iPhone .mov files - use fast conversion instead of compression
            const isIPhoneMov =
              file.name.toLowerCase().endsWith(".mov") &&
              file.type === "video/quicktime";

            if (isIPhoneMov) {
              setStatus("Converting iPhone video to MP4...");
              const mp4Blob = await convertToMp4(file);
              processedFile = new File([mp4Blob], "converted.mp4", {
                type: "video/mp4",
              });
            } else {
              setStatus("Compressing video...");
              const twelveMB = 12 * 1024 * 1024;
              const shouldResize = file.size > twelveMB;
              const compressedBlob = await compressVideo(file, shouldResize);
              if (compressedBlob.size === 0)
                throw new Error("Compression resulted in empty file");
              processedFile = new File([compressedBlob], "compressed.mp4", {
                type: "video/mp4",
              });
            }
          } catch (err) {
            errorStep = "transcoding";
            setStatus("Processing failed, retrying with fallback...");
            fallback = true;
            setFallbackMode(true);
            if (attempt < 3) {
              await processVideoFile(file, attempt + 1, "transcoding");
              return;
            } else {
              setStatus(
                "Processing failed after retries. Uploading original file."
              );
            }
          }
        } else if (!fallback && skipCompression) {
          try {
            setStatus("Converting to MP4 format...");
            const mp4Blob = await convertToMp4(file);
            processedFile = new File([mp4Blob], "converted.mp4", {
              type: "video/mp4",
            });
          } catch (err) {
            errorStep = "conversion";
            setStatus("Conversion failed, retrying with fallback...");
            fallback = true;
            setFallbackMode(true);
            if (attempt < 3) {
              await processVideoFile(file, attempt + 1, "conversion");
              return;
            } else {
              setStatus(
                "Conversion failed after retries. Uploading original file."
              );
            }
          }
        }

        // Upload
        try {
          setStatus("Uploading video...");
          setUploadProgress(0);
          
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          console.log("📱 Preparing upload - Mobile check:", {
            isMobile,
            fileSize: processedFile.size,
            fileSizeMB: Math.round(processedFile.size / 1024 / 1024 * 100) / 100,
            fileName: processedFile.name,
            fileType: processedFile.type,
            attempt: attempt,
            fallback: fallback
          });

          // Mobile-specific file size warning
          if (isMobile && processedFile.size > 50 * 1024 * 1024) { // 50MB
            console.warn("📱 Large file on mobile:", processedFile.size, "bytes");
            setStatus("Large file detected on mobile, this may take longer...");
          }

          const formData = new FormData();
          formData.append("file", processedFile);
          if (username) formData.append("creator", username);
          if (thumbnailUrl) formData.append("thumbnailUrl", thumbnailUrl);
          
          console.log("📱 FormData prepared:", {
            hasFile: formData.has("file"),
            hasCreator: formData.has("creator"),
            hasThumbnail: formData.has("thumbnailUrl"),
            creator: username,
            thumbnailUrl: thumbnailUrl,
            isMobile
          });

          const responseText = await uploadWithProgress(formData);
          
          console.log("📱 Upload response received, parsing...");
          let result;
          try {
            result = JSON.parse(responseText);
            console.log("📱 Upload result parsed:", result);
          } catch (parseError) {
            console.error("📱 Failed to parse upload response:", parseError, "Response:", responseText);
            errorStep = "upload";
            setStatus("Failed to parse upload response.");
            onUpload(null);
            if (onUploadFinish) onUploadFinish();
            return;
          }
          if (!result || !result.IpfsHash) {
            console.error("📱 Invalid upload result:", result);
            errorStep = "upload";
            setStatus("Failed to upload video.");
            onUpload(null);
            if (onUploadFinish) onUploadFinish();
            return;
          }
          const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
          console.log("📱 Upload successful! Video URL:", videoUrl);
          setStatus("Upload complete!");
          setUploadProgress(100);
          onUpload(videoUrl);
          if (onUploadFinish) onUploadFinish();
        } catch (err) {
          console.error("📱 Upload error caught:", err, "Type:", typeof err, "Attempt:", attempt);
          errorStep = "upload";
          setStatus("Upload failed, retrying...");
          if (attempt < 3) {
            console.log("📱 Retrying upload, attempt:", attempt + 1);
            await processVideoFile(file, attempt + 1, "upload");
            return;
          } else {
            console.error("📱 Upload failed after all retries");
            setStatus("Upload failed after retries.");
            onUpload(null);
            if (onUploadFinish) onUploadFinish();
            return;
          }
        }
      } catch (error) {
        let failMsg = "";
        if (errorStep === "duration")
          failMsg = "Failed to check video duration.";
        else if (errorStep === "thumbnail")
          failMsg = "Thumbnail generation failed.";
        else if (errorStep === "transcoding")
          failMsg = "Video transcoding failed.";
        else if (errorStep === "conversion")
          failMsg = "Video conversion failed.";
        else if (errorStep === "upload") failMsg = "Video upload failed.";
        else failMsg = "Unknown error.";
        setStatus(`Upload failed: ${failMsg}`);
        setCompressionProgress(0);
        setUploadProgress(0);
        onUpload(null);
        if (onUploadFinish) onUploadFinish();
      }
    };

    const handleVideoUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (file) {
        setFallbackMode(false);
        setRetryCount(0);
        await processVideoFile(file);
      } else {
        if (onUploadFinish) onUploadFinish();
      }
    };

    const handleFile = async (file: File) => {
      setFallbackMode(false);
      setRetryCount(0);
      await processVideoFile(file);
    };

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (inputRef.current && !isProcessing) {
          inputRef.current.value = ""; // reset so same file can be selected again
          inputRef.current.click();
        }
      },
      handleFile,
    }));

    return (
      <div>
        <input
          type="file"
          accept="video/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleVideoUpload}
          disabled={isProcessing}
        />
        {status && (
          <div
            style={{
              marginTop: 8,
              color:
                status.includes("Error") || status.includes("Failed")
                  ? "red"
                  : "#333",
            }}
          >
            {status}
            {retryCount > 0 && (
              <div style={{ fontSize: 12, color: "accent" }}>
                Retried {retryCount} {retryCount === 1 ? "time" : "times"}
              </div>
            )}
            {fallbackMode && (
              <div style={{ fontSize: 12, color: "accent" }}>
                Fallback mode enabled: minimal processing for mobile
                compatibility
              </div>
            )}
          </div>
        )}
        {status === "Compressing video..." && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 8,
                background: backgroundMuted,
                borderRadius: 4,
                overflow: "hidden",
                width: 200,
              }}
            >
              <div
                style={{
                  width: `${compressionProgress}%`,
                  height: "100%",
                  background: backgroundPrimary,
                  transition: "width 0.2s",
                }}
              />
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              {compressionProgress}%
            </div>
          </div>
        )}
        {status === "Uploading video..." && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 8,
                background: backgroundMuted,
                borderRadius: 4,
                overflow: "hidden",
                width: 200,
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  background: backgroundAccent,
                  transition: "width 0.2s",
                }}
              />
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>{uploadProgress}%</div>
          </div>
        )}
      </div>
    );
  }
);

VideoUploader.displayName = "VideoUploader";

export default VideoUploader;
