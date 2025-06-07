"use client";

import React, { useRef, useState } from "react";
import GIFMakerWithSelector, {
  GIFMakerRef as GIFMakerWithSelectorRef,
} from "@/components/homepage/GIFMakerWithSelector";
import ImageCompressor, {
  ImageCompressorRef,
} from "../../src/components/ImageCompressor";
import { Image } from "@chakra-ui/react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const GIFMakerPage: React.FC = () => {
  const gifMakerWithSelectorRef = useRef<GIFMakerWithSelectorRef>(null);
  const [gifUrl2, setGifUrl2] = useState<string | null>(null);
  const [gifSize2, setGifSize2] = useState<number | null>(null);
  const [isProcessing2, setIsProcessing2] = useState(false);

  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);

  const handleUpload2 = (url: string | null) => {
    setIsProcessing2(false);
    setGifUrl2(url);
    if (url) {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => setGifSize2(blob.size))
        .catch(() => setGifSize2(null));
    } else {
      setGifSize2(null);
    }
  };

  const handleTrigger2 = () => {
    setGifUrl2(null);
    setGifSize2(null);
    gifMakerWithSelectorRef.current?.trigger();
  };

  const handleImageUpload = (url: string | null) => {
    setIsCompressing(false);
    setCompressedUrl(url);
    if (url) {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => setCompressedSize(blob.size))
        .catch(() => setCompressedSize(null));
    } else {
      setCompressedSize(null);
    }
  };

  const handleImageTrigger = () => {
    setCompressedUrl(null);
    setCompressedSize(null);
    setIsCompressing(true);
    imageCompressorRef.current?.trigger();
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: 24,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        GIF Maker Utility
      </h1>
      <p style={{ marginBottom: 24, color: "#555" }}>
        Upload a 3-second video and convert it to a GIF right in your browser!
      </p>
      <button
        onClick={handleTrigger2}
        disabled={isProcessing2}
        style={{
          padding: "10px 24px",
          fontSize: 16,
          borderRadius: 6,
          background: isProcessing2 ? "#ccc" : "#222",
          color: "#fff",
          border: "none",
          cursor: isProcessing2 ? "not-allowed" : "pointer",
          marginBottom: 24,
        }}
      >
        {isProcessing2 ? "Processing..." : "Select Video (3-30s)"}
      </button>
      <GIFMakerWithSelector
        ref={gifMakerWithSelectorRef}
        onUpload={handleUpload2}
        isProcessing={isProcessing2}
      />
      {gifUrl2 && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            GIF Preview (Selected Segment)
          </h2>
          <Image
            src={gifUrl2}
            alt="Generated GIF"
            style={{
              maxWidth: "100%",
              borderRadius: 8,
              border: "1px solid #eee",
            }}
          />
          {gifSize2 !== null && (
            <div style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
              File size: {formatBytes(gifSize2)}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <a
              href={gifUrl2}
              download="output.gif"
              style={{ color: "#0070f3", textDecoration: "underline" }}
            >
              Download GIF
            </a>
          </div>
        </div>
      )}

      {/* Image Compressor Section */}
      <hr
        style={{
          margin: "48px 0 32px 0",
          border: 0,
          borderTop: "1px solid #eee",
        }}
      />
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Image Compressor
      </h1>
      <p style={{ marginBottom: 24, color: "#555" }}>
        Upload a JPEG, PNG, or HEIC image and compress it in your browser!
      </p>
      <button
        onClick={handleImageTrigger}
        disabled={isCompressing}
        style={{
          padding: "10px 24px",
          fontSize: 16,
          borderRadius: 6,
          background: isCompressing ? "#ccc" : "#222",
          color: "#fff",
          border: "none",
          cursor: isCompressing ? "not-allowed" : "pointer",
          marginBottom: 24,
        }}
      >
        {isCompressing ? "Processing..." : "Select Image (JPEG, PNG, HEIC)"}
      </button>
      <ImageCompressor
        ref={imageCompressorRef}
        onUpload={handleImageUpload}
        isProcessing={isCompressing}
      />
      {compressedUrl && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            Compressed Image Preview
          </h2>
          <Image
            src={compressedUrl}
            alt="Compressed"
            style={{
              maxWidth: "100%",
              borderRadius: 8,
              border: "1px solid #eee",
            }}
          />
          {compressedSize !== null && (
            <div style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
              File size: {formatBytes(compressedSize)}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <a
              href={compressedUrl}
              download="compressed-image"
              style={{ color: "#0070f3", textDecoration: "underline" }}
            >
              Download Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GIFMakerPage;
