"use client";
import { Container, Box } from "@chakra-ui/react";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Discussion } from "@hiveio/dhive";
import { findPosts, getPayoutValue } from "@/lib/hive/client-functions";
import TopBar from "@/components/blog/TopBar";
import PostInfiniteScroll from "@/components/blog/PostInfiniteScroll";
import { useSearchParams, useRouter } from "next/navigation";
import JoinSkatehiveBanner from "@/components/blog/JoinSkatehiveBanner";
import PostGrid from "@/components/blog/PostGrid";
import MagazineModal from "@/components/shared/MagazineModal";

function BlogContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams?.get("view");
  const validViews = ["grid", "list", "magazine"];
  const [viewMode, setViewMode] = useState<"grid" | "list" | "magazine">(
    validViews.includes(initialView as string)
      ? (initialView as "grid" | "list" | "magazine")
      : "grid"
  );
  const [query, setQuery] = useState("created");
  const [allPosts, setAllPosts] = useState<Discussion[]>([]);
  const isFetching = useRef(false);
  const [isGoatLoading, setIsGoatLoading] = useState(false);
  const router = useRouter();

  const tag = process.env.NEXT_PUBLIC_HIVE_SEARCH_TAG;

  const params = useRef([
    {
      tag: tag,
      limit: 12,
      start_author: "",
      start_permlink: "",
    },
  ]);

  const fetchGoatPosts = useCallback(async () => {
    setIsGoatLoading(true);
    setAllPosts([]);
    params.current = [
      {
        tag: tag,
        limit: 100,
        start_author: "",
        start_permlink: "",
      },
    ];
    let allFetchedPosts: Discussion[] = [];
    let keepFetching = true;
    let batchCount = 0;
    const maxBatches = 10; // 10 batches x 100 = 1000 posts
    while (keepFetching && batchCount < maxBatches) {
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
      setAllPosts(sorted.slice(0, 12));
      // Prepare for next batch
      params.current = [
        {
          tag: tag,
          limit: 100,
          start_author: posts[posts.length - 1].author,
          start_permlink: posts[posts.length - 1].permlink,
        },
      ];
      batchCount++;
      if (posts.length < 100) break;
      // Optionally, add a small delay to avoid rate limits
      await new Promise((res) => setTimeout(res, 300));
    }
    setIsGoatLoading(false);
  }, [tag]);

  const fetchPosts = useCallback(async () => {
    if (query === "goat") {
      fetchGoatPosts();
      return;
    }
    if (isFetching.current) return; // Prevent multiple fetches
    isFetching.current = true;
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
        setAllPosts((prevPosts) => [...prevPosts, ...sortedPosts]);
        params.current = [
          {
            tag: tag,
            limit: 12,
            start_author: sortedPosts[sortedPosts.length - 1].author,
            start_permlink: sortedPosts[sortedPosts.length - 1].permlink,
          },
        ];
      }
    } catch (error) {
        // error is silently swallowed
        if (process.env.NODE_ENV === "development") {
          console.error("Blog page error:", error);
        } else {
          // Replace with your monitoring service call
          if (typeof window !== "undefined" && (window as any).monitoringService) {
            (window as any).monitoringService.captureException(error);
          }
        }
    } finally {
      isFetching.current = false;
    }
  }, [query, tag, fetchGoatPosts]);

  useEffect(() => {
    setAllPosts([]);
    params.current = [
      {
        tag: tag,
        limit: 12,
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
  const magazineTag = [{ tag: communityTag, limit: 30 }];
  const magazineQuery = "trending"; // Use trending for blog magazine view

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
  );
}
