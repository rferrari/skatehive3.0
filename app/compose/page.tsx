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
} from "@chakra-ui/react";
import { useState, useMemo, useRef, useEffect } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useDropzone } from "react-dropzone";
import { FaImage, FaVideo } from "react-icons/fa";
import { MdGif, MdMovieCreation } from "react-icons/md";
import VideoRenderer from "../../components/layout/VideoRenderer";
import { Components } from "@uiw/react-markdown-preview";
import ImageCompressor, {
  ImageCompressorRef,
} from "../../src/components/ImageCompressor";
import VideoUploader, {
  VideoUploaderRef,
} from "../../components/homepage/VideoUploader";
import GIFMakerWithSelector, {
  GIFMakerRef as GIFMakerWithSelectorRef,
} from "../../components/homepage/GIFMakerWithSelector";
import {
  extractImageUrls,
  extractVideoUrls,
} from "../../lib/utils/extractImageUrls";
import Image from "next/image";

export default function Composer() {
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { aioha } = useAioha();
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

  const placeholders = [
    "Don't forget to title your post...",
    "Where is your mind?",
    "Write a bangin' title here...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [placeholders.length]);

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
    const permlink = title.replaceAll(" ", "-");
    const allImages = extractImageUrls(markdown);
    let imageArray: string[] = [];
    if (selectedThumbnail) {
      imageArray = [
        selectedThumbnail,
        ...allImages.filter((url) => url !== selectedThumbnail),
      ];
    } else {
      imageArray = allImages;
    }
    try {
      await aioha.comment(null, communityTag, permlink, title, markdown, {
        tags: hashtags,
        app: "Skatehive App 3.0",
        image: imageArray,
      });
      console.log("Post submitted successfully");
    } catch (error) {
      console.error("Failed to submit post:", error);
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
        const ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
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

  const { getRootProps, getInputProps } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
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
            insertAtCursor(`\n![${file.name}](${url})\n`);
          } else if (file.type.startsWith("video/")) {
            insertAtCursor(
              `\n<iframe src="${url}" frameborder="0" allowfullscreen></iframe>\n`
            );
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
      setIsUploading(false);
    },
    accept: {
      "image/*": [".png", ".gif", ".jpeg", ".jpg"],
      "video/*": [".mp4", ".mov"],
    },
    multiple: false,
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
    }),
    []
  );

  const handleGifTrigger = () => {
    setGifUrl(null);
    setGifSize(null);
    gifMakerWithSelectorRef.current?.trigger();
  };

  const handleGifUpload = (url: string | null) => {
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
      const ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
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
          sx={{
            "&::placeholder": {
              transition: "opacity 0.3s ease-in-out",
              opacity: 0.7,
            },
            "&:focus::placeholder": {
              opacity: 0.3,
            },
          }}
        />
        <Flex
          justify={{ base: "center", md: "flex-end" }}
          gap={2}
          mt={{ base: 2, md: 0 }}
          mb={{ base: 2, md: 0 }}
          flexShrink={0}
        >
          <Tooltip label="Upload Image" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "blue.400", bg: "transparent" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={handleImageTrigger}
            >
              <FaImage color="primary" size={48} />
            </Button>
          </Tooltip>
          <Tooltip label="Upload Video" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "blue.400", bg: "transparent" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={handleVideoTrigger}
            >
              <FaVideo color="primary" size={48} />
            </Button>
          </Tooltip>
          <Tooltip label="Upload GIF or WEBP (max 5MB)" placement="bottom">
            <Button
              variant="unstyled"
              size="lg"
              borderRadius="full"
              p={2}
              _hover={{ color: "blue.400", bg: "transparent" }}
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
              <MdGif color="primary" size={48} />
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
              _hover={{ color: "blue.400", bg: "transparent" }}
              style={{
                height: 64,
                width: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setGifModalOpen(true)}
            >
              <MdMovieCreation color="primary" size={48} />
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
        border="1px solid"
        borderColor="black"
        borderRadius="base"
        justify="center"
        overflow="hidden"
        width="100%"
      >
        <Box position="relative" width="100%" height="100%">
          <MDEditor
            value={markdown}
            onChange={(value) => setMarkdown(value || "")}
            height="100%"
            style={{
              border: "2px solid limegreen",
              padding: "10px",
              backgroundColor: "background",
              color: "white",
              width: "100%",
            }}
            extraCommands={extraCommands}
            previewOptions={{
              components: memoizedComponents,
              style: {
                backgroundColor: "background",
                color: "white",
              },
            }}
            commands={[
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
                <p style={{ marginBottom: 16, color: "#bbb" }}>
                  Upload a video (3-30 seconds), select a 3-second segment, and
                  convert it to a GIF!
                </p>
                <button
                  onClick={handleGifTrigger}
                  disabled={isProcessingGif}
                  style={{
                    padding: "10px 24px",
                    fontSize: 16,
                    borderRadius: 6,
                    background: isProcessingGif ? "#ccc" : "#222",
                    color: "#fff",
                    border: "none",
                    cursor: isProcessingGif ? "not-allowed" : "pointer",
                    marginBottom: 24,
                  }}
                >
                  {isProcessingGif ? "Processing..." : "Select Video (3-30s)"}
                </button>
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
                          formData.append("file", blob, "blog-gif.gif");
                          const response = await fetch("/api/pinata", {
                            method: "POST",
                            body: formData,
                          });
                          if (!response.ok)
                            throw new Error("Failed to upload GIF to IPFS");
                          const result = await response.json();
                          const ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;
                          insertAtCursor(`\n![skatehive](${ipfsUrl})\n`);
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
      <Input
        placeholder="Enter hashtags"
        mt="4"
        value={hashtagInput}
        onChange={(e) => setHashtagInput(e.target.value)}
        onKeyDown={handleHashtagKeyDown}
        borderRadius="base"
      />
      <Wrap mt="2">
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
      <Flex mt="1" justify="space-between">
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => setShowThumbnailPicker((v) => !v)}
        >
          Thumbnail
        </Button>
        <Button size="sm" colorScheme="blue" onClick={handleSubmit}>
          Submit
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
