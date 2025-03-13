'use client';
import { Box, Skeleton, SimpleGrid, Flex } from '@chakra-ui/react';
import InfiniteScroll from 'react-infinite-scroll-component';
import PostGrid from '@/components/blog/PostGrid';
import { Discussion } from '@hiveio/dhive';

interface PostsInfiniteScrollProps {
    allPosts: Discussion[];
    fetchPosts: () => Promise<void>;
    viewMode: 'grid' | 'list';
}

export default function PostsInfiniteScroll({ allPosts, fetchPosts, viewMode }: PostsInfiniteScrollProps) {
    const hasMore = allPosts.length % 12 === 0; // Adjust this logic based on your pagination

    return (
        <InfiniteScroll
            dataLength={allPosts.length}
            next={fetchPosts}
            hasMore={hasMore}
            loader={
                <SimpleGrid columns={viewMode === 'grid' ? 3 : 1} spacing={4}>
                    {Array(6).fill(0).map((_, i) => (
                        <Box key={i} borderWidth="1px" borderRadius="base" overflow="hidden" p={4} border="tb1">
                            {/* New skeleton header for profile pic and post author */}
                            <Flex alignItems="center" mb={4}>
                                <Skeleton startColor="background" endColor="muted" borderRadius="full" width="40px" height="40px" mr={3} />
                                <Skeleton startColor="background" endColor="muted" height="20px" width="100px" />
                            </Flex>
                            <Skeleton startColor="background" endColor="muted" height="200px" mb={4} />
                            <Skeleton startColor="background" endColor="muted" height="20px" mb={2} />
                            <Skeleton startColor="background" endColor="muted" height="20px" width="60%" />
                        </Box>
                    ))}
                </SimpleGrid>
            }
            scrollableTarget="scrollableDiv"
        >
            {allPosts && (<PostGrid posts={allPosts ?? []} columns={viewMode === 'grid' ? 3 : 1} />)}
        </InfiniteScroll>
    );
}
