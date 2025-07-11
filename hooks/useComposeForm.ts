import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { generatePermlink, prepareImageArray, insertAtCursor } from "@/lib/utils/composeUtils";

export const useComposeForm = () => {
    const [markdown, setMarkdown] = useState("");
    const [title, setTitle] = useState("");
    const [hashtagInput, setHashtagInput] = useState("");
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "live">("live");
    const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { aioha, user } = useAioha();
    const toast = useToast();
    const router = useRouter();
    const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "blog";

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

    const insertAtCursorWrapper = (content: string) => {
        insertAtCursor(content, markdown, setMarkdown);
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

        if (!title.trim()) {
            toast({
                title: "Please enter a title for your post.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);

        const imageArray = prepareImageArray(markdown, selectedThumbnail);
        const permlink = generatePermlink(title);

        try {
            // Show toast indicating we're waiting for keychain confirmation
            toast({
                title: "Please confirm the transaction in Keychain...",
                status: "info",
                duration: 3000,
                isClosable: true,
            });

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
                    description: "Redirecting to home page...",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });

                // Clear form
                setMarkdown("");
                setTitle("");
                setHashtags([]);
                setHashtagInput("");
                setSelectedThumbnail(null);

                // Wait a moment for the user to see the success message, then redirect
                setTimeout(() => {
                    router.push("/");
                }, 1500);
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

            // Check if the error is due to user cancellation
            if (error?.message?.includes("canceled") || error?.message?.includes("rejected")) {
                toast({
                    title: "Transaction cancelled.",
                    description: "Post submission was cancelled by user.",
                    status: "warning",
                    duration: 4000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: "Failed to submit post.",
                    description: error?.message || String(error),
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        markdown,
        setMarkdown,
        title,
        setTitle,
        hashtagInput,
        setHashtagInput,
        hashtags,
        setHashtags,
        placeholderIndex,
        selectedThumbnail,
        setSelectedThumbnail,
        previewMode,
        setPreviewMode,
        showThumbnailPicker,
        setShowThumbnailPicker,
        placeholders,
        user,
        insertAtCursorWrapper,
        handleSubmit,
        isSubmitting,
    };
};
