import HiveClient from '@/lib/hive/hiveclient';
import { Discussion } from '@hiveio/dhive';
import { useState, useEffect, useRef } from 'react';

interface lastContainerInfo {
  permlink: string;
  date: string;
}

export const useSnaps = () => {
  const lastContainerRef = useRef<lastContainerInfo | null>(null); // Use useRef for last container
  const fetchedPermlinksRef = useRef<Set<string>>(new Set()); // Track fetched permlinks

  const [currentPage, setCurrentPage] = useState(1);
  const [comments, setComments] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageMinSize = 10;
  

  // Filter comments by the target tag
  function filterCommentsByTag(comments: Discussion[], targetTag: string): Discussion[] {
    return comments.filter((commentItem) => {
      try {
        if (!commentItem.json_metadata) {
          return false; // Skip if json_metadata is empty
        }
        const metadata = JSON.parse(commentItem.json_metadata);
        const tags = metadata.tags || [];
        return tags.includes(targetTag);
      } catch (error) {
        console.error('Error parsing JSON metadata for comment:', commentItem, error);
        return false; // Exclude comments with invalid JSON
      }
    });
  }
  // Fetch comments with a minimum size
  async function getMoreSnaps(): Promise<Discussion[]> {
    const tag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || ''
    const author = "peak.snaps";
    const limit = 3;
    const allFilteredComments: Discussion[] = [];

    let hasMoreData = true; // To track if there are more containers to fetch
    let permlink = lastContainerRef.current?.permlink || "";
    let date = lastContainerRef.current?.date || new Date().toISOString();

    while (allFilteredComments.length < pageMinSize && hasMoreData) {

      const result = await HiveClient.database.call('get_discussions_by_author_before_date', [
        author,
        permlink,
        date,
        limit,
      ]);

      if (!result.length) {
        hasMoreData = false;
        break;
      }

      for (const resultItem of result) {
        const comments = (await HiveClient.database.call("get_content_replies", [
          author,
          resultItem.permlink,
        ])) as Discussion[];

        const filteredComments = filterCommentsByTag(comments, tag);
        allFilteredComments.push(...filteredComments);

        // Add permlink to the fetched set
        fetchedPermlinksRef.current.add(resultItem.permlink);

        // Update the last container info for the next fetch
        permlink = resultItem.permlink;
        date = resultItem.created;
      }
    }

    // Update the lastContainerRef state for the next API call
    lastContainerRef.current = { permlink, date };

    return allFilteredComments;
  }

  // Fetch posts when `currentPage` changes
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const newSnaps = await getMoreSnaps();

        if (newSnaps.length < pageMinSize) {
          setHasMore(false); // No more items to fetch
        }

        // Avoid duplicates in the comments array
        setComments((prevPosts) => {
          const existingPermlinks = new Set(prevPosts.map((post) => post.permlink));
          const uniqueSnaps = newSnaps.filter((snap) => !existingPermlinks.has(snap.permlink));
          return [...prevPosts, ...uniqueSnaps];
        });
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  // Load the next page
  const loadNextPage = () => {
    if (!isLoading && hasMore) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  return { comments, isLoading, loadNextPage, hasMore, currentPage };
};
