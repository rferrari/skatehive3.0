"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Discussion } from '@hiveio/dhive';
import HiveClient from '@/lib/hive/hiveclient';
import { validateHiveUsernameFormat } from '@/lib/utils/hiveAccountUtils';
import { filterAutoComments } from '@/lib/utils/postUtils';

// Debug utility - disabled for production
const debug = (...args: any[]) => {
    // Disabled for production
};

export default function useUserSnaps(username: string) {
    const [snaps, setSnaps] = useState<Discussion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const fetchedPermlinksRef = useRef<Set<string>>(new Set());
    const initialLoadDoneRef = useRef<boolean>(false);

    const resetSnaps = useCallback(() => {
        setSnaps([]);
        setHasMore(true);
        fetchedPermlinksRef.current.clear();
        initialLoadDoneRef.current = false;
    }, []);

    // Filter snaps to only include those with images or videos and good quality content
    const filterMediaSnaps = (snaps: Discussion[]): Discussion[] => {
        // First apply quality filters (reputation and downvote filtering)
        const qualityFilteredSnaps = filterAutoComments(snaps);

        // Then filter for media content
        return qualityFilteredSnaps.filter(snap => {
            try {
                const body = snap.body || '';

                // Only check for two patterns:
                // 1. Markdown image syntax: ![alt](url) → Images
                const hasMarkdownImages = /!\[.*?\]\([^\)]+\)/gi.test(body);

                // 2. HTML iframe tags → Videos
                const hasIframes = /<iframe[^>]*>/gi.test(body);

                const result = hasMarkdownImages || hasIframes;

                // Debug logging for each snap
                // if (body.length > 0) {
                //     debug(`Media check for snap ${snap.permlink}:`, {
                //         hasMarkdownImages,
                //         hasIframes,
                //         result,
                //         bodyPreview: body.substring(0, 200)
                //     });
                // }

                return result;
            } catch (error) {
                return false;
            }
        });
    };

    // Extract media URLs from snap body content
    const extractMediaFromSnap = (snap: Discussion) => {
        try {
            const body = snap.body || '';
            const allImages: string[] = [];
            const allVideos: string[] = [];

            // 1. Extract URLs from markdown image syntax ![alt](url) → Images
            const markdownImagePattern = /!\[.*?\]\(([^\)]+)\)/gi;
            let match;
            while ((match = markdownImagePattern.exec(body)) !== null) {
                allImages.push(match[1]);
            }

            // 2. Extract src from iframes → Videos
            const iframeSrcPattern = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
            while ((match = iframeSrcPattern.exec(body)) !== null) {
                allVideos.push(match[1]);
            }

            // Deduplicate and ensure proper URLs
            const uniqueImages = [...new Set(allImages)].map(url =>
                url.startsWith('http') ? url : `https://${url}`
            );
            const uniqueVideos = [...new Set(allVideos)].map(url =>
                url.startsWith('http') ? url : `https://${url}`
            );

            return {
                images: uniqueImages,
                videos: uniqueVideos,
                hasMedia: uniqueImages.length > 0 || uniqueVideos.length > 0
            };
        } catch (error) {
            return { images: [], videos: [], hasMedia: false };
        }
    };

    const fetchUserSnapsFromHive = async (username: string): Promise<Discussion[]> => {
        try {
            const tag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || '';
            const limit = 20;

            // Get user's posts from Hive blockchain
            const posts = await HiveClient.database.call('get_discussions_by_author_before_date', [
                username,
                '', // No specific permlink for first call
                new Date().toISOString(),
                limit,
            ]);

            if (!posts.length) {
                debug(`No posts found for user ${username} on Hive blockchain`);
                // Return empty array but don't throw error - this is a valid result
                return [];
            }

            // Filter posts that match our community tag if specified
            const filteredPosts = tag ? posts.filter((post: any) => {
                try {
                    const metadata = JSON.parse(post.json_metadata || '{}');
                    const tags = metadata.tags || [];
                    return tags.includes(tag);
                } catch {
                    return false;
                }
            }) : posts;

            debug(`Hive blockchain: Found ${posts.length} total posts, ${filteredPosts.length} matching tag "${tag}" for user ${username}`);

            // Convert to Discussion format
            const discussions: Discussion[] = filteredPosts.map((post: any) => ({
                ...post,
                json_metadata: typeof post.json_metadata === 'string'
                    ? post.json_metadata
                    : JSON.stringify(post.json_metadata || {})
            }));

            // Filter for media snaps
            const mediaSnaps = filterMediaSnaps(discussions);

            debug(`Hive blockchain: Found ${filteredPosts.length} posts, ${mediaSnaps.length} with media for user ${username}`);

            return mediaSnaps;
        } catch (error) {
            throw error;
        }
    };

    const fetchUserSnapsFromAPI = async (username: string): Promise<Discussion[]> => {
        // For the first load, get all posts without pagination
        // The API seems to work better without pagination parameters
        let apiUrl = `https://api.skatehive.app/api/v2/feed/${encodeURIComponent(username)}`;

        // Only add pagination if we already have snaps (for potential future pagination)
        if (snaps.length > 0) {
            const limit = 20;
            const currentPage = Math.floor(snaps.length / limit) + 1;
            apiUrl += `?limit=${encodeURIComponent(limit.toString())}&page=${encodeURIComponent(currentPage.toString())}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        // debug('User feed API response:', data);

        // Handle different possible response structures
        let userSnaps = [];
        if (data.data && Array.isArray(data.data)) {
            userSnaps = data.data;
        } else if (Array.isArray(data)) {
            userSnaps = data;
        } else if (data.posts && Array.isArray(data.posts)) {
            userSnaps = data.posts;
        } else if (data.result && Array.isArray(data.result)) {
            userSnaps = data.result;
        } else {
            return [];
        }

        // debug(`Found ${userSnaps.length} total snaps for user ${username}`);

        if (userSnaps.length === 0) {
            setHasMore(false);
            return [];
        }

        // Filter out already fetched snaps
        const newSnaps = userSnaps.filter((snap: any) => {
            return snap && snap.permlink && !fetchedPermlinksRef.current.has(snap.permlink);
        });

        // debug(`${newSnaps.length} new snaps after deduplication`);

        if (newSnaps.length > 0) {
            // debug('New user snaps:', newSnaps.map((snap: any) => ({
            //     author: snap.author,
            //     permlink: snap.permlink,
            //     created: snap.created,
            //     bodyPreview: (snap.body || '').substring(0, 200),
            //     hasBody: !!(snap.body),
            //     hasIframe: /<iframe[^>]*>/gi.test(snap.body || ''),
            //     hasMarkdown: /!\[.*?\]\([^\)]+\)/gi.test(snap.body || ''),
            //     hasIpfs: /ipfs\.skatehive\.app/gi.test(snap.body || ''),
            //     hasImagesHive: /images\.hive\.blog/gi.test(snap.body || '')
            // })));

            // Convert to Discussion format
            const discussions: Discussion[] = newSnaps.map((snap: any) => ({
                ...snap,
                json_metadata: (() => {
                    if (snap.post_json_metadata) {
                        return JSON.stringify(snap.post_json_metadata);
                    } else if (typeof snap.json_metadata === 'string') {
                        return snap.json_metadata;
                    } else if (typeof snap.json_metadata === 'object') {
                        return JSON.stringify(snap.json_metadata || {});
                    } else {
                        return JSON.stringify({});
                    }
                })()
            }));

            // Filter for media snaps
            const mediaSnaps = filterMediaSnaps(discussions);

            // debug(`Filtered to ${mediaSnaps.length} snaps with media`);

            // if (mediaSnaps.length > 0) {
            //     debug('Media snaps with extracted media:', mediaSnaps.map(snap => ({
            //         author: snap.author,
            //         permlink: snap.permlink,
            //         bodyPreview: snap.body.substring(0, 200),
            //         media: extractMediaFromSnap(snap)
            //     })));
            // } else if (newSnaps.length > 0) {
            //     debug('Snaps filtered out (no media detected):', newSnaps.map((snap: any) => ({
            //         author: snap.author,
            //         permlink: snap.permlink,
            //         bodyPreview: (snap.body || '').substring(0, 200),
            //         bodyFull: snap.body,
            //         hasIpfsSkate: /ipfs\.skatehive\.app/gi.test(snap.body || ''),
            //         hasImagesHive: /images\.hive\.blog/gi.test(snap.body || ''),
            //         hasMarkdown: /!\[.*?\]\([^\)]+\)/gi.test(snap.body || ''),
            //         hasIframe: /<iframe[^>]*>/gi.test(snap.body || '')
            //     })));
            // }

            // Mark as fetched
            mediaSnaps.forEach(snap => {
                fetchedPermlinksRef.current.add(snap.permlink);
            });

            // Check if we've reached the end
            // Since we're fetching all at once initially, disable pagination
            if (snaps.length === 0) {
                // First load - we got all the user's posts
                setHasMore(false);
            } else {
                // Future pagination logic (if needed)
                setHasMore(false);
            }

            return mediaSnaps;
        } else {
            // No new snaps, we've probably reached the end
            setHasMore(false);
            return [];
        }
    };

    const fetchUserSnaps = useCallback(async (): Promise<Discussion[]> => {
        // Validate username to prevent injection attacks
        if (!username || typeof username !== 'string') {
            return [];
        }

        // Validate username format using centralized validation
        const validation = validateHiveUsernameFormat(username);
        if (!validation.isValid) {
            return [];
        }

        try {
            let userSnaps: Discussion[] = [];

            // Try API method first
            try {
                userSnaps = await fetchUserSnapsFromAPI(username);

                // If API returns no results, try Hive blockchain as fallback
                if (userSnaps.length === 0) {
                    try {
                        userSnaps = await fetchUserSnapsFromHive(username);
                    } catch (hiveError) {
                        // Still return empty array from API rather than failing completely
                    }
                }
            } catch (apiError) {
                // Fallback to Hive blockchain if API method fails
                try {
                    userSnaps = await fetchUserSnapsFromHive(username);
                } catch (hiveError) {
                    setHasMore(false);
                    return [];
                }
            }

            return userSnaps;
        } catch (error) {
            setHasMore(false);
            return [];
        }
    }, [username]);

    const loadMoreSnaps = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const newSnaps = await fetchUserSnaps();

            if (newSnaps.length === 0) {
                setHasMore(false);
            } else {
                setSnaps(prevSnaps => {
                    const existingPermlinks = new Set(prevSnaps.map(snap => snap.permlink));
                    const uniqueSnaps = newSnaps.filter(snap => !existingPermlinks.has(snap.permlink));
                    return [...prevSnaps, ...uniqueSnaps];
                });
            }
        } catch (error) {
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, fetchUserSnaps]);

    // Reset when username changes
    useEffect(() => {
        resetSnaps();
    }, [username]);

    // Load initial snaps - only once per username
    useEffect(() => {
        if (username && !isLoading && !initialLoadDoneRef.current) {
            initialLoadDoneRef.current = true;
            loadMoreSnaps();
        }
    }, [username, isLoading, loadMoreSnaps]);

    return {
        snaps: snaps.map(snap => ({
            ...snap,
            media: extractMediaFromSnap(snap)
        })),
        isLoading,
        hasMore,
        loadMoreSnaps,
        resetSnaps
    };
}
