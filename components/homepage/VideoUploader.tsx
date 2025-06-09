import React, { useRef, useImperativeHandle, forwardRef, useState } from "react";
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
    const [status, setStatus] = useState<string>("");
    const [compressionProgress, setCompressionProgress] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // Replace hardcoded background and color values with theme variables
    const backgroundMuted = 'var(--chakra-colors-muted, #eee)';
    const backgroundPrimary = 'var(--chakra-colors-primary, #0070f3)';
    const backgroundAccent = 'var(--chakra-colors-accent, #00b894)';

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (inputRef.current && !isProcessing) {
          inputRef.current.value = ""; // reset so same file can be selected again
          inputRef.current.click();
        }
      },
    }));

    const compressVideo = async (file: File): Promise<Blob> => {
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
      await ffmpeg.exec([
        "-i", file.name,
        "-vcodec", "libx264",
        "-crf", "28",
        "-preset", "veryfast",
        "output.mp4"
      ]);
      const data = await ffmpeg.readFile("output.mp4");
      setCompressionProgress(100);
      return new Blob([data.buffer], { type: "video/mp4" });
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

    const handleVideoUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) {
        setStatus("");
        setCompressionProgress(0);
        setUploadProgress(0);
        console.log("No file selected.");
        return;
      }
      try {
        setStatus("Compressing video...");
        setCompressionProgress(0);
        setUploadProgress(0);
        // Compress video
        const compressedBlob = await compressVideo(file);
        const compressedFile = new File([compressedBlob], "compressed.mp4", {
          type: "video/mp4",
        });
        const formData = new FormData();
        formData.append("file", compressedFile);
        setStatus("Uploading video...");
        setCompressionProgress(0);
        setUploadProgress(0);
        // Upload to Pinata with progress
        const responseText = await uploadWithProgress(formData);
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          setStatus("Failed to parse upload response.");
          onUpload(null);
          return;
        }
        if (!result || !result.IpfsHash) {
          setStatus("Failed to upload video.");
          onUpload(null);
          return;
        }
        const videoUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
        setStatus("Upload complete!");
        setUploadProgress(100);
        onUpload(videoUrl);
      } catch (error) {
        setStatus("Error during file upload.");
        setCompressionProgress(0);
        setUploadProgress(0);
        console.error("Error during file upload:", error);
        onUpload(null);
      }
    };

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
