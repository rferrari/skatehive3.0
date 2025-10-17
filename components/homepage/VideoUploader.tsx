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
} from "@/lib/utils/videoProcessing";
import { handleVideoUpload } from "@/lib/utils/videoUploadUtils";
import { useHiveUser } from "@/contexts/UserContext";
import useHivePower from "@/hooks/useHivePower";

export interface VideoUploaderProps {
  onUpload: (result: { url?: string; hash?: string } | null) => void;
  username?: string;
  onUploadStart?: () => void;
  onUploadFinish?: () => void;
  onError?: (error: string) => void;
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
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Get user context for enhanced logging
    const { hiveUser } = useHiveUser();
    const { hivePower } = useHivePower(username);

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
      onUploadStart?.();

      try {
        // 1. Validate file
        const validation = validateVideo(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

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

          // For MP4 files, use direct IPFS upload with thumbnail support
          let result;
          if (existingThumbnail) {
            // Use handleVideoUpload if we have a thumbnail to preserve
            result = await handleVideoUpload(
              file,
              username,
              existingThumbnail,
              undefined, // onProgress callback
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
              onUpload({
                url: result.url,
                hash: result.IpfsHash,
              });
            } else {
              throw new Error(result.error || "Upload failed");
            }
          } else {
            // Use original uploadToIPFS for MP4 files without thumbnails
            const uploadResult = await uploadToIPFS(
              file,
              username,
              enhancedOptions
            );

            if (uploadResult.success && uploadResult.url) {
              onUpload({
                url: uploadResult.url,
                hash: uploadResult.hash,
              });
            } else {
              throw new Error(uploadResult.error || "Upload failed");
            }
          }
          return;
        }

        // 5. Non-MP4 files - process on server with enhanced options
        console.log("🔄 Non-MP4 file detected - server transcoding required");
        const processingOptions: EnhancedProcessingOptions = {
          userHP: enhancedOptions.userHP,
          platform: enhancedOptions.platform,
          viewport: enhancedOptions.viewport,
          deviceInfo: enhancedOptions.deviceInfo,
          browserInfo: enhancedOptions.browserInfo,
          connectionType: enhancedOptions.connectionType,
        };

        // For non-MP4 files, use server processing
        const result = await processVideoOnServer(
          file,
          username,
          processingOptions
        );

        if (result.success && result.url) {
          onUpload({
            url: result.url,
            hash: result.hash,
          });
        } else {
          throw new Error(result.error || "Server processing failed");
        }
      } catch (error) {
        // Provide user-friendly error messages
        let userMessage = "Video processing failed. ";
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch")) {
            userMessage +=
              "Video processing servers are currently unavailable. Please try again later or use an MP4 file.";
          } else if (error.message.includes("CORS")) {
            userMessage += "Server connection blocked. Please try again later.";
          } else if (error.message.includes("timeout")) {
            userMessage +=
              "Processing took too long (your file may be too large). Try a smaller file or use MP4 format for faster upload.";
          } else {
            userMessage += error.message;
          }
        } else {
          userMessage +=
            "Please try again or use an MP4 file for direct upload.";
        }

        onError?.(userMessage);
        onUpload(null);
      } finally {
        setIsProcessing(false);
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

    return (
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    );
  }
);

VideoUploader.displayName = "VideoUploader";

export default VideoUploader;
