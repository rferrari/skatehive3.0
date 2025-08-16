/**
 * Video thumbnail generation utilities
 */

import React from 'react';
import { loadFFmpeg, getFetchFile } from './videoProcessing';

export async function generateThumbnailWithCanvas(
  file: File
): Promise<string | null> {
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";

    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    // Wait for video metadata with timeout
    await Promise.race([
      new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
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
        video.load();
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject("Video metadata timeout"), 10000)
      ),
    ]);

    // Seek to a good thumbnail position (10% into video, max 5 seconds)
    const thumbnailTime = Math.min(Math.max(video.duration * 0.1, 1), 5);
    video.currentTime = thumbnailTime;

    // Wait for seek to complete
    await Promise.race([
      new Promise((resolve) => {
        video.onseeked = () => resolve(true);
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

    // Convert to blob
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

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Canvas thumbnail generation failed:", error);
    return null;
  }
}

export async function generateThumbnailWithFFmpeg(
  file: File,
  ffmpegRef: React.MutableRefObject<any>
): Promise<string | null> {
  try {
    if (!ffmpegRef.current) {
      await loadFFmpeg();
      ffmpegRef.current = new (await import("@ffmpeg/ffmpeg")).FFmpeg();
      await ffmpegRef.current.load();
    }
    
    const ffmpeg = ffmpegRef.current;
    const fetchFile = getFetchFile();

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
      "ultrafast",
      "thumbnail.webp",
    ]);

    const thumbnailData = await ffmpeg.readFile("thumbnail.webp");
    const thumbnailBlob = new Blob([thumbnailData.buffer], {
      type: "image/webp",
    });

    // Cleanup
    try {
      await ffmpeg.deleteFile("input_thumb.mp4");
      await ffmpeg.deleteFile("thumbnail.webp");
    } catch {}

    return URL.createObjectURL(thumbnailBlob);
  } catch (error) {
    console.error("FFmpeg thumbnail generation failed:", error);
    return null;
  }
}

export async function uploadThumbnail(
  thumbnailBlob: Blob,
  username?: string
): Promise<string | null> {
  try {
    const thumbnailFormData = new FormData();
    thumbnailFormData.append("file", thumbnailBlob, "thumbnail.webp");
    if (username) thumbnailFormData.append("creator", username);

    const thumbnailResponse = await fetch("/api/pinata", {
      method: "POST",
      body: thumbnailFormData,
    });

    if (!thumbnailResponse.ok) {
      throw new Error("Failed to upload thumbnail");
    }

    const thumbnailResult = await thumbnailResponse.json();
    return `https://ipfs.skatehive.app/ipfs/${thumbnailResult.IpfsHash}`;
  } catch (error) {
    console.error("Thumbnail upload failed:", error);
    return null;
  }
}

export async function generateThumbnail(
  file: File,
  ffmpegRef: React.MutableRefObject<any>,
  username?: string,
  fallback: boolean = false
): Promise<string | null> {
  // Always try Canvas method first for speed
  if (!fallback) {
    const canvasThumbnailUrl = await generateThumbnailWithCanvas(file);
    if (canvasThumbnailUrl) {
      // Convert to blob and upload
      try {
        const blob = await fetch(canvasThumbnailUrl).then(res => res.blob());
        const uploadedUrl = await uploadThumbnail(blob, username);
        URL.revokeObjectURL(canvasThumbnailUrl);
        return uploadedUrl;
      } catch (error) {
        console.error("Failed to upload canvas thumbnail:", error);
        URL.revokeObjectURL(canvasThumbnailUrl);
      }
    }
  }

  // Fallback to FFmpeg for files < 50MB
  if (file.size < 50 * 1024 * 1024) {
    const ffmpegThumbnailUrl = await generateThumbnailWithFFmpeg(file, ffmpegRef);
    if (ffmpegThumbnailUrl) {
      try {
        const blob = await fetch(ffmpegThumbnailUrl).then(res => res.blob());
        const uploadedUrl = await uploadThumbnail(blob, username);
        URL.revokeObjectURL(ffmpegThumbnailUrl);
        return uploadedUrl;
      } catch (error) {
        console.error("Failed to upload FFmpeg thumbnail:", error);
        URL.revokeObjectURL(ffmpegThumbnailUrl);
      }
    }
  }

  return null;
}
