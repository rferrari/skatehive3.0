import React, { useMemo } from "react";
import { Box } from "@chakra-ui/react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useDropzone } from "react-dropzone";
import { Components } from "@uiw/react-markdown-preview";
import VideoRenderer from "../layout/VideoRenderer";
import HiveMarkdown from "../shared/HiveMarkdown";

interface MarkdownEditorProps {
    markdown: string;
    setMarkdown: (value: string) => void;
    onDrop: (acceptedFiles: File[]) => void;
    isDragActive: boolean;
    previewMode: "edit" | "preview" | "live";
}

export default function MarkdownEditor({
    markdown,
    setMarkdown,
    onDrop,
    isDragActive,
    previewMode,
}: MarkdownEditorProps) {
    const { getRootProps } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".gif", ".jpeg", ".jpg", ".webp"],
            "video/*": [".mp4", ".mov"],
        },
        multiple: false,
    });

    const headerCommand = {
        name: "header",
        keyCommand: "header",
        buttonProps: { "aria-label": "Insert Header" },
        icon: <span style={{ fontWeight: "bold", fontSize: 18 }}>H</span>,
        execute: (
            state: import("@uiw/react-md-editor").TextState,
            api: import("@uiw/react-md-editor").TextAreaTextApi
        ) => {
            api.replaceSelection("# Header\n");
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
        []
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
        </Box>
    );
}
