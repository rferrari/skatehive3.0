import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { generatePermlink, prepareImageArray, insertAtCursor } from "@/lib/markdown/composeUtils";
import { Beneficiary } from "@/components/compose/BeneficiariesInput";

export const useComposeForm = () => {
    const [markdown, setMarkdown] = useState("");
    const [title, setTitle] = useState("");
    const [hashtagInput, setHashtagInput] = useState("");
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
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
        console.log("🚀 useComposeForm: Starting handleSubmit", {
            user,
            title: title.trim(),
            markdown: markdown.length,
            hashtags,
            beneficiaries,
            beneficiariesCount: beneficiaries.length,
            isSubmitting
        });

        if (!user) {
            console.log("❌ useComposeForm: No user logged in");
            toast({
                title: "You must be logged in to submit a post.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        if (!title.trim()) {
            console.log("❌ useComposeForm: No title provided");
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

        console.log("📝 useComposeForm: Preparing submission", {
            imageArray,
            permlink,
            communityTag,
            beneficiaries,
            beneficiariesCount: beneficiaries.length
        });

        try {
            // Show toast indicating we're waiting for keychain confirmation
            toast({
                title: "Please confirm the transaction in Keychain...",
                status: "info",
                duration: 3000,
                isClosable: true,
            });

            console.log("📤 useComposeForm: Submitting comment to Hive", {
                parentAuthor: null,
                parentPermlink: communityTag,
                permlink,
                title,
                markdownLength: markdown.length,
                jsonMetadata: {
                    tags: hashtags,
                    app: "Skatehive App 3.0",
                    image: imageArray,
                }
            });

            // First, submit the comment
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

            console.log("✅ useComposeForm: Comment submission result", { result });

            if (result && result.success) {
                console.log("🎉 useComposeForm: Comment submitted successfully, checking beneficiaries", {
                    beneficiariesCount: beneficiaries.length,
                    beneficiaries
                });

                // If beneficiaries are set, submit comment_options operation
                if (beneficiaries.length > 0) {
                    console.log("💰 useComposeForm: Processing beneficiaries", { beneficiaries });

                    // Validate beneficiaries before submitting
                    const totalWeight = beneficiaries.reduce((sum, b) => sum + b.weight, 0);
                    console.log("⚖️ useComposeForm: Validating total weight", {
                        totalWeight,
                        totalPercentage: totalWeight / 100,
                        isExceeding: totalWeight > 10000
                    });

                    if (totalWeight > 10000) {
                        throw new Error("Total beneficiary percentage cannot exceed 100%");
                    }

                    // Filter out invalid beneficiaries
                    const validBeneficiaries = beneficiaries.filter(b => 
                        b.account.trim() !== "" && 
                        b.weight > 0 &&
                        /^[a-z][a-z0-9.-]*[a-z0-9]$/.test(b.account) &&
                        b.account.length >= 3 &&
                        b.account.length <= 16
                    );

                    console.log("🔍 useComposeForm: Filtered beneficiaries", {
                        originalCount: beneficiaries.length,
                        validCount: validBeneficiaries.length,
                        original: beneficiaries,
                        valid: validBeneficiaries
                    });

                    if (validBeneficiaries.length > 0) {
                        // Submit comment_options operation for beneficiaries
                        const commentOptionsOp = [
                            "comment_options",
                            {
                                author: user,
                                permlink: permlink,
                                max_accepted_payout: "1000000.000 HBD",
                                percent_hbd: 10000,
                                allow_votes: true,
                                allow_curation_rewards: true,
                                extensions: [
                                    [0, {
                                        beneficiaries: validBeneficiaries.map(b => ({
                                            account: b.account,
                                            weight: b.weight
                                        }))
                                    }]
                                ]
                            }
                        ];

                        console.log("📋 useComposeForm: Preparing comment_options operation", {
                            operation: commentOptionsOp,
                            beneficiariesForHive: validBeneficiaries.map(b => ({
                                account: b.account,
                                weight: b.weight
                            }))
                        });

                        const optionsResult = await aioha.signAndBroadcastTx([commentOptionsOp], KeyTypes.Posting);
                        console.log("📋 useComposeForm: comment_options result", { optionsResult });
                        
                        if (!optionsResult || !optionsResult.success) {
                            console.warn("⚠️ useComposeForm: Failed to set beneficiaries, but post was created successfully", { optionsResult });
                            toast({
                                title: "Post created, but beneficiaries failed to set",
                                description: "Your post was published but beneficiaries could not be applied.",
                                status: "warning",
                                duration: 5000,
                                isClosable: true,
                            });
                        } else {
                            console.log("🎯 useComposeForm: Beneficiaries set successfully");
                        }
                    } else {
                        console.log("⚠️ useComposeForm: No valid beneficiaries found after filtering");
                    }
                } else {
                    console.log("ℹ️ useComposeForm: No beneficiaries to process");
                }

                console.log("🎉 useComposeForm: Showing success message and clearing form");
                
                toast({
                    title: "Post submitted successfully!",
                    description: "Redirecting to home page...",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });

                // Clear form
                console.log("🧹 useComposeForm: Clearing form state");
                setMarkdown("");
                setTitle("");
                setHashtags([]);
                setHashtagInput("");
                setBeneficiaries([]);
                setSelectedThumbnail(null);

                // Wait a moment for the user to see the success message, then redirect
                setTimeout(() => {
                    console.log("🏠 useComposeForm: Redirecting to home page");
                    router.push("/");
                }, 1500);
            } else {
                console.log("❌ useComposeForm: Comment submission failed", { result });
                toast({
                    title: "Failed to submit post.",
                    description: result?.error || "Unknown error.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error: any) {
            console.error("💥 useComposeForm: Error during submission", {
                error,
                errorMessage: error?.message,
                errorType: typeof error,
                beneficiaries,
                beneficiariesCount: beneficiaries.length
            });

            // Check if the error is due to user cancellation
            if (error?.message?.includes("canceled") || error?.message?.includes("rejected")) {
                console.log("🚫 useComposeForm: User cancelled transaction");
                toast({
                    title: "Transaction cancelled.",
                    description: "Post submission was cancelled by user.",
                    status: "warning",
                    duration: 4000,
                    isClosable: true,
                });
            } else {
                console.log("❌ useComposeForm: Submission error");
                toast({
                    title: "Failed to submit post.",
                    description: error?.message || String(error),
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } finally {
            console.log("🏁 useComposeForm: Submission process completed, setting isSubmitting to false");
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
        beneficiaries,
        setBeneficiaries,
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
