import { useState, useEffect } from "react";
import { base } from "viem/chains";
import { CoinCommentsData, CoinComment } from "@/types/coin";

interface UseCoinCommentsParams {
  address: string;
  count?: number;
  after?: string;
}

interface CoinCommentsApiResponse {
  zora20Token?: {
    zoraComments?: {
      pageInfo: {
        endCursor?: string;
        hasNextPage: boolean;
      };
      count: number;
      edges: Array<{
        node: {
          commentId: string;
          nonce: string;
          userAddress: string;
          txHash: string;
          comment: string;
          timestamp: number;
          userProfile?: {
            id: string;
            handle: string;
            avatar?: {
              previewImage: {
                blurhash?: string;
                small: string;
                medium: string;
              };
            };
          };
          replies?: {
            count: number;
            edges: Array<{
              node: {
                commentId: string;
                nonce: string;
                userAddress: string;
                txHash: string;
                comment: string;
                timestamp: number;
                userProfile?: {
                  id: string;
                  handle: string;
                  avatar?: {
                    previewImage: {
                      blurhash?: string;
                      small: string;
                      medium: string;
                    };
                  };
                };
              };
            }>;
          };
        };
      }>;
    };
  };
}

export function useCoinComments({ address, count = 20, after }: UseCoinCommentsParams) {
  const [comments, setComments] = useState<CoinCommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchComments() {
      try {
        setLoading(true);
        setError(null);

        // Build the API URL for coin comments
        const params = new URLSearchParams({
          chainId: base.id.toString(),
          address,
          count: count.toString(),
        });

        if (after) {
          params.append('after', after);
        }

        const url = `https://api-sdk.zora.engineering/coinComments?${params}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CoinCommentsApiResponse = await response.json();

        if (!ignore) {
          if (data.zora20Token?.zoraComments) {
            const zoraComments = data.zora20Token.zoraComments;

            const commentsData: CoinComment[] = zoraComments.edges.map(({ node }) => {
              return {
                commentId: node.commentId,
                nonce: node.nonce,
                userAddress: node.userAddress,
                txHash: node.txHash,
                comment: node.comment,
                timestamp: node.timestamp,
                userProfile: node.userProfile,
                replies: node.replies,
              };
            });

            const commentsResult = {
              comments: commentsData,
              hasNextPage: zoraComments.pageInfo.hasNextPage,
              endCursor: zoraComments.pageInfo.endCursor,
              totalCount: zoraComments.count,
            };

            setComments(commentsResult);
          } else {
            setComments({
              comments: [],
              hasNextPage: false,
              totalCount: 0,
            });
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("💥 Error fetching coin comments:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch comments");
          setComments({
            comments: [],
            hasNextPage: false,
            totalCount: 0,
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (address) {
      fetchComments();
    }

    return () => {
      ignore = true;
    };
  }, [address, count, after]);

  return { comments, loading, error };
}
