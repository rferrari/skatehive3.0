"use client";
import { useState, useEffect, useCallback } from "react";
import { checkFollow } from "@/lib/hive/client-functions";

export default function useFollowStatus(user: string | null, username: string) {
    const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        if (user && username && user !== username) {
            let isMounted = true; // Flag to prevent state updates after component unmount

            setIsFollowLoading(true);

            checkFollow(user, username)
                .then((res) => {
                    if (isMounted) {
                        setIsFollowing(res);
                    }
                })
                .catch((error) => {
                    if (isMounted) {
                        // Distinguish different error types
                        if (error.name === 'AbortError') {
                            // Request was cancelled, don't update state
                            console.log('Follow status check was cancelled');
                        } else if (error.response?.status === 404) {
                            // User not found
                            console.warn('User not found:', username);
                            setIsFollowing(false);
                        } else if (error.response?.status >= 500) {
                            // Server error
                            console.error('Server error checking follow status:', error);
                            setIsFollowing(null); // Keep unknown state
                        } else {
                            // Other errors (network, etc.)
                            console.error('Error checking follow status:', error);
                            setIsFollowing(false);
                        }
                    }
                })
                .finally(() => {
                    if (isMounted) {
                        setIsFollowLoading(false);
                    }
                });

            // Cleanup function to prevent race conditions
            return () => {
                isMounted = false;
            };
        } else {
            setIsFollowing(null);
            setIsFollowLoading(false);
        }
    }, [user, username]);

    const updateFollowing = useCallback((following: boolean | null) => {
        setIsFollowing(following);
    }, []);

    const updateLoading = useCallback((loading: boolean) => {
        setIsFollowLoading(loading);
    }, []);

    return {
        isFollowing,
        isFollowLoading,
        updateFollowing,
        updateLoading,
    };
}
