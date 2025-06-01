import React, { useRef, useState } from "react";
import { IconButton, Spinner } from "@chakra-ui/react";
import { FaVideo } from "react-icons/fa6";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface VideoUploaderProps {
  onUpload: (url: string | null) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);
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
        setIsProcessing(false);
        return;
      }
      const result = await response.json();
      const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
      onUpload(videoUrl);
    } catch (error) {
      console.error("Error during file upload:", error);
      onUpload(null);
    }
    setIsProcessing(false);
  };

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <>
      <input
        type="file"
        accept="video/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleVideoUpload}
      />
      <IconButton
        icon={isProcessing ? <Spinner size="sm" /> : <FaVideo />}
        aria-label="Upload Video"
        onClick={triggerFileInput}
        isDisabled={isProcessing}
        variant="ghost"
      />
    </>
  );
};

export default VideoUploader;
