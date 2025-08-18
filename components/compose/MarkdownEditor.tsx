import React, { useMemo, useState, useRef, useEffect } from "react";
import { Box, Button, HStack, IconButton } from "@chakra-ui/react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useDropzone } from "react-dropzone";
import { Components } from "@uiw/react-markdown-preview";
import VideoRenderer from "../layout/VideoRenderer";
import HiveMarkdown from "../shared/HiveMarkdown";
import { FaImage, FaVideo } from "react-icons/fa";
import { TbGif } from "react-icons/tb";
import MatrixOverlay from "../graphics/MatrixOverlay";
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
    // GIF functionality state
    const [isGifMakerOpen, setGifMakerOpen] = useState(false);
    const gifMakerWithSelectorRef = useRef<GIFMakerWithSelectorRef>(null);
    
    // Client-side mounting state to prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);
    
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

    // GIF handlers
    const handleGifCreated = async (gifBlob: Blob, fileName: string) => {
        // Ensure the filename has .gif extension
        const gifFileName = fileName.endsWith('.gif') ? fileName : `${fileName}.gif`;
        
        // If a handleGifUpload function is provided, use it for proper IPFS upload
        if (handleGifUpload) {
            try {
                await handleGifUpload(gifBlob, gifFileName);
            } catch (error) {
                console.error("Error uploading GIF:", error);
                // Fallback to blob URL if upload fails
                const gifUrl = URL.createObjectURL(gifBlob);
                if (insertAtCursor) {
                    insertAtCursor(`\n![${gifFileName}](${gifUrl})\n`);
                } else {
                    setMarkdown(prev => prev + `\n![${gifFileName}](${gifUrl})\n`);
                }
            }
        } else {
            // Fallback: create a blob URL for immediate display
            const gifUrl = URL.createObjectURL(gifBlob);
            if (insertAtCursor) {
                insertAtCursor(`\n![${gifFileName}](${gifUrl})\n`);
            } else {
                setMarkdown(prev => prev + `\n![${gifFileName}](${gifUrl})\n`);
            }
        }
    };

    const headerCommand = {
        name: "header",
        keyCommand: "header",
        buttonProps: { "aria-label": "Insert Header" },
        icon: <span style={{ fontWeight: "bold", fontSize: 22 }}>H</span>,
        execute: (
            state: import("@uiw/react-md-editor").TextState,
            api: import("@uiw/react-md-editor").TextAreaTextApi
        ) => {
            api.replaceSelection("# Header\n");
        },
    };

    // Media upload commands
    const imageCommand = {
        name: "image",
        keyCommand: "image",
        buttonProps: { "aria-label": "Upload Image" },
        icon: <FaImage size={20} />,
        execute: () => {
            if (handleImageTrigger) {
                handleImageTrigger();
            }
        },
    };

    const videoCommand = {
        name: "video", 
        keyCommand: "video",
        buttonProps: { "aria-label": "Upload Video" },
        icon: <FaVideo size={20} />,
        execute: () => {
            if (handleVideoTrigger) {
                handleVideoTrigger();
            }
        },
    };

    const gifCommand = {
        name: "gif",
        keyCommand: "gif", 
        buttonProps: { "aria-label": "Create GIF" },
        icon: <TbGif size={20} />,
        execute: () => {
            // Reset the GIF maker before opening
            gifMakerWithSelectorRef.current?.reset();
            setGifMakerOpen(true);
        },
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
                // Default anchor rendering
                return (
                    <a href={href} {...props}>
                        {children}
                    </a>
                );
            },
            text: ({ children }) => {
                if (typeof children === "string") {
                    // Replace @username with a link to /@username
                    const parts = children.split(/(@[a-zA-Z0-9._-]+)/g);
                    return parts.map((part, i) => {
                        if (/^@[a-zA-Z0-9._-]+$/.test(part)) {
                            const username = part.slice(1);
                            return (
                                <a
                                    key={i}
                                    href={`/@${username}`}
                                    style={{ color: "#3182ce", textDecoration: "underline" }}
                                >
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
        [markdown, setMarkdown]
    );

    return (
        <Box
            {...getRootProps()}
            position="relative"
            width="100%"
            height="100%"
            border={
                isDragActive
                    ? "2px dashed var(--chakra-colors-primary, limegreen)"
                    : undefined
            }
            transition="border 0.2s"
        >
            <MDEditor
                value={markdown}
                onChange={(value) => setMarkdown(value || "")}
                height="100%"
                data-color-mode="dark"
                extraCommands={[]}
                preview={previewMode}
                components={memoizedComponents}
                commands={[
                    ...(isMounted && user ? [imageCommand, videoCommand, gifCommand] : []),
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
            {/* Custom preview using Hive renderer when in preview mode */}
            {previewMode === "preview" && <HiveMarkdown markdown={markdown} />}
            
            {/* GIF Maker Modal */}
            <GIFMakerWithSelector
                ref={gifMakerWithSelectorRef}
                isOpen={isGifMakerOpen}
                onClose={() => {
                    // Reset the GIF maker when closing
                    gifMakerWithSelectorRef.current?.reset();
                    setGifMakerOpen(false);
                }}
                asModal={true}
                onGifCreated={handleGifCreated}
                onUpload={() => {}} // Not used with onGifCreated
                isProcessing={false}
            />
            

        </Box>
    );
}
