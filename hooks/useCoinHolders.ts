import { useState, useEffect } from "react";
import { base } from "viem/chains";
import { CoinHoldersData, CoinHolder } from "@/types/coin";

interface UseCoinHoldersParams {
  address: string;
  count?: number;
}

interface CoinHoldersApiResponse {
  zora20Token?: {
    tokenBalances?: {
      pageInfo: {
        endCursor?: string;
        hasNextPage: boolean;
      };
      count: number;
      edges: Array<{
        node: {
          balance: string;
          ownerAddress: string;
          ownerProfile?: {
            id: string;
            handle: string;
            avatar?: {
              previewImage: {
                blurhash?: string;
                medium: string;
                small: string;
              };
            };
          };
        };
      }>;
    };
  };
}

export function useCoinHolders({ address, count = 20 }: UseCoinHoldersParams) {
  const [holders, setHolders] = useState<CoinHoldersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchHolders() {
      try {
        setLoading(true);
        setError(null);

        // Use the real Zora API endpoint for coin holders
        const url = `https://api-sdk.zora.engineering/coinHolders?chainId=${base.id}&address=${address}&count=${count}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CoinHoldersApiResponse = await response.json();

        if (!ignore) {
          if (data.zora20Token?.tokenBalances) {
            const tokenBalances = data.zora20Token.tokenBalances;

            const holdersData: CoinHolder[] = tokenBalances.edges.map(({ node }) => {
              return {
                ownerAddress: node.ownerAddress,
                balance: node.balance,
                ownerProfile: node.ownerProfile ? {
                  handle: node.ownerProfile.handle,
                  avatar: node.ownerProfile.avatar,
                } : undefined,
              };
            });

            const holdersResult = {
              holders: holdersData,
              hasNextPage: tokenBalances.pageInfo.hasNextPage,
              endCursor: tokenBalances.pageInfo.endCursor,
              totalCount: tokenBalances.count,
            };

            setHolders(holdersResult);
          } else {
            setHolders({
              holders: [],
              hasNextPage: false,
              totalCount: 0,
            });
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("💥 Error fetching coin holders:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch holders");
          setHolders({
            holders: [],
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
      fetchHolders();
    }

    return () => {
      ignore = true;
    };
  }, [address, count]);

  return { holders, loading, error };
}
