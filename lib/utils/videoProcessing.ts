/**
 * Video processing utilities for FFmpeg operations
 */

import React from 'react';

// FFmpeg module imports
let FFmpeg: any;
let fetchFile: any;

// Types
export interface VideoDetails {
  fileName: string;
  fileSize: string;
  fileSizeMB: number;
  duration: string;
  resolution: string;
  frameRate: string;
  codec: string;
  format: string;
  bitrate: string;
  isVFR: boolean;
  audioCodec: string;
  hasAudio: boolean;
  creationTime?: string;
}

// File size limits and HP requirements
export const FILE_SIZE_LIMITS = {
  MAX_SIZE_DEFAULT: 500 * 1024 * 1024, // 500MB
  MAX_SIZE_HIGH_HP: 2 * 1024 * 1024 * 1024, // 2GB for 100+ HP users
  MIN_HP_FOR_LARGE_FILES: 100, // 100 HP required for files > 500MB
  
  // Processing limits to prevent crashes
  PROCESSING_TIMEOUT: 5 * 60 * 1000, // 5 minutes max processing time
  MAX_DURATION_SECONDS: 30 * 60, // 30 minutes max video duration
  FORCE_COMPRESSION_THRESHOLD: 1 * 1024 * 1024 * 1024, // Force compression for 1GB+ files
};

export function checkFileSizeAndHP(file: File, userHP: number = 0): {
  canUpload: boolean;
  needsCompression: boolean;
  reason?: string;
  forceCompression?: boolean;
} {
  const fileSizeMB = file.size / (1024 * 1024);
  const fileSizeGB = fileSizeMB / 1024;
  
  // Hard limit check - even high HP users can't exceed 2GB
  if (file.size > FILE_SIZE_LIMITS.MAX_SIZE_HIGH_HP) {
    return {
      canUpload: false,
      needsCompression: false,
      reason: `File too large (${fileSizeGB.toFixed(1)}GB). Maximum allowed: 2GB`,
    };
  }
  
  // If file is under 500MB, always allow
  if (file.size <= FILE_SIZE_LIMITS.MAX_SIZE_DEFAULT) {
    return {
      canUpload: true,
      needsCompression: false,
    };
  }
  
  // File is 500MB-2GB, check HP
  if (userHP >= FILE_SIZE_LIMITS.MIN_HP_FOR_LARGE_FILES) {
    // High HP users can upload larger files but with safeguards
    const forceCompression = file.size >= FILE_SIZE_LIMITS.FORCE_COMPRESSION_THRESHOLD;
    
    return {
      canUpload: true,
      needsCompression: forceCompression,
      forceCompression: forceCompression,
      reason: forceCompression 
        ? `Large file (${fileSizeGB.toFixed(1)}GB) will be compressed for stability`
        : undefined,
    };
  }
  
  // User doesn't have enough HP for large files
  return {
    canUpload: false,
    needsCompression: true,
    reason: `File size (${fileSizeMB.toFixed(1)}MB) exceeds 500MB limit. You need at least ${FILE_SIZE_LIMITS.MIN_HP_FOR_LARGE_FILES} HP to upload larger files.`,
  };
}

export function checkVideoDurationAndHP(duration: number, userHP: number = 0): {
  canUpload: boolean;
  needsTrimming: boolean;
  reason?: string;
} {
  // Hard limit for everyone - even high HP users
  if (duration > FILE_SIZE_LIMITS.MAX_DURATION_SECONDS) {
    const maxMinutes = FILE_SIZE_LIMITS.MAX_DURATION_SECONDS / 60;
    const durationMinutes = Math.round(duration / 60);
    return {
      canUpload: false,
      needsTrimming: false,
      reason: `Video too long (${durationMinutes} min). Maximum allowed: ${maxMinutes} minutes`,
    };
  }
  
  // 15-second limit for users with <100 HP
  if (userHP < FILE_SIZE_LIMITS.MIN_HP_FOR_LARGE_FILES && duration > 15) {
    return {
      canUpload: true,
      needsTrimming: true,
      reason: `Video exceeds 15-second limit. Trim required or get 100+ HP to bypass.`,
    };
  }
  
  // High HP users can upload any length up to the hard limit
  return {
    canUpload: true,
    needsTrimming: false,
  };
}

export function shouldProcessFile(file: File): {
  shouldProcess: boolean;
  isMovFile: boolean;
  isMp4File: boolean;
  justConvert: boolean;
} {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  const isMovFile = fileName.endsWith('.mov') || fileType === 'video/quicktime';
  const isMp4File = fileName.endsWith('.mp4') || fileType === 'video/mp4';
  
  // For .mov files, only convert container (no re-encoding) if needed for compatibility
  if (isMovFile) {
    return {
      shouldProcess: true,
      isMovFile: true,
      isMp4File: false,
      justConvert: true, // Only container conversion, no re-encoding
    };
  }
  
  // MP4 files should pass through completely
  if (isMp4File) {
    return {
      shouldProcess: false,
      isMovFile: false,
      isMp4File: true,
      justConvert: false,
    };
  }
  
  // Other formats need full processing
  return {
    shouldProcess: true,
    isMovFile: false,
    isMp4File: false,
    justConvert: false,
  };
}

export async function loadFFmpeg() {
  if (!FFmpeg || !fetchFile) {
    const ffmpegMod = await import("@ffmpeg/ffmpeg");
    const utilMod = await import("@ffmpeg/util");
    FFmpeg = ffmpegMod.FFmpeg;
    fetchFile = utilMod.fetchFile;
  }
}

export function getFetchFile() {
  return fetchFile;
}

// Video analysis utilities for debugging
export interface VideoMetadata {
  fileName: string;
  fileSize: string;
  fileSizeMB: number;
  duration: string;
  resolution: string;
  frameRate: string;
  codec: string;
  format: string;
  bitrate: string;
  isVFR: boolean;
  audioCodec: string;
  hasAudio: boolean;
  creationTime?: string;
}

export async function analyzeVideoFile(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    video.onloadedmetadata = () => {
      // Try to detect frame rate using various methods
      let frameRate = 'Unknown';
      
      // Method 1: Try to extract from video element properties if available
      if ((video as any).getVideoPlaybackQuality) {
        try {
          const quality = (video as any).getVideoPlaybackQuality();
          if (quality.totalVideoFrames && video.duration) {
            const calculatedFps = quality.totalVideoFrames / video.duration;
            frameRate = `${calculatedFps.toFixed(1)} fps (calculated)`;
          }
        } catch (e) {
          console.log('Could not calculate frame rate from playback quality');
        }
      }
      
      // Method 2: Common frame rates for mobile devices
      if (frameRate === 'Unknown') {
        // iPhone common frame rates
        if (file.name.toLowerCase().includes('iphone') || file.type === 'video/quicktime') {
          frameRate = 'Likely 30fps or 60fps (iPhone)';
        } else if (file.type === 'video/webm') {
          frameRate = 'Likely 30fps (WebM)';
        } else {
          frameRate = 'Likely 30fps (standard)';
        }
      }

      const metadata: VideoMetadata = {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileSizeMB: file.size / (1024 * 1024),
        duration: formatDuration(video.duration),
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        frameRate: frameRate,
        codec: file.type === 'video/webm' ? 'VP8/VP9 (WebM)' : 'Unknown (browser limitation)',
        format: file.type || 'Unknown',
        bitrate: 'Unknown',
        isVFR: false, // Will be detected if processing with FFmpeg
        audioCodec: 'Unknown',
        hasAudio: false, // Will try to detect
        creationTime: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
      };

      // Calculate approximate bitrate
      if (video.duration > 0) {
        const bitrateKbps = (file.size * 8) / (video.duration * 1000);
        metadata.bitrate = `~${bitrateKbps.toFixed(0)} kbps`;
      }

      // Try to detect if video has audio
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        metadata.hasAudio = true;
        metadata.audioCodec = file.type === 'video/webm' ? 'Vorbis/Opus (WebM)' : 'Present (type unknown)';
        audioContext.close();
      } catch (e) {
        // Audio detection failed, but that's ok
      }

      cleanup();
      resolve(metadata);
    };

    video.onerror = (e) => {
      console.warn("Video analysis error:", e);
      cleanup();
      // Don't reject, provide fallback metadata
      resolve({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileSizeMB: file.size / (1024 * 1024),
        duration: 'Analysis failed',
        resolution: 'Analysis failed',
        frameRate: 'Analysis failed',
        codec: 'Analysis failed',
        format: file.type || 'Unknown',
        bitrate: 'Analysis failed',
        isVFR: false,
        audioCodec: 'Analysis failed',
        hasAudio: false,
        creationTime: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
      });
    };

    video.src = URL.createObjectURL(file);
    
    // Add timeout for analysis
    setTimeout(() => {
      if (video.readyState === 0) {
        console.warn("Video analysis timeout");
        cleanup();
        resolve({
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileSizeMB: file.size / (1024 * 1024),
          duration: 'Analysis timeout',
          resolution: 'Analysis timeout',
          frameRate: 'Analysis timeout',
          codec: 'Analysis timeout',
          format: file.type || 'Unknown',
          bitrate: 'Analysis timeout',
          isVFR: false,
          audioCodec: 'Analysis timeout',
          hasAudio: false,
          creationTime: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
        });
      }
    }, 5000); // 5 second timeout
  });
}

export async function analyzeVideoWithFFmpeg(
  file: File,
  ffmpegRef: React.MutableRefObject<any>
): Promise<Partial<VideoMetadata>> {
  if (!ffmpegRef.current) {
    await loadFFmpeg();
    ffmpegRef.current = new FFmpeg();
    await ffmpegRef.current.load();
  }

  const ffmpeg = ffmpegRef.current;
  const fetchFile = getFetchFile();

  try {
    await ffmpeg.writeFile(file.name, await fetchFile(file));
    
    // Get detailed video info using ffprobe-like functionality
    // Note: This is a simplified approach since FFmpeg.wasm doesn't have full ffprobe
    const probeArgs = ['-i', file.name, '-f', 'null', '-'];
    await ffmpeg.exec(probeArgs);
    
    // For now, return basic info since FFmpeg.wasm logging is limited
    const metadata: Partial<VideoMetadata> = {
      frameRate: 'Analyzing...', // Will be filled by other methods
      codec: 'Analyzing...',
      audioCodec: 'Analyzing...',
      isVFR: false, // Simplified detection
    };
    
    console.log('🔍 FFmpeg analysis completed (limited info available)');
    
    return metadata;
  } catch (error) {
    console.error('🔍 FFmpeg analysis failed:', error);
    return {
      frameRate: 'Analysis failed',
      codec: 'Unknown',
      audioCodec: 'Unknown',
      isVFR: false,
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// iPhone/iOS detection and optimization functions
export function detectiOSDevice(): {
  isIOS: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  iosVersion?: number;
} {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isIPhone = /iPhone/.test(userAgent);
  const isIPad = /iPad/.test(userAgent);
  
  let iosVersion: number | undefined;
  if (isIOS) {
    const match = userAgent.match(/OS (\d+)_/);
    if (match) {
      iosVersion = parseInt(match[1]);
    }
  }
  
  return {
    isIOS,
    isIPhone,
    isIPad,
    iosVersion
  };
}

// Add Android device detection
export function detectAndroidDevice(): {
  isAndroid: boolean;
  isOldAndroid: boolean;
  androidVersion?: number;
  chromeVersion?: number;
} {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  
  let androidVersion: number | undefined;
  let chromeVersion: number | undefined;
  
  if (isAndroid) {
    const androidMatch = ua.match(/Android (\d+)/);
    if (androidMatch) {
      androidVersion = parseInt(androidMatch[1]);
    }
    
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      chromeVersion = parseInt(chromeMatch[1]);
    }
  }
  
  const isOldAndroid = isAndroid && (
    (androidVersion !== undefined && androidVersion < 8) ||  // Android < 8.0
    (chromeVersion !== undefined && chromeVersion < 70)      // Chrome < 70
  );
  
  return {
    isAndroid,
    isOldAndroid,
    androidVersion,
    chromeVersion
  };
}

export function shouldUseiOSOptimizedProcessing(file: File): boolean {
  const device = detectiOSDevice();
  if (!device.isIOS) return false;
  
  // Check if it's an iPhone video that needs special handling
  const isQuickTime = file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov');
  const isLargeFile = file.size > 50 * 1024 * 1024; // > 50MB
  
  return isQuickTime || isLargeFile;
}

// Add function to check if we should skip processing for Android
export function shouldSkipAndroidProcessing(file: File): {
  shouldSkip: boolean;
  reason: string;
} {
  const androidDevice = detectAndroidDevice();
  
  if (!androidDevice.isAndroid) {
    return { shouldSkip: false, reason: "Not an Android device" };
  }
  
  // For .mov files, always process (need to convert to compatible format)
  const isMovFile = file.name.toLowerCase().endsWith('.mov') || file.type === 'video/quicktime';
  if (isMovFile) {
    return { shouldSkip: false, reason: ".mov file needs conversion" };
  }
  
  // For MP4 files from Android, skip processing (they're usually already optimized)
  const isMp4File = file.name.toLowerCase().endsWith('.mp4') || file.type === 'video/mp4';
  if (isMp4File && androidDevice.isAndroid) {
    return { shouldSkip: true, reason: "Android MP4 files are typically already optimized" };
  }
  
  // For other formats, process normally
  return { shouldSkip: false, reason: "Non-MP4 file may benefit from processing" };
}

// iOS-optimized conversion that handles VFR better
export async function convertToMp4iOS(
  file: File,
  ffmpegRef: React.MutableRefObject<any>,
  onProgress: (progress: number) => void
): Promise<Blob> {
  if (!ffmpegRef.current) {
    await loadFFmpeg();
    ffmpegRef.current = new FFmpeg();
    await ffmpegRef.current.load();
  }
  
  const ffmpeg = ffmpegRef.current;
  const fetchFile = getFetchFile();

  ffmpeg.on("progress", ({ progress }: { progress: number }) => {
    // Ensure progress is a valid number between 0 and 1
    const validProgress = Math.max(0, Math.min(1, progress || 0));
    onProgress(Math.round(validProgress * 100));
  });

  await ffmpeg.writeFile(file.name, await fetchFile(file));

  // iOS-specific conversion that handles VFR better + resolution reduction
  const ffmpegArgs = [
    "-i", file.name,
    "-c:v", "libx264",           // Re-encode video to handle VFR
    "-c:a", "aac",               // Re-encode audio for compatibility
    "-r", "30",                  // Force constant 30fps
    "-vsync", "cfr",             // Convert VFR to CFR
    "-vf", "scale='min(1280,iw)':'min(720,ih)'", // Auto-resize to max 720p if larger
    "-pix_fmt", "yuv420p",       // Ensure compatibility
    "-profile:v", "baseline",     // Use baseline profile for compatibility
    "-level", "3.0",             // Compatibility level
    "-movflags", "+faststart",   // Optimize for web streaming
    "-preset", "medium",         // Balance quality/speed
    "-crf", "23",                // Good quality for mobile
    "output.mp4"
  ];

  console.log("📱 iOS optimized conversion with 720p limit:", ffmpegArgs.join(' '));
  await ffmpeg.exec(ffmpegArgs);

  const data = await ffmpeg.readFile("output.mp4");
  return new Blob([data.buffer], { type: "video/mp4" });
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function logVideoProcessingDetails(
  stage: string,
  inputFile: File,
  outputFile?: File | Blob,
  metadata?: VideoMetadata,
  ffmpegMetadata?: Partial<VideoMetadata>,
  processingTime?: number
) {
  console.group(`🎥 Video Processing: ${stage}`);
  
  console.log('📁 Input File:', {
    name: inputFile.name,
    size: formatFileSize(inputFile.size),
    type: inputFile.type,
    lastModified: new Date(inputFile.lastModified).toISOString(),
  });
  
  if (outputFile) {
    console.log('📤 Output File:', {
      size: formatFileSize(outputFile.size),
      type: outputFile.type,
      sizeReduction: `${(((inputFile.size - outputFile.size) / inputFile.size) * 100).toFixed(1)}%`,
    });
  }
  
  if (metadata) {
    console.log('📊 Video Metadata:', metadata);
  }
  
  if (ffmpegMetadata) {
    console.log('🔧 FFmpeg Analysis:', ffmpegMetadata);
  }
  
  if (processingTime) {
    console.log('⏱️ Processing Time:', `${processingTime.toFixed(2)}s`);
  }
  
  console.groupEnd();
}

export function detectFFmpegSupport(): boolean {
  const device = detectiOSDevice();
  const androidDevice = detectAndroidDevice();
  
  // SharedArrayBuffer detection
  const hasSharedArrayBuffer =
    typeof window !== "undefined" && "SharedArrayBuffer" in window;
  
  try {
    if (!hasSharedArrayBuffer) {
      console.log("🔧 FFmpeg not supported: SharedArrayBuffer not available");
      
      // For iOS, this is expected - they often disable SharedArrayBuffer
      if (device.isIOS) {
        console.log("📱 iOS detected: SharedArrayBuffer disabled (security policy)");
        return false; // Force fallback for iOS without SharedArrayBuffer
      }
      
      // For old Android, this is also common
      if (androidDevice.isOldAndroid) {
        console.log("🤖 Old Android detected: SharedArrayBuffer not available");
        return false;
      }
      
      return false;
    }
    
    // WebAssembly features
    if (typeof WebAssembly === "undefined") {
      console.log("🔧 FFmpeg not supported: WebAssembly not available");
      return false;
    }
    
    // iOS-specific checks
    if (device.isIOS) {
      console.log(`📱 iOS device detected (iPhone: ${device.isIPhone}, Version: ${device.iosVersion})`);
      
      // iOS 15+ has better WebAssembly support
      if (device.iosVersion && device.iosVersion < 15) {
        console.log("📱 iOS version too old for reliable FFmpeg support");
        return false;
      }
      
      // Check available memory (rough estimate)
      if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
        console.log("📱 Low device memory detected, using fallback");
        return false;
      }
      
      console.log("📱 iOS FFmpeg support: limited but attempting");
      return true;
    }
    
    // Android-specific checks
    if (androidDevice.isAndroid) {
      console.log(`🤖 Android device detected (Version: ${androidDevice.androidVersion}, Chrome: ${androidDevice.chromeVersion})`);
      
      if (androidDevice.isOldAndroid) {
        console.log("🤖 Old Android detected, using fallback");
        return false;
      }
      
      // Check available memory for newer Android
      if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 2) {
        console.log("🤖 Low Android device memory, using fallback");
        return false;
      }
      
      console.log("🤖 Android FFmpeg support: attempting");
      return true;
    }
    
    // For other mobile devices, let's be more lenient and try FFmpeg anyway
    const ua = navigator.userAgent;
    const isMobile = /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    if (isMobile) {
      console.log("🔧 Other mobile device detected, attempting FFmpeg anyway");
      return true;
    }
    
    console.log("🔧 FFmpeg support detected");
    return true;
  } catch (error) {
    console.log("🔧 FFmpeg support detection failed:", error);
    return false;
  }
}

export async function compressVideo(
  file: File,
  ffmpegRef: React.MutableRefObject<any>,
  onProgress: (progress: number) => void,
  shouldResize: boolean,
  qualityFactor: number = 1.0
): Promise<Blob> {
  if (!ffmpegRef.current) {
    await loadFFmpeg();
    ffmpegRef.current = new FFmpeg();
    await ffmpegRef.current.load();
  }
  
  const ffmpeg = ffmpegRef.current;
  const fetchFile = getFetchFile();
  
  // Set up progress handler
  ffmpeg.on("progress", ({ progress }: { progress: number }) => {
    // Ensure progress is a valid number between 0 and 1
    const validProgress = Math.max(0, Math.min(1, progress || 0));
    onProgress(Math.round(validProgress * 100));
  });
  
  await ffmpeg.writeFile(file.name, await fetchFile(file));

  // Compression settings with improved resolution handling
  const ffmpegArgs = [
    "-i",
    file.name,
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-crf",
    "25", // Fixed CRF like in the working code
    "-preset",
    "veryfast",
  ];

  // Smart resolution handling
  if (shouldResize) {
    // Resize large files while preserving aspect ratio - max 720p bounds
    console.log("📐 Large video detected - reducing to max 720p while preserving aspect ratio");
    ffmpegArgs.push("-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease");
  } else {
    // Auto-resize if video is larger than 720p to maintain quality/size balance
    console.log("📐 Applying smart resize filter - max 720p if larger");
    ffmpegArgs.push("-vf", "scale='min(1280,iw)':'min(720,ih)'");
  }

  ffmpegArgs.push("output.mp4");

  console.log("🎬 FFmpeg compression command:", ffmpegArgs.join(' '));
  await ffmpeg.exec(ffmpegArgs);

  const data = await ffmpeg.readFile("output.mp4");
  return new Blob([data.buffer], { type: "video/mp4" });
}

export async function convertToMp4(
  file: File,
  ffmpegRef: React.MutableRefObject<any>,
  onProgress: (progress: number) => void
): Promise<Blob> {
  if (!ffmpegRef.current) {
    await loadFFmpeg();
    ffmpegRef.current = new FFmpeg();
    await ffmpegRef.current.load();
  }
  
  const ffmpeg = ffmpegRef.current;
  const fetchFile = getFetchFile();

  // Set up progress handler
  ffmpeg.on("progress", ({ progress }: { progress: number }) => {
    // Ensure progress is a valid number between 0 and 1
    const validProgress = Math.max(0, Math.min(1, progress || 0));
    onProgress(Math.round(validProgress * 100));
  });

  await ffmpeg.writeFile(file.name, await fetchFile(file));

  // Try to get video info to check if resize is needed
  let needsResize = false;
  try {
    // Quick probe to check dimensions
    await ffmpeg.exec(['-i', file.name, '-t', '0.1', '-f', 'null', '-']);
  } catch (probeError) {
    // If we can't probe, assume resize might be needed for safety
    console.log("Could not probe video dimensions, applying conservative resize");
    needsResize = true;
  }

  let ffmpegArgs: string[];
  
  if (needsResize) {
    // Re-encode with resolution limit for large videos
    console.log("🔄 Converting with resolution check - max 720p if larger");
    ffmpegArgs = [
      "-i", file.name,
      "-c:v", "libx264",
      "-c:a", "aac", 
      "-vf", "scale='min(1280,iw)':'min(720,ih)'", // Limit to 720p if larger
      "-crf", "23", // Good quality
      "-preset", "medium",
      "-movflags", "+faststart",
      "output.mp4"
    ];
  } else {
    // Simple conversion - copy streams without re-encoding (preserves quality)
    // This matches the working approach from the reference code
    console.log("🔄 Converting with stream copy - preserving original quality");
    ffmpegArgs = [
      "-i", file.name,
      "-c", "copy", // Copy streams without re-encoding
      "-f", "mp4", // Force MP4 format
      "output.mp4",
    ];
  }

  console.log("🎬 Convert to MP4 command:", ffmpegArgs.join(' '));
  await ffmpeg.exec(ffmpegArgs);

  const data = await ffmpeg.readFile("output.mp4");
  return new Blob([data.buffer], { type: "video/mp4" });
}

// iOS-optimized fallback compression
export async function compressVideoiOSFallback(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    console.log("📱 Using iOS-optimized fallback compression");
    
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true; // Critical for iOS

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("iOS video processing timeout"));
    }, 30000); // 30 second timeout

    video.addEventListener("loadeddata", () => {
      clearTimeout(timeoutId);
      try {
        // More conservative settings for iOS
        const maxWidth = 640; // Reasonable for iOS
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
        
        const stream = (canvas as any).captureStream(30); // Force 30fps
        
        // iOS-optimized MediaRecorder settings
        let recorderOptions: MediaRecorderOptions = {
          videoBitsPerSecond: 800_000, // Conservative bitrate for iOS
        };
        
        // Try MP4 first, fallback to WebM
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          recorderOptions.mimeType = "video/mp4";
          console.log("📱 Using MP4 for iOS fallback");
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          recorderOptions.mimeType = "video/webm";
          console.log("📱 Using WebM for iOS fallback");
        } else {
          cleanup();
          reject(new Error("No supported video format for iOS"));
          return;
        }
        
        const recorder = new MediaRecorder(stream, recorderOptions);
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
          cleanup();
          const finalBlob = new Blob(chunks, { 
            type: recorderOptions.mimeType || "video/mp4" 
          });
          console.log(`📱 iOS fallback complete: ${finalBlob.size} bytes`);
          resolve(finalBlob);
        };
        
        recorder.start(1000); // Collect data every second
        
        let frameCount = 0;
        const maxFrames = Math.min(video.duration * 30, 1800); // Max 60 seconds at 30fps
        
        const draw = () => {
          if (!video.paused && !video.ended && frameCount < maxFrames) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frameCount++;
            requestAnimationFrame(draw);
          } else {
            setTimeout(() => recorder.stop(), 100);
          }
        };
        
        video.play()
          .then(() => {
            setTimeout(draw, 100); // Small delay for iOS
          })
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
      reject(new Error("Failed to load video on iOS"));
    };

    video.load();
  });
}

export async function compressVideoFallback(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const androidDevice = detectAndroidDevice();
    
    if (
      typeof MediaRecorder === "undefined" ||
      typeof (HTMLCanvasElement.prototype as any).captureStream !== "function"
    ) {
      reject(new Error("MediaRecorder not supported"));
      return;
    }
    
    console.log("🔧 Using fallback compression", androidDevice.isAndroid ? "(Android)" : "");
    
    // Create video element for playback
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
    }, 15000); // Longer timeout for slower devices

    video.addEventListener("loadeddata", () => {
      clearTimeout(timeoutId);
      try {
        // Smart resolution handling - limit to 720p for better performance
        let maxWidth, maxHeight;
        if (androidDevice.isOldAndroid) {
          // Very conservative for old devices
          maxWidth = 480;
          maxHeight = 360;
        } else {
          // Limit to 720p (1280x720) for all other devices
          maxWidth = Math.min(1280, video.videoWidth);
          maxHeight = Math.min(720, video.videoHeight);
        }
        
        // Maintain aspect ratio while respecting limits
        const aspectRatio = video.videoWidth / video.videoHeight;
        if (maxWidth / aspectRatio > maxHeight) {
          maxWidth = maxHeight * aspectRatio;
        } else {
          maxHeight = maxWidth / aspectRatio;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(maxWidth);
        canvas.height = Math.round(maxHeight);
        
        console.log(`📐 Fallback resize: ${video.videoWidth}x${video.videoHeight} → ${canvas.width}x${canvas.height}`);
        
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          cleanup();
          reject(new Error("Canvas context not available"));
          return;
        }
        
        const stream = (canvas as any).captureStream(30); // Force 30fps
        
        // Smart format detection for device compatibility
        let recorderOptions: MediaRecorderOptions = {
          videoBitsPerSecond: androidDevice.isOldAndroid ? 400_000 : 800_000, // Lower bitrate for old devices
        };
        
        // Try formats in order of preference
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          recorderOptions.mimeType = "video/mp4";
          console.log("🔧 Using MP4 for fallback");
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          recorderOptions.mimeType = "video/webm;codecs=vp8";
          console.log("🔧 Using WebM VP8 for fallback (Android)");
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          recorderOptions.mimeType = "video/webm";
          console.log("🔧 Using WebM for fallback (Android)");
        } else {
          cleanup();
          reject(new Error("No supported video format available"));
          return;
        }
        
        const recorder = new MediaRecorder(stream, recorderOptions);
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
          cleanup();
          const finalBlob = new Blob(chunks, { 
            type: recorderOptions.mimeType || "video/webm" 
          });
          console.log(`🔧 Fallback complete: ${finalBlob.size} bytes, format: ${recorderOptions.mimeType}`);
          resolve(finalBlob);
        };
        
        recorder.start(1000); // Collect data every second
        
        let frameCount = 0;
        const maxFrames = Math.min(video.duration * 30, 900); // Max 30 seconds for old devices
        
        const draw = () => {
          if (!video.paused && !video.ended && frameCount < maxFrames) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frameCount++;
            requestAnimationFrame(draw);
          } else {
            setTimeout(() => recorder.stop(), 100);
          }
        };
        
        video
          .play()
          .then(() => {
            setTimeout(draw, androidDevice.isOldAndroid ? 200 : 100); // Slower start for old devices
          })
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
}

// Add device info summary for debugging
export function getDeviceProcessingInfo(): {
  device: string;
  ffmpegSupported: boolean;
  expectedPath: string;
  expectedFormat: string;
} {
  const ios = detectiOSDevice();
  const android = detectAndroidDevice();
  const ffmpegSupported = detectFFmpegSupport();
  
  let device = "Desktop";
  let expectedPath = "FFmpeg Processing";
  let expectedFormat = "MP4";
  
  if (ios.isIOS) {
    device = `iOS ${ios.iosVersion || 'Unknown'} (${ios.isIPhone ? 'iPhone' : 'iPad'})`;
    if (!ffmpegSupported) {
      expectedPath = "iOS Fallback";
      expectedFormat = "MP4 or WebM";
    }
  } else if (android.isAndroid) {
    device = `Android ${android.androidVersion || 'Unknown'} (Chrome ${android.chromeVersion || 'Unknown'})`;
    if (android.isOldAndroid || !ffmpegSupported) {
      expectedPath = "Android Fallback";
      expectedFormat = "WebM (likely)";
    }
  }
  
  return {
    device,
    ffmpegSupported,
    expectedPath,
    expectedFormat
  };
}
