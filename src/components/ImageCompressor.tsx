import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import imageCompression from "browser-image-compression";

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
  // "image/heic", // browser-image-compression does not support HEIC
  // "image/heif",
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
        setError("Unsupported file type. Please upload a JPEG or PNG image.");
        onUpload(null);
        return;
      }
      try {
        setStatus("Resizing and compressing image...");
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        const url = URL.createObjectURL(compressedFile);
        setBlobUrl(url);
        setStatus("Image compressed successfully!");
        onUpload(url, compressedFile.name);
      } catch (err: any) {
        console.error(err);
        setError("Error compressing image.");
        setStatus("");
        onUpload(null);
      }
    };

    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
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