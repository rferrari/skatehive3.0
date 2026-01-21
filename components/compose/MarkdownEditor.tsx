import React, { useMemo, useState, useRef, useEffect } from "react";
import { Box, Textarea, HStack, IconButton, Button, Flex, Text } from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { Components } from "@uiw/react-markdown-preview";
import VideoRenderer from "../layout/VideoRenderer";
import HiveMarkdown from "../shared/HiveMarkdown";
import { FaImage, FaVideo, FaColumns } from "react-icons/fa";
import { TbGif } from "react-icons/tb";
import GIFMakerWithSelector, { GIFMakerRef as GIFMakerWithSelectorRef } from "../homepage/GIFMakerWithSelector";

interface MarkdownEditorProps {
  markdown: string;
  setMarkdown: (value: string) => void;
  onDrop: (acceptedFiles: File[]) => void;
  isDragActive: boolean;
  previewMode: "edit" | "preview" | "live";
  user?: any;
  handleImageTrigger?: () => void;
  handleVideoTrigger?: () => void;
  isUploading?: boolean;
  insertAtCursor?: (text: string) => void;
  handleGifUpload?: (blob: Blob, fileName: string) => Promise<void>;
}

export default function MarkdownEditor({
  markdown,
  setMarkdown,
  onDrop,
  isDragActive,
  previewMode,
  user,
  handleImageTrigger,
  handleVideoTrigger,
  isUploading = false,
  insertAtCursor,
  handleGifUpload,
}: MarkdownEditorProps) {
  const [isGifMakerOpen, setGifMakerOpen] = useState(false);
  const gifMakerWithSelectorRef = useRef<GIFMakerWithSelectorRef>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { getRootProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".gif", ".jpeg", ".jpg", ".webp"],
      "video/*": [".mp4", ".mov"],
    },
    multiple: false,
  });

  const handleGifCreated = async (gifBlob: Blob, fileName: string) => {
    const gifFileName = fileName.endsWith('.gif') ? fileName : `${fileName}.gif`;

    if (handleGifUpload) {
      try {
        await handleGifUpload(gifBlob, gifFileName);
      } catch (error) {
        console.error("Error uploading GIF:", error);
        const gifUrl = URL.createObjectURL(gifBlob);
        if (insertAtCursor) {
          insertAtCursor(`\n![${gifFileName}](${gifUrl})\n`);
        } else {
          setMarkdown(markdown + `\n![${gifFileName}](${gifUrl})\n`);
        }
      }
    } else {
      const gifUrl = URL.createObjectURL(gifBlob);
      if (insertAtCursor) {
        insertAtCursor(`\n![${gifFileName}](${gifUrl})\n`);
      } else {
        setMarkdown(markdown + `\n![${gifFileName}](${gifUrl})\n`);
      }
    }
  };

  const handleInsert = (prefix: string, suffix: string = "") => {
    const textarea = document.querySelector('#markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + prefix + selectedText + suffix + markdown.substring(end);
    setMarkdown(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPosition = splitPosition;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const newPosition = ((e.clientX - containerRect.left) / containerWidth) * 100;
      const clampedPosition = Math.max(20, Math.min(80, newPosition));
      setSplitPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const memoizedComponents: Components = useMemo(
    () => ({
      iframe: ({
        node,
        ...props
      }: React.IframeHTMLAttributes<HTMLIFrameElement> & {
        node?: unknown;
      }) => <VideoRenderer src={props.src} {...props} />,

      p: ({ children, ...props }) => {
        if (
          Array.isArray(children) &&
          children.length === 1 &&
          typeof children[0] === "string"
        ) {
          const text = children[0].trim();
          const ytMatch = text.match(
            /^(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))(?:[&?][^\s]*)?$/
          );
          if (ytMatch) {
            const videoId = ytMatch[2];
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            return (
              <div
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                  overflow: "hidden",
                  margin: "16px 0",
                }}
              >
                <iframe
                  src={embedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube Video"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            );
          }
        }
        return <p style={{ color: "#d8d8d8", lineHeight: 1.8, marginBottom: "12px" }} {...props}>{children}</p>;
      },
      a: ({ href, children, ...props }) => (
        <a href={href} {...props} style={{ color: "#6a9e6a", textDecoration: "none" }}>
          {children}
        </a>
      ),
      h1: ({ children }) => <h1 style={{ color: "#ffffff", fontSize: "1.75em", fontWeight: 700, marginBottom: "16px", marginTop: "24px" }}>{children}</h1>,
      h2: ({ children }) => <h2 style={{ color: "#ffffff", fontSize: "1.5em", fontWeight: 600, marginBottom: "14px", marginTop: "20px" }}>{children}</h2>,
      h3: ({ children }) => <h3 style={{ color: "#ffffff", fontSize: "1.25em", fontWeight: 600, marginBottom: "12px", marginTop: "16px" }}>{children}</h3>,
      strong: ({ children }) => <strong style={{ color: "#ffffff", fontWeight: 700 }}>{children}</strong>,
      em: ({ children }) => <em style={{ color: "#c8c8c8" }}>{children}</em>,
      code: ({ children }) => <code style={{ color: "#6a9e6a", backgroundColor: "rgba(106,158,106,0.1)", padding: "3px 8px", fontSize: "0.9em", fontFamily: "monospace" }}>{children}</code>,
      pre: ({ children }) => <pre style={{ backgroundColor: "rgba(255,255,255,0.04)", padding: "16px", overflow: "auto", margin: "16px 0" }}>{children}</pre>,
      blockquote: ({ children }) => <blockquote style={{ borderLeft: "4px solid #6a9e6a", paddingLeft: "16px", color: "#b8b8b8", margin: "16px 0", backgroundColor: "rgba(255,255,255,0.02)", padding: "12px 16px" }}>{children}</blockquote>,
      ul: ({ children }) => <ul style={{ color: "#d8d8d8", paddingLeft: "24px", lineHeight: 1.9, margin: "12px 0" }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ color: "#d8d8d8", paddingLeft: "24px", lineHeight: 1.9, margin: "12px 0" }}>{children}</ol>,
      li: ({ children }) => <li style={{ marginBottom: "6px" }}>{children}</li>,
    }),
    []
  );

  return (
    <Box
      {...getRootProps()}
      ref={containerRef}
      position="relative"
      width="100%"
      height="100%"
      bg="#16191f"
      border={isDragActive ? "2px solid #6a9e6a" : "1px solid rgba(255,255,255,0.08)"}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <HStack
        spacing={1}
        px={3}
        py={2}
        bg="#1a1f28"
        borderBottom="1px solid rgba(255,255,255,0.06)"
        flexWrap="wrap"
      >
        {isMounted && user && (
          <>
            <IconButton
              aria-label="Add image"
              icon={<FaImage />}
              size="sm"
              variant="ghost"
              color="#888"
              _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
              onClick={handleImageTrigger}
            />
            <IconButton
              aria-label="Add video"
              icon={<FaVideo />}
              size="sm"
              variant="ghost"
              color="#888"
              _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
              onClick={handleVideoTrigger}
            />
            <IconButton
              aria-label="Create GIF"
              icon={<TbGif size={18} />}
              size="sm"
              variant="ghost"
              color="#888"
              _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
              onClick={() => {
                gifMakerWithSelectorRef.current?.reset();
                setGifMakerOpen(true);
              }}
            />
            <Box w="1px" h="18px" bg="rgba(255,255,255,0.08)" mx={1} />
          </>
        )}
        <Button
          size="xs"
          variant="ghost"
          color="#888"
          fontWeight="600"
          h="28px"
          px={2}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => handleInsert("**", "**")}
        >
          B
        </Button>
        <Button
          size="xs"
          variant="ghost"
          color="#888"
          fontStyle="italic"
          h="28px"
          px={2}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => handleInsert("*", "*")}
        >
          I
        </Button>
        <Button
          size="xs"
          variant="ghost"
          color="#888"
          h="28px"
          px={2}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => handleInsert("~~", "~~")}
        >
          S
        </Button>
        <Button
          size="xs"
          variant="ghost"
          color="#888"
          h="28px"
          px={2}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => handleInsert("\n- ")}
        >
          List
        </Button>
        <Button
          size="xs"
          variant="ghost"
          color="#888"
          h="28px"
          px={2}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => handleInsert("\n> ")}
        >
          Quote
        </Button>
        <Button
          size="xs"
          variant="ghost"
          color="#888"
          h="28px"
          px={2}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => handleInsert("`", "`")}
        >
          Code
        </Button>
        <Box w="1px" h="18px" bg="rgba(255,255,255,0.08)" mx={1} />
        <IconButton
          aria-label="Toggle split view"
          icon={<FaColumns />}
          size="sm"
          variant="ghost"
          color={splitView ? "#6a9e6a" : "#888"}
          bg={splitView ? "rgba(106,158,106,0.1)" : "transparent"}
          _hover={{ color: "#fff", bg: "rgba(255,255,255,0.06)" }}
          onClick={() => setSplitView(!splitView)}
        />
      </HStack>

      {splitView ? (
        <Flex flex={1} overflow="hidden">
          <Box flex={`0 0 ${splitPosition}%`} height="100%" borderRight="1px solid rgba(255,255,255,0.08)" display="flex" flexDirection="column">
            <Box overflow="auto" flex={1} width="100%">
              <Textarea
                id="markdown-textarea"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your content here..."
                variant="unstyled"
                resize="none"
                width="100%"
                height="100%"
                p={4}
                fontSize="16px"
                lineHeight="1.7"
                fontFamily="inherit"
                bg="transparent"
                border="none"
                color="#d8d8d8"
                _placeholder={{ color: "#666" }}
                _focus={{ outline: "none", boxShadow: "none" }}
                sx={{
                  "&::placeholder": { color: "#666 !important" },
                  "&:focus": { outline: "none !important", boxShadow: "none !important" },
                }}
                style={{ caretColor: "#6a9e6a" }}
              />
            </Box>
          </Box>
          <Box flex={`0 0 ${100 - splitPosition}%`} height="100%" bg="#16191f" overflow="auto" p={4}>
            <Text
              fontSize="11px"
              color="#666"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.1em"
              mb={3}
            >
              Preview
            </Text>
            <Box color="#d8d8d8" fontSize="15px" lineHeight="1.7">
              <HiveMarkdown markdown={markdown} />
            </Box>
          </Box>
          <Box
            position="absolute"
            left={`${splitPosition}%`}
            top={0}
            bottom={0}
            width="6px"
            cursor="col-resize"
            bg="transparent"
            transform="translateX(-50%)"
            zIndex={10}
            _hover={{ bg: "rgba(106,158,106,0.3)" }}
            onMouseDown={handleSplitMouseDown}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box w="2px" h="40px" bg="#6a9e6a" borderRadius="1px" opacity={0.5} />
          </Box>
        </Flex>
      ) : (
        <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
          <Box overflow="auto" flex={1} width="100%">
            <Textarea
            id="markdown-textarea"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Write your content here..."
            variant="unstyled"
            resize="none"
            width="100%"
            height="100%"
            p={4}
            fontSize="16px"
            lineHeight="1.7"
            fontFamily="inherit"
            bg="transparent"
            border="none"
            color="#d8d8d8"
            _placeholder={{ color: "#666" }}
            _focus={{ outline: "none", boxShadow: "none" }}
            sx={{
              "&::placeholder": { color: "#666 !important" },
              "&:focus": { outline: "none !important", boxShadow: "none !important" },
            }}
            style={{ caretColor: "#6a9e6a" }}
          />
          </Box>
        </Box>
      )}

      {previewMode === "preview" && !splitView && (
        <Box
          p={4}
          bg="#16191f"
          borderTop="1px solid rgba(255,255,255,0.06)"
          maxHeight="50%"
          overflow="auto"
        >
          <HiveMarkdown markdown={markdown} />
        </Box>
      )}

      <GIFMakerWithSelector
        ref={gifMakerWithSelectorRef}
        isOpen={isGifMakerOpen}
        onClose={() => {
          gifMakerWithSelectorRef.current?.reset();
          setGifMakerOpen(false);
        }}
        asModal={true}
        onGifCreated={handleGifCreated}
        onUpload={() => {}}
        isProcessing={false}
      />
    </Box>
  );
}
