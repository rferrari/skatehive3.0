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
  hideCompletionMessage?: boolean; // Hide "Upload complete!" message
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
      hideCompletionMessage = false,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<any>(null);
    // Unified progress state
    const [progressState, setProgressState] = useState<{
      phase:
        | "idle"
        | "analyzing"
        | "processing"
        | "uploading"
        | "complete"
        | "error";
      progress: number;
      message: string;
      subMessage?: string;
    }>({
      phase: "idle",
      progress: 0,
      message: "",
    });

    // Helper functions for progress updates
    const updateProgress = (
      phase: typeof progressState.phase,
      progress: number,
      message: string,
      subMessage?: string
    ) => {
      const boundedProgress = Math.max(
        0,
        Math.min(100, Math.round(progress || 0))
      );
      setProgressState({
        phase,
        progress: boundedProgress,
        message,
        subMessage,
      });
    };

    const setStatus = (message: string) => {
      setProgressState((prev) => ({ ...prev, message }));
    };

    const setCompressionProgress = (progress: number) => {
      const boundedProgress = Math.max(
        0,
        Math.min(100, Math.round(progress || 0))
      );
      setProgressState((prev) => ({
        ...prev,
        progress: boundedProgress,
        phase: "processing",
      }));
    };

    const setUploadProgress = (progress: number) => {
      const boundedProgress = Math.max(
        0,
        Math.min(100, Math.round(progress || 0))
      );
      setProgressState((prev) => ({
        ...prev,
        progress: boundedProgress,
        phase: "uploading",
      }));
    };

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

    // Thumbnail debugging state
    const [thumbnailDebugInfo, setThumbnailDebugInfo] = useState<{
      url: string | null;
      generationMethod: string | null;
      wasPreGenerated: boolean;
      generationTime: number | null;
      error: string | null;
    }>({
      url: null,
      generationMethod: null,
      wasPreGenerated: false,
      generationTime: null,
      error: null,
    });

    // Memoized device detection to avoid repeated calculations
    const deviceInfo = React.useMemo(() => {
      const ios = detectiOSDevice();
      const android = detectAndroidDevice();
      return {
        isIOS: ios,
        isAndroid: android.isAndroid,
        isOldAndroid: android.isOldAndroid,
        androidDevice: android,
        supportsMobileOptimization: true,
      };
    }, []);
    const [processingTime, setProcessingTime] = useState<number>(0);
    const [isDevelopment, setIsDevelopment] = useState<boolean>(false);
    const [showDevDetails, setShowDevDetails] = useState<boolean>(true);

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
        updateProgress("idle", 0, "");
        // Reset metadata
        setInputVideoMetadata(null);
        setOutputVideoMetadata(null);
        setFFmpegAnalysis(null);
        setProcessingTime(0);
        setThumbnailDebugInfo({
          url: null,
          generationMethod: null,
          wasPreGenerated: false,
          generationTime: null,
          error: null,
        });
        if (onUploadFinish) onUploadFinish();
        return;
      }

      // Reset metadata for new upload
      if (attempt === 1) {
        setInputVideoMetadata(null);
        setOutputVideoMetadata(null);
        setFFmpegAnalysis(null);
        setProcessingTime(0);
        setThumbnailDebugInfo({
          url: null,
          generationMethod: null,
          wasPreGenerated: false,
          generationTime: null,
          error: null,
        });
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
        isIOSDevice: deviceInfo.isIOS,
      });

      // Provide better user feedback based on device and capabilities
      if (deviceInfo.isIOS && !ffmpegSupported) {
        console.log(
          "📱 iOS device detected without FFmpeg support - will use optimized fallback"
        );
      } else if (deviceInfo.isIOS && ffmpegSupported) {
        console.log(
          "📱 iOS device with FFmpeg support - will use iOS-optimized processing"
        );
      }

      try {
        // Duration check
        if (maxDurationSeconds) {
          updateProgress("analyzing", 10, "Checking video duration...");
          try {
            const duration = await getVideoDuration(file);
            const validation = validateVideoDuration(
              duration,
              maxDurationSeconds
            );
            if (!validation.isValid) {
              updateProgress("error", 0, "Video duration exceeds limit");
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
        const thumbnailStartTime = Date.now();

        // Check if thumbnail was already generated by VideoTrimModal
        if ((file as any).thumbnailUrl) {
          thumbnailUrl = (file as any).thumbnailUrl;
          updateProgress("analyzing", 20, "Using existing thumbnail...");
          setThumbnailDebugInfo({
            url: thumbnailUrl,
            generationMethod: "Pre-generated (VideoTrimModal)",
            wasPreGenerated: true,
            generationTime: 0,
            error: null,
          });
        } else {
          try {
            updateProgress("analyzing", 15, "Generating thumbnail...");
            thumbnailUrl = await generateThumbnail(
              file,
              ffmpegRef,
              username,
              fallback
            );
            const thumbnailEndTime = Date.now();
            const thumbnailGenerationTime = (thumbnailEndTime - thumbnailStartTime) / 1000;
            
            setThumbnailDebugInfo({
              url: thumbnailUrl,
              generationMethod: fallback ? "FFmpeg fallback" : "Canvas (primary)",
              wasPreGenerated: false,
              generationTime: thumbnailGenerationTime,
              error: null,
            });
          } catch (err) {
            errorStep = "thumbnail";
            const thumbnailError = err instanceof Error ? err.message : "Unknown error";
            setThumbnailDebugInfo(prev => ({
              ...prev,
              error: thumbnailError,
              generationMethod: "Failed",
            }));
            updateProgress(
              "analyzing",
              25,
              "Thumbnail generation failed, continuing upload..."
            );
          }
        }

        // Check file size and HP requirements first
        const fileSizeCheck = checkFileSizeAndHP(file, userHP);
        if (!fileSizeCheck.canUpload && onFileSizeError) {
          updateProgress("error", 0, "File size exceeds limits");
          onFileSizeError(fileSizeCheck.reason || "File size exceeds limits");
          onUpload(null);
          if (onUploadFinish) onUploadFinish();
          return;
        }

        // Analyze input video for development info
        const startTime = Date.now();
        if (isDevelopment) {
          try {
            updateProgress("analyzing", 30, "Analyzing video metadata...");
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
          deviceInfo.isIOS && shouldUseiOSOptimizedProcessing(file);

        // Android optimization - check if we should skip processing
        const androidSkipInfo = shouldSkipAndroidProcessing(file);

        console.log(`📱 Device info:`, {
          isIOS: deviceInfo.isIOS,
          iosOptimized,
          isAndroid: deviceInfo.isAndroid,
          isOldAndroid: deviceInfo.isOldAndroid,
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
          updateProgress(
            "processing",
            100,
            "Android MP4 detected - uploading without processing..."
          );
          processedFile = file;
        } else {
          console.log(`📱 Use iOS optimized processing: ${iosOptimized}`);

          // Update state for UI feedback
          setUseIOSOptimized(iosOptimized);

          // Enhanced processing status messages
          if (deviceInfo.isIOS) {
            if (iosOptimized) {
              updateProgress(
                "processing",
                0,
                "Detected iPhone video - using optimized processing..."
              );
            } else {
              updateProgress("processing", 0, "Processing iPhone video...");
            }
          } else if (deviceInfo.isAndroid) {
            if (isMovFile) {
              updateProgress(
                "processing",
                0,
                "Converting Android .MOV video..."
              );
            } else {
              updateProgress("processing", 0, "Processing Android video...");
            }
          } else if (isMovFile) {
            updateProgress("processing", 0, "Processing .MOV video file...");
          } else {
            updateProgress("processing", 0, "Processing video...");
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
                if (deviceInfo.isIOS && isMovFile && iosOptimized) {
                  updateProgress(
                    "processing",
                    0,
                    "Converting iPhone video to MP4 (optimized)..."
                  );
                } else {
                  updateProgress(
                    "processing",
                    0,
                    "Converting to MP4 format..."
                  );
                }

                let mp4Blob: Blob;
                if (deviceInfo.isIOS && isMovFile && iosOptimized) {
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
                if (deviceInfo.isIOS && iosOptimized) {
                  updateProgress(
                    "processing",
                    0,
                    "Making iPhone video more awesome..."
                  );
                } else {
                  updateProgress(
                    "processing",
                    0,
                    "Sending video to skate gods..."
                  );
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

                processedFile = new File(
                  [compressedBlob],
                  "skatehivesnapvideo.mp4",
                  {
                    type: "video/mp4",
                  }
                );
                console.log("📱 Successfully compressed video");
              }
            } catch (err) {
              console.error("📱 FFmpeg processing failed:", err);

              // For iOS devices, try iOS-specific fallback first
              if (deviceInfo.isIOS) {
                try {
                  console.log("📱 Trying iOS-specific fallback...");
                  updateProgress(
                    "processing",
                    0,
                    "Using iOS fallback compression..."
                  );
                  const iosFallbackBlob = await compressVideoiOSFallback(file);
                  processedFile = new File(
                    [iosFallbackBlob],
                    "ios-skatehivesnapvideo.mp4",
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
                      updateProgress(
                        "processing",
                        0,
                        "Retrying with simple conversion..."
                      );
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
                      updateProgress(
                        "processing",
                        100,
                        "All processing failed, uploading original file..."
                      );
                      processedFile = file;
                    }
                  } else {
                    console.log(
                      "📱 Uploading original file due to iOS processing failure"
                    );
                    updateProgress(
                      "processing",
                      100,
                      "iOS processing failed, uploading original file..."
                    );
                    processedFile = file;
                  }
                }
              } else {
                // For .mov files on non-iOS, try one more time with just basic conversion
                if (isMovFile && !shouldSkipCompression) {
                  try {
                    if (isMovFile && !shouldSkipCompression) {
                      try {
                        console.log(
                          "📱 Retrying .mov file with simple conversion only"
                        );
                        updateProgress(
                          "processing",
                          0,
                          "Retrying with simple conversion..."
                        );
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
                          "📱 Retry also failed, uploading original file:",
                          retryErr
                        );
                        updateProgress(
                          "processing",
                          100,
                          "Conversion failed, uploading original file..."
                        );
                        processedFile = file;
                      }
                    } else {
                      console.log(
                        "📱 Uploading original file due to processing failure"
                      );
                      updateProgress(
                        "processing",
                        100,
                        "Processing failed, uploading original file..."
                      );
                      processedFile = file;
                    }
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
              if (deviceInfo.isIOS) {
                console.log("📱 Using iOS-optimized fallback for iOS device");
                updateProgress(
                  "processing",
                  0,
                  "Using iPhone-optimized fallback compression..."
                );
                const iosFallbackBlob = await compressVideoiOSFallback(file);
                processedFile = new File(
                  [iosFallbackBlob],
                  "ios-fallback.mp4",
                  {
                    type: "video/mp4",
                  }
                );
              } else {
                updateProgress(
                  "processing",
                  0,
                  "Using fallback compression..."
                );
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
              updateProgress(
                "processing",
                100,
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
              updateProgress("analyzing", 90, "Analyzing processed video...");
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
          updateProgress("uploading", 0, "Skate Gods Sending back to Earth...");

          const limits = getFileSizeLimits();
          const isMobile = isMobileDevice();

          if (processedFile.size > limits.maxSize) {
            const sizeMB =
              Math.round((processedFile.size / 1024 / 1024) * 100) / 100;
            const maxSizeMB = Math.round(limits.maxSize / 1024 / 1024);

            if (isMobile && !fallback && sizeMB > 45) {
              updateProgress(
                "processing",
                0,
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
                updateProgress(
                  "error",
                  0,
                  `File too large (${sizeMB}MB) for mobile upload. Maximum: ${maxSizeMB}MB`
                );
                onUpload(null);
                if (onUploadFinish) onUploadFinish();
                return;
              }
            } else {
              updateProgress(
                "error",
                0,
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

          if (hideCompletionMessage) {
            updateProgress("idle", 0, "");
          } else {
            updateProgress("complete", 100, "Upload complete!");
          }
          onUpload(result.url || null);
          if (onUploadFinish) onUploadFinish();
        } catch (err) {
          errorStep = "upload";
          if (attempt < 3) {
            updateProgress(
              "error",
              0,
              `Upload failed (attempt ${attempt}/3): ${
                err instanceof Error ? err.message : String(err)
              }. Retrying...`
            );
            await processVideoFile(file, attempt + 1, "upload");
            return;
          } else {
            updateProgress(
              "error",
              0,
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

        updateProgress("error", 0, `Upload failed: ${failMsg}`);
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
        {progressState.phase !== "idle" && (
          <div
            style={{
              marginTop: 8,
              color: progressState.phase === "error" 
                ? "red" 
                : (progressState.message.includes("skate gods") || progressState.message.includes("Skate Gods"))
                  ? "var(--chakra-colors-primary)"
                  : "#333",
            }}
          >
            {progressState.message}
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
            {progressState.subMessage && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {progressState.subMessage}
              </div>
            )}
          </div>
        )}

        {/* Unified Progress Bar with Phase Indicator */}
        {(progressState.phase === "processing" ||
          progressState.phase === "uploading") && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 8,
                background: backgroundMuted,
                borderRadius: 4,
                overflow: "hidden",
                width: 200,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, progressState.progress || 0)
                  )}%`,
                  height: "100%",
                  background:
                    progressState.phase === "uploading"
                      ? backgroundAccent
                      : backgroundPrimary,
                  transition: "width 0.3s ease-out",
                }}
              />
              {/* Animated shimmer effect for processing */}
              {progressState.phase === "processing" && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                    animation: "shimmer 2s infinite",
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                marginTop: 2,
                color: "#666",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {Math.max(0, Math.min(100, progressState.progress || 0))}%
              </span>
              <span style={{ textTransform: "capitalize" }}>
                {progressState.phase === "processing"
                  ? "⚙️ Processing"
                  : "📤 Uploading"}
              </span>
            </div>
          </div>
        )}

        {/* Analyzing phase indicator */}
        {progressState.phase === "analyzing" && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 12,
                color: "#666",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "2px solid #ddd",
                  borderTop: "2px solid " + backgroundPrimary,
                  animation: "spin 1s linear infinite",
                  marginRight: 8,
                }}
              />
              🔍 Analyzing...
            </div>
          </div>
        )}

        {/* Add CSS animations */}
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          @keyframes shimmer {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
        `}</style>

        {/* Development Video Details */}
        {isDevelopment && (inputVideoMetadata || outputVideoMetadata) && showDevDetails && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "background",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "monospace",
              border: "1px solid #ddd",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h4 style={{ margin: 0, color: "#333" }}>
                🎥 Video Processing Details (Development)
              </h4>
              <button
                onClick={() => setShowDevDetails(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 16,
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Close dev details"
              >
                ✕
              </button>
            </div>

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

            {/* Thumbnail Debug Information */}
            {(thumbnailDebugInfo.url || thumbnailDebugInfo.error) && (
              <div style={{ marginBottom: 12 }}>
                <strong>🖼️ Thumbnail Generation:</strong>
                <div style={{ marginLeft: 12, marginTop: 4 }}>
                  <div>🔧 Method: {thumbnailDebugInfo.generationMethod || "Unknown"}</div>
                  <div>⚡ Pre-generated: {thumbnailDebugInfo.wasPreGenerated ? "Yes" : "No"}</div>
                  {thumbnailDebugInfo.generationTime !== null && (
                    <div>⏱️ Generation Time: {thumbnailDebugInfo.generationTime.toFixed(2)}s</div>
                  )}
                  {thumbnailDebugInfo.url ? (
                    <>
                      <div style={{ wordBreak: "break-all" }}>
                        🔗 URL: {thumbnailDebugInfo.url.substring(0, 80)}...
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <strong>📸 Preview:</strong>
                        <div style={{ marginTop: 4 }}>
                          <img
                            src={thumbnailDebugInfo.url}
                            alt="Generated thumbnail"
                            style={{
                              maxWidth: "120px",
                              maxHeight: "80px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              const errorDiv = document.createElement("div");
                              errorDiv.textContent = "❌ Thumbnail preview failed";
                              errorDiv.style.color = "red";
                              errorDiv.style.fontSize = "10px";
                              (e.target as HTMLImageElement).parentNode?.appendChild(errorDiv);
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "red" }}>
                      ❌ Generation Failed: {thumbnailDebugInfo.error || "Unknown error"}
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
                <div>📱 iOS Device: {deviceInfo.isIOS ? "Yes" : "No"}</div>
                <div>
                  🤖 Android Device:{" "}
                  {deviceInfo.isAndroid
                    ? `Yes ${deviceInfo.isOldAndroid ? "(Old)" : "(Modern)"}`
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
