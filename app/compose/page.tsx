"use client";
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
} from "@chakra-ui/react";
import { useState, useMemo, useRef, useEffect } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useDropzone } from "react-dropzone";
import { FaImage } from "react-icons/fa";
import VideoRenderer from "../../components/layout/VideoRenderer";
import { Components } from "@uiw/react-markdown-preview";

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

  const placeholders = [
    "Enter post title...",
    "What's on your mind?",
    "Share your story...",
    "Write a banging title here...",
    "Got any new tricks to share?",
    "What did you skate today?",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const insertAtCursor = (content: string) => {
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
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
    try {
      await aioha.comment(null, communityTag, permlink, title, markdown, {
        tags: hashtags,
        app: "Skatehive App 3.0",
      });
      console.log("Post submitted successfully");
    } catch (error) {
      console.error("Failed to submit post:", error);
    }
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
            insertAtCursor(`\n<iframe src="${url}" frameborder="0" allowfullscreen></iframe>\n`);
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

  const extraCommands = [
    {
      name: "uploadImage",
      keyCommand: "uploadImage",
      buttonProps: { "aria-label": "Upload image" },
      icon: (
        <Tooltip label="Upload Image or Video" placement="left">
          <span>
            <FaImage color="primary" />
          </span>
        </Tooltip>
      ),
      execute: (state: any, api: any) => {
        const element = document.getElementById("md-image-upload");
        if (element) {
          element.click();
        }
      },
    },
  ];

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
      <Input
        placeholder={placeholders[placeholderIndex]}
        mb="4"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="lg"
        borderRadius="base"
        fontSize="3xl"
        fontWeight="bold"
        _placeholder={{ fontSize: "3xl" }}
        maxLength={123}
        sx={{
          '&::placeholder': {
            transition: 'opacity 0.3s ease-in-out',
            opacity: 0.7,
          },
          '&:focus::placeholder': {
            opacity: 0.3,
          }
        }}
      />
      {isUploading && (
        <Center>
          <Spinner />
        </Center>
      )}
      <Flex
        flex="1"
        border="1px solid"
        borderColor="black"
        borderRadius="base"
        justify="center"
        overflow="hidden"
        width="100%"
        {...getRootProps()}
      >
        <input
          {...getInputProps()}
          id="md-image-upload"
          style={{ display: "none" }}
        />
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
        <Button size="sm" colorScheme="blue">
          Advanced
        </Button>
        <Button size="sm" colorScheme="blue" onClick={handleSubmit}>
          Submit
        </Button>
      </Flex>
    </Flex>
  );
}
