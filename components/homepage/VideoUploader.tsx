import React, { useRef, useImperativeHandle, forwardRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface VideoUploaderProps {
  onUpload: (url: string | null) => void;
  isProcessing?: boolean;
  username?: string; // Add username prop for metadata
  onUploadStart?: () => void;
  onUploadFinish?: () => void;
}

export interface VideoUploaderRef {
  trigger: () => void;
  handleFile: (file: File) => void;
}

const VideoUploader = forwardRef<VideoUploaderRef, VideoUploaderProps>(
  ({ onUpload, isProcessing = false, username, onUploadStart, onUploadFinish }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<any>(null);
    const [status, setStatus] = useState<string>("");
    const [compressionProgress, setCompressionProgress] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // Replace hardcoded background and color values with theme variables
    const backgroundMuted = 'var(--chakra-colors-muted, #eee)';
    const backgroundPrimary = 'var(--chakra-colors-primary, #0070f3)';
    const backgroundAccent = 'var(--chakra-colors-accent, #00b894)';

    const compressVideo = async (file: File, shouldResize: boolean): Promise<Blob> => {
      setStatus("Compressing video...");
      setCompressionProgress(0);
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
      }
      const ffmpeg = ffmpegRef.current;
      // Set up progress handler
      ffmpeg.on('progress', ({ progress }: { progress: number }) => {
        setCompressionProgress(Math.round(progress * 100));
      });
      await ffmpeg.writeFile(file.name, await fetchFile(file));

      const ffmpegArgs = [
        "-i", file.name,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-crf", "25",
        "-preset", "veryfast",
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

    const generateThumbnail = async (file: File): Promise<string | null> => {
      try {
        setStatus("Generating thumbnail...");

        if (!ffmpegRef.current) {
          ffmpegRef.current = new FFmpeg();
          await ffmpegRef.current.load();
        }
        const ffmpeg = ffmpegRef.current;

        // Write the original file for thumbnail generation
        await ffmpeg.writeFile("input_thumb.mp4", await fetchFile(file));

        // Generate thumbnail at 2 second mark
        await ffmpeg.exec([
          "-i", "input_thumb.mp4",
          "-ss", "00:00:02",
          "-frames:v", "1",
          "-vf", "scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2",
          "-f", "webp",
          "thumbnail.webp"
        ]);

        const thumbnailData = await ffmpeg.readFile("thumbnail.webp");
        const thumbnailBlob = new Blob([thumbnailData.buffer], { type: "image/webp" });

        // Upload thumbnail to IPFS first
        const thumbnailFormData = new FormData();
        thumbnailFormData.append("file", thumbnailBlob, "thumbnail.webp");
        if (username) {
          thumbnailFormData.append("creator", username);
        }

        const thumbnailResponse = await fetch("/api/pinata", {
          method: "POST",
          body: thumbnailFormData,
        });

        if (!thumbnailResponse.ok) {
          throw new Error("Failed to upload thumbnail");
        }

        const thumbnailResult = await thumbnailResponse.json();
        const thumbnailUrl = `https://ipfs.skatehive.app/ipfs/${thumbnailResult.IpfsHash}`;

        // Clean up FFmpeg files
        try {
          await ffmpeg.deleteFile("input_thumb.mp4");
          await ffmpeg.deleteFile("thumbnail.webp");
        } catch (e) {
          console.warn("Failed to clean up thumbnail files:", e);
        }

        return thumbnailUrl;
      } catch (error) {
        console.error("Thumbnail generation failed:", error);
        return null;
      }
    };

    const uploadWithProgress = (formData: FormData): Promise<any> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/pinata");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(xhr.responseText);
          }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(formData);
      });
    };

    // Extracted video upload logic for direct file handling
    const processVideoFile = async (file: File) => {
      if (!file) {
        setStatus("");
        setCompressionProgress(0);
        setUploadProgress(0);
        console.log("No file selected.");
        if (onUploadFinish) onUploadFinish();
        return;
      }
      if (onUploadStart) onUploadStart();
      try {
        const twelveMB = 12 * 1024 * 1024;
        const shouldResize = file.size > twelveMB;

        setStatus("Converting video...");
        setCompressionProgress(0);
        setUploadProgress(0);

        if (shouldResize) {
          console.log("File is larger than 12MB, compressing with resize.");
        } else {
          console.log("File is smaller than 12MB, converting to MP4 without resize.");
        }

        // Generate thumbnail first
        const thumbnailUrl = await generateThumbnail(file);

        const compressedBlob = await compressVideo(file, shouldResize);

        console.log(`Original file size: ${file.size} bytes`);
        console.log(`Compressed video size: ${compressedBlob.size} bytes`);

        if (compressedBlob.size === 0) {
          setStatus("Error: Compression resulted in an empty file.");
          onUpload(null);
          if (onUploadFinish) onUploadFinish();
          return;
        }
        if (shouldResize && compressedBlob.size > file.size) {
          setStatus("Error: Compressed file is larger than the original.");
          onUpload(null);
          if (onUploadFinish) onUploadFinish();
          return;
        }

        const compressedFile = new File([compressedBlob], "compressed.mp4", {
          type: "video/mp4",
        });
        const formData = new FormData();
        formData.append("file", compressedFile);
        if (username) {
          formData.append("creator", username);
        }
        if (thumbnailUrl) {
          formData.append("thumbnailUrl", thumbnailUrl);
        }
        setStatus("Uploading video...");
        setUploadProgress(0);
        // Upload to Pinata with progress
        const responseText = await uploadWithProgress(formData);
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
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
        setStatus("Error during file upload.");
        setCompressionProgress(0);
        setUploadProgress(0);
        console.error("Error during file upload:", error);
        onUpload(null);
        if (onUploadFinish) onUploadFinish();
      }
    };

    const handleVideoUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (file) {
        await processVideoFile(file);
      } else {
        if (onUploadFinish) onUploadFinish();
      }
    };

    const handleFile = async (file: File) => {
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
          <div style={{ marginTop: 8, color: status.includes("Error") || status.includes("Failed") ? 'red' : '#333' }}>
            {status}
          </div>
        )}
        {status === "Compressing video..." && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 8, background: backgroundMuted, borderRadius: 4, overflow: 'hidden', width: 200 }}>
              <div style={{ width: `${compressionProgress}%`, height: '100%', background: backgroundPrimary, transition: 'width 0.2s' }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>{compressionProgress}%</div>
          </div>
        )}
        {status === "Uploading video..." && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 8, background: backgroundMuted, borderRadius: 4, overflow: 'hidden', width: 200 }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: backgroundAccent, transition: 'width 0.2s' }} />
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
