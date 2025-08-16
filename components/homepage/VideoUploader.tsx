"use client";

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

// Import utilities
import {
  detectFFmpegSupport,
  compressVideo,
  convertToMp4,
  compressVideoFallback,
  loadFFmpeg,
  checkFileSizeAndHP,
  shouldProcessFile,
  analyzeVideoFile,
  analyzeVideoWithFFmpeg,
  logVideoProcessingDetails,
  VideoMetadata,
  VideoDetails,
  formatFileSize,
  detectiOSDevice,
  detectAndroidDevice,
  shouldUseiOSOptimizedProcessing,
  shouldSkipAndroidProcessing,
  convertToMp4iOS,
  compressVideoiOSFallback,
} from "@/lib/utils/videoProcessing";
import {
  getVideoDuration,
  isMobileDevice,
  getFileSizeLimits,
  handleVideoUpload as uploadVideo,
  UploadResult,
} from "@/lib/utils/videoUploadUtils";
import { generateThumbnail } from "@/lib/utils/videoThumbnailUtils";
import {
  validateVideoDuration,
  getVideoFileInfo,
} from "@/lib/utils/videoValidation";

interface VideoUploaderProps {
  onUpload: (url: string | null) => void;
  isProcessing?: boolean;
  username?: string; // Add username prop for metadata
  userHP?: number; // User's Hive Power for file size limits
  onUploadStart?: () => void;
  onUploadFinish?: () => void;
  skipCompression?: boolean; // Skip compression entirely
  maxDurationSeconds?: number; // Maximum allowed video duration
  onDurationError?: (duration: number) => void; // Callback for duration violations
  onFileSizeError?: (reason: string) => void; // Callback for file size violations
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
      userHP = 0,
      onUploadStart,
      onUploadFinish,
      skipCompression = false,
      maxDurationSeconds,
      onDurationError,
      onFileSizeError,
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
    const [inputVideoMetadata, setInputVideoMetadata] =
      useState<VideoMetadata | null>(null);
    const [outputVideoMetadata, setOutputVideoMetadata] =
      useState<VideoMetadata | null>(null);
    const [ffmpegAnalysis, setFFmpegAnalysis] =
      useState<Partial<VideoMetadata> | null>(null);
    const [inputDetails, setInputDetails] = useState<VideoDetails | null>(null);
    const [outputDetails, setOutputDetails] = useState<VideoDetails | null>(
      null
    );
    const [useIOSOptimized, setUseIOSOptimized] = useState(false);

    // Device detection
    const device = React.useMemo(
      () => ({
        isIOS: detectiOSDevice(),
        supportsMobileOptimization: true, // We'll check file-specific optimization later
      }),
      []
    );
    const [processingTime, setProcessingTime] = useState<number>(0);
    const [isDevelopment, setIsDevelopment] = useState<boolean>(false);

    // Check if we're in development mode
    React.useEffect(() => {
      setIsDevelopment(process.env.NODE_ENV === "development");
    }, []);

    // Replace hardcoded background and color values with theme variables
    const backgroundMuted = "var(--chakra-colors-muted, #eee)";
    const backgroundPrimary = "var(--chakra-colors-primary, #0070f3)";
    const backgroundAccent = "var(--chakra-colors-accent, #00b894)";

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
        // Reset metadata
        setInputVideoMetadata(null);
        setOutputVideoMetadata(null);
        setFFmpegAnalysis(null);
        setProcessingTime(0);
        if (onUploadFinish) onUploadFinish();
        return;
      }

      // Reset metadata for new upload
      if (attempt === 1) {
        setInputVideoMetadata(null);
        setOutputVideoMetadata(null);
        setFFmpegAnalysis(null);
        setProcessingTime(0);
      }

      if (onUploadStart) onUploadStart();
      setRetryCount(attempt - 1);

      let ffmpegSupported = detectFFmpegSupport();
      let fallback = fallbackMode || !ffmpegSupported;
      let errorStep = "";

      console.log("🔧 FFmpeg Detection Results:", {
        ffmpegSupported,
        fallbackMode,
        willUseFallback: fallback,
        userAgent: navigator.userAgent,
        hasSharedArrayBuffer:
          typeof window !== "undefined" && "SharedArrayBuffer" in window,
        hasWebAssembly: typeof WebAssembly !== "undefined",
        isIOSDevice: device.isIOS,
      });

      // Provide better user feedback based on device and capabilities
      if (device.isIOS && !ffmpegSupported) {
        console.log(
          "📱 iOS device detected without FFmpeg support - will use optimized fallback"
        );
      } else if (device.isIOS && ffmpegSupported) {
        console.log(
          "📱 iOS device with FFmpeg support - will use iOS-optimized processing"
        );
      }

      try {
        // Duration check
        if (maxDurationSeconds) {
          setStatus("Checking video duration...");
          try {
            const duration = await getVideoDuration(file);
            const validation = validateVideoDuration(
              duration,
              maxDurationSeconds
            );
            if (!validation.isValid) {
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
            thumbnailUrl = await generateThumbnail(
              file,
              ffmpegRef,
              username,
              fallback
            );
          } catch (err) {
            errorStep = "thumbnail";
            setStatus("Thumbnail generation failed, continuing upload...");
          }
        }

        // Check file size and HP requirements first
        const fileSizeCheck = checkFileSizeAndHP(file, userHP);
        if (!fileSizeCheck.canUpload && onFileSizeError) {
          setStatus("");
          onFileSizeError(fileSizeCheck.reason || "File size exceeds limits");
          onUpload(null);
          if (onUploadFinish) onUploadFinish();
          return;
        }

        // Analyze input video for development info
        const startTime = Date.now();
        if (isDevelopment) {
          try {
            setStatus("Analyzing video metadata...");
            const metadata = await analyzeVideoFile(file);
            setInputVideoMetadata(metadata);

            // Get FFmpeg analysis if available
            if (!fallback) {
              const ffmpegMeta = await analyzeVideoWithFFmpeg(file, ffmpegRef);
              setFFmpegAnalysis(ffmpegMeta);
            }

            logVideoProcessingDetails(
              "Input Analysis",
              file,
              undefined,
              metadata,
              ffmpegAnalysis || undefined
            );
          } catch (err) {
            console.warn("📊 Video analysis failed:", err);
          }
        }

        // Simple processing logic like the working reference code
        let processedFile: File = file;
        const processingInfo = shouldProcessFile(file);

        console.log("📱 File processing check:", {
          fileName: file.name,
          fileType: file.type,
          fileSizeMB: (file.size / (1024 * 1024)).toFixed(1),
          userHP,
          shouldProcess: processingInfo.shouldProcess,
          isMovFile: processingInfo.isMovFile,
          isMp4File: processingInfo.isMp4File,
          justConvert: processingInfo.justConvert,
          skipCompression,
          fallback,
        });

        // For .mov files, force FFmpeg processing even if detection suggests otherwise
        const isMovFile =
          file.name.toLowerCase().endsWith(".mov") ||
          file.type === "video/quicktime";
        const iosOptimized =
          device.isIOS && shouldUseiOSOptimizedProcessing(file);

        // Android optimization - check if we should skip processing
        const androidDevice = detectAndroidDevice();
        const androidSkipInfo = shouldSkipAndroidProcessing(file);

        console.log(`📱 Device info:`, {
          isIOS: device.isIOS,
          iosOptimized,
          isAndroid: androidDevice.isAndroid,
          isOldAndroid: androidDevice.isOldAndroid,
          androidSkip: androidSkipInfo.shouldSkip,
          androidReason: androidSkipInfo.reason,
          fallbackMode,
          ffmpegSupported,
        });

        // Android MP4 optimization - skip processing for MP4 files from Android
        if (androidSkipInfo.shouldSkip) {
          console.log(
            `🤖 Skipping Android processing: ${androidSkipInfo.reason}`
          );
          setStatus("Android MP4 detected - uploading without processing...");
          processedFile = file;
        } else {
          console.log(`📱 Use iOS optimized processing: ${iosOptimized}`);

          // Update state for UI feedback
          setUseIOSOptimized(iosOptimized);

          // Enhanced processing status messages
          if (device.isIOS) {
            if (iosOptimized) {
              setStatus(
                "Detected iPhone video - using optimized processing..."
              );
            } else {
              setStatus("Processing iPhone video...");
            }
          } else if (androidDevice.isAndroid) {
            if (isMovFile) {
              setStatus("Converting Android .MOV video...");
            } else {
              setStatus("Processing Android video...");
            }
          } else if (isMovFile) {
            setStatus("Processing .MOV video file...");
          } else {
            setStatus("Processing video...");
          }

          if (isMovFile) {
            console.log("📱 .mov file detected - forcing FFmpeg processing");
            fallback = false; // Force FFmpeg for .mov files
          }

          // Determine processing approach based on file size and duration
          const twelveMB = 12 * 1024 * 1024;
          const shouldResize = file.size > twelveMB;
          let shouldSkipCompression = skipCompression;

          // Auto-skip compression for videos over 1 minute (like working code)
          if (
            !shouldSkipCompression &&
            !maxDurationSeconds &&
            inputVideoMetadata
          ) {
            try {
              const durationInSeconds = inputVideoMetadata.duration
                ? parseInt(inputVideoMetadata.duration.split(":")[0]) * 60 +
                  parseInt(inputVideoMetadata.duration.split(":")[1])
                : 0;
              if (durationInSeconds > 60) {
                shouldSkipCompression = true;
                console.log(
                  "📱 Auto-skipping compression for video over 1 minute"
                );
              }
            } catch (error) {
              console.warn(
                "Could not determine video duration, proceeding with compression:",
                error
              );
            }
          }

          if (!fallback) {
            try {
              if (shouldSkipCompression) {
                // Just convert to MP4 format without compression
                if (device.isIOS && isMovFile && iosOptimized) {
                  setStatus("Converting iPhone video to MP4 (optimized)...");
                } else {
                  setStatus("Converting to MP4 format...");
                }

                let mp4Blob: Blob;
                if (device.isIOS && isMovFile && iosOptimized) {
                  console.log(
                    "📱 Using iOS-optimized conversion for .mov file"
                  );
                  mp4Blob = await convertToMp4iOS(
                    file,
                    ffmpegRef,
                    setCompressionProgress
                  );
                } else {
                  mp4Blob = await convertToMp4(
                    file,
                    ffmpegRef,
                    setCompressionProgress
                  );
                }

                processedFile = new File([mp4Blob], "converted.mp4", {
                  type: "video/mp4",
                });
                console.log(
                  "📱 Successfully converted to MP4 without compression"
                );
              } else {
                // Compress the video using simple settings
                if (device.isIOS && iosOptimized) {
                  setStatus("Compressing iPhone video (optimized)...");
                } else {
                  setStatus("Compressing video...");
                }

                const compressedBlob = await compressVideo(
                  file,
                  ffmpegRef,
                  setCompressionProgress,
                  shouldResize
                );

                if (compressedBlob.size === 0) {
                  throw new Error("Compression resulted in empty file");
                }

                if (shouldResize && compressedBlob.size > file.size) {
                  throw new Error("Compressed file is larger than original");
                }

                processedFile = new File([compressedBlob], "compressed.mp4", {
                  type: "video/mp4",
                });
                console.log("📱 Successfully compressed video");
              }
            } catch (err) {
              console.error("📱 FFmpeg processing failed:", err);

              // For iOS devices, try iOS-specific fallback first
              if (device.isIOS) {
                try {
                  console.log("📱 Trying iOS-specific fallback...");
                  setStatus("Using iOS fallback compression...");
                  const iosFallbackBlob = await compressVideoiOSFallback(file);
                  processedFile = new File(
                    [iosFallbackBlob],
                    "ios-compressed.mp4",
                    {
                      type: "video/mp4",
                    }
                  );
                  console.log("✅ iOS fallback successful");
                } catch (iosErr) {
                  console.error("📱 iOS fallback also failed:", iosErr);
                  // For .mov files, try one more time with just basic conversion
                  if (isMovFile && !shouldSkipCompression) {
                    try {
                      console.log(
                        "📱 Retrying .mov file with simple conversion only"
                      );
                      setStatus("Retrying with simple conversion...");
                      const mp4Blob = await convertToMp4(
                        file,
                        ffmpegRef,
                        setCompressionProgress
                      );
                      processedFile = new File([mp4Blob], "converted.mp4", {
                        type: "video/mp4",
                      });
                      console.log(
                        "📱 Successfully converted .mov file on retry"
                      );
                    } catch (retryErr) {
                      console.error(
                        "📱 All attempts failed, uploading original file:",
                        retryErr
                      );
                      setStatus(
                        "All processing failed, uploading original file..."
                      );
                      processedFile = file;
                    }
                  } else {
                    console.log(
                      "📱 Uploading original file due to iOS processing failure"
                    );
                    setStatus(
                      "iOS processing failed, uploading original file..."
                    );
                    processedFile = file;
                  }
                }
              } else {
                // For .mov files on non-iOS, try one more time with just basic conversion
                if (isMovFile && !shouldSkipCompression) {
                  try {
                    console.log(
                      "📱 Retrying .mov file with simple conversion only"
                    );
                    setStatus("Retrying with simple conversion...");
                    const mp4Blob = await convertToMp4(
                      file,
                      ffmpegRef,
                      setCompressionProgress
                    );
                    processedFile = new File([mp4Blob], "converted.mp4", {
                      type: "video/mp4",
                    });
                    console.log("📱 Successfully converted .mov file on retry");
                  } catch (retryErr) {
                    console.error(
                      "📱 Retry also failed, uploading original file:",
                      retryErr
                    );
                    setStatus("Conversion failed, uploading original file...");
                    processedFile = file;
                  }
                } else {
                  console.log(
                    "📱 Uploading original file due to processing failure"
                  );
                  setStatus("Processing failed, uploading original file...");
                  processedFile = file;
                }
              }
            }
          } else {
            console.warn(
              "📱 Using fallback compression - reduced quality expected"
            );
            // Use fallback compression only as last resort
            try {
              if (device.isIOS) {
                console.log("📱 Using iOS-optimized fallback for iOS device");
                setStatus("Using iPhone-optimized fallback compression...");
                const iosFallbackBlob = await compressVideoiOSFallback(file);
                processedFile = new File(
                  [iosFallbackBlob],
                  "ios-fallback.mp4",
                  {
                    type: "video/mp4",
                  }
                );
              } else {
                setStatus("Using fallback compression...");
                const mobileBlob = await compressVideoFallback(file);
                processedFile = new File(
                  [mobileBlob],
                  "mobile-compressed.webm",
                  {
                    type: "video/webm",
                  }
                );
              }
            } catch {
              setStatus(
                "Fallback compression failed, uploading original file..."
              );
              processedFile = file;
            }
          }
        }

        // Analyze output video for development info (works for both skipped and processed files)
        const endTime = Date.now();
        const totalProcessingTime = (endTime - startTime) / 1000;
        setProcessingTime(totalProcessingTime);

        console.log("📊 Processing completed:", {
          originalFile: file.name,
          processedFile: processedFile.name,
          originalSize: file.size,
          processedSize: processedFile.size,
          sameFile: processedFile === file,
          processingTime: totalProcessingTime,
        });

        if (isDevelopment) {
          try {
            if (processedFile !== file) {
              setStatus("Analyzing processed video...");
              const outputMetadata = await analyzeVideoFile(processedFile);
              setOutputVideoMetadata(outputMetadata);

              console.log("📊 Output analysis completed:", outputMetadata);

              logVideoProcessingDetails(
                "Output Analysis",
                file,
                processedFile,
                inputVideoMetadata || undefined,
                ffmpegAnalysis || undefined,
                totalProcessingTime
              );
            } else {
              // No processing was done, but still log for comparison
              setOutputVideoMetadata(inputVideoMetadata);
              console.log(
                "📱 No processing performed - file passed through unchanged"
              );

              logVideoProcessingDetails(
                "No Processing (Pass Through)",
                file,
                undefined,
                inputVideoMetadata || undefined,
                ffmpegAnalysis || undefined,
                totalProcessingTime
              );
            }
          } catch (err) {
            console.warn("📊 Output video analysis failed:", err);
            // Set a basic output metadata if analysis fails
            if (processedFile !== file) {
              setOutputVideoMetadata({
                fileName: processedFile.name,
                fileSize: formatFileSize(processedFile.size),
                fileSizeMB: processedFile.size / (1024 * 1024),
                duration: "Analysis failed",
                resolution: "Analysis failed",
                frameRate: "Analysis failed",
                codec: "Analysis failed",
                format: processedFile.type,
                bitrate: "Analysis failed",
                isVFR: false,
                audioCodec: "Analysis failed",
                hasAudio: false,
              });
            }
          }
        }

        // Upload
        try {
          setStatus("Uploading video...");
          setUploadProgress(0);

          const limits = getFileSizeLimits();
          const isMobile = isMobileDevice();

          if (processedFile.size > limits.maxSize) {
            const sizeMB =
              Math.round((processedFile.size / 1024 / 1024) * 100) / 100;
            const maxSizeMB = Math.round(limits.maxSize / 1024 / 1024);

            if (isMobile && !fallback && sizeMB > 45) {
              setStatus(
                "File too large for mobile, compressing more aggressively..."
              );
              try {
                const aggressivelyCompressed = await compressVideo(
                  processedFile,
                  ffmpegRef,
                  setCompressionProgress,
                  true,
                  0.3
                );

                if (aggressivelyCompressed.size < limits.maxSizeForMobile) {
                  processedFile = new File(
                    [aggressivelyCompressed],
                    "mobile_compressed.mp4",
                    { type: "video/mp4" }
                  );
                } else {
                  throw new Error(
                    "Still too large after aggressive compression"
                  );
                }
              } catch (compressionError) {
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

          const result = await uploadVideo(
            processedFile,
            username,
            thumbnailUrl || undefined,
            setUploadProgress
          );

          if (!result.success) {
            throw new Error(result.error || "Upload failed");
          }

          setStatus("Upload complete!");
          setUploadProgress(100);
          onUpload(result.url || null);
          if (onUploadFinish) onUploadFinish();
        } catch (err) {
          errorStep = "upload";
          if (attempt < 3) {
            setStatus(
              `Upload failed (attempt ${attempt}/3): ${
                err instanceof Error ? err.message : String(err)
              }. Retrying...`
            );
            await processVideoFile(file, attempt + 1, "upload");
            return;
          } else {
            setStatus(
              `Upload failed after 3 attempts: ${
                err instanceof Error ? err.message : String(err)
              }`
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

        {/* Development Video Details */}
        {isDevelopment && (inputVideoMetadata || outputVideoMetadata) && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "monospace",
              border: "1px solid #ddd",
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 8, color: "#333" }}>
              🎥 Video Processing Details (Development)
            </h4>

            {inputVideoMetadata && (
              <div style={{ marginBottom: 12 }}>
                <strong>📁 Input Video:</strong>
                <div style={{ marginLeft: 12, marginTop: 4 }}>
                  <div>📋 File: {inputVideoMetadata.fileName}</div>
                  <div>
                    📏 Size: {inputVideoMetadata.fileSize} (
                    {inputVideoMetadata.fileSizeMB.toFixed(2)} MB)
                  </div>
                  <div>⏱️ Duration: {inputVideoMetadata.duration}</div>
                  <div>📐 Resolution: {inputVideoMetadata.resolution}</div>
                  <div>🎞️ Frame Rate: {inputVideoMetadata.frameRate}</div>
                  <div>🎬 Format: {inputVideoMetadata.format}</div>
                  <div>📈 Bitrate: {inputVideoMetadata.bitrate}</div>
                  {ffmpegAnalysis && (
                    <>
                      <div>🔧 Codec: {ffmpegAnalysis.codec || "Unknown"}</div>
                      <div>
                        🎵 Audio: {ffmpegAnalysis.audioCodec || "Unknown"}
                      </div>
                      <div>
                        🔄 VFR:{" "}
                        {ffmpegAnalysis.isVFR
                          ? "Yes (Variable Frame Rate)"
                          : "No"}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {outputVideoMetadata && (
              <div style={{ marginBottom: 12 }}>
                <strong>📤 Output Video:</strong>
                <div style={{ marginLeft: 12, marginTop: 4 }}>
                  <div>📋 File: {outputVideoMetadata.fileName}</div>
                  <div>
                    📏 Size: {outputVideoMetadata.fileSize} (
                    {outputVideoMetadata.fileSizeMB.toFixed(2)} MB)
                  </div>
                  <div>⏱️ Duration: {outputVideoMetadata.duration}</div>
                  <div>📐 Resolution: {outputVideoMetadata.resolution}</div>
                  <div>🎞️ Frame Rate: {outputVideoMetadata.frameRate}</div>
                  <div>🎬 Format: {outputVideoMetadata.format}</div>
                  <div>📈 Bitrate: {outputVideoMetadata.bitrate}</div>
                  {inputVideoMetadata && (
                    <div
                      style={{
                        color:
                          outputVideoMetadata.fileSizeMB <
                          inputVideoMetadata.fileSizeMB
                            ? "green"
                            : "red",
                      }}
                    >
                      📊 Size Change:{" "}
                      {(
                        ((outputVideoMetadata.fileSizeMB -
                          inputVideoMetadata.fileSizeMB) /
                          inputVideoMetadata.fileSizeMB) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  )}
                </div>
              </div>
            )}

            {processingTime > 0 && (
              <div>
                <strong>⏱️ Processing Time:</strong> {processingTime.toFixed(2)}
                s
              </div>
            )}

            {fallbackMode && (
              <div style={{ color: "orange", marginTop: 8 }}>
                ⚠️ Fallback mode was used - FFmpeg processing failed
              </div>
            )}

            {/* Device and Processing Information */}
            <div
              style={{
                marginTop: 12,
                paddingTop: 8,
                borderTop: "1px solid #ddd",
              }}
            >
              <strong>📱 Device & Processing Info:</strong>
              <div style={{ marginLeft: 12, marginTop: 4 }}>
                <div>📱 iOS Device: {device.isIOS ? "Yes" : "No"}</div>
                <div>
                  🤖 Android Device:{" "}
                  {detectAndroidDevice().isAndroid
                    ? `Yes ${
                        detectAndroidDevice().isOldAndroid
                          ? "(Old)"
                          : "(Modern)"
                      }`
                    : "No"}
                </div>
                <div>🔧 iOS Optimized: {useIOSOptimized ? "Yes" : "No"}</div>
                <div>🛠️ FFmpeg Supported: {!fallbackMode ? "Yes" : "No"}</div>
                <div>
                  🌐 User Agent: {navigator.userAgent.substring(0, 50)}...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoUploader.displayName = "VideoUploader";

export default VideoUploader;
