import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export interface ImageCompressorProps {
  onUpload: (url: string | null, fileName?: string) => void;
  isProcessing?: boolean;
  hideStatus?: boolean;
}

export interface ImageCompressorRef {
  trigger: () => void;
}

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
];

const statusStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#333",
  fontSize: 14,
};
const errorStyle: React.CSSProperties = {
  ...statusStyle,
  color: "red",
};

const ImageCompressor = forwardRef<ImageCompressorRef, ImageCompressorProps>(
  ({ onUpload, isProcessing = false, hideStatus = false }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<any>(null);
    const [status, setStatus] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (inputRef.current && !isProcessing) {
          inputRef.current.value = "";
          inputRef.current.click();
        }
      },
    }));

    useEffect(() => {
      return () => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      };
    }, [blobUrl]);

    const compressImage = async (file: File): Promise<Blob> => {
      if (!ffmpegRef.current) {
        setStatus("Loading FFmpeg...");
        ffmpegRef.current = new FFmpeg();
        await ffmpegRef.current.load();
        ffmpegRef.current.on('log', ({ message }: { message: string }) => {
          console.log('[FFmpeg]', message);
        });
        ffmpegRef.current.on('error', (err: any) => {
          console.error('[FFmpeg ERROR]', err);
        });
      }
      const ffmpeg = ffmpegRef.current;
      setStatus("Compressing image...");
      await ffmpeg.writeFile(file.name, await fetchFile(file));
      let outputName = "output";
      let outputType = "";
      let args: string[] = [];
      if (file.type === "image/jpeg" || file.type === "image/heic" || file.type === "image/heif") {
        // For HEIC, convert to JPEG for browser compatibility
        outputName += ".jpg";
        outputType = "image/jpeg";
        // Check if ffmpeg supports HEIC
        if ((file.type === "image/heic" || file.type === "image/heif") && !ffmpeg?.core?.config?.formats?.includes?.("heic")) {
          throw new Error("HEIC format not supported.");
        }
        args = [
          "-i", file.name,
          "-q:v", "10",
          outputName,
        ];
      } else if (file.type === "image/png") {
        outputName += ".png";
        outputType = "image/png";
        args = [
          "-i", file.name,
          "-compression_level", "9",
          outputName,
        ];
      } else {
        throw new Error("Unsupported file type.");
      }
      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputName);
      return new Blob([data.buffer], { type: outputType });
    };

    const handleImageUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      setError("");
      setStatus("");
      const file = event.target.files?.[0];
      if (!file) {
        setStatus("");
        return;
      }
      if (!SUPPORTED_TYPES.includes(file.type)) {
        setError("Unsupported file type. Please upload a JPEG, PNG, or HEIC image.");
        onUpload(null);
        return;
      }
      try {
        const compressedBlob = await compressImage(file);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        const url = URL.createObjectURL(compressedBlob);
        setBlobUrl(url);
        setStatus("Image compressed successfully!");
        onUpload(url, file.name);
      } catch (err: any) {
        console.error(err);
        if (err?.message?.includes("HEIC format not supported")) {
          setError("HEIC format not supported.");
        } else {
          setError("Error compressing image.");
        }
        setStatus("");
        onUpload(null);
      }
    };

    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          style={{ display: "none" }}
          onChange={handleImageUpload}
          disabled={isProcessing}
        />
        {!hideStatus && status && <div style={statusStyle}>{status}</div>}
        {!hideStatus && error && <div style={errorStyle}>{error}</div>}
      </div>
    );
  }
);

ImageCompressor.displayName = "ImageCompressor";

export default ImageCompressor; 