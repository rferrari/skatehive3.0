"use client";

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

import {
  isMP4,
  validateVideo,
  uploadToIPFS,
  EnhancedUploadOptions,
} from "@/lib/utils/videoUpload";
import {
  processVideoOnServer,
  EnhancedProcessingOptions,
  ProcessingResult,
} from "@/lib/utils/videoProcessing";
import { handleVideoUpload } from "@/lib/utils/videoUploadUtils";
import { useHiveUser } from "@/contexts/UserContext";
import useHivePower from "@/hooks/useHivePower";
import {
  VideoUploadTerminal,
  useUploadTerminal,
  TerminalLine,
} from "./VideoUploadTerminal";

// Enable debug mode via localStorage or environment
const DEBUG_MODE = typeof window !== 'undefined' && (
  localStorage.getItem('SKATEHIVE_DEBUG') === 'true' ||
  process.env.NODE_ENV === 'development'
);

/**
 * Error details for debugging and display
 */
interface ErrorDetails {
  errorType?: ProcessingResult['errorType'] | 'ipfs_upload' | 'validation';
  statusCode?: number;
  failedServer?: ProcessingResult['failedServer'] | 'pinata';
  rawError: string;
  uploadType: 'mp4_direct' | 'transcoding';
  fileInfo: {
    name: string;
    size: string;
    type: string;
  };
}

/**
 * Generate funny, informative error messages based on the failure type
 */
function generateFunnyErrorMessage(errorDetails: ErrorDetails): string {
  const { errorType, statusCode, failedServer, rawError, uploadType, fileInfo } = errorDetails;

  // Server-specific roasts
  const serverRoasts: Record<string, string[]> = {
    oracle: [
      "🔮 The Oracle has spoken... and it said 'nope'.",
      "🔮 Oracle decided to take a cosmic nap.",
      "🔮 Oracle went full Morpheus and unplugged itself.",
    ],
    macmini: [
      "🍎 Vlad's Mac Mini is being dramatic again. Go mock him on Discord!",
      "🍎 The M4 chip decided it needed a coffee break.",
      "🍎 Mac Mini said 'I'm a premium device, I don't do THIS.'",
    ],
    pi: [
      "🫐 The Raspberry Pi tried its best... but it's still a tiny computer.",
      "🫐 Pi is probably overheating in Vlad's closet.",
      "🫐 Pi said 'I'm not THAT kind of dessert!'",
    ],
    pinata: [
      "📌 Pinata IPFS said 'no piñata for you today!'",
      "📌 The IPFS upload service is taking a siesta.",
      "📌 Pinata went to find better candy. 🍬",
    ],
    all: [
      "💀 ALL THREE SERVERS FAILED! This is fine... 🔥🐕🔥",
      "🔥 Mac Mini, Oracle, AND Pi all crashed! Time to touch grass.",
      "☠️ Complete server apocalypse! Even the skateboards are crying.",
      "🎭 The servers had a meeting and decided to collectively bail.",
      "🪦 RIP your upload. Mac Mini, Oracle, and Pi all said 'not today fam'.",
      "🤡 Three servers walk into a bar... and none of them could transcode your video.",
      "🛹 Your video was so gnarly, it broke ALL our servers. Respect.",
      "💩 Well, that escalated quickly. All servers went 💨",
    ]
  };

  // Get status code explanation
  const getStatusExplanation = (code?: number): string => {
    if (!code) return "";
    switch (code) {
      case 400: return "Bad Request - the video format might be corrupted";
      case 403: return "Forbidden - server rejected the upload (auth or format issue)";
      case 404: return "Not Found - endpoint is missing";
      case 413: return "File Too Large - your video is too thicc 🍑";
      case 500: return "Server Error - something broke on our end";
      case 502: return "Bad Gateway - server is having network issues";
      case 503: return "Service Unavailable - server is overloaded or down";
      case 504: return "Gateway Timeout - server took too long to respond";
      default: return `HTTP ${code}`;
    }
  };

  // Error type explanations with actionable advice
  const getActionableAdvice = (): string => {
    if (uploadType === 'mp4_direct') {
      if (statusCode === 500) {
        return "💡 Try: The IPFS upload service had an issue. Try again in a moment, or try a smaller file.";
      }
      if (statusCode === 413) {
        return "💡 Try: Your MP4 is too large. Compress it or trim it down.";
      }
      return "💡 Try: Wait a moment and retry. If it keeps failing, the IPFS service might be down.";
    }
    
    if (statusCode === 403) {
      return "💡 Try: Use an MP4 file, or check if the video is corrupted.";
    }
    if (statusCode === 413 || errorType === 'file_too_large') {
      return "💡 Try: Compress your video or use a shorter clip (under 100MB works best).";
    }
    if (errorType === 'timeout') {
      return "💡 Try: Use a smaller file, check your internet, or try again in a few minutes.";
    }
    if (errorType === 'connection' || rawError.includes('Failed to fetch')) {
      return "💡 Try: Check your internet connection and try again.";
    }
    if (errorType === 'server_error' || (statusCode && statusCode >= 500)) {
      return "💡 Try: Wait a minute and try again. If it keeps failing, yell at Vlad on Discord.";
    }
    return "💡 Try: Use an MP4 file for direct upload (bypasses transcoding servers).";
  };

  // Pick a random roast for the failed server
  const getServerRoast = (): string => {
    const server = failedServer || 'all';
    const roasts = serverRoasts[server] || serverRoasts.all;
    return roasts[Math.floor(Math.random() * roasts.length)];
  };

  // Build server chain status (Order: Mac Mini → Oracle → Pi)
  const getServerChainStatus = (): string => {
    if (uploadType === 'mp4_direct') {
      return "📌 Pinata IPFS → ❌ (direct MP4 upload)";
    }
    if (failedServer === 'all') {
      return "🍎 Mac Mini → ❌ | 🔮 Oracle → ❌ | 🫐 Pi → ❌";
    }
    if (failedServer === 'macmini') {
      return "🍎 Mac Mini → ❌ (stopped here - should have tried Oracle & Pi!)";
    }
    if (failedServer === 'oracle') {
      return "🍎 Mac Mini → ❌ | 🔮 Oracle → ❌ (stopped here - should have tried Pi!)";
    }
    if (failedServer === 'pi') {
      return "🍎 Mac Mini → ❌ | 🔮 Oracle → ❌ | 🫐 Pi → ❌";
    }
    return `Upload type: ${uploadType}, Server: ${failedServer || 'unknown'}`;
  };

  // Build the final message with all the details
  const serverRoast = getServerRoast();
  const serverChain = getServerChainStatus();
  const statusExplanation = statusCode ? getStatusExplanation(statusCode) : null;
  const advice = getActionableAdvice();
  
  // Format: Roast + Server Chain + Error Details + File Info + Advice
  let message = serverRoast;
  message += `\n\n📡 Servers tried:\n${serverChain}`;
  
  if (statusCode) {
    message += `\n\n❌ Error: ${statusExplanation}`;
  } else if (errorType) {
    message += `\n\n❌ Error type: ${errorType}`;
  }
  
  // Add file info
  message += `\n📁 File: ${fileInfo.name} (${fileInfo.size}, ${fileInfo.type})`;
  
  // Add raw error if it has useful info
  if (rawError && !rawError.includes('Server processing failed')) {
    const shortError = rawError.length > 80 ? rawError.substring(0, 80) + '...' : rawError;
    message += `\n📝 Details: ${shortError}`;
  }
  
  message += `\n\n${advice}`;
  
  return message;
}

/**
 * Extract status code from error message like "Upload failed: 500"
 */
function extractStatusCode(errorMessage: string): number | undefined {
  const match = errorMessage.match(/(\d{3})/);
  return match ? parseInt(match[1], 10) : undefined;
}

export interface VideoUploaderProps {
  onUpload: (result: { url?: string; hash?: string } | null) => void;
  username?: string;
  onUploadStart?: () => void;
  onUploadFinish?: () => void;
  onError?: (error: string) => void;
  /** Render prop for terminal - allows parent to position it */
  renderTerminal?: (terminal: React.ReactNode) => React.ReactNode;
}

export interface VideoUploaderRef {
  trigger: () => void;
  handleFile: (file: File) => void;
}

const VideoUploader = forwardRef<VideoUploaderRef, VideoUploaderProps>(
  (
    {
      onUpload,
      username = "anonymous",
      onUploadStart,
      onUploadFinish,
      onError,
      renderTerminal,
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    
    // Terminal state for showing upload progress
    const terminal = useUploadTerminal();

    // Get user context for enhanced logging
    const { hiveUser } = useHiveUser();
    const { hivePower } = useHivePower(username);
    
    // Helper to format file size
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Enhanced device detection function
    const getDetailedDeviceInfo = () => {
      const ua = navigator.userAgent;
      const platform = navigator.platform;

      // Detect device type
      let deviceType = "desktop";
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        deviceType = "mobile";
        if (/iPad/i.test(ua)) deviceType = "tablet";
      }

      // Detect OS
      let os = "unknown";
      if (/Mac/i.test(platform)) os = "macOS";
      else if (/Win/i.test(platform)) os = "Windows";
      else if (/Linux/i.test(platform)) os = "Linux";
      else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
      else if (/Android/i.test(ua)) os = "Android";

      // Detect browser
      let browser = "unknown";
      if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = "Chrome";
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
      else if (/Firefox/i.test(ua)) browser = "Firefox";
      else if (/Edge|Edg/i.test(ua)) browser = "Edge";

      return {
        platform: deviceType,
        deviceInfo: `${deviceType}/${os}/${browser}`,
        browserInfo: `${browser} on ${os}`,
        viewport: `${window.screen.width}x${window.screen.height}`,
        connectionType:
          (navigator as any).connection?.effectiveType || "unknown",
      };
    };

    const processFile = async (file: File) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setCurrentFile(file);
      onUploadStart?.();
      
      // Initialize terminal
      terminal.clear();
      terminal.show();
      terminal.addLine(`Starting upload: ${file.name}`, "info");
      terminal.addLine(`File size: ${formatFileSize(file.size)}, Type: ${file.type}`, "info");

      // Track error details for better messaging
      let errorDetails: ErrorDetails | null = null;

      try {
        // 1. Validate file
        terminal.addLine("Validating video file...", "info");
        const validation = validateVideo(file);
        if (!validation.valid) {
          errorDetails = {
            errorType: 'validation',
            rawError: validation.error || 'Validation failed',
            uploadType: 'mp4_direct',
            fileInfo: { name: file.name, size: formatFileSize(file.size), type: file.type }
          };
          throw new Error(validation.error);
        }
        terminal.addLine("✓ Video validated successfully", "success");

        // 2. Prepare enhanced options with device and user information
        const deviceData = getDetailedDeviceInfo();

        const enhancedOptions: EnhancedUploadOptions = {
          userHP: hivePower || 0,
          platform: deviceData.platform,
          viewport: deviceData.viewport,
          deviceInfo: deviceData.deviceInfo,
          browserInfo: deviceData.browserInfo,
          connectionType: deviceData.connectionType,
        };

        console.log("📤 Video upload started:", file.name);

        // 3. Check if file already has a thumbnail from VideoTrimModal
        const existingThumbnail = (file as any).thumbnailUrl;
        console.log("🖼️ Existing thumbnail:", existingThumbnail);

        // 4. Handle MP4 files - direct upload with enhanced options
        if (isMP4(file)) {
          console.log("📹 MP4 file detected - direct upload");
          terminal.addLine("MP4 detected → Direct IPFS upload (no transcoding needed)", "info");
          terminal.addLine("Uploading to Pinata IPFS...", "server", "pinata" as any, "trying");

          // For MP4 files, use direct IPFS upload with thumbnail support
          try {
            if (existingThumbnail) {
              // Use handleVideoUpload if we have a thumbnail to preserve
              const result = await handleVideoUpload(
                file,
                username,
                existingThumbnail,
                (progress) => terminal.updateProgress(progress, 'uploading'), // Real progress callback
                hivePower || 0,
                {
                  platform: deviceData.platform,
                  deviceInfo: deviceData.deviceInfo,
                  browserInfo: deviceData.browserInfo,
                  viewport: deviceData.viewport,
                  connectionType: deviceData.connectionType,
                }
              );
              
              if (result.success && result.url) {
                terminal.updateProgress(100); // Upload complete!
                terminal.addLine("✓ IPFS upload successful!", "success");
                terminal.addLine(`CID: ${result.IpfsHash || 'unknown'}`, "info");
                terminal.addLine("🎉 Video ready! Close this terminal when ready.", "success");
                
                onUpload({
                  url: result.url,
                  hash: result.IpfsHash,
                });
                return;
              } else {
                throw new Error(result.error || "Upload failed");
              }
            } else {
              // Use original uploadToIPFS for MP4 files without thumbnails
              const uploadResult = await uploadToIPFS(
                file,
                username,
                enhancedOptions,
                (progress) => terminal.updateProgress(progress, 'uploading') // Real progress!
              );

              if (uploadResult.success && uploadResult.url) {
                terminal.updateProgress(100, 'complete'); // Upload complete!
                terminal.addLine("✓ IPFS upload successful!", "success");
                terminal.addLine(`CID: ${uploadResult.hash || 'unknown'}`, "info");
                terminal.addLine("🎉 Video ready! Close this terminal when ready.", "success");
                
                onUpload({
                  url: uploadResult.url,
                  hash: uploadResult.hash,
                });
                return;
              } else {
                throw new Error(uploadResult.error || "Upload failed");
              }
            }
          } catch (uploadError) {
            const errorMsg = uploadError instanceof Error ? uploadError.message : String(uploadError);
            terminal.addLine(`✗ Pinata IPFS failed: ${errorMsg}`, "error");
            
            errorDetails = {
              errorType: 'ipfs_upload',
              statusCode: extractStatusCode(errorMsg),
              failedServer: 'pinata',
              rawError: errorMsg,
              uploadType: 'mp4_direct',
              fileInfo: { name: file.name, size: formatFileSize(file.size), type: file.type }
            };
            throw uploadError;
          }
        }

        // 5. Non-MP4 files - process on server with enhanced options
        console.log("🔄 Non-MP4 file detected - server transcoding required");
        terminal.addLine(`Non-MP4 file (${file.type}) → Server transcoding required`, "info");
        terminal.addLine("Starting 3-server fallback chain...", "info");
        
        terminal.updateProgress(5, 'receiving');
        
        const processingOptions: EnhancedProcessingOptions = {
          userHP: enhancedOptions.userHP,
          platform: enhancedOptions.platform,
          viewport: enhancedOptions.viewport,
          deviceInfo: enhancedOptions.deviceInfo,
          browserInfo: enhancedOptions.browserInfo,
          connectionType: enhancedOptions.connectionType,
          // Real-time progress from SSE!
          onProgress: (progress, stage) => {
            terminal.updateProgress(progress, stage);
            console.log(`📊 Server progress: ${progress}% - ${stage}`);
          }
        };

        // Show server attempts in terminal
        terminal.addLine("🔮 Trying Oracle (PRIMARY)...", "server", "oracle", "trying");

        // For non-MP4 files, use server processing with streaming progress
        const result = await processVideoOnServer(
          file,
          username,
          processingOptions
        );

        if (result.success && result.url) {
          terminal.updateProgress(100, 'complete'); // Complete!
          // Determine which server succeeded
          terminal.addLine("✓ Transcoding successful!", "success");
          terminal.addLine(`IPFS CID: ${result.hash}`, "info");
          terminal.addLine("🎉 Video ready! Close this terminal when ready.", "success");
          
          onUpload({
            url: result.url,
            hash: result.hash,
          });
        } else {
          // Log which servers failed in terminal
          if (result.failedServer === 'all' || result.failedServer === 'pi') {
            terminal.addLine("✗ Oracle failed", "error", "oracle", "failed");
            terminal.addLine("🍎 Trying Mac Mini (SECONDARY)...", "server", "macmini", "trying");
            terminal.addLine("✗ Mac Mini failed", "error", "macmini", "failed");
            terminal.addLine("🫐 Trying Raspberry Pi (TERTIARY)...", "server", "pi", "trying");
            terminal.addLine("✗ Raspberry Pi failed", "error", "pi", "failed");
          } else if (result.failedServer === 'macmini') {
            terminal.addLine("✗ Oracle failed", "error", "oracle", "failed");
            terminal.addLine("🍎 Trying Mac Mini...", "server", "macmini", "trying");
            terminal.addLine("✗ Mac Mini failed", "error", "macmini", "failed");
          } else if (result.failedServer === 'oracle') {
            terminal.addLine("✗ Oracle failed", "error", "oracle", "failed");
          }
          
          // Create error details for the message
          errorDetails = {
            errorType: result.errorType,
            statusCode: result.statusCode,
            failedServer: result.failedServer,
            rawError: result.error || 'Server processing failed',
            uploadType: 'transcoding',
            fileInfo: { name: file.name, size: formatFileSize(file.size), type: file.type }
          };
          
          throw new Error(result.error || "Server processing failed");
        }
      } catch (error) {
        // Build error details if not already set
        if (!errorDetails) {
          const rawMessage = error instanceof Error ? error.message : String(error);
          const processingError = error as Error & Partial<ProcessingResult>;
          errorDetails = {
            errorType: processingError.errorType || 'unknown',
            statusCode: processingError.statusCode || extractStatusCode(rawMessage),
            failedServer: processingError.failedServer,
            rawError: rawMessage,
            uploadType: isMP4(currentFile!) ? 'mp4_direct' : 'transcoding',
            fileInfo: { 
              name: currentFile?.name || 'unknown', 
              size: currentFile ? formatFileSize(currentFile.size) : 'unknown', 
              type: currentFile?.type || 'unknown' 
            }
          };
        }
        
        terminal.addLine(`❌ Upload failed: ${errorDetails.rawError}`, "error");
        
        // Generate user-friendly message with funny roast
        const userMessage = generateFunnyErrorMessage(errorDetails);
        terminal.addLine("", "info"); // Empty line for spacing
        terminal.addLine(userMessage, "error");
        
        // Set error details for debug panel
        terminal.setError({
          errorType: errorDetails.errorType,
          statusCode: errorDetails.statusCode,
          failedServer: errorDetails.failedServer,
          rawError: errorDetails.rawError
        });
        
        onError?.(userMessage);
        onUpload(null);
      } finally {
        setIsProcessing(false);
        setCurrentFile(null);
        onUploadFinish?.();
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const triggerFileSelect = () => {
      if (!isProcessing && fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    useImperativeHandle(ref, () => ({
      trigger: triggerFileSelect,
      handleFile: processFile,
    }));

    const terminalComponent = (
      <VideoUploadTerminal
        lines={terminal.lines}
        isVisible={terminal.isVisible}
        onClose={() => terminal.hide()}
        debugMode={DEBUG_MODE}
        progress={terminal.progress}
        stage={terminal.stage}
        errorDetails={terminal.errorDetails}
      />
    );

    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        
        {/* Terminal - either use renderTerminal prop or render inline */}
        {renderTerminal ? renderTerminal(terminalComponent) : terminalComponent}
      </>
    );
  }
);

VideoUploader.displayName = "VideoUploader";

// Export the demo panel for testing
export { ErrorDemoPanel } from "./ErrorDemoPanel";

export default VideoUploader;
