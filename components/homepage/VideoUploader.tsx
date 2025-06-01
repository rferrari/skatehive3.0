import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface VideoUploaderProps {
  onUpload: (url: string | null) => void;
  isProcessing?: boolean;
}

export interface VideoUploaderRef {
  trigger: () => void;
}

const VideoUploader = forwardRef<VideoUploaderRef, VideoUploaderProps>(
  ({ onUpload, isProcessing = false }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (inputRef.current && !isProcessing) {
          inputRef.current.value = ""; // reset so same file can be selected again
          inputRef.current.click();
        }
      },
    }));

    const compressVideo = async (file: File): Promise<Blob> => {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
      }
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile(file.name, await fetchFile(file));
      await ffmpeg.exec([
        "-i", file.name,
        "-vcodec", "libx264",
        "-crf", "28",
        "-preset", "veryfast",
        "output.mp4"
      ]);
      const data = await ffmpeg.readFile("output.mp4");
      return new Blob([data.buffer], { type: "video/mp4" });
    };

    const handleVideoUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) {
        console.log("No file selected.");
        return;
      }
      try {
        // Compress video
        const compressedBlob = await compressVideo(file);
        const compressedFile = new File([compressedBlob], "compressed.mp4", {
          type: "video/mp4",
        });
        const formData = new FormData();
        formData.append("file", compressedFile);
        // Upload to Pinata
        const response = await fetch("/api/pinata", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to upload video. Response:", errorText);
          onUpload(null);
          return;
        }
        const result = await response.json();
        const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
        onUpload(videoUrl);
      } catch (error) {
        console.error("Error during file upload:", error);
        onUpload(null);
      }
    };

    return (
      <input
        type="file"
        accept="video/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleVideoUpload}
        disabled={isProcessing}
      />
    );
  }
);

VideoUploader.displayName = "VideoUploader";

export default VideoUploader;
