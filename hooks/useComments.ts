'use client'
import HiveClient from "@/lib/hive/hiveclient"
import { useCallback, useEffect, useState } from "react"
import { Discussion } from "@hiveio/dhive"


export interface ListCommentsParams {
    start: []
    limit: number
    order: string
}

async function fetchComments(
    author: string,
    permlink: string,
    recursive: boolean = false
): Promise<Discussion[]> {
    try {
        /*
        const params = {
            start: [author, permlink, "", ""],
            limit: 10,
            order: "by_parent"
          };
          
        const temp = await HiveClient.call("database_api", "list_comments", params);
        console.log(temp.comments)
        const comments = temp.comments
        */

        const comments = (await HiveClient.database.call("get_content_replies", [
            author,
            permlink,
        ])) as Discussion[];

        if (recursive) {
            const fetchReplies = async (Discussion: Discussion): Promise<Discussion> => {
                if (Discussion.children && Discussion.children > 0) {
                    Discussion.replies = await fetchComments(Discussion.author, Discussion.permlink, true) as any;
                }
                return Discussion;
            };
            const commentsWithReplies = await Promise.all(comments.map(fetchReplies));
            return commentsWithReplies;
        } else {
            return comments;
        }
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return [];
    }
}

export function useComments(
    author: string,
    permlink: string,
    recursive: boolean = false
) {
    const [comments, setComments] = useState<Discussion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAndUpdateComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedComments = await fetchComments(author, permlink, recursive);
            setComments(fetchedComments);
            setIsLoading(false);
        } catch (err: any) {
            setError(err.message ? err.message : "Error loading comments");
            console.error(err);
            setIsLoading(false);
        }
    }, [author, permlink, recursive]);

    useEffect(() => {
        fetchAndUpdateComments();
    }, [fetchAndUpdateComments]);

    const addComment = useCallback((newComment: Discussion) => {
        setComments((existingComments) => [...existingComments, newComment]);
    }, []);

    const updateComments = useCallback(async () => {
        await fetchAndUpdateComments();
    }, [fetchAndUpdateComments]);

    return {
        comments,
        error,
        isLoading,
        addComment,
        updateComments,
    };
}
