"use client";

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { isMP4, validateVideo, uploadToIPFS } from "@/lib/utils/videoUpload";
import { processVideoOnServer } from "@/lib/utils/videoProcessing";

export interface VideoUploaderProps {
  onUpload: (url: string | null) => void;
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

        // 2. Check if MP4 - direct upload
        if (isMP4(file)) {
          const result = await uploadToIPFS(file, username);

          if (result.success && result.url) {
            onUpload(result.url);
          } else {
            throw new Error(result.error || "Upload failed");
          }
          return;
        }

        // 3. Non-MP4 - process on server
        const result = await processVideoOnServer(file, username);

        if (result.success && result.url) {
          onUpload(result.url);
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
