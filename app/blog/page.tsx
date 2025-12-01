"use client";
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Discussion } from "@hiveio/dhive";
import { findPosts, getPayoutValue } from "@/lib/hive/client-functions";
import TopBar from "@/components/blog/TopBar";
import PostInfiniteScroll from "@/components/blog/PostInfiniteScroll";
import { useSearchParams, useRouter } from "next/navigation";
import JoinSkatehiveBanner from "@/components/blog/JoinSkatehiveBanner";
import PostGrid from "@/components/blog/PostGrid";
import MagazineModal from "@/components/shared/MagazineModal";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import {
  BLOG_CONFIG,
  VALID_QUERIES,
  VALID_VIEW_MODES,
  type QueryType,
  type ViewMode,
} from "@/constants/blogConfig";

function BlogContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams?.get("view");
  const initialQuery = searchParams?.get("query");

  const [viewMode, setViewMode] = useState<ViewMode>(
    VALID_VIEW_MODES.includes(initialView as ViewMode)
      ? (initialView as ViewMode)
      : "grid"
  );
  const [query, setQuery] = useState<QueryType>(
    VALID_QUERIES.includes(initialQuery as QueryType)
      ? (initialQuery as QueryType)
      : "created"
  );
  const [allPosts, setAllPosts] = useState<Discussion[]>([]);
  const isFetching = useRef(false);
  const [isGoatLoading, setIsGoatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const tag = process.env.NEXT_PUBLIC_HIVE_SEARCH_TAG;

  // Validate required environment variables
  useEffect(() => {
    if (!tag) {
      setError(
        "NEXT_PUBLIC_HIVE_SEARCH_TAG environment variable is not configured"
      );
    }
  }, [tag]);

  const params = useRef([
    {
      tag: tag,
      limit: BLOG_CONFIG.POSTS_PER_PAGE as number,
      start_author: "",
      start_permlink: "",
    },
  ]);

  const fetchGoatPosts = useCallback(async () => {
    if (!tag) {
      setError("Cannot fetch posts: missing search tag configuration");
      return;
    }

    setIsGoatLoading(true);
    setAllPosts([]);
    setError(null);

    params.current = [
      {
        tag: tag,
        limit: BLOG_CONFIG.GOAT_BATCH_SIZE as number,
        start_author: "",
        start_permlink: "",
      },
    ];
    let allFetchedPosts: Discussion[] = [];
    let keepFetching = true;
    let batchCount = 0;

    try {
      while (keepFetching && batchCount < BLOG_CONFIG.MAX_GOAT_BATCHES) {
        const posts = await findPosts("created", params.current);
        if (!posts || posts.length === 0) break;
        allFetchedPosts = [...allFetchedPosts, ...posts];
        // Remove duplicates by permlink
        const uniquePosts = Array.from(
          new Map(
            allFetchedPosts.map((p) => [p.author + "/" + p.permlink, p])
          ).values()
        );
        // Sort by payout
        const sorted = uniquePosts.sort(
          (a, b) => Number(getPayoutValue(b)) - Number(getPayoutValue(a))
        );
        // Show top 12 so far
        setAllPosts(sorted.slice(0, BLOG_CONFIG.POSTS_PER_PAGE));
        // Prepare for next batch
        params.current = [
          {
            tag: tag,
            limit: BLOG_CONFIG.GOAT_BATCH_SIZE as number,
            start_author: posts[posts.length - 1].author,
            start_permlink: posts[posts.length - 1].permlink,
          },
        ];
        batchCount++;
        if (posts.length < BLOG_CONFIG.GOAT_BATCH_SIZE) break;
        // Add delay to avoid rate limits
        await new Promise((res) => setTimeout(res, BLOG_CONFIG.BATCH_DELAY_MS));
      }
    } catch (error) {
      console.error("Failed to fetch GOAT posts:", error);
      setError("Failed to load GOAT posts. Please try again later.");
    } finally {
      setIsGoatLoading(false);
    }
  }, [tag]);

  const fetchPosts = useCallback(async () => {
    if (query === "goat") {
      fetchGoatPosts();
      return;
    }
    if (isFetching.current) return; // Prevent multiple fetches
    if (!tag) {
      setError("Cannot fetch posts: missing search tag configuration");
      return;
    }

    isFetching.current = true;
    setError(null);

    try {
      const posts = await findPosts(
        query === "highest_paid" ? "created" : query,
        params.current
      );
      let sortedPosts = posts;
      if (query === "highest_paid") {
        sortedPosts = [...posts].sort(
          (a, b) => Number(getPayoutValue(b)) - Number(getPayoutValue(a))
        );
      }
      if (sortedPosts.length > 0) {
        setAllPosts((prevPosts) => {
          // Combine previous posts with new posts
          const combined = [...prevPosts, ...sortedPosts];
          // Remove duplicates by author/permlink combination
          const uniquePosts = Array.from(
            new Map(
              combined.map((p) => [p.author + "/" + p.permlink, p])
            ).values()
          );
          return uniquePosts;
        });
        params.current = [
          {
            tag: tag,
            limit: BLOG_CONFIG.POSTS_PER_PAGE as number,
            start_author: sortedPosts[sortedPosts.length - 1].author,
            start_permlink: sortedPosts[sortedPosts.length - 1].permlink,
          },
        ];
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError("Failed to load posts. Please try again later.");
    } finally {
      isFetching.current = false;
    }
  }, [query, tag, fetchGoatPosts]);

  useEffect(() => {
    // Clean up posts and reset state when query changes
    setAllPosts([]);
    setError(null);
    isFetching.current = false;
    params.current = [
      {
        tag: tag,
        limit: BLOG_CONFIG.POSTS_PER_PAGE as number,
        start_author: "",
        start_permlink: "",
      },
    ];
    if (query === "goat") {
      fetchGoatPosts();
    } else {
      fetchPosts();
    }
  }, [fetchPosts, fetchGoatPosts, query, tag]);

  // Detect mobile and force grid view
  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 768) {
          setViewMode("grid");
        }
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Modal logic for magazine view
  const isMagazineOpen = viewMode === "magazine";
  const closeMagazine = () => {
    // Simple state change - just close the magazine
    setViewMode("grid");
  };
  // Magazine props (same as /magazine/page.tsx)
  const communityTag =
    process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || "hive-173115";
  const magazineTag = [{ tag: communityTag, limit: 20 }]; // Bridge API max limit is 20
  const magazineQuery = "created"; // Use trending for blog magazine view

  return (
    <>
      {/* Magazine Modal */}
      {isMagazineOpen && (
        <MagazineModal
          isOpen={isMagazineOpen}
          onClose={closeMagazine}
          magazineTag={magazineTag}
          magazineQuery={magazineQuery}
        />
      )}
      {/* Main Blog Content */}
      <Box
        id="scrollableDiv"
        maxW="container.lg"
        mx="auto"
        maxH="100vh"
        overflowY="auto"
        p={0}
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        <JoinSkatehiveBanner />
        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}
        <TopBar
          viewMode={viewMode}
          setViewMode={(mode) => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setViewMode("grid");
              const params = new URLSearchParams(window.location.search);
              params.set("view", "grid");
              router.replace(`/blog?${params.toString()}`);
            } else {
              setViewMode(mode);
              const params = new URLSearchParams(window.location.search);
              params.set("view", mode);
              router.replace(`/blog?${params.toString()}`);
            }
          }}
          setQuery={setQuery}
          onQueryChange={(newQuery: QueryType) => {
            setQuery(newQuery);
            const params = new URLSearchParams(window.location.search);
            params.set("query", newQuery);
            router.replace(`/blog?${params.toString()}`);
          }}
        />
        {isGoatLoading && query === "goat" && (
          <Box textAlign="center" color="primary" py={4} fontWeight="bold">
            Scanning for GOAT posts...
          </Box>
        )}
        {query === "goat" ? (
          <PostGrid posts={allPosts} columns={3} />
        ) : (
          <PostInfiniteScroll
            allPosts={allPosts}
            fetchPosts={fetchPosts}
            viewMode={viewMode}
            context="blog"
          />
        )}
      </Box>
    </>
  );
}

export default function Blog() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Box
            maxW="container.lg"
            mx="auto"
            maxH="100vh"
            overflowY="auto"
            p={0}
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <JoinSkatehiveBanner />
            <Box textAlign="center" color="primary" py={4} fontWeight="bold">
              Loading...
            </Box>
          </Box>
        }
      >
        <BlogContent />
      </Suspense>
    </ErrorBoundary>
  );
}
