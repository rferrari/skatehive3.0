"use client";

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
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
let FFmpeg: any;
let fetchFile: any;

async function loadFFmpeg() {
  if (!FFmpeg || !fetchFile) {
    const ffmpegMod = await import("@ffmpeg/ffmpeg");
    const utilMod = await import("@ffmpeg/util");
    FFmpeg = ffmpegMod.FFmpeg;
    fetchFile = utilMod.fetchFile;
  }
}

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
      shouldResize: boolean,
      qualityFactor: number = 1.0 // 1.0 = normal, 0.5 = more aggressive, 0.3 = very aggressive
    ): Promise<Blob> => {
      setStatus("Compressing video...");
      setCompressionProgress(0);
      if (!ffmpegRef.current) {
        await loadFFmpeg();
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
      }
      const ffmpeg = ffmpegRef.current;
      // Set up progress handler
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        setCompressionProgress(Math.round(progress * 100));
      });
      await ffmpeg.writeFile(file.name, await fetchFile(file));

      // Adaptive compression settings based on quality factor
      const baseCRF = 28;
      const adjustedCRF = Math.min(
        51,
        Math.round(baseCRF + (1 - qualityFactor) * 15)
      ); // Higher CRF = more compression

      const ffmpegArgs = [
        "-i",
        file.name,
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-crf",
        adjustedCRF.toString(),
        "-preset",
        qualityFactor < 0.5 ? "faster" : "ultrafast", // Use faster preset for aggressive compression
        "-tune",
        "fastdecode",
        "-movflags",
        "+faststart",
        "-threads",
        "0",
      ];

      // More aggressive scaling for mobile
      if (shouldResize) {
        const scale = qualityFactor < 0.5 ? "640:-2" : "854:-2"; // Smaller resolution for aggressive mode
        ffmpegArgs.push("-vf", scale);
      }

      // Add bitrate limit for very aggressive compression
      if (qualityFactor < 0.5) {
        ffmpegArgs.push("-maxrate", "500k", "-bufsize", "1000k");
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
        await loadFFmpeg();
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

    // Basic mobile-friendly compression when FFmpeg isn't available
    const compressVideoFallback = async (file: File): Promise<Blob> => {
      setStatus("Compressing video for mobile...");
      return new Promise((resolve, reject) => {
        if (
          typeof MediaRecorder === "undefined" ||
          typeof (HTMLCanvasElement.prototype as any).captureStream !==
            "function"
        ) {
          reject(new Error("MediaRecorder not supported"));
          return;
        }

        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        const cleanup = () => {
          URL.revokeObjectURL(video.src);
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error("Video load timeout"));
        }, 10000);

        video.addEventListener("loadeddata", () => {
          clearTimeout(timeoutId);
          try {
            const maxWidth = 640;
            const scale = Math.min(1, maxWidth / video.videoWidth);
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              cleanup();
              reject(new Error("Canvas context not available"));
              return;
            }
            const stream = (canvas as any).captureStream();
            const addTracks = (video as any).captureStream?.();
            if (addTracks) {
              addTracks
                .getAudioTracks()
                .forEach((t: MediaStreamTrack) => stream.addTrack(t));
            }
            const recorder = new MediaRecorder(stream, {
              mimeType: "video/webm",
              videoBitsPerSecond: 800_000,
            });
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = () => {
              cleanup();
              resolve(new Blob(chunks, { type: "video/webm" }));
            };
            recorder.start();
            const draw = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              if (!video.paused && !video.ended) {
                requestAnimationFrame(draw);
              } else {
                recorder.stop();
              }
            };
            video
              .play()
              .then(() => draw())
              .catch((err) => {
                recorder.stop();
                cleanup();
                reject(err);
              });
          } catch (err) {
            cleanup();
            reject(err as Error);
          }
        });

        video.onerror = () => {
          clearTimeout(timeoutId);
          cleanup();
          reject(new Error("Failed to load video"));
        };

        video.load();
      });
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
              await loadFFmpeg();
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

    // Chunked upload for large files to bypass Vercel limits
    const uploadWithChunks = async (file: File, creator?: string, thumbnailUrl?: string): Promise<any> => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks to stay well under limits
      const totalChunks = Math.ceil(file.size / chunkSize);

      console.log("📱 Starting chunked upload:", {
        fileSize: file.size,
        fileSizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100,
        chunkSize,
        totalChunks,
        isMobile
      });

      setStatus(`Preparing chunked upload (${totalChunks} chunks)...`);

      if (totalChunks === 1) {
        // File is small enough for single chunk
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const arrayBuffer = reader.result as ArrayBuffer;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

              setStatus("Uploading via chunked method...");
              setUploadProgress(50);

              const response = await fetch('/api/pinata-chunked', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileName: file.name,
                  fileType: file.type,
                  creator,
                  thumbnailUrl,
                  totalSize: file.size,
                  chunk: base64,
                  chunkIndex: 0,
                  totalChunks: 1
                })
              });

              setUploadProgress(90);

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Chunked upload failed: ${response.status} - ${errorText}`);
              }

              const result = await response.json();
              setUploadProgress(100);
              resolve(JSON.stringify(result));
            } catch (error) {
              reject(error);
            }
          };

          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsArrayBuffer(file);
        });
      } else {
        // Multi-chunk upload (not implemented yet, fall back to regular upload)
        throw new Error("Multi-chunk uploads not yet supported");
      }
    };

    const uploadWithProgress = (formData: FormData): Promise<any> => {
      return new Promise((resolve, reject) => {
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );

        console.log("📱 Starting upload - Device info:", {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          mobile: isMobile,
          formDataKeys: Array.from(formData.keys()),
          file: formData.get("file"),
          fileSize: formData.get("file")
            ? (formData.get("file") as File).size
            : "no file",
          fileName: formData.get("file")
            ? (formData.get("file") as File).name
            : "no file",
        });

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("loadstart", () => {
          console.log("📱 Upload started");
        });

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            console.log(
              `📱 Upload progress: ${progress}% (${event.loaded}/${event.total} bytes)`
            );
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          console.log(
            "📱 Upload completed - Status:",
            xhr.status,
            "Response length:",
            xhr.responseText?.length
          );
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(
              "📱 Upload successful, response:",
              xhr.responseText.substring(0, 200)
            );
            resolve(xhr.responseText);
          } else {
            console.error(
              "📱 Upload failed with status:",
              xhr.status,
              "Response:",
              xhr.responseText
            );
            reject(
              new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`)
            );
          }
        });

        xhr.addEventListener("error", (event) => {
          const errorInfo = {
            readyState: xhr.readyState,
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            isMobile,
          };
          console.error(
            "📱 Upload error event:",
            event,
            "Error info:",
            errorInfo
          );

          // Show detailed error in UI for mobile debugging
          const errorMessage = `Network error: ${
            xhr.statusText || "Unknown error"
          } (Status: ${xhr.status}, State: ${xhr.readyState})`;
          setStatus(
            `${isMobile ? "Mobile" : "Desktop"} upload failed: ${errorMessage}`
          );
          reject(new Error(errorMessage));
        });

        xhr.addEventListener("timeout", () => {
          console.error("📱 Upload timeout");
          setStatus(
            `${
              isMobile ? "Mobile" : "Desktop"
            } upload failed: Connection timeout (2 minutes)`
          );
          reject(new Error("Upload timeout"));
        });

        xhr.addEventListener("abort", () => {
          console.error("📱 Upload aborted");
          setStatus(
            `${
              isMobile ? "Mobile" : "Desktop"
            } upload failed: Connection aborted`
          );
          reject(new Error("Upload aborted"));
        });

        // Set timeout for mobile networks
        xhr.timeout = isMobile ? 180000 : 120000; // 3 minutes for mobile, 2 for desktop

        try {
          let endpoint: string;
          if (PINATA_JWT) {
            endpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";
            xhr.open("POST", endpoint);
            xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);
          } else {
            // Use mobile-specific endpoint for mobile devices
            endpoint = isMobile ? "/api/pinata-mobile" : "/api/pinata";
            xhr.open("POST", endpoint);
            // Add mobile-specific headers that might help
            if (isMobile) {
              console.log("📱 Using mobile-specific endpoint and headers");
              xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
              xhr.setRequestHeader("X-Mobile-Upload", "true");
            }
          }

          console.log("📱 XHR opened, sending FormData to:", endpoint);
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
        
        // Check if this file is already processed from VideoTrimModal
        const isAlreadyProcessed = file.name.includes("trimmed_") || 
                                 file.type === "video/webm" ||
                                 (file as any).fromTrimModal;
        
        console.log("📱 File processing check:", {
          fileName: file.name,
          fileType: file.type,
          isAlreadyProcessed,
          hasThumbail: !!(file as any).thumbnailUrl,
          skipCompression,
          fallback
        });

        if (isAlreadyProcessed && !fallback) {
          setStatus("File already processed, uploading directly...");
          console.log("📱 Skipping processing for pre-processed file");
          // Don't process already trimmed/processed files on first attempt
        } else if (!fallback && !skipCompression) {
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
        } else {
          try {
            const mobileBlob = await compressVideoFallback(file);
            processedFile = new File([mobileBlob], "mobile-compressed.webm", {
              type: "video/webm",
            });
          } catch {
            // If compression fails, proceed with original file
            setStatus("Mobile compression failed, uploading original file...");
          }
        }

        // Upload
        try {
          setStatus("Uploading video...");
          setUploadProgress(0);

          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            );

          console.log("📱 Preparing upload - Mobile check:", {
            isMobile,
            fileSize: processedFile.size,
            fileSizeMB:
              Math.round((processedFile.size / 1024 / 1024) * 100) / 100,
            fileName: processedFile.name,
            fileType: processedFile.type,
            attempt: attempt,
            fallback: fallback,
          });

          // Mobile-specific file size limits (Vercel has 50MB limit)
          const maxSizeForMobile = 45 * 1024 * 1024; // 45MB to be safe
          const maxSizeForDesktop = 50 * 1024 * 1024; // 50MB
          const maxSize = isMobile ? maxSizeForMobile : maxSizeForDesktop;

          if (processedFile.size > maxSize) {
            const sizeMB =
              Math.round((processedFile.size / 1024 / 1024) * 100) / 100;
            const maxSizeMB = Math.round(maxSize / 1024 / 1024);

            console.error("📱 File too large for upload:", {
              fileSizeMB: sizeMB,
              maxSizeMB,
              isMobile,
              isOver413Limit: processedFile.size > 50 * 1024 * 1024,
            });

            if (isMobile && !fallback && sizeMB > 45) {
              // Try aggressive compression for mobile
              setStatus(
                "File too large for mobile, compressing more aggressively..."
              );
              try {
                const aggressivelyCompressed = await compressVideo(
                  processedFile,
                  true,
                  0.3
                ); // Lower quality
                if (aggressivelyCompressed.size < maxSizeForMobile) {
                  processedFile = new File(
                    [aggressivelyCompressed],
                    "mobile_compressed.mp4",
                    {
                      type: "video/mp4",
                    }
                  );
                  console.log(
                    "📱 Aggressive compression successful:",
                    processedFile.size
                  );
                } else {
                  throw new Error(
                    "Still too large after aggressive compression"
                  );
                }
              } catch (compressionError) {
                console.error(
                  "📱 Aggressive compression failed:",
                  compressionError
                );
                setStatus(
                  `File too large (${sizeMB}MB) for mobile upload. Maximum: ${maxSizeMB}MB`
                );
                onUpload(null);
                if (onUploadFinish) onUploadFinish();
                return;
              }
            } else {
              setStatus(
                `File too large (${sizeMB}MB). Maximum: ${maxSizeMB}MB`
              );
              onUpload(null);
              if (onUploadFinish) onUploadFinish();
              return;
            }
          }

          if (isMobile && processedFile.size > 30 * 1024 * 1024) {
            // 30MB+
            console.warn(
              "📱 Large file on mobile:",
              processedFile.size,
              "bytes"
            );
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
            isMobile,
          });

          let responseText: string;

          // Try chunked upload for large files (>20MB) to bypass Vercel limits
          if (processedFile.size > 20 * 1024 * 1024) {
            console.log("📱 Large file detected, using chunked upload");
            try {
              responseText = await uploadWithChunks(
                processedFile, 
                username, 
                thumbnailUrl || undefined
              );
            } catch (chunkError) {
              console.log("📱 Chunked upload failed, falling back to regular upload:", chunkError);
              responseText = await uploadWithProgress(formData);
            }
          } else {
            responseText = await uploadWithProgress(formData);
          }

          console.log("📱 Upload response received, parsing...");
          let result;
          try {
            result = JSON.parse(responseText);
            console.log("📱 Upload result parsed:", result);
          } catch (parseError) {
            console.error(
              "📱 Failed to parse upload response:",
              parseError,
              "Response:",
              responseText
            );
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
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            );
          const errorDetails = {
            message: err instanceof Error ? err.message : String(err),
            type: typeof err,
            attempt: attempt,
            isMobile,
            errorStep: "upload",
          };

          console.error("📱 Upload error caught:", errorDetails);

          errorStep = "upload";

          if (attempt < 3) {
            setStatus(
              `Mobile upload failed (attempt ${attempt}/3): ${errorDetails.message}. Retrying...`
            );
            console.log("📱 Retrying upload, attempt:", attempt + 1);
            await processVideoFile(file, attempt + 1, "upload");
            return;
          } else {
            console.error("📱 Upload failed after all retries");
            setStatus(
              `Mobile upload failed after 3 attempts: ${errorDetails.message}`
            );
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
