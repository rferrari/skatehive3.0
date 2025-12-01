"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { findPosts } from "@/lib/hive/client-functions";

export default function useProfilePosts(username: string) {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isFetching = useRef(false);
    const params = useRef([
        username,
        "",
        new Date().toISOString().split(".")[0],
        20, // Bridge API max limit
    ]);

    const fetchPosts = useCallback(async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
            const newPosts = await findPosts("author_before_date", params.current);
            if (newPosts && newPosts.length > 0) {
                setPosts((prevPosts) => [...prevPosts, ...newPosts]);
                params.current = [
                    username,
                    newPosts[newPosts.length - 1].permlink,
                    newPosts[newPosts.length - 1].created,
                    20, // Bridge API max limit
                ];
            }
            setIsLoading(false);
            isFetching.current = false;
        } catch (err) {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [username]);

    // Reset posts when username changes
    useEffect(() => {
        setPosts([]);
        setIsLoading(true);
        params.current = [username, "", new Date().toISOString().split(".")[0], 20];
        fetchPosts();
    }, [username, fetchPosts]);

    return { posts, fetchPosts, isLoading };
}
