"use client";
import React from "react";
import { useAioha } from "@aioha/react-ui";
import {
  Flex,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  Wrap,
  WrapItem,
  Button,
  Tooltip,
  Center,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { useState, useMemo, useRef, useEffect } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useDropzone } from "react-dropzone";
import { FaImage, FaVideo } from "react-icons/fa";
import { MdGif, MdMovieCreation } from "react-icons/md";
import VideoRenderer from "../../components/layout/VideoRenderer";
import { Components } from "@uiw/react-markdown-preview";
import ImageCompressor, { ImageCompressorRef } from "../../src/components/ImageCompressor";
import VideoUploader, { VideoUploaderRef } from "../../components/homepage/VideoUploader";
import GIFMakerWithSelector, { GIFMakerRef as GIFMakerWithSelectorRef } from "../../components/homepage/GIFMakerWithSelector";
import { extractImageUrls, extractVideoUrls } from "../../lib/utils/extractImageUrls";
import MatrixOverlay from "../../components/graphics/MatrixOverlay";
import { Image } from "@chakra-ui/react";
import imageCompression from "browser-image-compression";
import rehypeMentionLinks from "../../lib/utils/rehypeMentionLinks";

export default function Composer() {
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { aioha, user } = useAioha();
  const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "blog";
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef<any>(null);
  const imageCompressorRef = useRef<ImageCompressorRef>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const videoUploaderRef = useRef<VideoUploaderRef>(null);
  const [isCompressingVideo, setIsCompressingVideo] = useState(false);
  const [isGifModalOpen, setGifModalOpen] = useState(false);
  const gifMakerWithSelectorRef = useRef<GIFMakerWithSelectorRef>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifSize, setGifSize] = useState<number | null>(null);
  const [isProcessingGif, setIsProcessingGif] = useState(false);
  const [isUploadingGif, setIsUploadingGif] = useState(false);
  const gifWebpInputRef = useRef<HTMLInputElement>(null);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(
    null
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const toast = useToast();
  const [gifCaption, setGifCaption] = useState<string>("skatehive-gif");

  const placeholders = [
    "Don't forget a title...",
    "Where is your mind?",
    "Write a title here...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    if (isGifModalOpen) {
      gifMakerWithSelectorRef.current?.reset();
      setGifUrl(null);
      setGifSize(null);
      setIsProcessingGif(false);
    }
  }, [isGifModalOpen]);

  const insertAtCursor = (content: string) => {
    const textarea = document.querySelector(
      ".w-md-editor-text-input"
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = markdown;
      const before = text.substring(0, start);
      const after = text.substring(end);
      setMarkdown(`${before}${content}${after}`);
      // Reset cursor position after React re-render
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + content.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === " " || e.key === "Enter" || e.key === ",") &&
      hashtagInput.trim()
    ) {
      setHashtags((prev) => [...prev, hashtagInput.trim()]);
      setHashtagInput("");
    } else if (e.key === "Backspace" && !hashtagInput && hashtags.length) {
      setHashtags((prev) => prev.slice(0, -1));
    }
  };

  const removeHashtag = (index: number) => {
    setHashtags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "You must be logged in to submit a post.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    const allImages = extractImageUrls(markdown);
    // For GIFs, append ?filename=... if not present
    function ensureGifFilename(url: string): string {
      if (url.match(/\.gif($|\?)/i) && !url.includes("?filename=")) {
        return url + (url.includes("?") ? "&" : "?") + "filename=skatehive.gif";
      }
      return url;
    }
    let imageArray: string[] = [];
    if (selectedThumbnail) {
      imageArray = [
        ensureGifFilename(selectedThumbnail),
        ...allImages.filter((url) => url !== selectedThumbnail).map(ensureGifFilename),
      ];
    } else {
      imageArray = allImages.map(ensureGifFilename);
    }
    const permlink = title
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // replace invalid chars with dash
      .replace(/^-+|-+$/g, "")      // trim leading/trailing dashes
      .slice(0, 255);                // max length for Hive permlink
    try {
      const result = await aioha.comment(
        null,
        communityTag,
        permlink,
        title,
        markdown,
        {
          tags: hashtags,
          app: "Skatehive App 3.0",
          image: imageArray,
        }
      );
      console.log("aioha.comment result:", result);
      if (result && result.success) {
        toast({
          title: "Post submitted successfully!",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
        // Optionally clear form here
      } else {
        toast({
          title: "Failed to submit post.",
          description: result?.error || "Unknown error.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error("Failed to submit post:", error);
      toast({
        title: "Failed to submit post.",
        description: error?.message || String(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleImageUpload = async (url: string | null, fileName?: string) => {
    setIsUploading(true);
    setIsCompressingImage(false);
    if (url) {
      try {
        const blob = await fetch(url).then((res) => res.blob());
        const formData = new FormData();
        formData.append("file", blob, fileName || "compressed-image.jpg");
        const response = await fetch("/api/pinata", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to upload file to IPFS");
        }
        const result = await response.json();
        let ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
        // If GIF, append filename param for better frontend compatibility
        if (fileName && fileName.toLowerCase().endsWith('.gif')) {
          ipfsUrl += `?filename=${encodeURIComponent(fileName)}`;
        }
        insertAtCursor(`\n![${fileName || "image"}](${ipfsUrl})\n`);
        setIsUploading(false);
      } catch (error) {
        console.error("Error uploading compressed image to IPFS:", error);
        setIsUploading(false);
      }
    } else {
      setIsUploading(false);
    }
  };

  const handleImageTrigger = () => {
    setIsCompressingImage(true);
    imageCompressorRef.current?.trigger();
  };

  const handleVideoUpload = (url: string | null) => {
    setIsCompressingVideo(false);
    if (url) {
      insertAtCursor(
        `\n<iframe src="${url}" frameborder="0" allowfullscreen></iframe>\n`
      );
    }
  };

  const handleVideoTrigger = () => {
    setIsCompressingVideo(true);
    videoUploaderRef.current?.trigger();
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setIsUploading(true);
    for (const file of acceptedFiles) {
      let fileToUpload = file;
      let fileName = file.name;
      if (
        file.type.startsWith("image/") &&
        file.type !== "image/gif" &&
        file.type !== "image/webp"
      ) {
        try {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          fileToUpload = compressedFile;
          fileName = compressedFile.name;
        } catch (err) {
          alert(
            "Error compressing image: " +
              (err instanceof Error ? err.message : err)
          );
          continue;
        }
      }
      const formData = new FormData();
      formData.append("file", fileToUpload, fileName);
      try {
        const response = await fetch("/api/pinata", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to upload file");
        }
        const result = await response.json();
        const url = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
        if (file.type.startsWith("image/")) {
          insertAtCursor(`\n![${fileName}](${url})\n`);
        } else if (file.type.startsWith("video/")) {
          insertAtCursor(
            `\n<iframe src=\"${url}\" frameborder=\"0\" allowfullscreen></iframe>\n`
          );
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
    setIsUploading(false);
  };

  const {
    getRootProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".gif", ".jpeg", ".jpg", ".webp"],
      "video/*": [".mp4", ".mov"]
    },
    multiple: false
  });

  const extraCommands: never[] = [];

  const memoizedComponents: Components = useMemo(
    () => ({
      iframe: ({
        node,
        ...props
      }: React.IframeHTMLAttributes<HTMLIFrameElement> & {
        node?: unknown;
      }) => <VideoRenderer src={props.src} {...props} />,
      
      p: ({ children, ...props }) => {
        // If the paragraph contains only a YouTube URL, embed it
        if (
          Array.isArray(children) &&
          children.length === 1 &&
          typeof children[0] === "string"
        ) {
          const text = children[0].trim();
          // Regex for YouTube URLs
          const ytMatch = text.match(
            /^(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))(?:[&?][^\s]*)?$/
          );
          if (ytMatch) {
            const videoId = ytMatch[2];
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            return (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", margin: "16px 0" }}>
                <iframe
                  src={embedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube Video"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                />
              </div>
            );
          }
        }
        // Default paragraph rendering
        return <p {...props}>{children}</p>;
      },
      a: ({ href, children, ...props }) => {
        // Regex for YouTube URLs
        const ytMatch = href?.match(
          /^(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))(?:[&?][^\s]*)?$/
        );
        if (ytMatch) {
          const videoId = ytMatch[2];
          const embedUrl = `https://www.youtube.com/embed/${videoId}`;
          return (
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", margin: "16px 0" }}>
              <iframe
                src={embedUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube Video"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
            </div>
          );
        }
        // Default anchor rendering
        return <a href={href} {...props}>{children}</a>;
      },
      text: ({ children }) => {
        if (typeof children === "string") {
          // Replace @username with a link to /@username
          const parts = children.split(/(@[a-zA-Z0-9._-]+)/g);
          return parts.map((part, i) => {
            if (/^@[a-zA-Z0-9._-]+$/.test(part)) {
              const username = part.slice(1);
              return (
                <a key={i} href={`/@${username}`} style={{ color: '#3182ce', textDecoration: 'underline' }}>
                  {part}
                </a>
              );
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
          });
        }
        return children;
      },
    }),
    []
  );

  const handleGifTrigger = () => {
    setGifUrl(null);
    setGifSize(null);
    gifMakerWithSelectorRef.current?.trigger();
  };

  const handleGifUpload = (url: string | null, caption?: string) => {
    setIsProcessingGif(!!url);
    setGifUrl(url);
    if (url) {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => setGifSize(blob.size))
        .catch(() => setGifSize(null));
    } else {
      setGifSize(null);
    }
    setGifCaption(caption || "skatehive-gif");
  };

  const handleGifWebpUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Check file type
    if (!(file.type === "image/gif" || file.type === "image/webp")) {
      alert("Only GIF and WEBP files are allowed.");
      return;
    }
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("GIF or WEBP file size must be 5MB or less.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/pinata", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload GIF/WEBP to IPFS");
      }
      const result = await response.json();
      let ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
      if (file.type === "image/gif") {
        ipfsUrl += `?filename=${encodeURIComponent(file.name)}`;
      }
      insertAtCursor(`\n![${file.name}](${ipfsUrl})\n`);
    } catch (error) {
      alert("Error uploading GIF/WEBP to IPFS.");
      console.error("Error uploading GIF/WEBP:", error);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  const headerCommand = {
    name: "header",
    keyCommand: "header",
    buttonProps: { "aria-label": "Insert Header" },
    icon: (
      <span style={{ fontWeight: "bold", fontSize: 18 }}>H</span>
    ),
    execute: (state: import("@uiw/react-md-editor").TextState, api: import("@uiw/react-md-editor").TextAreaTextApi) => {
      api.replaceSelection("# Header\n");
    },
  };

  return (
    <Flex
      width="100%"
      height="92vh"
      bgColor="background"
      justify="center"
      p="1"
      direction="column"
      overflow="hidden"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify={{ base: "flex-start", md: "space-between" }}
        mb={4}
        gap={2}
        width="100%"
        position="relative"
      >
        <Input
          placeholder={placeholders[placeholderIndex]}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="lg"
          borderRadius="base"
          fontSize="3xl"
          fontWeight="bold"
          _placeholder={{ fontSize: "3xl" }}
          maxLength={123}
          flex="1"
          minW={0}
        />
        <Flex
          justify={{ base: "center", md: "flex-end" }}
          gap={2}
          mt={{ base: 2, md: 0 }}
          mb={{ base: 2, md: 0 }}
          flexShrink={0}
          position="relative"
        >
          {/* Overlay for non-logged-in users */}
          {!user && (
            <>
              <Box position="absolute" top={0} left={0} w="100%" h="100%" zIndex={21} pointerEvents="all" display="flex" alignItems="center" justifyContent="center">
                <MatrixOverlay />
              </Box>
            </>
          )}
          {/* Media upload buttons */}
          <Tooltip label="Upload Image" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "primary", bg: "muted" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={handleImageTrigger}
            >
              <FaImage color="var(--chakra-colors-primary)" size={48} />
            </Button>
          </Tooltip>
          <Tooltip label="Upload Video" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "primary", bg: "muted" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={handleVideoTrigger}
            >
              <FaVideo color="var(--chakra-colors-primary)" size={48} />
            </Button>
          </Tooltip>
          <Tooltip label="Upload GIF or WEBP (max 5MB)" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "primary", bg: "muted" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => gifWebpInputRef.current?.click()}
              isDisabled={isUploading}
            >
              <MdGif color="var(--chakra-colors-primary)" size={48} />
              <input
                type="file"
                accept=".gif,.webp"
                style={{ display: "none" }}
                ref={gifWebpInputRef}
                onChange={handleGifWebpUpload}
              />
            </Button>
          </Tooltip>
          <Tooltip label="Create GIF From Video" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "primary", bg: "muted" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setGifModalOpen(true)}
            >
              <MdMovieCreation color="var(--chakra-colors-primary)" size={48} />
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
      {isUploading && (
        <Center>
          <Spinner />
        </Center>
      )}
      <Flex width="100%" justify="flex-end" mb={2}>
        <Box minWidth="220px">
          <VideoUploader
            ref={videoUploaderRef}
            onUpload={handleVideoUpload}
            isProcessing={isCompressingVideo}
          />
        </Box>
      </Flex>
      <Flex
        flex="1"
        borderRadius="base"
        justify="center"
        overflow="hidden"
        width="100%"
      >
        <Box
          {...getRootProps()}
          position="relative"
          width="100%"
          height="100%"
          border={isDragActive ? "2px dashed var(--chakra-colors-primary, limegreen)" : undefined}
          transition="border 0.2s"
        >
          <MDEditor
            value={markdown}
            onChange={(value) => setMarkdown(value || "")}
            height="100%"
            style={{
              padding: "10px",
              backgroundColor: "var(--chakra-colors-background)",
              color: "var(--chakra-colors-text, white)",
              width: "100%",
            }}
            extraCommands={extraCommands}
            previewOptions={{
              components: memoizedComponents,
              style: {
                backgroundColor: "var(--chakra-colors-background)",
                color: "var(--chakra-colors-text, white)",
              },
              rehypePlugins: [rehypeMentionLinks],
            }}
            commands={[
              headerCommand,
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.hr,
              commands.code,
              commands.table,
              commands.link,
              commands.quote,
              commands.unorderedListCommand,
              commands.orderedListCommand,
              commands.fullscreen,
              commands.codeEdit,
              commands.codeLive,
            ]}
          />
        </Box>
        <ImageCompressor
          ref={imageCompressorRef}
          onUpload={handleImageUpload}
          isProcessing={isCompressingImage}
          hideStatus={true}
        />
        <Modal
          isOpen={isGifModalOpen}
          onClose={() => setGifModalOpen(false)}
          size="xl"
          isCentered
        >
          <ModalOverlay />
          <ModalContent bg="background" color="text">
            <ModalHeader>GIF Maker by web-gnar</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <div style={{ maxWidth: 480, margin: "0 auto", padding: 12 }}>
                {/* Keep instructions, remove only the outer select button */}
                {!gifUrl && (
                  <>
                    <p style={{ marginBottom: 16, color: "#bbb" }}>
                      Upload a video (3-30 seconds), select a 3-second segment, and
                      convert it to a GIF!
                    </p>
                    {/* Removed the Select Video (3-30s) button here */}
                  </>
                )}
                <GIFMakerWithSelector
                  ref={gifMakerWithSelectorRef}
                  onUpload={handleGifUpload}
                  isProcessing={isProcessingGif}
                />
                {gifUrl && (
                  <div
                    style={{
                      marginTop: 32,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        marginBottom: 12,
                        textAlign: "center",
                      }}
                    >
                      GIF Preview (Selected Segment)
                    </h2>
                    <Image
                      src={gifUrl}
                      alt="Generated GIF"
                      style={{
                        maxWidth: 320,
                        borderRadius: 8,
                        border: "1px solid #eee",
                        display: "block",
                        margin: "0 auto",
                      }}
                    />
                    {gifSize !== null && (
                      <div
                        style={{
                          marginTop: 8,
                          color: "#666",
                          fontSize: 14,
                          textAlign: "center",
                        }}
                      >
                        File size: {Math.round(gifSize / 1024)} KB
                      </div>
                    )}
                    <a
                      href="#"
                      style={{
                        marginTop: 18,
                        color: "#3182ce",
                        textDecoration: "underline",
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: isUploadingGif ? "not-allowed" : "pointer",
                        opacity: isUploadingGif ? 0.6 : 1,
                      }}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (isUploadingGif) return;
                        setIsUploadingGif(true);
                        try {
                          const blob = await fetch(gifUrl).then((res) =>
                            res.blob()
                          );
                          const formData = new FormData();
                          // Use the user-provided caption as the filename, fallback to skatehive-gif.gif
                          const safeCaption = gifCaption ? gifCaption.replace(/[^a-zA-Z0-9-_]/g, "-") : "skatehive-gif";
                          const filename = `${safeCaption}.gif`;
                          formData.append("file", blob, filename);
                          const response = await fetch("/api/pinata", {
                            method: "POST",
                            body: formData,
                          });
                          if (!response.ok)
                            throw new Error("Failed to upload GIF to IPFS");
                          const result = await response.json();
                          let ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}?filename=${encodeURIComponent(filename)}`;
                          insertAtCursor(`\n![${filename}](${ipfsUrl})\n`);
                          gifMakerWithSelectorRef.current?.reset();
                          setGifUrl(null);
                          setGifSize(null);
                          setIsProcessingGif(false);
                          setGifModalOpen(false);
                        } catch (err) {
                          alert("Failed to upload GIF to IPFS.");
                        } finally {
                          setIsUploadingGif(false);
                        }
                      }}
                    >
                      {isUploadingGif ? "Uploading..." : "Add to blog"}
                    </a>
                  </div>
                )}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
      {/* Hashtags input and tags, right-aligned and 25% width */}
      <Flex width="100%" direction="row" alignItems="center" mt={4} mb={2}>
        <Box flex="1">
          <Wrap justify="flex-start">
            {hashtags.map((tag, index) => (
              <WrapItem key={index}>
                <Tag
                  size="md"
                  borderRadius="base"
                  variant="solid"
                  colorScheme="blue"
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => removeHashtag(index)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
        <Box>
          <Input
            placeholder="Enter hashtags"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={handleHashtagKeyDown}
            borderRadius="base"
            width="200px"
          />
        </Box>
      </Flex>
      <Flex mt="1" justify="space-between">
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => setShowThumbnailPicker((v) => !v)}
        >
          Thumbnail
        </Button>
        <Button size="sm" colorScheme="blue" onClick={handleSubmit}>
          Publish
        </Button>
      </Flex>
      {showThumbnailPicker && (
        <Box
          mt={4}
          p={3}
          border="1px solid #444"
          borderRadius="md"
          bg="#181818"
        >
          <Box mb={2} fontWeight="bold">
            Choose a thumbnail:
          </Box>
          <Flex wrap="wrap" gap={3}>
            {extractImageUrls(markdown).map((url, idx) => (
              <Box
                key={url + idx}
                border={
                  selectedThumbnail === url
                    ? "2px solid limegreen"
                    : "2px solid transparent"
                }
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                onClick={() => setSelectedThumbnail(url)}
                _hover={{ border: "2px solid #3182ce" }}
                width="96px"
                height="96px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="#222"
              >
                <Image
                  src={url}
                  alt="thumbnail"
                  style={{ maxWidth: 90, maxHeight: 90, objectFit: "cover" }}
                />
              </Box>
            ))}
            {extractVideoUrls(markdown).map((url, idx) => (
              <Box
                key={url + idx}
                border={
                  selectedThumbnail === url
                    ? "2px solid limegreen"
                    : "2px solid transparent"
                }
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                onClick={() => setSelectedThumbnail(url)}
                _hover={{ border: "2px solid #3182ce" }}
                width="96px"
                height="96px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="#222"
              >
                <video
                  src={url}
                  style={{ maxWidth: 90, maxHeight: 90, objectFit: "cover" }}
                  preload="metadata"
                  muted
                />
              </Box>
            ))}
            {extractImageUrls(markdown).length === 0 &&
              extractVideoUrls(markdown).length === 0 && (
                <Box color="#888">No media found in your post yet.</Box>
              )}
          </Flex>
          {selectedThumbnail && (
            <Box mt={2} color="#aaa" fontSize="sm">
              Selected thumbnail:{" "}
              <span style={{ wordBreak: "break-all" }}>
                {selectedThumbnail}
              </span>
            </Box>
          )}
        </Box>
      )}
    </Flex>
  );
}
