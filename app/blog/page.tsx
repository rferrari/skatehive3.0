'use client';
import { Container, Box } from '@chakra-ui/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Discussion } from '@hiveio/dhive';
import { findPosts } from '@/lib/hive/client-functions';
import TopBar from '@/components/blog/TopBar';
import PostInfiniteScroll from '@/components/blog/PostInfiniteScroll';
import { useSearchParams } from 'next/navigation';

export default function Blog() {
    const searchParams = useSearchParams();
    const initialView = searchParams?.get('view');
    const validViews = ['grid', 'list', 'magazine'];
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'magazine'>(
        validViews.includes(initialView as string) ? (initialView as 'grid' | 'list' | 'magazine') : 'grid'
    );
    const [query, setQuery] = useState("created");
    const [allPosts, setAllPosts] = useState<Discussion[]>([]);
    const isFetching = useRef(false);

    const tag = process.env.NEXT_PUBLIC_HIVE_SEARCH_TAG

    const params = useRef([
        {
            tag: tag,
            limit: 12,
            start_author: '',
            start_permlink: '',
        }
    ]);

    // 1. Move fetchPosts outside and wrap in useCallback
    const fetchPosts = useCallback(async () => {
        if (isFetching.current) return; // Prevent multiple fetches
        isFetching.current = true;
        try {
            const posts = await findPosts(query, params.current);
            if (posts.length > 0) {
                setAllPosts(prevPosts => [...prevPosts, ...posts]);
                params.current = [{
                    tag: tag,
                    limit: 12,
                    start_author: posts[posts.length - 1].author,
                    start_permlink: posts[posts.length - 1].permlink,
                }];
            }
        } catch (error) {
            console.log(error);
        } finally {
            isFetching.current = false;
        }
    }, [query, tag]);

    useEffect(() => {
        setAllPosts([]);
        params.current = [{
            tag: tag,
            limit: 12,
            start_author: '',
            start_permlink: '',
        }];
        fetchPosts();
    }, [fetchPosts, tag]);

    // Detect mobile and force grid view
    useEffect(() => {
        function handleResize() {
            if (typeof window !== 'undefined') {
                if (window.innerWidth < 768) {
                    setViewMode('grid');
                }
            }
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Box
            id="scrollableDiv"
            maxW="container.lg"
            mx="auto"
            maxH="100vh"
            overflowY="auto"
            p={0}
            sx={{
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
            }}
        >
            <TopBar viewMode={viewMode} setViewMode={(mode) => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setViewMode('grid');
                } else {
                    setViewMode(mode);
                }
            }} setQuery={setQuery} />
            <PostInfiniteScroll allPosts={allPosts} fetchPosts={fetchPosts} viewMode={viewMode} context="blog" />
        </Box>
    );
}
