import { useState, useEffect, useCallback } from 'react';
import HiveClient from '@/lib/hive/hiveclient';
import { KeychainSDK, KeychainRequestResponse, KeychainKeyTypes } from 'keychain-sdk';

const CUSTOM_JSON_ID = 'skatehive-bounty-claim';

export interface BountyClaim {
    author: string;
    permlink: string;
}

// Custom hook to fetch bounties claimed by a specific user
export function useBountyClaims(username?: string | null) {
    const [claimedBounties, setClaimedBounties] = useState<BountyClaim[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchClaimsByUser = useCallback(async (user: string) => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            // This can be slow if the user has a long transaction history.
            // A dedicated indexer would be a better long-term solution.
            let start = -1;
            const claims: BountyClaim[] = [];
            const fetchedTransactions = new Set<number>();
            let keepFetching = true;

            while (keepFetching) {
                const history = await HiveClient.database.call('get_account_history', [user, start, 1000]);

                if (!history || history.length === 0) {
                    keepFetching = false;
                    break;
                }

                let lastTxId = -1;

                for (const item of history.reverse()) { // Process oldest first to get correct `start`
                    const txId = item[0];
                    if (fetchedTransactions.has(txId)) continue;
                    fetchedTransactions.add(txId);

                    const op = item[1].op;
                    if (op[0] === 'custom_json' && op[1].id === CUSTOM_JSON_ID) {
                        try {
                            const json = JSON.parse(op[1].json);
                            if (json.author && json.permlink) {
                                claims.push({ author: json.author, permlink: json.permlink });
                            }
                        } catch (e) {
                            // Ignore malformed JSON
                        }
                    }
                    lastTxId = txId;
                }
                
                if (history.length < 1001) {
                    keepFetching = false;
                } else {
                    start = lastTxId -1;
                    if (start <= 0) {
                        keepFetching = false;
                    }
                }
            }
            // Using a Map to get unique claims, as a user might claim the same bounty multiple times
            const uniqueClaims = Array.from(new Map(claims.map(item => [`${item.author}/${item.permlink}`, item])).values());
            setClaimedBounties(uniqueClaims.reverse()); // Show newest first
        } catch (e: any) {
            setError(e.message || 'Failed to fetch bounty claims.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (username) {
            fetchClaimsByUser(username);
        }
    }, [username, fetchClaimsByUser]);

    const refetch = useCallback(() => {
        if (username) {
            fetchClaimsByUser(username);
        }
    }, [username, fetchClaimsByUser]);

    return { claimedBounties, isLoading, error, refetch };
}

// Function to check if a user has claimed a bounty.
// Scans the last 1000 transactions for performance reasons.
export async function hasUserClaimed(username: string, author: string, permlink: string): Promise<boolean> {
    if (!username) return false;

    const history = await HiveClient.database.call('get_account_history', [username, -1, 1000]);

    for (const item of history) {
        const op = item[1].op;
        if (op[0] === 'custom_json' && op[1].id === CUSTOM_JSON_ID) {
            try {
                const json = JSON.parse(op[1].json);
                if (json.author === author && json.permlink === permlink) {
                    return true;
                }
            } catch (e) {
                // malformed json
            }
        }
    }
    return false;
}

// Function to broadcast a claim custom_json to the Hive blockchain
export async function claimBounty(username: string, author: string, permlink: string): Promise<KeychainRequestResponse> {
    const keychain = new KeychainSDK(window);
    const jsonPayload = {
        author,
        permlink,
    };

    const result = await keychain.custom({
        username,
        id: CUSTOM_JSON_ID,
        method: KeychainKeyTypes.posting, // Requires posting authority
        json: JSON.stringify(jsonPayload),
        display_msg: `Claiming bounty: @${author}/${permlink}`,
    });

    return result;
} 