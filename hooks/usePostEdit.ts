import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { useAioha } from "@aioha/react-ui";
import { KeyTypes } from "@aioha/aioha";
import { Discussion, Operation } from "@hiveio/dhive";

export const usePostEdit = (discussion: Discussion) => {
    const { aioha, user } = useAioha();
    const toast = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(discussion.body);
    const [isSaving, setIsSaving] = useState(false);

    const handleEditClick = useCallback(() => {
        setEditedContent(discussion.body);
        setIsEditing(true);
    }, [discussion.body]);

    const handleCancelEdit = useCallback(() => {
        setEditedContent(discussion.body);
        setIsEditing(false);
    }, [discussion.body]);

    const handleSaveEdit = useCallback(async () => {
        if (!user || editedContent === discussion.body) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);

        try {
            // Check if no changes were made
            if (editedContent.trim() === discussion.body.trim()) {
                toast({
                    title: "No changes detected",
                    description: "Please make some changes before saving.",
                    status: "warning",
                    duration: 3000,
                    isClosable: true,
                });
                setIsSaving(false);
                return;
            }

            // Parse existing metadata
            let parsedMetadata: any = {};
            try {
                parsedMetadata = JSON.parse(discussion.json_metadata || '{}');
            } catch (e) {
                console.warn('Failed to parse existing metadata, using empty object');
            }

            const operation: Operation = [
                "comment",
                {
                    parent_author: discussion.parent_author || "",
                    parent_permlink: discussion.parent_permlink || "",
                    author: user,
                    permlink: discussion.permlink,
                    title: discussion.title || "",
                    body: editedContent,
                    json_metadata: JSON.stringify(parsedMetadata),
                },
            ];


            // Use aioha to broadcast the edit
            const result = await aioha.signAndBroadcastTx([operation], KeyTypes.Posting);


            if (result && !result.error) {
                toast({
                    title: "Post updated successfully!",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });

                // Update the local discussion body
                discussion.body = editedContent;
                setIsEditing(false);
            } else {
                const errorMessage = result?.error?.message || result?.message || "Failed to update post";
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error("Error updating post:", error);
            toast({
                title: "Failed to update post",
                description: error.message || "An unknown error occurred",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    }, [user, editedContent, discussion, aioha, toast]);

    return {
        isEditing,
        editedContent,
        isSaving,
        setEditedContent,
        handleEditClick,
        handleCancelEdit,
        handleSaveEdit,
    };
};
